
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { GoogleGenAI, Modality } from 'https://esm.sh/@google/genai'
import Stripe from 'https://esm.sh/stripe@14.14.0?target=deno'

declare const Deno: any;

// Production CORS - restrict to your domain
const ALLOWED_ORIGINS = ['https://peutic.xyz', 'https://www.peutic.xyz', 'http://localhost:5173', 'http://localhost:3000'];

const getCorsHeaders = (origin: string | null) => {
    const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    return {
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Credentials': 'true',
    };
};

serve(async (req: any) => {

    const origin = req.headers.get('origin');
    const corsHeaders = getCorsHeaders(origin);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { action, payload } = await req.json();

        // Initialize Supabase Admin Client
        const supUrl = Deno.env.get('SUPABASE_URL');
        const supKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supUrl || !supKey) {
            throw new Error("Missing Server Secrets");
        }

        const supabaseClient = createClient(supUrl, supKey);

        // Helper to get user from JWT
        const getAuthenticatedUser = async () => {
            const authHeader = req.headers.get('Authorization');
            if (!authHeader) return null;
            const token = authHeader.replace('Bearer ', '');
            const { data: { user } } = await supabaseClient.auth.getUser(token);
            return user;
        };

        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        const stripe = stripeKey ? new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        }) : null;

        // --- ADMIN CREATION --- (Allowed if count is 0)
        if (action === 'admin-create') {
            const { email, password } = payload;
            const { count } = await supabaseClient.from('users').select('*', { count: 'exact', head: true });

            if ((count || 0) > 0) {
                return new Response(JSON.stringify({ error: "System already initialized." }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            const { data: user, error: createError } = await supabaseClient.auth.admin.createUser({
                email,
                password,
                email_confirm: true,
                user_metadata: { full_name: 'System Admin' }
            });

            if (createError) throw createError;

            await supabaseClient.from('users').insert({
                id: user.user.id,
                email: email,
                name: 'System Admin',
                role: 'ADMIN',
                balance: 999,
                subscription_status: 'ACTIVE',
                provider: 'email'
            });

            return new Response(JSON.stringify({ success: true, user: user.user }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- ADMIN RECLAIM --- (Must check Master Key)
        if (action === 'admin-reclaim') {
            const { masterKey } = payload;
            const systemMasterKey = Deno.env.get('MASTER_KEY') || 'PEUTIC_MASTER_2026';

            if (masterKey !== systemMasterKey) {
                return new Response(JSON.stringify({ error: "Invalid Master Key. Reclamation failed." }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            // Reset all ADMINs to USER
            const { error: resetError } = await supabaseClient
                .from('users')
                .update({ role: 'USER' })
                .eq('role', 'ADMIN');

            if (resetError) {
                console.error("Reclaim Reset Error:", resetError);
                throw resetError;
            }

            return new Response(JSON.stringify({ success: true, message: "System Ownership Reset." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- PUBLIC/SEMIAUTH ACTIONS ---

        // --- ADMIN AUTO VERIFY ---
        if (action === 'admin-auto-verify') {
            const { email } = payload;
            const { data: { users } } = await supabaseClient.auth.admin.listUsers();

            const targetUser = users?.find((u: any) => u.email === email);
            if (!targetUser) throw new Error("User not found");

            const { error: updateError } = await supabaseClient.auth.admin.updateUserById(targetUser.id, { email_confirm: true });
            if (updateError) throw updateError;
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- PROFILE BYPASS ---
        if (action === 'profile-create-bypass') {
            const { id, email, name, provider } = payload;
            const { error } = await supabaseClient.from('users').upsert({
                id, email, name, provider,
                role: 'USER',
                balance: 0,
                subscription_status: 'ACTIVE'
            });
            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- AUTHENTICATED ACTIONS BELOW ---

        // --- PAYMENTS ---
        if (action === 'process-topup') {
            const user = await getAuthenticatedUser();
            if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

            if (!stripe) throw new Error("Stripe not configured");
            const { userId, amount, cost, paymentToken } = payload;

            // Security: Ensure userId matches authenticated user
            if (user.id !== userId) return new Response(JSON.stringify({ error: "Forbidden: User ID mismatch" }), { status: 403, headers: corsHeaders });

            if (cost > 0) {
                await stripe.charges.create({
                    amount: Math.round(cost * 100),
                    currency: 'usd',
                    source: paymentToken,
                    description: `Peutic Credits: ${userId}`
                });
            }

            const { data: balanceData, error: balanceError } = await supabaseClient.rpc('add_user_balance', { p_user_id: userId, p_amount: amount });

            if (balanceError) throw balanceError;
            const newBalance = balanceData;
            await supabaseClient.from('transactions').insert({
                id: `tx_${Date.now()}`,
                user_id: userId,
                amount, cost,
                description: cost > 0 ? 'Credit Purchase' : 'System Grant',
                status: 'COMPLETED'
            });

            return new Response(JSON.stringify({ success: true, newBalance }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- AI GENERATION ---
        if (action === 'gemini-generate') {
            const user = await getAuthenticatedUser();
            if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

            const apiKey = Deno.env.get('GEMINI_API_KEY');
            if (!apiKey) throw new Error("GEMINI_API_KEY missing");

            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: payload.prompt,
                config: { systemInstruction: "You are a mental wellness companion. Be concise, warm, and supportive." }
            });

            return new Response(JSON.stringify({ text: response.text() }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }


        // --- AI TTS ---
        if (action === 'gemini-speak' || action === 'tts') {
            const user = await getAuthenticatedUser();
            if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

            const apiKey = Deno.env.get('GEMINI_API_KEY');
            if (!apiKey) throw new Error("GEMINI_API_KEY missing");

            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: [{ parts: [{ text: payload.text || payload.prompt }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: payload.voiceId || 'Kore' } } },
                },
            });

            const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            return new Response(JSON.stringify({ audioData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- USER UPDATE ---
        if (action === 'user-update') {
            const user = await getAuthenticatedUser();
            if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
            if (user.id !== payload.id) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

            const { error } = await supabaseClient.from('users').update({
                name: payload.name,
                email: payload.email,
                birthday: payload.birthday,
                avatar_url: payload.avatar,
                email_preferences: payload.emailPreferences,
                theme_preference: payload.themePreference,
                language_preference: payload.languagePreference,
                last_login_date: new Date().toISOString()
            }).eq('id', payload.id);

            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- ADMIN ACTIONS (SECURE) ---
        if (action === 'system-logs' || action === 'broadcast' || action === 'delete-user' || action === 'user-status' || action === 'admin-list-users' || action === 'admin-list-companions') {
            const user = await getAuthenticatedUser();
            if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

            const { data: userData } = await supabaseClient.from('users').select('role').eq('id', user.id).single();
            if (userData?.role !== 'ADMIN') return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: corsHeaders });

            if (action === 'admin-list-users') {
                const { data } = await supabaseClient.from('users').select('*').order('created_at', { ascending: false });
                return new Response(JSON.stringify(data || []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            if (action === 'admin-list-companions') {
                const { data } = await supabaseClient.from('companions').select('*').order('name');
                return new Response(JSON.stringify(data || []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            if (action === 'system-logs') {
                const { data } = await supabaseClient.from('system_logs').select('*').order('timestamp', { ascending: false }).limit(100);
                return new Response(JSON.stringify(data || []), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            if (action === 'broadcast') {
                const { error } = await supabaseClient.from('global_settings').update({
                    broadcast_message: payload.message
                }).eq('id', 1);
                if (error) throw error;
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            if (action === 'user-status') {
                const { userId, status } = payload;
                const { error } = await supabaseClient.from('users').update({ subscription_status: status }).eq('id', userId);
                if (error) throw error;
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }

            if (action === 'delete-user') {
                const { userId } = payload;
                const { data: targetUser } = await supabaseClient.from('users').select('role').eq('id', userId).single();
                if (targetUser?.role === 'ADMIN') return new Response(JSON.stringify({ error: "Cannot delete Admin" }), { status: 400, headers: corsHeaders });

                const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId);
                if (deleteError) throw deleteError;
                await supabaseClient.from('users').delete().eq('id', userId);
                return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        }


        // --- DEBUG FALLBACK ---
        console.warn(`Gateway received unhandled action: [${action}]`);
        return new Response(JSON.stringify({
            error: `Invalid Action: Received '${action}'`,
            received_payload_keys: Object.keys(payload || {}),
            repro_hint: "Check spelling in services/database.ts or geminiService.ts"
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error: any) {
        const origin = req.headers.get('origin');
        const corsHeaders = getCorsHeaders(origin);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
})
