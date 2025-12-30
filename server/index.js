
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { createClient } from '@supabase/supabase-js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================

// 1. Rate Limiter (Basic In-Memory)
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_IP = 100;

const rateLimiter = (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    
    const userHistory = rateLimit.get(ip) || [];
    const recentRequests = userHistory.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
    
    if (recentRequests.length >= MAX_REQUESTS_PER_IP) {
        return res.status(429).json({ error: "Too many requests. Please slow down." });
    }
    
    recentRequests.push(now);
    rateLimit.set(ip, recentRequests);
    next();
};

app.use(rateLimiter);

// ==========================================
// PERSISTENT DB CONNECTION (Production Ready)
// ==========================================

const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use Service Role Key for Admin actions (Updating balances), fallback to Anon for read-only
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("WARNING: Supabase credentials missing. Server entering limited mode.");
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// CONSTANTS
const MAX_CONCURRENT_SESSIONS = 15;
const SESSION_TIMEOUT_MS = 15000; // 15s heartbeat timeout

// ==========================================
// HELPERS
// ==========================================

const cleanupZombies = async () => {
    const cutoff = new Date(Date.now() - SESSION_TIMEOUT_MS).toISOString();
    try {
        // Remove stale sessions from DB
        const { error } = await supabase
            .from('active_sessions')
            .delete()
            .lt('last_ping', cutoff);
        
        if (!error) {
            // Check if we have space to promote from queue
            await processQueue();
        }
    } catch (e) {
        console.error("Cleanup Error:", e);
    }
};

const processQueue = async () => {
    try {
        // 1. Check Active Count
        const { count } = await supabase
            .from('active_sessions')
            .select('*', { count: 'exact', head: true });
        
        if ((count || 0) < MAX_CONCURRENT_SESSIONS) {
            // 2. Get next in line
            const { data: nextUsers } = await supabase
                .from('session_queue')
                .select('*')
                .order('joined_at', { ascending: true })
                .limit(1);
        }
    } catch (e) {
        console.error("Queue Processing Error:", e);
    }
};

// Calculate ETA based on DB state
const getEstimatedWaitTime = async (userId) => {
    try {
        // Get user's join time
        const { data: myEntry } = await supabase
            .from('session_queue')
            .select('joined_at')
            .eq('user_id', userId)
            .single();

        if (!myEntry) return 0;

        // Count people ahead
        const { count } = await supabase
            .from('session_queue')
            .select('*', { count: 'exact', head: true })
            .lt('joined_at', myEntry.joined_at);
        
        const position = (count || 0) + 1;
        const avgSessionMins = 5;
        return Math.ceil((position * avgSessionMins) / MAX_CONCURRENT_SESSIONS);
    } catch (e) {
        return 5; // Fallback
    }
};

// Run cleanup every 10 seconds (Note: In Serverless Vercel, this interval only runs while a request is processing)
if (process.env.NODE_ENV !== 'production') {
    setInterval(cleanupZombies, 10000);
}

// ==========================================
// ENDPOINTS
// ==========================================

// --- AUTH & SYNC ---
app.post('/api/auth/login', async (req, res) => {
    const { email } = req.body;
    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (user && !error) {
        return res.json(user);
    }
    res.status(404).json({ error: "User not found" });
});

app.post('/api/auth/signup', async (req, res) => {
    const userData = req.body;
    // Ensure ID and Balance defaults
    const newUser = {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role || 'USER',
        balance: 0,
        provider: userData.provider,
        joined_at: new Date().toISOString(),
        last_login_date: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('users')
        .upsert(newUser)
        .select()
        .single();

    if (error) {
        return res.status(500).json({ error: error.message });
    }
    res.json(data);
});

app.post('/api/user/update', async (req, res) => {
    const { user } = req.body;
    
    const { error } = await supabase
        .from('users')
        .update({
            name: user.name,
            avatar: user.avatar,
            email_preferences: user.emailPreferences,
            last_login_date: user.lastLoginDate
        })
        .eq('id', user.id);

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// --- QUEUE SYSTEM ---

app.post('/api/queue/join', async (req, res) => {
    const { userId } = req.body;

    try {
        await cleanupZombies();

        // 1. Is user already active?
        const { data: active } = await supabase
            .from('active_sessions')
            .select('user_id')
            .eq('user_id', userId)
            .single();

        if (active) {
            await supabase.from('active_sessions').update({ last_ping: new Date().toISOString() }).eq('user_id', userId);
            return res.json({ status: 'ACTIVE', position: 0, message: "Session Active" });
        }

        // 2. Is user already in queue?
        const { data: queued } = await supabase
            .from('session_queue')
            .select('joined_at')
            .eq('user_id', userId)
            .single();

        if (queued) {
            const { count } = await supabase.from('session_queue').select('*', { count: 'exact', head: true }).lt('joined_at', queued.joined_at);
            const pos = (count || 0) + 1;
            return res.json({ status: 'QUEUED', position: pos, eta: await getEstimatedWaitTime(userId) });
        }

        // 3. Join Queue
        await supabase.from('session_queue').insert({
            user_id: userId,
            joined_at: new Date().toISOString()
        });

        const { count } = await supabase.from('session_queue').select('*', { count: 'exact', head: true });
        const pos = count || 1;

        res.json({ 
            status: 'QUEUED', 
            position: pos, 
            eta: Math.ceil((pos * 5) / MAX_CONCURRENT_SESSIONS),
            message: "You are in line."
        });

    } catch (e) {
        res.status(500).json({ error: "Queue Error" });
    }
});

app.get('/api/queue/status/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const { data: active } = await supabase
            .from('active_sessions')
            .select('user_id')
            .eq('user_id', userId)
            .single();
        
        if (active) return res.json({ status: 'ACTIVE', position: 0 });

        const { data: myEntry } = await supabase
            .from('session_queue')
            .select('joined_at')
            .eq('user_id', userId)
            .single();

        if (myEntry) {
            const { count } = await supabase
                .from('session_queue')
                .select('*', { count: 'exact', head: true })
                .lt('joined_at', myEntry.joined_at);
            
            const pos = (count || 0) + 1;
            return res.json({ status: 'QUEUED', position: pos, eta: 3 * pos }); 
        }

        res.json({ status: 'IDLE', position: 0 });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/session/heartbeat', async (req, res) => {
    const { userId } = req.body;
    const { error } = await supabase
        .from('active_sessions')
        .update({ last_ping: new Date().toISOString() })
        .eq('user_id', userId);
    
    if (error) res.status(401).json({ error: "Session expired" });
    else res.json({ status: 'OK' });
});

app.post('/api/session/end', async (req, res) => {
    const { userId } = req.body;
    await supabase.from('active_sessions').delete().eq('user_id', userId);
    await supabase.from('session_queue').delete().eq('user_id', userId);
    res.json({ success: true });
});

// --- VIDEO GENERATION (TAVUS) ---

app.post('/api/video/init', async (req, res) => {
    const { replicaId, context, conversationName, userId } = req.body;
    // Use server-side env var preferred, fallback to vite for dev
    const TAVUS_API_KEY = process.env.TAVUS_API_KEY || process.env.VITE_TAVUS_API_KEY;

    if (!TAVUS_API_KEY) {
        return res.status(500).json({ error: "Server Configuration Error: Video API Key Missing" });
    }

    try {
        // 1. Balance Check
        if (userId) {
            const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();
            if (!user || user.balance <= 0) {
                return res.status(403).json({ error: "Insufficient Credits" });
            }
        }

        // 2. Call Tavus
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
                    enable_recording: false, // PRIVACY: DISABLED BY DEFAULT
                    enable_transcription: true, // Needed for conversation logic
                    language: 'english'
                }
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || "Failed to create conversation");
        }

        res.json(data);

    } catch (e) {
        console.error("Video Init Error:", e);
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/video/terminate', async (req, res) => {
    const { conversationId } = req.body;
    const TAVUS_API_KEY = process.env.TAVUS_API_KEY || process.env.VITE_TAVUS_API_KEY;

    if (!conversationId || !TAVUS_API_KEY) return res.json({ success: false });

    try {
        await fetch(`https://tavusapi.com/v2/conversations/${conversationId}/end`, {
            method: 'POST',
            headers: { 'x-api-key': TAVUS_API_KEY }
        });
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: "Termination failed" });
    }
});

// --- SECURE CREDITS ---

app.post('/api/credits/topup', async (req, res) => {
    const { userId, amount, cost } = req.body;
    
    // SECURITY: Input Validation
    if (!amount || amount <= 0 || amount > 1000) {
        return res.status(400).json({ error: "Invalid amount detected." });
    }

    const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();
    if (!user) return res.status(404).json({ error: "User not found" });

    const newBalance = (user.balance || 0) + amount;

    const { error } = await supabase.from('users').update({ balance: newBalance }).eq('id', userId);
    if (error) return res.status(500).json({ error: "Update failed" });

    await supabase.from('transactions').insert({
        user_id: userId,
        amount: amount,
        cost: cost,
        description: 'Credit Purchase',
        date: new Date().toISOString(),
        status: 'COMPLETED'
    });

    res.json({ success: true, balance: newBalance });
});

app.post('/api/credits/deduct', async (req, res) => {
    const { userId, amount } = req.body;
    
    const { data: user } = await supabase.from('users').select('balance').eq('id', userId).single();
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.balance < amount) {
        return res.status(402).json({ error: "Insufficient funds" });
    }

    const newBalance = user.balance - amount;
    const { error } = await supabase.from('users').update({ balance: newBalance }).eq('id', userId);

    if (error) return res.status(500).json({ error: "Deduction failed" });

    res.json({ success: true, balance: newBalance });
});

// --- ADMIN ---
app.get('/api/admin/data', async (req, res) => {
    const { count: activeCount } = await supabase.from('active_sessions').select('*', { count: 'exact', head: true });
    const { count: queueCount } = await supabase.from('session_queue').select('*', { count: 'exact', head: true });
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });

    res.json({
        activeSessions: activeCount || 0,
        queueLength: queueCount || 0,
        totalUsers: userCount || 0
    });
});

if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

export default app;
