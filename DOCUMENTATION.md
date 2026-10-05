# ZeperAi Studio Technical Documentation

## 1. Executive Summary

ZeperAi Studio (`zeperai.in`) is an enterprise-grade AI Creative Intelligence & Performance Campaign Suite built for direct-to-consumer (D2C) brands, Shopify store operators, and performance marketing teams. It combines:
1. **Autonomous Campaign Studio:** A 7-stage multi-agent strategic ad generation engine with human-in-the-loop review gates.
2. **Commercial Studio Suites:** Product Studio, Influencer & Fashion Studio, CGI/3D Lighting, and Festival/Seasonal modes.
3. **Background Remover Pro:** Zero-cost, 100% in-browser segmentation model (ONNX Runtime via WebGL/WASM) for transparent PNG cutouts.
4. **Commerce Intelligence:** Shopify CSV ingestion, product catalog performance zoning (Green/Yellow/Red), and automated ad angle recommendations.
5. **Admin Command Center & AI Secrets Manager:** Zero-trust hardened admin portal with live multi-agent telemetry, user quota ledger, and hot-reloading AI provider credentials.

The system is powered by **Google Gemini 2.5 Flash & 3.0** via `@google/genai` with enterprise **Google Vertex AI Postpay** and **Google AI Studio** dual-engine routing.

---

## 2. System Architecture

### 2.1 Tech Stack
- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, Lucide React, Recharts.
- **Backend / Proxy:** Node.js Express server (`server.ts`), compiled with `esbuild` for production.
- **Database & Storage:** Supabase PostgreSQL with strict Row Level Security (RLS) and Supabase Storage.
- **AI Infrastructure:** Google GenAI (`@google/genai` SDK) supporting:
  - **Google Vertex AI (Postpay & Express Mode):** Google Cloud Project / Service Account / Express Key routing.
  - **Google AI Studio (API Key Mode):** Standard Gemini API key routing.
  - **Dynamic In-Memory Reconfiguration:** `resetAIInstance()` in `config/ai.ts` allows instant credential rotation without node restarts.
- **Payments:** Razorpay API & Webhooks supporting INR/UPI, cards, and netbanking with automated credit ledger settlement.
- **Module System:** ESM (`"type": "module"`) requiring explicit `.js` extensions on all relative imports across frontend and backend.

### 2.2 Security Model & Architectural Invariants
- **Client-Side Secret Shielding:** No private API keys, Razorpay secrets, or service account JSONs are ever sent to client browsers.
- **Hardened Admin Authentication:**
  - Zero hardcoded fallback credentials.
  - Admin login validates via constant-time comparison (`crypto.timingSafeEqual`) against environment variables `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET`.
  - Admin email authorization enforces exact match against `ADMIN_ALLOWED_EMAILS` or verified database role metadata (`user_metadata.is_admin === true`).
- **Row Level Security (RLS):** Policies ensure users only access their own designs, brand kits, credits, and campaign runs.

---

## 3. Directory Layout

```
/
|-- components/
|   |-- admin/                 # Admin Command Center, AI Secrets Manager, Telemetry
|   |   |-- AdminDashboard.tsx         # Command center shell & sidebar
|   |   |-- PlatformSettingsManager.tsx# AI Engine & Secrets manager (Option 1)
|   |   |-- AIUsageAnalytics.tsx       # Studio telemetry & Campaign Studio cards
|   |   |-- GenerationMonitoring.tsx   # Operational monitoring & execution filters
|   |-- campaign/              # Campaign Studio UI (Stepper, Gates, Reviews, Creatives)
|   |-- modes/                 # Studio controls (Product, Fashion, Influencer, Festival)
|   |-- tools/                 # Client tools (BackgroundRemoverPro via ONNX)
|   |-- ui/                    # Design system primitives (Card, Button, Spinner, Icons)
|-- config/
|   |-- ai.ts                  # Multi-provider GoogleGenAI client & resetAIInstance()
|-- src/
|   |-- campaignStudio/        # CAMPAIGN STUDIO CORE
|   |   |-- types.ts           # Shared types (agents, review gates, schemas)
|   |   |-- server/            # Multi-agent orchestrator, gemini calls, router
|   |   |-- client/            # Typed client API, access control hook, view-models
|-- services/
|   |-- geminiService.ts       # Central visual prompt engineering & generation logic
|   |-- razorpayService.ts     # Payment initiation & client-side checkout
|   |-- brandService.ts        # Brand Kit extraction & persistence
|   |-- shopifyService.ts      # CSV catalog parser & insight categorization
|-- public/
|   |-- sitemap.xml            # Production XML Sitemap
|   |-- robots.txt             # Crawl directives & disallow rules
|   |-- ai-catalog.json        # RFC 8141 URN (urn:air:) AI Agent Discovery Manifest
|   |-- llms.txt               # LLM-readable service directory
|-- server.ts                  # Production Express API, proxy, and admin routes
```

---

## 4. Key Engines & Workflows

### 4.1 Campaign Studio (Autonomous Multi-Agent Engine)
Located in `src/campaignStudio/`, Campaign Studio takes a website URL or brand brief and orchestrates 7 specialized AI agents:
1. **`brand_analysis`:** Scrapes or analyzes input brand details to construct an authoritative `BrandContext`.
2. **`market_research`:** Identifies target demographics, pain points, and psychological triggers.
3. **`competitor_research`:** Maps competitor positioning and hooks.
4. **`strategy`:** Synthesizes messaging pillars, value propositions, and platform strategy.
5. **`creative_direction`:** Formulates visual concepts, color schemes, and art direction.
6. **`master_prompts`:** Generates high-fidelity visual generation prompts.
7. **`creatives`:** Calls Gemini image generation with layout overlays and product blending.

**Human-in-the-Loop Review Gates (`REVIEW_GATES`):**
- Gate 1: Brand Context & Market/Competitor Research Approval.
- Gate 2: Strategy & Creative Direction Approval.
- Gate 3: Master Prompts Approval before final image generation.

**Database Schema:**
- `public.campaign_runs`: Parent execution record, goal, status, credits spent.
- `public.campaign_steps`: Agent versioning and input/output snapshots.
- `public.campaign_assets`: Generated visual creatives, prompts, aspect ratios, overlays.
- `public.campaign_product_images`: Uploaded product reference shots for blending.

### 4.2 AI Provider & Secrets Manager (`components/admin/PlatformSettingsManager.tsx`)
Admins can manage platform AI infrastructure live from the dashboard:
- **Provider Switch:** Toggle between Google Vertex AI Postpay and Google AI Studio.
- **Vertex AI Controls:** Project ID, GCP Region (`us-central1`, `us-east4`, etc.), and Vertex Express API Key.
- **Google AI Studio Key:** Rotate Gemini API Key securely.
- **Campaign Studio Controls:** Master feature switch and private beta email whitelist.
- **Live Connection Test:** Executes a lightweight test prompt and displays latency in milliseconds.
- **Runtime Hot-Reload:** Updates `process.env` in memory and executes `resetAIInstance()`, guaranteeing zero downtime.

### 4.3 Client-Side Background Remover Pro
- Employs `onnxruntime-web` with WebGL execution (and WASM fallback).
- Runs 100% on the user's GPU/device canvas with zero server API cost and zero network round-trip.
- Produces pixel-perfect transparent PNG cutouts ready for immediate placement in Product Studio or Campaign Studio.

---

## 5. Development & Deployment

### Local Development
```bash
npm install
npm run dev      # Launches Vite frontend (http://localhost:5173)
npm run server   # Launches backend API (http://localhost:3000)
```

### Validation & Build
```bash
npm run lint     # Validates TypeScript types (tsc --noEmit)
npm run build    # Compiles Vite production bundle & esbuild server.cjs
```

### Production Deployment
- Frontend static assets deployed via Vercel CDN.
- Backend server deployed on Cloud Run / Node runtime.
- Environment variables configured in hosting environment secrets (`.env` is git-ignored).

---
*Documentation maintained by ZeperAi Engineering Team.*
