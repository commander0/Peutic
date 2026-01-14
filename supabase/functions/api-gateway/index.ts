
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

        if (!supUrl || !supKey) {
            throw new Error("Missing Server Secrets");
        }

        const supabaseClient = createClient(supUrl, supKey);
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        const stripe = stripeKey ? new Stripe(stripeKey, {
            apiVersion: '2023-10-16',
            httpClient: Stripe.createFetchHttpClient(),
        }) : null;

        // --- ADMIN CREATION ---
        if (action === 'admin-create') {
            const { email, password } = payload;
            const { count } = await supabaseClient.from('users').select('*', { count: 'exact', head: true });

            if ((count || 0) > 0) {
                return new Response(JSON.stringify({ error: "System already initialized." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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

        // --- PROFILE BYPASS (For self-healing) ---
        if (action === 'profile-create-bypass') {
            const { id, email, name, provider } = payload;
            const { count } = await supabaseClient.from('users').select('*', { count: 'exact', head: true });
            const isFirst = (count || 0) === 0;

            const { error } = await supabaseClient.from('users').upsert({
                id, email, name, provider,
                role: isFirst ? 'ADMIN' : 'USER',
                balance: isFirst ? 999 : 0,
                subscription_status: 'ACTIVE'
            });

            if (error) throw error;
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- PAYMENTS ---
        if (action === 'process-topup') {
            if (!stripe) throw new Error("Stripe not configured");
            const { userId, amount, cost, paymentToken } = payload;

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
            const apiKey = Deno.env.get('GEMINI_API_KEY');
            if (!apiKey) throw new Error("GEMINI_API_KEY missing");

            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: payload.prompt,
                config: { systemInstruction: "You are a mental wellness companion. Be concise, warm, and supportive." }
            });

            return new Response(JSON.stringify({ text: response.text }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // --- AI TTS ---
        if (action === 'gemini-speak') {
            const apiKey = Deno.env.get('GEMINI_API_KEY');
            if (!apiKey) throw new Error("GEMINI_API_KEY missing");

            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: [{ parts: [{ text: payload.text }] }],
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
                },
            });

            const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            return new Response(JSON.stringify({ audioData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ error: "Invalid Action" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
})
