
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// Port is only used for local development
const PORT = process.env.PORT || 3001;

// --- CONFIGURATION ---
const MAX_CONCURRENT_SESSIONS = 15;
const MAX_QUEUE_SIZE = 50;

// VERCEL ADAPTATION: Vercel file system is read-only. 
// We must use /tmp for temporary storage, but note that data WILL persist only briefly.
// For a real production app on Vercel, you must use an external database (MongoDB, Postgres, etc).
const isVercel = process.env.VERCEL === '1';
const DB_FILE = isVercel ? '/tmp/db.json' : path.join(__dirname, 'db.json');

// In production, this would come from process.env
const TAVUS_API_KEY = process.env.VITE_TAVUS_API_KEY || ''; 

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); 

// --- IN-MEMORY STATE ---
// Note: On Vercel, these reset on every cold start (approx every 15 mins of inactivity)
let activeSessions = []; 
let queue = []; 

// Persistent State (Saved to JSON)
let db = {
    users: [],
    journals: {}, 
    art: {}, 
    transactions: [],
    feedback: [],
    settings: {
        pricePerMinute: 1.59,
        saleMode: true,
        maintenanceMode: false,
        allowSignups: true,
        siteName: 'Peutic',
        maxConcurrentSessions: 15,
        multilingualMode: true,
        broadcastMessage: ''
    }
};

// --- PERSISTENCE ---
const loadDb = () => {
    if (fs.existsSync(DB_FILE)) {
        try {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            const loaded = JSON.parse(data);
            db = { ...db, ...loaded };
            console.log('📦 Database loaded.');
        } catch (e) {
            console.error("DB Load Error:", e);
        }
    } else {
        saveDb(); // Initialize file
    }
};

const saveDb = () => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
    } catch (e) {
        console.error("DB Save Error:", e);
    }
};

// Initialize DB
loadDb();

// --- QUEUE LOGIC ---
const processQueue = () => {
    while (activeSessions.length < MAX_CONCURRENT_SESSIONS && queue.length > 0) {
        const nextUser = queue.shift();
        if (nextUser && !activeSessions.includes(nextUser)) {
            activeSessions.push(nextUser);
        }
    }
};

// --- ROUTES ---

// 1. AUTHENTICATION
app.post('/api/auth/login', (req, res) => {
    const { email } = req.body;
    const user = db.users.find(u => u.email === email);
    if (user) {
        user.lastLoginDate = new Date().toISOString();
        saveDb();
        res.json(user);
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

app.post('/api/auth/signup', (req, res) => {
    const { name, email, provider, role, birthday, avatar } = req.body;
    
    const existing = db.users.find(u => u.email === email);
    if (existing) {
        return res.status(400).json({ error: 'Email already exists' });
    }

    const newUser = {
        id: `u_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name, 
        email, 
        role: role || (db.users.length === 0 ? 'ADMIN' : 'USER'),
        balance: 0,
        avatar,
        birthday,
        joinedAt: new Date().toISOString(),
        lastLoginDate: new Date().toISOString(),
        subscriptionStatus: 'ACTIVE',
        provider: provider || 'email',
        streak: 0,
        emailPreferences: { updates: true, marketing: false }
    };
    
    db.users.push(newUser);
    saveDb();
    res.json(newUser);
});

app.post('/api/user/update', (req, res) => {
    const { user } = req.body;
    const idx = db.users.findIndex(u => u.id === user.id);
    if (idx !== -1) {
        db.users[idx] = { ...db.users[idx], ...user };
        saveDb();
        res.json(db.users[idx]);
    } else {
        res.status(404).json({ error: "User not found" });
    }
});

app.delete('/api/user/:userId', (req, res) => {
    const { userId } = req.params;
    db.users = db.users.filter(u => u.id !== userId);
    delete db.journals[userId];
    delete db.art[userId];
    saveDb();
    res.json({ success: true });
});

// 2. CONCURRENCY & QUEUE
app.post('/api/queue/join', (req, res) => {
    const { userId } = req.body;

    if (activeSessions.includes(userId)) {
        return res.json({ status: 'ACTIVE', position: 0 });
    }

    const qIdx = queue.indexOf(userId);
    if (qIdx !== -1) {
        return res.json({ status: 'QUEUED', position: qIdx + 1 });
    }

    if (activeSessions.length >= MAX_CONCURRENT_SESSIONS && queue.length >= MAX_QUEUE_SIZE) {
        return res.status(503).json({ 
            error: 'System at capacity.' 
        });
    }

    if (activeSessions.length < MAX_CONCURRENT_SESSIONS) {
        activeSessions.push(userId);
        return res.json({ status: 'ACTIVE', position: 0 });
    }

    queue.push(userId);
    res.json({ status: 'QUEUED', position: queue.length });
});

app.get('/api/queue/status/:userId', (req, res) => {
    const { userId } = req.params;
    if (activeSessions.includes(userId)) return res.json({ status: 'ACTIVE', position: 0 });
    
    const qIdx = queue.indexOf(userId);
    if (qIdx !== -1) return res.json({ status: 'QUEUED', position: qIdx + 1 });
    
    res.json({ status: 'NONE', position: 0 });
});

app.post('/api/session/end', (req, res) => {
    const { userId } = req.body;
    const wasActive = activeSessions.includes(userId);
    activeSessions = activeSessions.filter(id => id !== userId);
    queue = queue.filter(id => id !== userId);
    
    if (wasActive) {
        processQueue();
    }
    res.json({ success: true });
});

app.post('/api/session/heartbeat', (req, res) => {
    const { userId } = req.body;
    if (!activeSessions.includes(userId) && !queue.includes(userId)) {
        return res.status(401).json({ error: "Session expired" });
    }
    res.json({ status: "OK" });
});

// 3. SECURE CREDITS
app.post('/api/credits/topup', (req, res) => {
    const { userId, amount, cost } = req.body;
    const user = db.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.balance += amount;
    
    db.transactions.unshift({
        id: `tx_${Date.now()}`,
        userId,
        userName: user.name,
        date: new Date().toISOString(),
        amount: amount,
        cost: cost,
        description: cost > 0 ? 'Credit Purchase' : 'Admin Grant',
        status: 'COMPLETED'
    });
    
    saveDb();
    res.json({ balance: user.balance });
});

app.post('/api/credits/deduct', (req, res) => {
    const { userId, amount } = req.body;
    const user = db.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.role !== 'ADMIN' && user.balance < amount) {
        const taken = user.balance;
        user.balance = 0;
        saveDb();
        return res.json({ balance: 0, deducted: taken });
    }

    user.balance = Math.max(0, user.balance - amount);
    saveDb();
    res.json({ balance: user.balance });
});

app.post('/api/transaction', (req, res) => {
    const { transaction } = req.body;
    db.transactions.unshift(transaction);
    saveDb();
    res.json({ success: true });
});

// 4. STORAGE
app.get('/api/journal/:userId', (req, res) => {
    res.json(db.journals[req.params.userId] || []);
});

app.post('/api/journal', (req, res) => {
    const { userId, entry } = req.body;
    if (!db.journals[userId]) db.journals[userId] = [];
    db.journals[userId].unshift(entry);
    saveDb();
    res.json({ success: true });
});

app.get('/api/art/:userId', (req, res) => {
    res.json(db.art[req.params.userId] || []);
});

app.post('/api/art', (req, res) => {
    const { userId, entry } = req.body;
    if (!db.art[userId]) db.art[userId] = [];
    if (db.art[userId].length >= 15) db.art[userId].pop();
    
    db.art[userId].unshift(entry);
    saveDb();
    res.json({ success: true });
});

app.delete('/api/art/:userId/:artId', (req, res) => {
    const { userId, artId } = req.params;
    if (db.art[userId]) {
        db.art[userId] = db.art[userId].filter(a => a.id !== artId);
        saveDb();
    }
    res.json({ success: true });
});

app.post('/api/feedback', (req, res) => {
    const { feedback } = req.body;
    db.feedback.unshift(feedback);
    saveDb();
    res.json({ success: true });
});

// 5. VIDEO PROXY
app.post('/api/video/init', async (req, res) => {
    const { replicaId, context, conversationName } = req.body;
    
    if (!TAVUS_API_KEY && process.env.NODE_ENV !== 'development') {
        console.error("Missing TAVUS_API_KEY");
    }

    try {
        const response = await fetch('https://tavusapi.com/v2/conversations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': TAVUS_API_KEY,
            },
            body: JSON.stringify({
                replica_id: replicaId,
                conversation_name: conversationName,
                conversational_context: context,
                properties: {
                    max_call_duration: 3600,
                    enable_recording: true,
                    enable_transcription: true,
                    language: 'multilingual'
                }
            }),
        });

        const data = await response.json();
        if (!response.ok) {
             throw new Error(data.message || data.error || 'Video provider error');
        }
        res.json(data);
    } catch (e) {
        console.error("Video Init Error:", e);
        if (process.env.NODE_ENV === 'development' || !TAVUS_API_KEY) {
             return res.json({ 
                conversation_id: "mock_id", 
                conversation_url: "https://tavus.com/mock-session", 
                status: "active" 
            });
        }
        res.status(500).json({ error: e.message });
    }
});

// 6. ADMIN & SETTINGS
app.get('/api/admin/data', (req, res) => {
    res.json({
        users: db.users,
        activeCount: activeSessions.length,
        queueCount: queue.length,
        transactions: db.transactions,
        settings: db.settings,
        feedback: db.feedback
    });
});

app.post('/api/settings', (req, res) => {
    const { settings } = req.body;
    db.settings = { ...db.settings, ...settings };
    saveDb();
    res.json(db.settings);
});

// VERCEL CONFIGURATION
// Only listen if not running in Vercel environment
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`✨ Peutic Server running locally on http://localhost:${PORT}`);
    });
}

// Export the app for Vercel Serverless
export default app;
