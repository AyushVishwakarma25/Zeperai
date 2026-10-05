# ZeperAi Studio

> The All-in-One AI Creative Intelligence & Performance Ad Generation Platform for D2C Brands, E-Commerce Stores, and Growth Marketers.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75C2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![Google Cloud Vertex AI](https://img.shields.io/badge/Google_Cloud_Vertex_AI-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)](https://cloud.google.com/vertex-ai)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

---

## 🚀 Overview

**ZeperAi Studio** (`zeperai.in`) replaces expensive traditional commercial photoshoots and multi-week agency design turnaround times with an autonomous, high-velocity creative generation suite. Brands can transform simple product photos or website URLs into full-funnel ad campaigns, photorealistic studio photography, influencer content, and transparent cutouts in seconds.

---

## 🌟 Core Features & Studios

### 1. Autonomous Campaign Studio
Turn any website URL or product details into a complete, high-converting ad campaign. A 7-stage multi-agent orchestration pipeline with human-in-the-loop review gates:
* **Brand Analysis:** Analyzes company URLs and value props to extract a verified `BrandContext`.
* **Market & Competitor Research:** Discovers target demographics, angles, and competitor hooks.
* **Strategy & Creative Direction:** Synthesizes messaging pillars, themes, and art direction.
* **Master Prompts & Creatives Generation:** Generates multi-platform visual ad creatives (Meta, Google, TikTok) ready for immediate deployment.

### 2. Commercial Creative Suites
* **Product Studio:** Place isolated products into photorealistic commercial environments (marble, studio lighting, outdoor, tech backdrops).
* **Influencer & Fashion Studio:** On-model garment transfers and relatable UGC photos with Indian and global models.
* **CGI & 3D Lighting Studio:** High-end studio lighting rigs, reflections, and 3D composition.
* **Festival & Seasonal Photoshoots:** Instant campaign backdrops for Diwali, Black Friday, Christmas, Summer Sales, and flash promotions.

### 3. Background Remover Pro
* **100% Client-Side:** Leverages `onnxruntime-web` with WebGL/WASM acceleration.
* **Zero Cost & Instant:** Extracts transparent PNG cutouts entirely in the user's browser with no server GPU costs and zero network latency.

### 4. Admin Command Center & AI Secrets Manager
* **In-App AI Secrets Management:** One-click toggle between **Google Vertex AI (Postpay & Express Mode)** and **Google AI Studio (API Key Mode)** without redeploying.
* **Runtime Hot-Reload:** Updates in-memory AI configuration and singletons via `resetAIInstance()`, guaranteeing zero downtime.
* **Live Connectivity Testing:** Ping test button measuring live roundtrip latency in milliseconds.
* **Live Telemetry:** Tracks live Campaign Studio runs, active user quotas, credit ledgers, and operational execution logs.

---

## 🛠 Tech Stack

* **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, Lucide React, Recharts.
* **Backend:** Node.js Express server (`server.ts`) compiled with `esbuild`.
* **Database & Storage:** Supabase PostgreSQL with strict Row Level Security (RLS) and storage buckets.
* **AI Engine:** Google GenAI (`@google/genai`) with dual Vertex AI Enterprise Postpay & Google AI Studio routing.
* **Payments:** Razorpay API for INR/UPI & card checkouts with automatic credit top-up and subscription webhooks.
* **AI Agent Discovery:** Manifest compliant with RFC 8141 URNs (`urn:air:`) at `/ai-catalog.json` and `/llms.txt`.

---

## 🔒 Architectural Invariants & Security

1. **Zero-Trust Hardened Admin Authentication:**
   * Constant-time comparison (`crypto.timingSafeEqual`) against environment variables `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET`.
   * Strict email allowlist (`ADMIN_ALLOWED_EMAILS`) or verified database role metadata (`is_admin === true`).
   * No fallback or hardcoded credentials.
2. **Mandatory `.js` Extensions on Relative Imports:**
   * Package uses `"type": "module"`. All relative imports (`./...` and `../...`) across frontend and backend **must** end with `.js`.
3. **Secret Protection:**
   * `.env` files are strictly git-ignored. All sensitive keys are managed via hosting environment secrets or the Admin Secrets Manager.

---

## 📦 Getting Started

### Prerequisites
* Node.js 18+
* npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/AyushVishwakarma25/Zeperai.git
cd Zeperai

# Install dependencies
npm install
```

### Environment Configuration
Copy `.env.example` to `.env` and populate your credentials:

```bash
cp .env.example .env
```

Key environment variables:
```ini
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Provider Configuration (Google Vertex AI or AI Studio)
USE_VERTEX_AI=true
VERTEX_PROJECT_ID=your-gcp-project-id
VERTEX_LOCATION=us-central1
VERTEX_API_KEY=your-optional-vertex-express-key
GEMINI_API_KEY=your-optional-ai-studio-gemini-key

# Hardened Admin Credentials
ADMIN_USERNAME=your-admin-user
ADMIN_PASSWORD=your-secure-admin-password
ADMIN_SESSION_SECRET=your-random-64-char-secret
ADMIN_ALLOWED_EMAILS=founder@zeper.ai

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

### Running Locally

```bash
# Start Vite development server
npm run dev

# Start Node backend server
npm run server
```

---

## 🧪 Testing & Verification

```bash
# Type check and lint validation
npm run lint

# Production bundle compilation
npm run build
```

---

## 🌐 Sitemaps & Search Engine Discovery

* **XML Sitemap:** [`https://zeperai.in/sitemap.xml`](https://zeperai.in/sitemap.xml)
* **Robots Directives:** [`https://zeperai.in/robots.txt`](https://zeperai.in/robots.txt)
* **AI Agent Catalog (ARD / RFC 8141):** [`https://zeperai.in/ai-catalog.json`](https://zeperai.in/ai-catalog.json)
* **LLM Knowledge Index:** [`https://zeperai.in/llms.txt`](https://zeperai.in/llms.txt)

---

## 📄 License & Commercial Rights

Outputs generated across free and commercial tiers include full commercial usage rights for digital and print advertising.

© 2026 ZeperAi. All rights reserved.
