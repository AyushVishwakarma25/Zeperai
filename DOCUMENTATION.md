
# ZeperAi Studio Technical Documentation

## 1. Executive Summary

ZeperAi Studio is a full-stack, AI-powered Creative Intelligence Platform designed for e-commerce brands and agencies. It goes beyond simple image generation by integrating **Commerce Intelligence (Shopify Data)**, **Brand Identity Persistence**, and **Predictive Analytics** into the creative workflow.

The system leverages **Google Gemini 2.5 & 3.0** models for multimodal generation (Text-to-Image, Image-to-Text, Data Analysis) and uses **Supabase** for a serverless backend infrastructure.

---

## 2. System Architecture

### 2.1 Tech Stack
-   **Frontend:** React 18, TypeScript, Tailwind CSS, Vite.
-   **State Management:** React Hooks + Context (Local State), Supabase Realtime (Remote State).
-   **Backend (BaaS):** Supabase (PostgreSQL, Auth, Storage, Edge Functions).
-   **AI Layer:** Google Gemini API (via `@google/genai` SDK).
-   **Payments:** Stripe (via Supabase Edge Functions).

### 2.2 Security Model
-   **Client-Side:** No sensitive API keys are exposed.
-   **Edge Proxy:** All AI calls go through `gemini-proxy`, a Supabase Edge Function that:
    1.  Verifies the User's JWT.
    2.  Checks the `user_credits` balance in PostgreSQL.
    3.  Injects the server-side API Key.
    4.  Deducts credits upon success.
-   **Row Level Security (RLS):** Database policies ensure users can only access their own profiles, designs, and brand kits.

---

## 3. Directory Structure

```
/
|-- components/
|   |-- modes/              # Logic-heavy sub-forms for specific generation modes (Product, Fashion, etc.)
|   |-- ui/                 # Atomic design elements (Buttons, Inputs, Icons)
|   |-- AnalyticsDashboard  # BI Dashboard with Chart.js visualization
|   |-- BrandKitModal       # Visual Identity manager (Logo analysis, Color extraction)
|   |-- CreativeModal       # The core orchestration engine for generative tasks
|   |-- DashboardSidebar    # Global navigation and state controller
|   |-- ShopifyDashboard    # CSV Parser and Data Analysis engine
|   |-- ... (Feature-specific modals & panels)
|-- services/
|   |-- adCopyService.ts    # structured text generation for marketing copy
|   |-- analyticsService.ts # Heuristic performance prediction algorithms
|   |-- authService.ts      # Supabase Auth wrapper
|   |-- brandService.ts     # CRUD for Brand Identity persistence
|   |-- geminiService.ts    # CENTRAL AI SERVICE: Prompt Engineering & API communication
|   |-- paymentService.ts   # Stripe Checkout initialization
|   |-- shopifyService.ts   # AI-driven CSV analysis and insight generation
|   |-- ... (Data access layers)
|-- supabase/
|   |-- functions/          # Deno-based Edge Functions
|       |-- gemini-proxy/   # Secure AI Gateway
|       |-- create-checkout/# Stripe Session Creator
|       |-- stripe-webhook/ # Payment confirmation listener
|-- types.ts                # Strict TypeScript definitions
|-- utils/                  # Client-side image processing (crop, resize, format)
```

---

## 4. Core Modules & Logic

### 4.1 Generative Engine (`geminiService.ts`)
This service contains the sophisticated "Prompt Engineering" logic.
-   **Dynamic Prompt Building:** It assembles a prompt based on `AppMode` (Product, Influencer, Fashion). It injects Brand Kit constraints (colors, fonts, negative prompts) automatically into every request.
-   **Multimodal Input:** Handles mixing text prompts with multiple reference images (Scene + Product).
-   **Fallback & Retry:** Implements exponential backoff for API rate limits.

### 4.2 Commerce Intelligence (`shopifyService.ts` & `ShopifyDashboard.tsx`)
-   **Ingestion:** Parses raw CSV exports from Shopify using `PapaParse`.
-   **AI Analysis:** Sends the raw data to Gemini-3-Pro (via Proxy) to categorize products into performance zones:
    -   🟢 **Green Zone:** Top 20% revenue drivers (Scale Ad).
    -   🟡 **Yellow Zone:** Middle 60% (Boost).
    -   🔴 **Red Zone:** Bottom 20% (Clearance).
-   **Strategy Generation:** Automatically suggests specific ad angles based on the data analysis.

### 4.3 Brand Identity System (`brandService.ts`)
-   **Logo Analysis:** Users upload a logo, and Gemini Vision extracts the Hex palette, font style, and brand "vibe".
-   **Persistence:** This data is stored in the `brand_kits` table and auto-injected into the context of the AI Content Writer and Image Generator.

### 4.4 Credits & Payment (`paymentService.ts`)
-   **Consumption:** Credits are deducted atomically via the backend.
    -   Standard Image: 1 Credit.
    -   AI Copywriting: 2 Credits.
    -   High Res / Fashion Batch: 4 Credits.
-   **Top-up:** Webhooks listen for Stripe events to increment the `user_credits` table safely.

---

## 5. Database Schema (PostgreSQL)

The application relies on a relational schema with foreign key constraints.

1.  **`profiles`**: Extends `auth.users` with display names and avatars.
2.  **`user_credits`**: Tracks integer balance and subscription quotas.
3.  **`designs`**: Stores generated images, prompt metadata, and Cloud Storage paths.
4.  **`brand_kits`**: Stores design system tokens (colors, fonts, voice).
5.  **`analysis_reports`**: JSONB storage for historical Shopify analysis data.
6.  **`inspiration_gallery`**: Public/Private feed of remixable designs.

---

## 6. Development & Deployment

### Environment Variables
Required in `.env` (Local) and Vercel/Supabase (Production):
-   `VITE_SUPABASE_URL`: Public Supabase URL.
-   `VITE_SUPABASE_ANON_KEY`: Public Anon Key.
-   `API_KEY`: Google Gemini API Key (Server-side only).
-   `STRIPE_SECRET_KEY`: Stripe Secret (Server-side only).

### Image Processing Pipeline
1.  **Upload:** Browser resizes images to max 2048px (to save bandwidth).
2.  **Generation:** Gemini returns Base64.
3.  **Persistence:** App uploads Base64 to Supabase Storage (`/designs` bucket) and saves the returned public URL to the Database. This ensures long-term access.

---
*Documentation maintained by ZeperAi Engineering.*
