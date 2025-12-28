
# Stripe Webhook Function

**Route:** `POST /stripe-webhook`

## Purpose
Listens for asynchronous events sent by Stripe (e.g., when a payment is successfully completed) and updates the user's credit balance in the database.

## Authentication
*   **Type:** Signature Verification
*   **Header:** `stripe-signature`
*   **Mechanism:** Verifies the raw request body against the `STRIPE_WEBHOOK_SIGNING_SECRET` environment variable.

## Handled Events
*   `checkout.session.completed`:
    *   Extracts `userId` and `priceId` from session metadata.
    *   Maps `priceId` to specific credit amounts (e.g., Starter = 80 credits).
    *   Updates the `user_credits` table in Supabase.

## Errors
*   **400 Bad Request:** Missing signature or invalid event structure.
*   **500 Internal Server Error:** Database connection or update failure.
