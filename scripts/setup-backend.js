
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
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenAI } from 'https://esm.sh/@google/genai'
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
    
    // Debug Log (View in Supabase Dashboard > Edge Functions > Logs)
    console.log("Request Action:", action);

    // Initialize Supabase Admin Client (Service Role)
    const supUrl = Deno.env.get('SUPABASE_URL');
    const supKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supUrl || !supKey) {
        throw new Error("Server Misconfiguration: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
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
        // Return 200 with error to avoid generic 500 on client
        return new Response(JSON.stringify({ success: false, error: 'Invalid Credentials' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // --- SECURE USER CREATION (Bypasses RLS) ---
    if (action === 'user-create') {
        const { name, email, role, provider, key } = payload;

        // 1. Determine requested role (default to USER)
        let finalRole = role || 'USER';

        // 2. Check if any admins ALREADY exist in the system
        const { count: adminCount, error: countError } = await supabaseClient.from('users').select('*', { count: 'exact', head: true }).eq('role', 'ADMIN');
        
        if (countError) {
            // This usually means table doesn't exist
            throw new Error(\`Database Error: \${countError.message}. Did you run the SQL schema?\`);
        }

        const hasAdmins = (adminCount || 0) > 0;

        // 3. AUTO-PROMOTION LOGIC
        if (!hasAdmins) {
            console.log("No admins found. Promoting first user to ADMIN.");
            finalRole = 'ADMIN';
        }

        // 4. Security Check: If requesting ADMIN when admins already exist, require Key
        if (finalRole === 'ADMIN' && hasAdmins) {
             const MASTER_KEY = Deno.env.get('ADMIN_MASTER_KEY') || 'PEUTIC-MASTER-2025-SECURE';
             if (key !== MASTER_KEY) {
                 return new Response(JSON.stringify({ error: 'Unauthorized: Invalid Master Key. System already has an administrator.' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
             }
        }

        // 5. Check duplicates using admin privileges
        // We ignore error here as .single() returns error if no rows found
        const { data: existing } = await supabaseClient.from('users').select('id').eq('email', email).single();
        if (existing) {
             return new Response(JSON.stringify({ error: 'User already exists' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const id = \`u_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
        const newUser = {
            id,
            name,
            email,
            role: finalRole,
            balance: 0,
            created_at: new Date().toISOString(),
            last_login_date: new Date().toISOString(),
            provider: provider || 'email',
            avatar_url: ''
        };

        const { error: insertError } = await supabaseClient.from('users').insert(newUser);
        if (insertError) throw new Error(insertError.message);

        return new Response(JSON.stringify({ success: true, user: newUser }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'process-topup') {
        if (!stripe) throw new Error("Stripe not configured on server");
        
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
                    description: \`Peutic Credits Top-up for user \${userId}\`
                });
                if (charge.status !== 'succeeded') throw new Error("Payment failed");
            } catch (stripeError) {
                console.error("Stripe Error:", stripeError);
                throw new Error(\`Payment processing failed: \${stripeError.message}\`);
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
        const apiKey = Deno.env.get('GEMINI_API_KEY');
        if (!apiKey) throw new Error("Server Misconfiguration: Missing GEMINI_API_KEY");
        
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

    if (action === 'gemini-speak') {
        const apiKey = Deno.env.get('GEMINI_API_KEY');
        if (!apiKey) throw new Error("Server Misconfiguration: Missing GEMINI_API_KEY");

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

  } catch (error) {
    console.error("Gateway Error:", error);
    // Return 200 with error property to bypass generic 500 handlers on client
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
        throw new Error("Server Configuration Error: Missing TAVUS_API_KEY");
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
                throw new Error("System Capacity Reached. Please try again later.");
            }
            throw new Error(errorMsg);
        }

        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } else if (action === 'end') {
        if (!conversationId) throw new Error("Missing conversation ID");
        
        await fetch(\`\${TAVUS_API_URL}/conversations/\${conversationId}/end\`, {
            method: 'POST',
            headers: { 'x-api-key': TAVUS_API_KEY },
        });
        
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error("Invalid Action");

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