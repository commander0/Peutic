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
        // --- SAFETY PROTOCOL INJECTION (Server-Side) ---
        const CRISIS_PROTOCOL = `
        CRITICAL SAFETY PROTOCOL:
        If the user expresses intent of self-harm, suicide, or harm to others:
        1. Immediately stop the roleplay.
        2. Say exactly: "I am concerned about your safety. Please call 988 or your local emergency services immediately."
        3. Do not attempt to treat a crisis situation yourself.
        `;

        const systemContext = context || `You are an empathetic, professional, and warm human specialist. You are speaking with ${userName}. Your role is to listen actively, provide emotional support, and help them process their thoughts. You are fluent in all languages. Detect the user's language instantly and respond in that same language with zero latency. ${CRISIS_PROTOCOL}`;

        const body = {
            replica_id: replicaId,
            conversation_name: `Session with ${userName} - ${new Date().toISOString()}`,
            conversational_context: systemContext,
            properties: {
                max_call_duration: 3600,
                enable_recording: true,
                enable_transcription: true,
                language: 'multilingual'
            }
        };

        const response = await fetch(`${TAVUS_API_URL}/conversations`, {
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
        
        await fetch(`${TAVUS_API_URL}/conversations/${conversationId}/end`, {
            method: 'POST',
            headers: { 'x-api-key': TAVUS_API_KEY },
        });
        
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error("Invalid Action");

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})