
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

    // --- 1. ADMIN CREATION BYPASS (NO EMAIL VERIFICATION) ---
    if (action === 'admin-create') {
        const { email, password } = payload;
        
        // Double Check: Ensure no users exist (Security)
        // Or check if specific 'admin-secret' is passed if you want multiple admins later
        const { count } = await supabaseClient.from('users').select('*', { count: 'exact', head: true });
        
        // If users exist, only allow creation if this is a recovery or special key is provided
        // For this specific request: "Once root admin is created, system plan page goes away"
        // We strictly enforce 1 root admin for this setup to be safe.
        if ((count || 0) > 0) {
             // If trying to create a 2nd admin via this public route, deny it.
             // Real admins can add users via dashboard if needed later.
             return new Response(JSON.stringify({ error: "System already initialized. Admin exists." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Create User via Admin API (Auto-confirm email)
        const { data: user, error: createError } = await supabaseClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // <--- BYPASS VERIFICATION
            user_metadata: { full_name: 'System Admin' }
        });

        if (createError) throw createError;

        // Create Public Profile manually (Ensure Role is ADMIN)
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

        if (profileError) {
             console.error("Profile creation error:", profileError);
             // If profile fails (e.g. duplicate), we still return success if auth worked,
             // letting the client handle login.
        }

        return new Response(JSON.stringify({ success: true, user: user.user }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- 2. ADMIN AUTO-VERIFY (REPAIR) ---
    if (action === 'admin-auto-verify') {
        const { email } = payload;
        if (!email) throw new Error("Email required");

        // Use Admin Auth API to verify existing user
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
        const apiKey = Deno.env.get('GEMINI_API_KEY');
        if (!apiKey) throw new Error("Server Misconfiguration: Missing AI Key");
        
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: payload.prompt,
            config: {
                systemInstruction: "You are a warm, empathetic mental wellness companion. Be concise, supportive, and human-like. Do not give medical advice."
            }
        });
        
        return new Response(JSON.stringify({ text: response.text }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- 5. AI SPEECH ---
    if (action === 'gemini-speak') {
        const apiKey = Deno.env.get('GEMINI_API_KEY');
        if (!apiKey) throw new Error("Server Misconfiguration: Missing AI Key");

        const ai = new GoogleGenAI({ apiKey: apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: { parts: [{ text: payload.text }] },
            config: {
                responseModalities: ['AUDIO'],
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
