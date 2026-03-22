# Product Requirements Document (PRD)
**Product Name:** Zeper AI (zeperai.com)
**Document Version:** 1.0
**Date:** March 18, 2026

---

## 1. Product Overview & Vision
**Zeper AI** is an all-in-one AI-powered creative suite designed for e-commerce brands, digital marketers, and agencies. It streamlines the content creation process by allowing users to instantly generate professional product photography, high-converting ad creatives, and engaging marketing copy without the need for expensive photoshoots or large creative teams.

## 2. Target Audience
*   **E-commerce Store Owners (Shopify, etc.):** Looking to generate professional product photos and ads quickly.
*   **Digital Marketers & Media Buyers:** Needing rapid ad variations for A/B testing and campaign scaling.
*   **Creative Agencies:** Seeking to reduce turnaround times for client deliverables.
*   **Social Media Managers:** Requiring constant, high-quality visual and written content.

## 3. Core Features (Current Scope)

### 3.1. Public Landing Page & Routing
*   **High-Converting Marketing Page:** A 10-section public-facing page designed to convert visitors into users, featuring hero sections, feature showcases, testimonials, and pricing tables.
*   **Seamless Routing:** Unauthenticated users are directed to the landing page or login, while authenticated users are automatically routed to the main dashboard.

### 3.2. AI Creative Tools
*   **Product & Fashion Photography:** Upload a basic product photo and generate high-quality lifestyle images with AI models and custom backgrounds.
*   **Ad Generator + BI:** Automatically generate high-converting ad layouts paired with predictive creative analytics.
*   **AI Content Writer:** Generate SEO-optimized blog posts, social media captions, and ad copy.
*   **Background Remover:** Instant, pixel-perfect background removal for product images.
*   **Image Restyle (Remix):** Apply advanced AI style transfer to existing visuals to match new campaigns.
*   **Festive Photoshoot:** Instantly adapt product photos for seasonal holidays and events (e.g., Christmas, Halloween, Summer sales).

### 3.2. Workspace & Asset Management
*   **Brand Kits:** Store brand colors, logos, and typography to ensure AI generations remain on-brand.
*   **Saved Models:** Save specific AI-generated human models to maintain consistency across multiple product shoots.
*   **Shopify Integration:** Import product data directly from Shopify to generate targeted ads and reports.
*   **Recent Activity / History:** View, download, and manage previously generated designs.

### 3.3. Monetization & User Management
*   **Credit System:** Actions (like generating an image) consume credits. Includes logic for deducting and refunding credits upon failure.
*   **Subscription Tiers:** Free, Starter, Standard, and Agency tiers, unlocking specific features (e.g., Pro tools like Content Writer).
*   **Authentication:** Secure user login and profile management.

## 4. User Flow
1.  **Authentication:** User logs in to the platform.
2.  **Dashboard:** User lands on the main dashboard and selects a creative tool (e.g., "Festive Photoshoot").
3.  **Configuration:** User uploads a reference image (front product), inputs a prompt, selects aspect ratios, and applies their Brand Kit.
4.  **Generation:** The app deducts credits, shows a progress indicator, and communicates with the AI backend.
5.  **Review & Edit:** User reviews the generated images. They can remove backgrounds, generate matching captions, or save the AI model used.
6.  **Export:** User downloads the final assets or pushes them directly to their ad campaigns.

## 5. Technical Architecture
*   **Frontend:** React 18+, Vite, Tailwind CSS for styling, Framer Motion for animations.
*   **Backend/API:** Node.js/Express proxy server (`server.ts`) to securely handle API requests.
*   **AI Integration:** Google Gemini API (via `@google/genai`) for image generation, image editing, and text generation.
*   **State Management:** React Context API (`AuthContext`, `DesignsContext`, `ModalContext`) and custom hooks (`useCreativeSession`).

## 6. Future Roadmap (Phase 2 & Beyond)
*   **Advanced A/B Testing Analytics:** Deeper integration with ad platforms (Meta, Google Ads) to track the real-world performance of generated creatives.
*   **Video Generation:** Expanding from static images to short-form video ads.
*   **Team Collaboration:** Multi-user workspaces for agencies to collaborate on creative assets.

---
*Note: This PRD reflects the current state of the application built in AI Studio, including the newly integrated public landing page and dashboard routing.*
