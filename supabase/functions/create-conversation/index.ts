
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

// Declare Deno for TypeScript environments that don't have Deno types globally available
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Concurrency Check (Enforce 15 User Limit)
    // We check the database state which acts as our distributed counter
    const { count, error: countError } = await supabase
      .from('active_sessions')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      throw new Error("Failed to verify system capacity.");
    }

    const MAX_CONCURRENCY = 15;
    if ((count || 0) >= MAX_CONCURRENCY) {
      return new Response(
        JSON.stringify({ error: "Server is busy. Maximum capacity reached. Please try again in a moment." }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // 2. Prepare Tavus API Call
    const { replicaId, context, conversationName } = await req.json()
    const TAVUS_API_KEY = Deno.env.get('TAVUS_API_KEY')

    if (!TAVUS_API_KEY) {
      throw new Error("Server Misconfiguration: API Key missing")
    }

    // 3. Call Tavus API (Securely)
    const response = await fetch('https://tavusapi.com/v2/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': TAVUS_API_KEY,
      },
      body: JSON.stringify({
        replica_id: replicaId,
        conversation_name: conversationName,
        conversational_context: context,
        properties: {
          max_call_duration: 3600,
          enable_recording: true,
          enable_transcription: true,
          language: 'multilingual'
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || "Failed to create conversation");
    }

    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
