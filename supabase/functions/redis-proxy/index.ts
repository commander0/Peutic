import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { connect } from "https://deno.land/x/redis@v0.29.0/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
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

        const { action, key, value, ttl } = await req.json()

        // Environment Variables (Set in Supabase Secrets)
        const redisUrl = Deno.env.get('REDIS_URL') || Deno.env.get('VITE_REDIS_URL')
        // Token/Password isn't used directly by redis/mod.ts usually, just URL with Auth or separate Auth
        // Redis URL format: redis://:password@endpoint:port
        const redisPassword = Deno.env.get('REDIS_TOKEN') || Deno.env.get('VITE_REDIS_TOKEN')

        // Construct valid Redis URL if needed or parse manually
        // Assuming simple hostname provided: "redis-15927...com"
        // Port defaults to 6379 unless specified.
        // Password might be needed.

        // Strategy: Parse the user input.
        let hostname = redisUrl;
        let port = 6379;

        if (redisUrl && redisUrl.includes(':')) {
            const parts = redisUrl.split(':');
            if (parts.length > 1) {
                // Handle "redis-host:port" or "redis://host:port"
                const p = parts[parts.length - 1];
                if (!isNaN(parseInt(p))) port = parseInt(p);

                // Extract hostname cleanly
                hostname = parts[0].replace('redis://', '');
            }
        }

        if (!hostname) throw new Error("Missing REDIS_URL configuration");

        const redis = await connect({
            hostname: hostname,
            port: port,
            password: redisPassword,
        });

        let result;

        switch (action) {
            case 'get':
                result = await redis.get(key);
                break;
            case 'set':
                if (ttl) {
                    await redis.set(key, JSON.stringify(value), { px: ttl * 1000 });
                } else {
                    await redis.set(key, JSON.stringify(value));
                }
                result = "OK";
                break;
            case 'del':
                await redis.del(key);
                result = "OK";
                break;
            default:
                throw new Error(`Unknown action: ${action}`);
        }

        redis.close();

        return new Response(
            JSON.stringify(result),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    }
})
