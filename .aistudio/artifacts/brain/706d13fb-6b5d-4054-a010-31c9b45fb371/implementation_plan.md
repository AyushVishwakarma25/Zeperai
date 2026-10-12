# Implementation Plan: Editorial Design System for Pricing & About Pages

This plan covers extending the **ZeperAI visual design system** to the **Pricing Page** and **About Page**, restructuring the About page into a sleek editorial magazine format, updating social links (removing Instagram, adding personal and company LinkedIn), removing the Blog page, and standardizing the contact email to **`team@Zeperai.in`**.

---

## 1. User Decisions & Design Invariants

- **Editorial Structure for About Page**: Modern magazine layout featuring a bold manifesto, founder highlight card for Ayush Vishwakarma, 3-act narrative story with editorial pull quotes, studio services showcase, and clean contact cards.
- **LinkedIn Links**: Feature both Ayush Vishwakarma's founder LinkedIn profile and the official ZeperAI company LinkedIn page (`https://www.linkedin.com/company/zeperai/`). Remove `@sup_madman` Instagram link.
- **Pricing Page 80/15/5 Palette**:
  - **80% Neutral Surfaces**: Free Trial, Pay-As-You-Go, and Agency tier cards rendered in crisp `#ffffff` and `stone-50` with hairline `border-stone-200` borders and subtle `shadow-2xs`.
  - **15% Dark Contrast**: The **Pro Subscription (Recommended / Most Popular)** tier highlighted in a sleek dark contrast card (`bg-zinc-950 border border-zinc-800 text-white shadow-xl md:-translate-y-4`).
  - **5% Accent**: Refined `#4452FB` accent for primary actions and badge highlights.
  - **Removal of Decorative Neon Gradients**: Remove saturated blue/purple radial halos and button gradients.
  - **Typography**: Editorial **Lora** serif for page headings and tier titles; **Manrope** for pricing figures, feature checklists, and action buttons.
- **Email Standardization**: Update all contact links and legal references from old emails to **`team@Zeperai.in`**.
- **Blog Page Removal**: Remove the `/blog` route from `App.tsx` (redirecting any incoming traffic to `/`), remove the Blog link from `Footer.tsx`, and remove `BlogPage` import.

---

## 2. Proposed Architectural & Code Changes

### A. About Page Overhaul (`src/landing/AboutUsPage.tsx`)
- **Header & Meta**: Scoped with `font-manrope` and `font-lora`, clean editorial kicker `FOUNDER MANIFESTO · 01`.
- **Manifesto Headline**: Large editorial title in Lora serif: *"Built solo. The hard way."*
- **Sleek Founder Profile**:
  - Image of Ayush Vishwakarma with high-resolution styling and verified badges (`Solo Founder & Lead Engineer`).
  - Personal bio with architectural hairline borders and dark contrast accent.
- **Narrative Columns & Pull Quotes**:
  - Act 1: *The Problem with Traditional Commercial Creative* (cost, speed, friction).
  - Act 2: *Building the Machine at 3 AM* (pipelines, models, GPU orchestration, and edge cases).
  - Act 3: *The Solo Founder Advantage* (no corporate bureaucracy, fast shipping, direct contact).
  - Pull Quote: Elegant Lora serif italic quote with subtle vertical accent line.
- **Studio Services Showcase**:
  - Clean 2-column or 3-column editorial cards outlining both ZeperAI (the software platform) and custom design/marketing studio execution for high-growth D2C brands.
- **Connect & Contact**:
  - Direct email: `team@Zeperai.in` with copy/email button.
  - LinkedIn: Ayush Vishwakarma Personal LinkedIn & ZeperAI Official Company LinkedIn (`https://www.linkedin.com/company/zeperai/`).
  - Completely eliminate Instagram handle `@sup_madman`.

### B. Pricing Page Refinement (`src/landing/PricingPage.tsx`)
- **Typography & Canvas**:
  - Apply `font-manrope` body and `font-lora` headings.
  - Warm neutral canvas (`bg-white` with `stone-50` rhythm).
- **Plan Cards Grid**:
  - Free Trial (₹0): Clean stone card, `border-stone-200`, `text-zinc-900`.
  - Pay As You Go (₹999): Clean stone card, `border-stone-200`, `text-zinc-900`.
  - Pro Subscription (₹1,999): Dark contrast hero tier (`bg-zinc-950 border border-zinc-800 text-white shadow-xl md:-translate-y-4`), solid white CTA button.
  - Agency Plan (₹4,999): Clean stone card, `border-stone-200`, `text-zinc-900`.
- **Model Breakdown Section**:
  - Model cards in `bg-stone-50 border border-stone-200 rounded-2xl p-6` (no neon glows).
  - Replace any generic model naming with clean, authoritative model tier cards.
- **No Neon Gradients**: Replace multi-gradient CTA backgrounds with solid accent buttons.

### C. Remove Blog Page
- **`App.tsx`**:
  - Remove `const BlogPage = ...` import.
  - Replace `<Route path="/blog" element={<BlogPage />} />` with `<Route path="/blog" element={<Navigate to="/" replace />} />`.
- **`src/landing/Footer.tsx`**:
  - Remove `<li><Link to="/blog" ...>Blog</Link></li>`.
- **`public/llms.txt`**:
  - Remove Blog page reference and update contact email to `team@Zeperai.in`.

### D. Global Email Update to `team@Zeperai.in`
- Update email in:
  - `src/landing/AboutUsPage.tsx`
  - `src/landing/ContactPage.tsx`
  - `src/landing/PrivacyPolicyPage.tsx`
  - `src/landing/TermsPage.tsx`
  - `public/llms.txt`

---

## 3. Strict Guardrails & Verification

1. **Mandatory `.js` Extensions**: Verify that every relative import across all modified files strictly ends with `.js` (e.g. `import { LandingHeader } from './LandingHeader.js'`).
2. **Zero-Trust Security**: Ensure no changes to authentication guards, admin comparisons (`crypto.timingSafeEqual`), or environment variable checks.
3. **Compilation & Linting**:
   - Run `compile_applet` to confirm zero Vite build errors.
   - Run `lint_applet` (`tsc --noEmit`) to verify 100% clean TypeScript validation.
