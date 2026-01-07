
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenAI } from 'https://esm.sh/@google/genai'
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // PRIVILEGED KEY
    );

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
        apiVersion: '2023-10-16',
        httpClient: Stripe.createFetchHttpClient(),
    });

    // --- 1. SECURE ADMIN AUTH ---
    if (action === 'admin-verify') {
        const MASTER_KEY = Deno.env.get('ADMIN_MASTER_KEY') || 'PEUTIC-MASTER-2025-SECURE';
        if (payload.key === MASTER_KEY) {
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ success: false, error: 'Invalid Credentials' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- 2. SECURE WALLET TOP-UP ---
    if (action === 'process-topup') {
        const { userId, amount, cost, paymentToken } = payload;
        
        // Fetch current user data securely
        const { data: user, error: fetchError } = await supabaseClient
            .from('users')
            .select('balance')
            .eq('id', userId)
            .single();
            
        if (fetchError) throw new Error("User not found");

        // --- PAYMENT VERIFICATION ---
        if (cost > 0) {
            if (!paymentToken) {
                throw new Error("Missing payment token");
            }
            try {
                // Charge the card
                const charge = await stripe.charges.create({
                    amount: Math.round(cost * 100), // Convert to cents
                    currency: 'usd',
                    source: paymentToken,
                    description: `Peutic Credits Top-up for user ${userId}`
                });

                if (charge.status !== 'succeeded') {
                    throw new Error("Payment failed or was declined");
                }
            } catch (stripeError: any) {
                console.error("Stripe Error:", stripeError);
                throw new Error(`Payment processing failed: ${stripeError.message}`);
            }
        }

        const newBalance = (user.balance || 0) + amount;

        // Perform atomic update
        await supabaseClient.from('users').update({ balance: newBalance }).eq('id', userId);
        
        // Log transaction
        await supabaseClient.from('transactions').insert({
            id: `tx_${Date.now()}`,
            user_id: userId,
            amount: amount,
            cost: cost,
            description: cost > 0 ? 'Credit Purchase' : 'Admin Grant',
            status: 'COMPLETED',
            date: new Date().toISOString()
        });

        return new Response(JSON.stringify({ success: true, newBalance }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- 3. SECURE AI GENERATION (TEXT) ---
    if (action === 'gemini-generate') {
        const apiKey = Deno.env.get('GEMINI_API_KEY');
        if (!apiKey) throw new Error("Server Misconfiguration: Missing AI Key");
        
        // Correct Initialization per Guidelines
        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        // Use Gemini 3 Flash Preview for text generation (Speed + Quality balance)
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: payload.prompt,
            config: {
                systemInstruction: "You are a warm, empathetic mental wellness companion. Be concise, supportive, and human-like. Do not give medical advice."
            }
        });
        
        return new Response(JSON.stringify({ text: response.text }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- 4. SECURE AI SPEECH (TTS) ---
    if (action === 'gemini-speak') {
        const apiKey = Deno.env.get('GEMINI_API_KEY');
        if (!apiKey) throw new Error("Server Misconfiguration: Missing AI Key");

        const ai = new GoogleGenAI({ apiKey: apiKey });
        
        // Use Gemini 2.5 Flash TTS (Specialized for Audio)
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: { parts: [{ text: payload.text }] },
            config: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }, // 'Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'
                    },
                },
            },
        });

        // Extract Base64 Audio
        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (!audioData) throw new Error("No audio generated");

        return new Response(JSON.stringify({ audioData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error("Invalid Action");

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})
