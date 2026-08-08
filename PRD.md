# Product Requirements Document (PRD)
**Product Name:** Zeper AI Studio (zeperai.com)
**Document Version:** 2.0
**Date:** August 8, 2026

---

## 1. Product Overview & Vision
**Zeper AI Studio** is an all-in-one AI-powered Creative Intelligence Platform designed for e-commerce brands, digital marketers, performance media buyers, and creative agencies. It replaces expensive traditional photoshoots and manual design pipelines with an end-to-end AI studio. Users can instantly generate studio-quality product photography, AI fashion shoots, UGC influencer content, high-converting ad creatives with editable canvas layers, and data-backed ad copy — backed by Shopify Commerce Intelligence and predictive ad analytics.

---

## 2. Target Audience
* **E-commerce Brand Owners (Shopify & Direct-to-Consumer):** Looking to create high-converting product photos, seasonal shoots, and ad campaigns quickly.
* **Performance Marketers & Media Buyers:** Needing rapid ad variations, A/B testing assets, and high Hook/Conversion scoring creatives to scale ad spend.
* **Digital & Creative Agencies:** Seeking to accelerate client asset delivery, manage multiple Brand Kits, and offer catalog-scale creative variations.
* **Social Media Managers & Content Creators:** Requiring consistent, high-fidelity visual and written content across platforms (Instagram, TikTok, YouTube, Meta Ads).

---

## 3. Core Features & Capabilities

### 3.1. Public Landing Page & Onboarding
* **High-Converting Public Landing Page:** A 10-section marketing experience featuring visual hero demonstrations, feature bento grids, pricing comparison, testimonials, and interactive FAQ.
* **Seamless Authentication & Routing:** Dedicated login/signup pages and modal flows. Unauthenticated visitors see the public landing experience, while authenticated users automatically enter the Zeper AI Dashboard.

### 3.2. Dashboard & Navigation Layout
* **Compact High-Density Dashboard:** Streamlined desktop layout with 20% optimized feature cards to ensure all core creative tools are visible above the fold without forced scrolling.
* **Multi-View Workspace Navigation:**
  * **Dashboard:** Primary hub with personalized greetings, quick launch offer CTA, and direct access to creative modes.
  * **My Designs:** Filterable asset gallery with instant re-editing, high-res export, quick variants generation, and detailed asset inspection.
  * **Analytics & Creative Scorecard:** Predictive performance scoring engine analyzing CTR, Conversion Potential, Hook Score, and Visual Appeal.
  * **Shopify Analytics:** Commerce Intelligence dashboard for analyzing product sales, Green/Yellow/Red performance zones, and automated ad angle recommendations.
  * **Inspiration Library:** Community & curated design feed with 1-click prompt copying and visual style remixing.
  * **Profile & Subscriptions:** Plan management, usage metrics, credit transaction logs, and profile customization.

### 3.3. AI Creative Suite (Modes & Engines)
* **Product Photography:** Transform basic product shots into professional studio lighting setups with custom backdrops, camera angles, shadow controls, and category presets (Skincare, Perfume, Tech, Fashion, Jewellery, Home Decor).
* **Fashion & Apparel Photography:** Swap AI models, apply garment transfers, and customize demographic parameters (gender, age, skin tone, clothing styles, studio lighting).
* **Ad Creative Studio:** Generate high-converting ad creatives with structured **Layout Blueprints** (Text Right/Left, Product Showcase, Comparison Split, Comparison Overlay, Feature Table) and customizable banner themes.
* **AI UGC Influencer Generator:** Create photorealistic virtual influencer images with granular control over pose, setting, expression, outfit, and demographics.
* **Festive & Seasonal Photoshoot:** Adapt product visuals for major shopping holidays (Christmas, Diwali, Black Friday, Summer Sales, Halloween) using pre-curated prompts.
* **Image Restyle (Remix):** Apply advanced AI style transfer while preserving underlying product geometry.
* **Bulk Multi-Variant Generation:** Batch-process multi-sku catalogs into unified marketing visual sets.
* **3D Studio:** Interactive canvas for positioning and previewing 3D object models in virtual spaces.

### 3.4. Interactive Director Canvas & Asset Editing
* **Director Canvas:** On-image overlay editor supporting draggable text layers, custom Google Fonts typography, logo watermarking, color adjustments, background removal, and precision erasing/inpainting.
* **Quick Variants Generator:** 1-click batch generation to create alternative colorways, backdrops, and composition variations for any design.
* **A/B Testing Simulator:** Side-by-side visual matrix for comparing ad creative variations prior to launching ad campaigns.

### 3.5. Commerce Intelligence & Content Tools
* **Shopify Ingestion & Analytics:** Import Shopify catalog CSV exports to classify products into revenue zones (🟢 Green: Scale, 🟡 Yellow: Boost, 🔴 Red: Clearance) and receive automated campaign strategies.
* **AI Content Generator & Ad Copywriter:** Generate SEO blog posts, social media captions, and proven ad copywriting frameworks (PAS, AIDA, BAB) tailored to brand voice.
* **Zeper AI Chat Assistant:** Conversational AI co-pilot embedded in the app for prompt optimization, campaign advice, and quick workflow guidance.

### 3.6. Brand Identity System
* **Brand Kits:** Extract color palettes, font pairings, and brand logos automatically. Brand guidelines are auto-injected into the AI prompt pipeline to ensure brand consistency across all outputs.

### 3.7. Credit System & Dual Monetization
* **Dynamic Credit Ledger:** Actions consume credits based on resolution quality (Standard vs. High) and selected AI model (Imagen 3 Fast/Pro, Nano Banana Pro, Dall-E 3). Includes automatic fail-safe credit refund logic on failed requests.
* **Multi-Currency Payment Gateways:**
  * **Stripe Integration:** Seamless checkout for USD/international subscriptions and top-up packs.
  * **Razorpay Integration:** Native support for Indian Rupees (INR) transactions with UPI, credit/debit cards, and Netbanking.
* **Subscription & Pricing Strategy:** Enforces a single unit-economics rule (Price ≥ 2.5x raw API cost per credit, calculated at 1 USD = ₹95.21, yielding 54–60% profit margins):
  * **Free Trial:** 10 Credits (7 days, ₹0, ~₹30.50 max acquisition exposure)
  * **Starter Pro:** 100 Credits / month (₹699 / month, ~₹6.99/credit, ~56% net margin)
  * **Pay-As-You-Go Top Up:** 50 Credits instant pack (₹349, ~₹6.98/credit, ~54% net margin)
  * **Agency Pro:** 500 Credits / month (₹2,999 / month, ~₹5.99/credit, ~50% net margin)
  * **No Credit Rollover:** Unused monthly credits expire at cycle reset to protect unit margins.

---

## 4. User Flow
1. **Authentication:** User logs in via email/password or guest demo mode.
2. **Dashboard Selection:** User lands on the compact dashboard and selects a creative mode (e.g., *Ad Creative*, *Product Photography*, or *Festive Shoot*).
3. **Configuration & Brand Kit Application:** User uploads a reference product image, selects aspect ratio (9:16, 1:1, 4:5, 16:9, 2:3), applies saved Brand Kit colors, and specifies lighting/backdrop prompts.
4. **Generation & Concurrency Handling:** The system deducts credits, enqueues the job through the server-side TaskQueue, and generates image variations using Gemini 2.5/3.0 models.
5. **Director Canvas Editing:** User opens the generated asset in Director Canvas to add brand logos, customize call-to-action text layers, or run background removal.
6. **Analytics & Copy Generation:** User checks the Creative Scorecard for predicted performance and generates matching ad copy/hooks with the Content Generator.
7. **Export & Direct Deployment:** Asset is saved to *My Designs* and downloaded in high-res format (JPG, PNG, WEBP) or exported directly.

---

## 5. Technical Architecture

### 5.1 Tech Stack
* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Framer Motion animations, Lucide React icons.
* **Backend Proxy:** Node.js Express server (`server.ts`) running on port `3000` behind Cloud Run / Nginx.
* **AI Engine:** Google Gemini API (`@google/genai` SDK) utilizing Gemini 2.5 Flash and Gemini 3.0 models with two-stage prompt optimization (Critic/Optimizer -> Generation).
* **Database & Storage:** Supabase PostgreSQL with Row Level Security (RLS) for multi-tenant profile isolation, designs, brand kits, user credits, and asset storage.
* **Payments:** Dual gateway integration via Stripe API and Razorpay SDK.

### 5.2 Concurrency & Rate Limiting System
* **Task Queue Engine:** Express proxy enforces a global `TaskQueue` limiting active Gemini API requests to **2 concurrent operations** globally. Excess incoming requests are queued in memory and processed sequentially to prevent `429 Too Many Requests` API errors while preserving user credits.

---

## 6. Future Roadmap
* **Video Ad Generator:** Expand static ad creation into short-form UGC video ads with automated voiceovers.
* **Direct Meta & TikTok Ads API Sync:** One-click deployment of generated ad creatives and copy directly into live ad accounts.
* **Multi-User Agency Workspaces:** Team permission controls, client folder organization, and seat-based enterprise licensing.

---
*Document maintained by Zeper AI Product & Engineering Team.*
