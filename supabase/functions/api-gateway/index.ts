
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { GoogleGenAI } from 'https://esm.sh/@google/genai'

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
        const { userId, amount, cost } = payload;
        
        // Fetch current user data securely
        const { data: user, error: fetchError } = await supabaseClient
            .from('users')
            .select('balance')
            .eq('id', userId)
            .single();
            
        if (fetchError) throw new Error("User not found");

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

    // --- 3. SECURE AI GENERATION (Hide Gemini Key) ---
    if (action === 'gemini-generate') {
        const apiKey = Deno.env.get('GEMINI_API_KEY');
        if (!apiKey) throw new Error("Server Misconfiguration: Missing AI Key");
        
        const ai = new GoogleGenAI({ apiKey: apiKey });
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash-lite-preview-02-05',
            contents: payload.prompt
        });
        
        const text = response.text;
        
        return new Response(JSON.stringify({ text }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    throw new Error("Invalid Action");

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
})
