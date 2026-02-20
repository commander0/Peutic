
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

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

    // CRITICAL SECURITY FIX: Enforce Auth
    const supUrl = Deno.env.get('SUPABASE_URL');
    const supKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supUrl || !supKey) throw new Error("Supabase config missing");

    const supabaseClient = createClient(supUrl, supKey);
    const authHeader = req.headers.get('Authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    if (!token) throw new Error("Unauthorized request");

    const { data: { user }, error: authErr } = await supabaseClient.auth.getUser(token);
    if (authErr || !user) throw new Error("Unauthorized request");

    const { action, replicaId, userName, context, conversationId } = await req.json();

    if (action === 'create') {
      const CRISIS_PROTOCOL = `
        CRITICAL SAFETY PROTOCOL:
        If the user expresses intent of self-harm, suicide, or harm to others:
        1. Immediately stop the roleplay.
        2. Say exactly: "I am concerned about your safety. Please call 988 or your local emergency services immediately."
        3. Do not attempt to treat a crisis situation yourself.
        `;

      const systemContext = context || `You are an empathetic, professional, and warm human specialist. You are speaking with ${userName}. Your role is to listen actively, provide emotional support, and help them process their thoughts. You are fluent in all languages. Detect the user's language instantly and respond in that same language with zero latency. ${CRISIS_PROTOCOL}`;

      const response = await fetch(`${TAVUS_API_URL}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
        body: JSON.stringify({
          replica_id: replicaId,
          conversation_name: `Session ${userName} - ${new Date().toISOString()}`,
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
      await fetch(`${TAVUS_API_URL}/conversations/${conversationId}/end`, {
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
