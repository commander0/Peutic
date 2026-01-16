
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

// --- 1. API GATEWAY CODE (Deno) ---
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

    // --- ADMIN DASHBOARD ACTIONS ---
    
    // 1. List Users
    if (action === 'admin-list-users') {
        const { data, error } = await supabaseClient.from('users').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 2. List Companions
    if (action === 'admin-list-companions') {
        const { data, error } = await supabaseClient.from('companions').select('*').order('name');
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 3. System Logs
    if (action === 'system-logs') {
        const { data, error } = await supabaseClient.from('system_logs').select('*').order('timestamp', { ascending: false }).limit(100);
        if (error) throw error;
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 4. Update User Status (Ban/Unban)
    if (action === 'user-status') {
        const { userId, status } = payload;
        // status is 'ACTIVE' or 'BANNED'
        const { error } = await supabaseClient.from('users').update({ subscription_status: status }).eq('id', userId);
        if (error) throw error;
        
        // If banning, maybe revoke sessions? (Advanced)
        if (status === 'BANNED') {
           await supabaseClient.auth.admin.signOut(userId);
        }
        
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 5. Delete User
    if (action === 'delete-user') {
        const { userId } = payload;
        // Delete from Auth (cascades usually, but let's be safe)
        const { error } = await supabaseClient.auth.admin.deleteUser(userId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 6. Broadcast Message
    if (action === 'broadcast') {
        const { message } = payload;
        const { error } = await supabaseClient.from('global_settings').update({ broadcast_message: message }).eq('id', 1);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 7. Auto Verify Email
    if (action === 'admin-auto-verify') {
        const { email } = payload;
        // Search by email to get ID (Auth Admin)
        // Or if we have ID. payload usually has email from the UI for this specific call in adminService
        // adminService says: admin-auto-verify { email }
        
        // We need to list users to find the ID by email, OR just use updateUserById if we had ID.
        // Assuming we need to find them first.
        const { data: { users } } = await supabaseClient.auth.admin.listUsers();
        const target = users.find((u: any) => u.email === email);
        
        if (!target) return new Response(JSON.stringify({ error: "User not found" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        const { error } = await supabaseClient.auth.admin.updateUserById(target.id, { email_confirm: true });
        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 8. Reclaim Admin (Security)
    if (action === 'admin-reclaim') {
         const { masterKey } = payload;
         const VALID_KEY = Deno.env.get('MASTER_KEY') || 'PEUTIC_MASTER_2026'; // Fallback for dev
         if (masterKey !== VALID_KEY) {
             return new Response(JSON.stringify({ error: "Invalid Master Key" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
         }

         // Find current user calling this? No, payload usually has userId if authenticated, 
         // BUT this might be called when user IS logged in as basic user.
         // We get the user from the Authorization header usually.
         
         const authHeader = req.headers.get('Authorization');
         if (!authHeader) return new Response(JSON.stringify({ error: "No Session" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
         const token = authHeader.replace('Bearer ', '');
         const { data: { user }, error: uErr } = await supabaseClient.auth.getUser(token);
         
         if (uErr || !user) return new Response(JSON.stringify({ error: "Invalid Session" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

         const { error } = await supabaseClient.from('users').update({ role: 'ADMIN' }).eq('id', user.id);
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
                description: \`Peutic Credits: \${userId}\`
            });
        }

        const { data: balanceData, error: balanceError } = await supabaseClient.rpc('add_user_balance', { p_user_id: userId, p_amount: amount });
        
        if (balanceError) throw balanceError;
        const newBalance = balanceData;
        await supabaseClient.from('transactions').insert({
            id: \`tx_\${Date.now()}\`,
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

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
`;

// --- 2. TAVUS PROXY CODE (Deno) ---
const tavusProxyCode = `
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

declare const Deno: any;
const TAVUS_API_URL = 'https://tavusapi.com/v2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get('TAVUS_API_KEY');
    if (!apiKey) throw new Error("TAVUS_API_KEY missing");

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

        const response = await fetch(\`\${TAVUS_API_URL}/conversations\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
            body: JSON.stringify({
                replica_id: replicaId,
                conversation_name: \`Session \${userName} - \${new Date().toISOString()}\`,
                conversational_context: systemContext,
                properties: { 
                    max_call_duration: 3600, 
                    enable_recording: true,
                    enable_transcription: true,
                    language: 'multilingual'
                }
            }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Tavus Error");
        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (action === 'end') {
        await fetch(\`\${TAVUS_API_URL}/conversations/\${conversationId}/end\`, {
            method: 'POST',
            headers: { 'x-api-key': apiKey },
        });
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ error: "Invalid Action" }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
`;

// --- WRITE FILES ---
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
} catch (e) {
    console.error("❌ Setup Failed:", e);
}
