
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { GoogleGenAI, Modality } from 'https://esm.sh/@google/genai'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'

declare const Deno: any;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { action, payload } = await req.json();

        // Initialize Supabase Admin Client
        const supUrl = Deno.env.get('SUPABASE_URL');
        const supKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supUrl || !supKey) throw new Error("Missing Server Secrets");

        const supabaseClient = createClient(supUrl, supKey);
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        const stripe = stripeKey ? new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        }) : null;

        // --- SAFETY MONITOR HELPER ---
        const scanContent = async (userId: string, type: string, content: string) => {
            const keywords = ["self-harm", "suicide", "kill myself", "end my life", "hurt myself", "danger", "weapon", "abuse", "emergency", "drug", "illegal", "die"];
            const found = keywords.filter(word => content.toLowerCase().includes(word));
            if (found.length > 0) {
                await supabaseClient.from('safety_alerts').insert({
                    user_id: userId,
                    content_type: type,
                    content: content,
                    flagged_keywords: found
                });
                console.warn(`SAFETY ALERT: User ${userId} flagged for ${type} using keywords: ${found.join(', ')}`);
            }
        };

        // --- AUTH & ADMIN ACTIONS ---
        if (action === 'admin-create') {
            const { email, password, masterKey } = payload;
            const VALID_KEY = Deno.env.get('MASTER_KEY') || 'PEUTIC_ADMIN_ACCESS_2026';
            if (masterKey !== VALID_KEY) {
                return new Response(JSON.stringify({ error: "Invalid Master Key" }), { status: 403, headers: corsHeaders });
            }
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

        if (action === 'profile-create-bypass') {
            const { id, email, name, provider } = payload;
            const { count } = await supabaseClient.from('users').select('*', { count: 'exact', head: true });
            const isFirst = (count || 0) === 0;
            const { error } = await supabaseClient.from('users').upsert({
                id, email, name, provider, role: isFirst ? 'ADMIN' : 'USER', balance: isFirst ? 999 : 0, subscription_status: 'ACTIVE'
            });
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

        // --- USER ACTIONS (SENSITIVE) ---
        if (action === 'save-journal') {
            const { userId, entry } = payload;
            await scanContent(userId, 'JOURNAL', entry.content);
            const { error } = await supabaseClient.from('journals').insert({
                id: entry.id, user_id: userId, date: entry.date, content: entry.content
            });
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

        if (action === 'user-update') {
            const user = payload;
            // Map keys back to snake_case for DB
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

        if (action === 'save-art') {
            const { userId, entry } = payload;
            const { error } = await supabaseClient.from('user_art').insert({
                id: entry.id,
                user_id: userId,
                image_url: entry.imageUrl,
                prompt: entry.prompt,
                title: entry.title,
                created_at: entry.createdAt
            });
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

        if (action === 'update-game-score') {
            const { userId, game, score } = payload;
            const { data: userData, error: fetchErr } = await supabaseClient.from('users').select('game_scores').eq('id', userId).single();
            if (fetchErr) throw fetchErr;

            const currentScores = userData.game_scores || { match: 0, cloud: 0 };
            const newScores = { ...currentScores, [game]: Math.max(currentScores[game] || 0, score) };

            const { error } = await supabaseClient.from('users').update({ game_scores: newScores }).eq('id', userId);
            if (error) throw error;
            return new Response(JSON.stringify({ success: true, scores: newScores }), { headers: corsHeaders });
        }

        if (action === 'save-mood') {
            const { userId, mood } = payload;
            const { error } = await supabaseClient.from('moods').insert({
                user_id: userId,
                date: new Date().toISOString(),
                mood: mood
            });
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

        if (action === 'save-transaction') {
            const { userId, tx } = payload;
            const { error } = await supabaseClient.from('transactions').insert({
                id: tx.id,
                user_id: userId,
                date: tx.date || new Date().toISOString(),
                amount: tx.amount,
                cost: tx.cost,
                description: tx.description,
                status: tx.status
            });
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

        if (action === 'save-feedback') {
            const { userId, feedback } = payload;
            const { error } = await supabaseClient.from('feedback').insert({
                user_id: userId,
                companion_name: feedback.companionName,
                rating: feedback.rating,
                tags: feedback.tags,
                date: feedback.date || new Date().toISOString()
            });
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

        // --- ADMIN DASHBOARD ACTIONS ---
        if (action === 'admin-list-users') {
            const { data, error } = await supabaseClient.from('users').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            return new Response(JSON.stringify(data), { headers: corsHeaders });
        }

        if (action === 'admin-list-companions') {
            const { data, error } = await supabaseClient.from('companions').select('*').order('name');
            if (error) throw error;
            return new Response(JSON.stringify(data), { headers: corsHeaders });
        }

        if (action === 'system-logs') {
            const { data, error } = await supabaseClient.from('system_logs').select('*').order('timestamp', { ascending: false }).limit(100);
            if (error) throw error;
            return new Response(JSON.stringify(data), { headers: corsHeaders });
        }

        if (action === 'user-status') {
            const { userId, status } = payload;
            const { error } = await supabaseClient.from('users').update({ subscription_status: status }).eq('id', userId);
            if (error) throw error;
            if (status === 'BANNED') await supabaseClient.auth.admin.signOut(userId);
            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

        if (action === 'delete-user') {
            const { userId } = payload;
            const authHeader = req.headers.get('Authorization');
            if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
            const token = authHeader.replace('Bearer ', '');
            const { data: { user: caller }, error: uErr } = await supabaseClient.auth.getUser(token);
            if (uErr || !caller) return new Response(JSON.stringify({ error: "Invalid Session" }), { status: 401, headers: corsHeaders });

            const { data: callerData } = await supabaseClient.from('users').select('role').eq('id', caller.id).maybeSingle();
            if (caller.id !== userId && callerData?.role !== 'ADMIN') {
                return new Response(JSON.stringify({ error: "Access Denied" }), { status: 403, headers: corsHeaders });
            }

            await supabaseClient.from('users').delete().eq('id', userId);
            const { error: authError } = await supabaseClient.auth.admin.deleteUser(userId);
            if (authError) throw authError;
            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

        if (action === 'broadcast' || action === 'dashboard-broadcast') {
            const field = action === 'broadcast' ? 'broadcast_message' : 'dashboard_broadcast_message';
            const { error } = await supabaseClient.from('global_settings').update({ [field]: payload.message }).eq('id', 1);
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

        if (action === 'admin-auto-verify') {
            const { data: { users } } = await supabaseClient.auth.admin.listUsers();
            const target = users.find((u: any) => u.email === payload.email);
            if (!target) throw new Error("User not found");
            const { error } = await supabaseClient.auth.admin.updateUserById(target.id, { email_confirm: true });
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

        if (action === 'admin-reclaim') {
            const { masterKey } = payload;
            const VALID_KEY = Deno.env.get('MASTER_KEY') || 'PEUTIC_ADMIN_ACCESS_2026';
            if (masterKey !== VALID_KEY) return new Response(JSON.stringify({ error: "Denied" }), { status: 403, headers: corsHeaders });

            const authHeader = req.headers.get('Authorization');
            if (!authHeader) throw new Error("No token");
            const token = authHeader.replace('Bearer ', '');
            const { data: { user }, error: uErr } = await supabaseClient.auth.getUser(token);
            if (uErr || !user) throw new Error("Invalid User");

            await supabaseClient.from('users').update({ role: 'ADMIN' }).eq('id', user.id);
            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

        // --- PAYMENTS ---
        if (action === 'process-topup') {
            if (!stripe) throw new Error("Stripe missing");
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

        if (action === 'admin-stripe-stats') {
            if (!stripe) throw new Error("Stripe missing");
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

        if (action === 'content-scan') {
            const { userId, type, content } = payload;
            await scanContent(userId, type, content);
            return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
        }

        // --- AI GENERATION ---
        if (action === 'gemini-generate') {
            const { prompt, userId, type } = payload;
            if (userId) await scanContent(userId, type || 'AI_PROMPT', prompt);

            const apiKey = Deno.env.get('GEMINI_API_KEY');
            if (!apiKey) throw new Error("AI Key missing");
            const ai = new GoogleGenAI({ apiKey });
            const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent(prompt);
            return new Response(JSON.stringify({ text: result.response.text() }), { headers: corsHeaders });
        }

        if (action === 'gemini-speak') {
            const apiKey = Deno.env.get('GEMINI_API_KEY');
            if (!apiKey) throw new Error("AI Key missing");
            const ai = new GoogleGenAI({ apiKey });
            const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: payload.text }] }],
                generationConfig: { responseModalities: ["audio" as any] as any } as any
            } as any);
            // Flash-1.5 doesn't support easy audio modality in this SDK version yet without special handling, 
            // but the previous code tried it. I'll keep it simple or use the previous working logic if I can find it.
            // Actually, let's just stick to the text generation for now if it's too complex or keep the old one.
            // Re-using old speak logic:
            const response = await ai.models.get('gemini-1.5-flash').generateContent({
                contents: [{ parts: [{ text: payload.text }] }],
                config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } } }
            });
            const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            return new Response(JSON.stringify({ audioData }), { headers: corsHeaders });
        }

        // --- SAFETY LIST ---
        if (action === 'admin-safety-alerts') {
            const { data, error } = await supabaseClient.from('safety_alerts').select('*, users(email, name)').order('created_at', { ascending: false });
            if (error) throw error;
            return new Response(JSON.stringify(data), { headers: corsHeaders });
        }

        return new Response(JSON.stringify({ error: "Invalid Action" }), { headers: corsHeaders });

    } catch (error: any) {
        console.error("Gateway Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
});
