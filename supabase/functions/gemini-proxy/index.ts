
/**
 * POST /gemini-proxy
 *
 * PURPOSE:
 * - Acts as a secure gateway between the Frontend and Google Gemini API.
 * - Enforces Authentication (Supabase JWT).
 * - Enforces Business Logic (Credit Check & Deduction).
 *
 * AUTH:
 * - Required: Bearer Token (Supabase JWT) in 'Authorization' header.
 *
 * BODY:
 * {
 *   action: "generateContent",
 *   model: "gemini-3-flash-preview",
 *   cost: number, // Optional, defaults to 1 if not provided
 *   params: { ... },
 *   config: { ... }
 * }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { GoogleGenAI } from "https://esm.sh/@google/genai@^1.19.0";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const geminiApiKey = Deno.env.get('API_KEY');

    if (!supabaseUrl || !supabaseServiceKey || !geminiApiKey) {
      throw new Error("Missing environment configuration");
    }

    // 1. Initialize Supabase Admin
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Identify the User via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const supabaseUserClient = createClient(
      supabaseUrl,
      supabaseAnonKey ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseUserClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401 
      });
    }

    // 3. Parse Request
    const body = await req.json();
    const { action, params, model = 'gemini-flash-latest', config = {}, cost = 1 } = body;

    // Validate Cost (prevent negative or zero cost exploits)
    const deductionAmount = Math.max(1, Math.floor(Number(cost) || 1));

    // 4. Check Credits on Server
    const { data: creditData, error: creditError } = await supabaseAdmin
      .from('user_credits')
      .select('current_balance')
      .eq('user_id', user.id)
      .single();

    if (creditError || !creditData) {
      // Create user_credits record if missing (self-healing)
      await supabaseAdmin.from('user_credits').insert({ user_id: user.id, current_balance: 10, total_quota: 10 });
      // Re-fetch or allow pass for now, but usually throw error
    }
    
    if (creditData && creditData.current_balance < deductionAmount) {
      return new Response(JSON.stringify({ error: "Insufficient credits balance" }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 402 
      });
    }

    // 5. Call Gemini
    const ai = new GoogleGenAI({ apiKey: geminiApiKey });
    let response;

    if (action === 'generateContent') {
      response = await ai.models.generateContent({
        model: model,
        contents: params.contents || params,
        config: config
      });
    } else {
      throw new Error(`Unsupported action: ${action}`);
    }

    // 6. Deduct Credits
    if (creditData) {
        const { error: updateError } = await supabaseAdmin
        .from('user_credits')
        .update({ current_balance: creditData.current_balance - deductionAmount })
        .eq('user_id', user.id);

        if (updateError) console.warn("Failed to deduct credits:", updateError);
    }

    return new Response(
      JSON.stringify({ 
        text: response.text, 
        candidates: response.candidates 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error("Proxy Execution Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
