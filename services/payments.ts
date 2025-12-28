
import { supabase } from './supabaseClient';

export const STRIPE_PRICES = {
    STARTER: 'price_1SfLsGSJiVYEkmoMg1vjwQge',
    STANDARD: 'price_1SfLuJSJiVYEkmoMCng9doLV',
    AGENCY: 'price_1SfLvlSJiVYEkmoMGnzcUVLj',
    TOP_UP_25: 'price_1SfM9hSJiVYEkmoMzEF8LOKe',
};

export const payments = {
    async createCheckoutSession(priceId: string): Promise<void> {
        if (priceId.startsWith('prod_')) {
            alert('Configuration Error: You are using a Product ID. Please update services/payments.ts with the Price ID.');
            throw new Error('Invalid Price ID');
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("You must be logged in to subscribe.");

        const { data, error } = await supabase.functions.invoke('create-checkout', {
            body: {
                priceId: priceId,
                userId: user.id,
                email: user.email,
                returnUrl: window.location.origin
            }
        });

        if (error) throw new Error(`Payment Error: ${error.message || 'Unknown error'}`);
        if (!data?.url) throw new Error('No checkout URL returned from the server.');

        window.location.href = data.url;
    }
};
