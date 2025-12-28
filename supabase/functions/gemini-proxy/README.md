
# Gemini Proxy Function

**Route:** `POST /gemini-proxy`

## Purpose
Acts as a secure gateway between the Frontend and the Google Gemini API. It handles:
1.  **Authentication:** Verifies the Supabase JWT.
2.  **Business Logic:** Checks if the user has sufficient credits.
3.  **Proxying:** Calls the Google Gemini API securely (hiding the API Key).
4.  **Accounting:** Deducts credits upon successful generation.

## Authentication
*   **Type:** Bearer Token (Supabase JWT)
*   **Header:** `Authorization: Bearer <token>`

## Request Body
```json
{
  "action": "generateContent",
  "model": "gemini-3-flash-preview", // or "gemini-2.5-flash-image"
  "params": {
    "contents": [
      { "parts": [{ "text": "..." }, { "inlineData": ... }] }
    ]
  },
  "config": {
    "temperature": 0.7,
    "topK": 40
    // ...other generation config
  }
}
```

## Response
*   **Success (200):** Returns the raw Gemini API response (candidates, text, etc.).

## Errors
*   **401 Unauthorized:** Invalid or missing JWT.
*   **402 Payment Required:** Insufficient user credits.
*   **400 Bad Request:** Invalid `action` or malformed body.
*   **500 Internal Server Error:** Gemini API failure or Database update failure.
