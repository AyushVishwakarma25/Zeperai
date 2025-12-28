
# Create Checkout Function

**Route:** `POST /create-checkout`

## Purpose
Initializes a Stripe Checkout Session for user subscriptions or credit top-ups. It returns a URL that the frontend redirects the user to.

## Authentication
*   **Type:** Bearer Token (Supabase JWT)
*   **Header:** `Authorization: Bearer <token>`

## Request Body
```json
{
  "priceId": "price_1SfLsGSJiVYEkmoMg1vjwQge",
  "userId": "uuid-string",
  "email": "user@example.com",
  "returnUrl": "https://your-app.com"
}
```

## Response
*   **Success (200):**
    ```json
    {
      "url": "https://checkout.stripe.com/c/pay/..."
    }
    ```

## Errors
*   **400 Bad Request:** Missing `priceId` or `userId`.
*   **500 Internal Server Error:** Stripe API failure.
