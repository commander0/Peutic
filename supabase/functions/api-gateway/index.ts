
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { GoogleGenAI } from 'https://esm.sh/@google/genai'

declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Lazy-load Stripe
const getStripe = async () => {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) return null;
    const { default: Stripe } = await import('https://esm.sh/stripe@12.18.0');
    return new Stripe(stripeKey, { apiVersion: '2023-08-16' });
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { action, payload } = await req.json();

        // Initialize Supabase Admin Client
        const supUrl = Deno.env.get('SUPABASE_URL');
        const supKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supUrl || !supKey) throw new Error("Server Configuration Error: Missing Secrets");

        const supabaseClient = createClient(supUrl, supKey);

        // --- SECURITY HELPER ---
        const getAuthUser = async () => {
            const authHeader = req.headers.get('Authorization');
            const token = authHeader ? authHeader.replace('Bearer ', '') : null;
            if (!token) return null;
            const { data: { user }, error } = await supabaseClient.auth.getUser(token);
            return !error ? user : null;
        };

        const requireAuth = async (targetUserId: string) => {
            const user = await getAuthUser();
            if (!user) throw new Error("Unauthorized");
            if (user.id !== targetUserId) throw new Error("Forbidden");
            return user;
        };

        // --- SAFETY SCANNER ---
        const scanContent = async (userId: string, type: string, content: string) => {
            if (!content) return;
            const keywords = ["self-harm", "suicide", "kill myself", "end my life", "hurt myself", "danger", "weapon", "abuse", "emergency", "drug", "illegal", "die"];
            const found = keywords.filter(word => content.toLowerCase().includes(word));
            if (found.length > 0) {
                await supabaseClient.from('safety_alerts').insert({
                    user_id: userId,
                    content_type: type,
                    content: content,
                    flagged_keywords: found
                });
            }
        };

        // --- ACTION HANDLERS ---
        switch (action) {
            // ==========================================
            // LOGGING & SYSTEM
            // ==========================================
            case 'log-event': {
                const { type, event, details } = payload;
                await supabaseClient.from('system_logs').insert({
                    type, event, details, timestamp: new Date().toISOString()
                });
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            // ==========================================
            // ADMIN AUTH & MANAGEMENT
            // ==========================================
            case 'admin-create': {
                const { email, password, masterKey } = payload;
                const VALID_KEY = Deno.env.get('MASTER_KEY') || 'PEUTIC_ADMIN_ACCESS_2026';
                if (masterKey !== VALID_KEY) throw new Error("Invalid Master Key");

                const { count } = await supabaseClient.from('users').select('*', { count: 'exact', head: true });
                if ((count || 0) > 0) throw new Error("System already initialized.");

                const { data: user, error: createError } = await supabaseClient.auth.admin.createUser({
                    email, password, email_confirm: true, user_metadata: { full_name: 'System Admin' }
                });
                if (createError) throw createError;

                await supabaseClient.from('users').insert({
                    id: user.user.id, email, name: 'System Admin', role: 'ADMIN', balance: 999, subscription_status: 'ACTIVE', provider: 'email'
                });
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            case 'admin-reclaim': {
                const { masterKey } = payload;
                const VALID_KEY = Deno.env.get('MASTER_KEY') || 'PEUTIC_ADMIN_ACCESS_2026';
                if (masterKey !== VALID_KEY) throw new Error("Invalid Master Key");

                const user = await getAuthUser();
                if (!user) throw new Error("Authentication required");

                await supabaseClient.from('users').update({ role: 'ADMIN' }).eq('id', user.id);
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            case 'admin-reset-system': {
                await supabaseClient.from('users').delete().neq('role', 'ADMIN');
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            case 'admin-save-settings': {
                const { settings } = payload;
                const { error } = await supabaseClient.from('global_settings').upsert({
                    id: 1,
                    price_per_minute: settings.pricePerMinute,
                    sale_mode: settings.saleMode,
                    maintenance_mode: settings.maintenanceMode,
                    allow_signups: settings.allowSignups,
                    site_name: settings.siteName,
                    broadcast_message: settings.broadcastMessage,
                    dashboard_broadcast_message: settings.dashboardBroadcastMessage,
                    max_concurrent_sessions: settings.maxConcurrentSessions,
                    multilingual_mode: settings.multilingualMode
                });
                if (error) throw error;
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            case 'admin-auto-verify': {
                const { data: { users } } = await supabaseClient.auth.admin.listUsers();
                const target = users.find((u: any) => u.email === payload.email);
                if (!target) throw new Error("User not found");
                const { error } = await supabaseClient.auth.admin.updateUserById(target.id, { email_confirm: true });
                if (error) throw error;
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            // ==========================================
            // USER DATA MANAGEMENT
            // ==========================================
            case 'user-update': {
                const user = payload;
                await requireAuth(user.id);
                const updateData: any = {
                    name: user.name,
                    email: user.email,
                    birthday: user.birthday,
                    avatar_url: user.avatar,
                    theme_preference: user.themePreference,
                    language_preference: user.languagePreference,
                    email_preferences: user.emailPreferences,
                    last_login_date: user.lastLoginDate,
                    streak: user.streak
                };
                const { error } = await supabaseClient.from('users').update(updateData).eq('id', user.id);
                if (error) throw error;
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            case 'save-journal': {
                const { userId, entry } = payload;
                await requireAuth(userId);
                await scanContent(userId, 'JOURNAL', entry.content);
                const insertData: any = {
                    user_id: userId,
                    date: entry.date || new Date().toISOString(),
                    content: entry.content
                };
                if (entry.id && entry.id.length === 36) insertData.id = entry.id;

                const { error } = await supabaseClient.from('journals').insert(insertData);
                if (error) throw error;
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            case 'save-mood': {
                const { userId, mood } = payload;
                const { error } = await supabaseClient.from('moods').insert({
                    user_id: userId,
                    date: new Date().toISOString(),
                    mood: mood
                });
                if (error) throw error;
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            case 'save-art': {
                const { userId, entry } = payload;
                await requireAuth(userId);
                const insertData: any = {
                    user_id: userId,
                    image_url: entry.imageUrl,
                    prompt: entry.prompt,
                    title: entry.title,
                    created_at: entry.createdAt || new Date().toISOString()
                };
                if (entry.id && entry.id.length === 36) insertData.id = entry.id;

                const { error } = await supabaseClient.from('user_art').insert(insertData);
                if (error) throw error;
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            // ==========================================
            // STRIPE & FINANCIALS
            // ==========================================
            case 'admin-stripe-stats': {
                const stripe = await getStripe();
                if (!stripe) throw new Error("Stripe not configured");

                const [balance, charges, payouts, balanceTransactions] = await Promise.all([
                    stripe.balance.retrieve(),
                    stripe.charges.list({ limit: 10 }),
                    stripe.payouts.list({ limit: 5 }),
                    stripe.balanceTransactions.list({ limit: 20, expand: ['data.source'] })
                ]);

                return new Response(JSON.stringify({
                    balance: {
                        available: balance.available.reduce((a: any, b: any) => a + b.amount, 0) / 100,
                        pending: balance.pending.reduce((a: any, b: any) => a + b.amount, 0) / 100,
                        currency: balance.available[0]?.currency || 'usd'
                    },
                    recentSales: charges.data.map((c: any) => ({
                        id: c.id,
                        amount: c.amount / 100,
                        customer: c.billing_details.email || 'Anonymous',
                        date: new Date(c.created * 1000).toISOString(),
                        status: c.status
                    })),
                    recentPayouts: payouts.data.map((p: any) => ({
                        id: p.id,
                        amount: p.amount / 100,
                        arrivalDate: new Date(p.arrival_date * 1000).toISOString(),
                        status: p.status,
                        bankName: p.bank_account?.bank_name || 'Bank Account'
                    })),
                    transactions: balanceTransactions.data.map((bt: any) => ({
                        id: bt.id,
                        amount: bt.amount / 100,
                        fee: bt.fee / 100,
                        net: bt.net / 100,
                        type: bt.type,
                        description: bt.description,
                        created: new Date(bt.created * 1000).toISOString()
                    }))
                }), { headers: corsHeaders });
            }

            case 'process-topup': {
                const stripe = await getStripe();
                if (!stripe) throw new Error("Stripe not configured");
                const { userId, amount, cost, paymentToken } = payload;
                if (cost > 0) {
                    await stripe.charges.create({
                        amount: Math.round(cost * 100), currency: 'usd', source: paymentToken, description: `Credits: ${userId}`
                    });
                }
                const { data: newBal, error: bErr } = await supabaseClient.rpc('add_user_balance', { p_user_id: userId, p_amount: amount });
                if (bErr) throw bErr;
                await supabaseClient.from('transactions').insert({
                    id: `tx_${Date.now()}`, user_id: userId, amount, cost, description: cost > 0 ? 'Purchase' : 'Grant', status: 'COMPLETED'
                });
                return new Response(JSON.stringify({ success: true, newBalance: newBal }), { headers: corsHeaders });
            }

            // ==========================================
            // AI & MISC
            // ==========================================
            case 'gemini-generate': {
                const { prompt, userId, type } = payload;
                if (userId) await scanContent(userId, type || 'AI_PROMPT', prompt);
                const apiKey = Deno.env.get('GEMINI_API_KEY');
                const ai = new GoogleGenAI({ apiKey });
                const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const result = await model.generateContent(prompt);
                return new Response(JSON.stringify({ text: result.response.text() }), { headers: corsHeaders });
            }

            case 'queue-heartbeat': {
                const { userId } = payload;
                await supabaseClient.from('session_queue').update({ last_ping: new Date().toISOString() }).eq('user_id', userId);
                await supabaseClient.rpc('match_session_queue');
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            case 'session-keepalive': {
                const { userId } = payload;
                await supabaseClient.from('active_sessions').upsert({ user_id: userId, last_ping: new Date().toISOString() });
                await supabaseClient.rpc('match_session_queue');
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            case 'broadcast':
            case 'dashboard-broadcast': {
                const field = action === 'broadcast' ? 'broadcast_message' : 'dashboard_broadcast_message';
                const { error } = await supabaseClient.from('global_settings').update({ [field]: payload.message }).eq('id', 1);
                if (error) throw error;
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            case 'admin-safety-alerts': {
                const { data, error } = await supabaseClient.from('safety_alerts').select('*, users(email, name)').order('created_at', { ascending: false });
                if (error) throw error;
                return new Response(JSON.stringify(data), { headers: corsHeaders });
            }

            case 'delete-user': {
                const { userId } = payload;
                const caller = await getAuthUser();
                if (!caller) throw new Error("Unauthorized");

                const { data: callerData } = await supabaseClient.from('users').select('role').eq('id', caller.id).maybeSingle();
                if (caller.id !== userId && callerData?.role !== 'ADMIN') {
                    throw new Error("Access Denied");
                }
                await supabaseClient.from('users').delete().eq('id', userId);
                await supabaseClient.auth.admin.deleteUser(userId);
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            case 'user-status': {
                const { userId, status } = payload;
                await supabaseClient.from('users').update({ subscription_status: status }).eq('id', userId);
                if (status === 'BANNED') await supabaseClient.auth.admin.signOut(userId);
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            case 'admin-update-companion': {
                const { companion } = payload;
                const { error } = await supabaseClient.from('companions').update({ ...companion }).eq('id', companion.id);
                if (error) throw error;
                return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
            }

            default:
                // Include the received action in the error to help debugging
                console.error(`Unknown Action Received: "${action}"`);
                return new Response(JSON.stringify({ error: `Invalid Action: ${action}` }), { headers: corsHeaders });
        }

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
});
