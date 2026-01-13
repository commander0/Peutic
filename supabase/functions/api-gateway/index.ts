
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '' // PRIVILEGED KEY
    );

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
        apiVersion: '2023-10-16',
        httpClient: Stripe.createFetchHttpClient(),
    });

    // --- 1. ADMIN CREATION BYPASS (NO EMAIL VERIFICATION) ---
    if (action === 'admin-create') {
        const { email, password } = payload;
        
        const { count } = await supabaseClient.from('users').select('*', { count: 'exact', head: true });
        
        if ((count || 0) > 0) {
             return new Response(JSON.stringify({ error: "System already initialized. Admin exists." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const { data: user, error: createError } = await supabaseClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // BYPASS VERIFICATION
            user_metadata: { full_name: 'System Admin' }
        });

        if (createError) throw createError;

        const { error: profileError } = await supabaseClient.from('users').insert({
            id: user.user.id,
            email: email,
            name: 'System Admin',
            role: 'ADMIN',
            balance: 999,
            subscription_status: 'ACTIVE',
            provider: 'email',
            created_at: new Date().toISOString()
        });

        return new Response(JSON.stringify({ success: true, user: user.user }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- 2. ADMIN AUTO-VERIFY (REPAIR) ---
    if (action === 'admin-auto-verify') {
        const { email } = payload;
        if (!email) throw new Error("Email required");

        const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers();
        if (listError) throw listError;
        
        const targetUser = users.find((u: any) => u.email === email);
        
        if (targetUser) {
            const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
                targetUser.id,
                { email_confirm_at: new Date().toISOString() }
            );
            
            if (updateError) throw updateError;
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        } else {
            throw new Error("User not found in Auth");
        }
    }

    // --- 3. PROCESS TOPUP ---
    if (action === 'process-topup') {
        const { userId, amount, cost, paymentToken } = payload;
        
        const { data: user, error: fetchError } = await supabaseClient
            .from('users')
            .select('balance')
            .eq('id', userId)
            .single();
            
        if (fetchError) throw new Error("User not found");

        if (cost > 0) {
            if (!paymentToken) throw new Error("Missing payment token");
            try {
                const charge = await stripe.charges.create({
                    amount: Math.round(cost * 100),
                    currency: 'usd',
                    source: paymentToken,
                    description: `Peutic Credits Top-up for user ${userId}`
                });
                if (charge.status !== 'succeeded') throw new Error("Payment failed or was declined");
            } catch (stripeError: any) {
                console.error("Stripe Error:", stripeError);
                throw new Error(`Payment processing failed: ${stripeError.message}`);
            }
        }

        const newBalance = (user.balance || 0) + amount;
        await supabaseClient.from('users').update({ balance: newBalance }).eq('id', userId);
        
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

    // --- 4. AI GENERATION ---
    if (action === 'gemini-generate') {
        // Fix: Use process.env.API_KEY directly for initialization as per guidelines
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: payload.prompt,
            config: {
                systemInstruction: "You are a warm, empathetic mental wellness companion. Be concise, supportive, and human-like. Do not give medical advice."
            }
        });
        
        // Fix: Access .text property directly (not a method)
        return new Response(JSON.stringify({ text: response.text }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- 5. AI SPEECH ---
    if (action === 'gemini-speak') {
        // Fix: Use process.env.API_KEY directly for initialization as per guidelines
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            // Fix: Standardize contents format to an array of parts
            contents: [{ parts: [{ text: payload.text }] }],
            config: {
                // Fix: Use Modality.AUDIO from enum
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });

        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!audioData) throw new Error("No audio generated");

        return new Response(JSON.stringify({ audioData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error("Invalid Action");

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})
