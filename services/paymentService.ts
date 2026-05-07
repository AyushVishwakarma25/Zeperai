
import { supabase } from './supabaseClient';
import { loadStripe } from '@stripe/stripe-js';

// --- CONFIGURATION ---
// ACTUAL STRIPE PRICE IDs
export const STRIPE_PRICES = {
    PAY_AS_YOU_GO: 'price_1SfM9hSJiVYEkmoMzEF8LOKe', // ₹499 - 150 Credits (Updated from 25 credits topup)
};

export const paymentService = {
    /**
     * Initiates a Stripe Checkout Session via Supabase Edge Function
     */
    async createCheckoutSession(priceId: string): Promise<void> {
        // Validation for common mistake
        if (priceId.startsWith('prod_')) {
            alert('Configuration Error: You are using a Product ID. Please update services/paymentService.ts with the Price ID (starts with price_).');
            throw new Error('Invalid Price ID');
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("You must be logged in to subscribe.");

        // Call Supabase Edge Function
        // Passing the body directly as an object allows supabase-js to handle serialization and Content-Type
        const { data, error } = await supabase.functions.invoke('create-checkout', {
            body: {
                priceId: priceId,
                userId: user.id,
                email: user.email,
                returnUrl: window.location.origin // e.g. http://localhost:5173
            }
        });

        if (error) {
            console.error('Checkout error:', error);
            // Provide a more helpful error message to the user
            const msg = error.message || 'Unknown error';
            if (msg.includes('Failed to send a request') || msg.includes('404')) {
                throw new Error('Payment system is initializing. Please ensure you have deployed the "create-checkout" function using: supabase functions deploy create-checkout --no-verify-jwt');
            }
            throw new Error(`Payment Error: ${msg}`);
        }

        if (!data?.url) {
            throw new Error('No checkout URL returned from the server.');
        }

        // Redirect to Stripe
        window.location.href = data.url;
    }
};
