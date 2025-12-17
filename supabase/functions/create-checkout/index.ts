
import Stripe from "https://esm.sh/stripe@16.0.0?target=deno";

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Hardcoded Test Key for this specific setup
const stripe = new Stripe('sk_test_51MkjFASJiVYEkmoMo9XblyGWl84C2WmnifqO3eyPJnej3miPOVO8OPMAcxdV2Zk12hEE4V64LskqTv2uHalKKvwq00zO8RWPA7', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

Deno.serve(async (req) => {
  // 1. Handle CORS Preflight Request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Parse Request Body
    const { priceId, userId, email, returnUrl } = await req.json();

    if (!priceId || !userId) {
      throw new Error("Missing priceId or userId");
    }

    // 3. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${returnUrl}/?payment_success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}/?payment_cancelled=true`,
      customer_email: email,
      metadata: {
        userId: userId,
        priceId: priceId,
      },
    });

    // 4. Return the Checkout URL
    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
