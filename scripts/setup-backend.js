
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const ensureDirectoryExistence = (filePath) => {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
};

console.log("🚀 Initializing Peutic Backend...");

// --- 1. API GATEWAY CODE ---
const apiGatewayCode = `
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
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, payload } = await req.json();
    
    // Debug Log
    console.log("Request Action:", action);

    // Initialize Supabase Admin Client (Service Role)
    const supUrl = Deno.env.get('SUPABASE_URL');
    const supKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supUrl || !supKey) {
        return new Response(JSON.stringify({ error: "Server Misconfiguration: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Check your Supabase secrets." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseClient = createClient(supUrl, supKey);

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const stripe = stripeKey ? new Stripe(stripeKey, {
        apiVersion: '2023-10-16',
        httpClient: Stripe.createFetchHttpClient(),
    }) : null;

    if (action === 'admin-verify') {
        const MASTER_KEY = Deno.env.get('ADMIN_MASTER_KEY') || 'PEUTIC-MASTER-2025-SECURE';
        if (payload.key === MASTER_KEY) {
            return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        return new Response(JSON.stringify({ success: false, error: 'Invalid Credentials' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- EMERGENCY PROFILE CREATION (Bypasses RLS) ---
    if (action === 'profile-create-bypass') {
        const { id, email, name, provider } = payload;
        
        const { count } = await supabaseClient.from('users').select('*', { count: 'exact', head: true });
        const isFirst = (count || 0) === 0;

        const { error } = await supabaseClient.from('users').upsert({
            id: id,
            email: email,
            name: name,
            role: isFirst ? 'ADMIN' : 'USER',
            balance: isFirst ? 999 : 0,
            subscription_status: 'ACTIVE',
            provider: provider || 'email',
            created_at: new Date().toISOString()
        }, { onConflict: 'id' });

        if (error) {
            console.error("Profile Bypass Error:", error);
            return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'process-topup') {
        if (!stripe) return new Response(JSON.stringify({ error: "Stripe not configured on server" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        
        const { userId, amount, cost, paymentToken } = payload;
        
        const { data: user, error: fetchError } = await supabaseClient
            .from('users')
            .select('balance')
            .eq('id', userId)
            .single();
            
        if (fetchError) return new Response(JSON.stringify({ error: "User not found" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        if (cost > 0) {
            if (!paymentToken) return new Response(JSON.stringify({ error: "Missing payment token" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            try {
                const charge = await stripe.charges.create({
                    amount: Math.round(cost * 100),
                    currency: 'usd',
                    source: paymentToken,
                    description: \`Peutic Credits Top-up for user \${userId}\`
                });
                if (charge.status !== 'succeeded') return new Response(JSON.stringify({ error: "Payment failed" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            } catch (stripeError) {
                console.error("Stripe Error:", stripeError);
                return new Response(JSON.stringify({ error: \`Payment processing failed: \${stripeError.message}\` }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
        }

        const newBalance = (user.balance || 0) + amount;
        await supabaseClient.from('users').update({ balance: newBalance }).eq('id', userId);
        
        await supabaseClient.from('transactions').insert({
            id: \`tx_\${Date.now()}\`,
            user_id: userId,
            amount: amount,
            cost: cost,
            description: cost > 0 ? 'Credit Purchase' : 'Admin Grant',
            status: 'COMPLETED',
            date: new Date().toISOString()
        });

        return new Response(JSON.stringify({ success: true, newBalance }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

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
        if (!audioData) return new Response(JSON.stringify({ error: "No audio generated" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        return new Response(JSON.stringify({ audioData }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: "Invalid Action" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error("Gateway Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
`;

// --- 2. TAVUS PROXY CODE ---
const tavusProxyCode = `
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

declare const Deno: any;

const TAVUS_API_URL = 'https://tavusapi.com/v2';
const TAVUS_API_KEY = Deno.env.get('TAVUS_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!TAVUS_API_KEY) {
        return new Response(JSON.stringify({ error: "Server Configuration Error: Missing TAVUS_API_KEY" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { action, replicaId, userName, context, conversationId } = await req.json();

    if (action === 'create') {
        const CRISIS_PROTOCOL = \`
        CRITICAL SAFETY PROTOCOL:
        If the user expresses intent of self-harm, suicide, or harm to others:
        1. Immediately stop the roleplay.
        2. Say exactly: "I am concerned about your safety. Please call 988 or your local emergency services immediately."
        3. Do not attempt to treat a crisis situation yourself.
        \`;

        const systemContext = context || \`You are an empathetic, professional, and warm human specialist. You are speaking with \${userName}. Your role is to listen actively, provide emotional support, and help them process their thoughts. You are fluent in all languages. Detect the user's language instantly and respond in that same language with zero latency. \${CRISIS_PROTOCOL}\`;

        const body = {
            replica_id: replicaId,
            conversation_name: \`Session with \${userName} - \${new Date().toISOString()}\`,
            conversational_context: systemContext,
            properties: {
                max_call_duration: 3600,
                enable_recording: true,
                enable_transcription: true,
                language: 'multilingual'
            }
        };

        const response = await fetch(\`\${TAVUS_API_URL}/conversations\`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': TAVUS_API_KEY,
            },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data.message || data.error || response.statusText;
            console.error("Tavus API Error:", errorMsg);
            if (response.status === 402 || errorMsg.includes('quota')) {
                return new Response(JSON.stringify({ error: "System Capacity Reached. Please try again later." }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
            }
            return new Response(JSON.stringify({ error: errorMsg }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } else if (action === 'end') {
        if (!conversationId) return new Response(JSON.stringify({ error: "Missing conversation ID" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        
        await fetch(\`\${TAVUS_API_URL}/conversations/\${conversationId}/end\`, {
            method: 'POST',
            headers: { 'x-api-key': TAVUS_API_KEY },
        });
        
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: "Invalid Action" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
`;

// --- 3. EXECUTE WRITE ---
const gatewayPath = path.join(rootDir, 'supabase', 'functions', 'api-gateway', 'index.ts');
const tavusPath = path.join(rootDir, 'supabase', 'functions', 'tavus-proxy', 'index.ts');

try {
    ensureDirectoryExistence(gatewayPath);
    fs.writeFileSync(gatewayPath, apiGatewayCode);
    console.log("✅ Created function: api-gateway");

    ensureDirectoryExistence(tavusPath);
    fs.writeFileSync(tavusPath, tavusProxyCode);
    console.log("✅ Created function: tavus-proxy");

    console.log("\n✨ Success! Backend code generated.");
    console.log("👉 Next Steps: Run 'npm run backend:deploy' to push to cloud.");
} catch (e) {
    console.error("❌ Setup Failed:", e);
}
