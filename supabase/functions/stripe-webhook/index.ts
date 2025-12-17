
import Stripe from "https://esm.sh/stripe@16.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

declare const Deno: any;

const stripe = new Stripe('sk_test_51MkjFASJiVYEkmoMo9XblyGWl84C2WmnifqO3eyPJnej3miPOVO8OPMAcxdV2Zk12hEE4V64LskqTv2uHalKKvwq00zO8RWPA7', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

// Helper to determine credit amount based on price ID
const getCreditsForPrice = (priceId: string) => {
    switch (priceId) {
        case 'price_1SfLsGSJiVYEkmoMg1vjwQge': return 80;   // Starter
        case 'price_1SfLuJSJiVYEkmoMCng9doLV': return 300;  // Standard
        case 'price_1SfLvlSJiVYEkmoMGnzcUVLj': return 1000; // Agency
        case 'price_1SfM9hSJiVYEkmoMzEF8LOKe': return 25;   // Top Up
        default: return 0;
    }
};

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing signature", { status: 400 });
  }

  try {
    const body = await req.text();
    // In production, verify signature:
    // const event = stripe.webhooks.constructEvent(body, signature, Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!);
    
    // For test environment without secret env var set:
    const event = JSON.parse(body);

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const priceId = session.line_items?.[0]?.price?.id || session.metadata?.priceId;

        if (userId) {
            const supabaseAdmin = createClient(
                Deno.env.get('SUPABASE_URL') ?? '',
                Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
            );

            const creditsToAdd = getCreditsForPrice(priceId);

            if (creditsToAdd > 0) {
                const { data: currentCredit } = await supabaseAdmin
                    .from('user_credits')
                    .select('current_balance')
                    .eq('user_id', userId)
                    .single();

                const newBalance = (currentCredit?.current_balance || 0) + creditsToAdd;

                await supabaseAdmin
                    .from('user_credits')
                    .update({ current_balance: newBalance })
                    .eq('user_id', userId);
                
                console.log(`Updated credits for user ${userId}: +${creditsToAdd}`);
            } else {
                console.log(`Unknown price ID ${priceId}, no credits added.`);
            }
        }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err) {
    console.error("Webhook Error:", err);
    return new Response(err instanceof Error ? err.message : 'Unknown Error', { status: 400 });
  }
});
