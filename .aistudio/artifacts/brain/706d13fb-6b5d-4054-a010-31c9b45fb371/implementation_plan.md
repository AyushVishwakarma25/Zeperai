# Implementation Plan: Light Theme UI Kit Alignment for Tools Hub & E-Commerce Calculators

Restyle the `/tools` hub and all interactive calculators (`/tools/roas-rto-calculator`, `/tools/meta-creative-fatigue`, `/tools/quick-commerce-margin-calculator`) to a clean, production-grade **Light Theme UI Kit** matching the main ZeperAI landing page. Additionally, implement robust local WebAssembly client-side fallbacks for the background remover tool to handle remote service or disk availability errors gracefully.

---

## User Review & Confirmed Decisions

> [!IMPORTANT]
> Confirmed Phase 1 choices from user interview:

- **Confirmed Decision 1 (Visual Aesthetics)**: Clean white canvas (`bg-white` / `bg-slate-50`) with sharp emerald accents (`emerald-600`), crisp hairline borders (`border-slate-200`), and high-contrast dark slate typography (`text-slate-900`, `text-slate-600`).
- **Confirmed Decision 2 (Theme Scope)**: Pure light theme across the central `/tools` directory, individual calculator pages, and shared calculator components.
- **Confirmed Decision 3 (Service Resilience)**: Fall back to in-browser local WebAssembly background removal engine with a polite toast notification whenever GCP / remote service calls fail or time out.

---

## 1. Overview & Core Concept

- **Goal**: Unify the visual posture of all marketing acquisition tools (`/tools`, `/tools/roas-rto-calculator`, `/tools/meta-creative-fatigue`, `/tools/quick-commerce-margin-calculator`) into a light-mode UI kit that aligns with the main landing page brand identity.
- **Key Value**: Provides a seamless, professional experience for Indian D2C founders, performance marketers, and quick-commerce sellers while ensuring zero broken features during server outages.

---

## 2. User Experience & Visual Design

### Light Theme UI Kit Specifications
- **Canvas & Surfaces**:
  - Main background: `bg-slate-50` / `bg-white`
  - Cards & containers: `bg-white border border-slate-200/90 shadow-sm rounded-2xl`
  - Input fields: `bg-slate-100/80 border border-slate-200 text-slate-900 focus:border-emerald-600 focus:bg-white`
- **Typography & Contrast**:
  - Headings: `text-slate-900 font-extrabold tracking-tight`
  - Subtitles & body: `text-slate-600 font-normal leading-relaxed`
  - Unboxed metadata: Quiet inline text `text-slate-500` with typographic dot separators (`·`)
- **Accent Budget (10%)**:
  - Primary accents: Rich emerald (`emerald-600` / `emerald-700`) for primary buttons, active slider tracks, and positive financial highlights.
  - Secondary accents: Soft indigo (`indigo-600`) for ad fatigue metrics, amber (`amber-600`) for platform commissions, and rose (`rose-600`) for RTO losses.
- **Interactive Component Light Restyling**:
  - `CurrencyInput.tsx`: Light slate input field with dark font, currency prefix (`₹`), and `+`/`-` step buttons.
  - `PercentageInput.tsx`: Synchronized slider with emerald track and numeric box.
  - `MetricCard.tsx`: Crisp white elevated card with light border, dark numeric value, and status badges.
  - `NativeCharts.tsx`: High-contrast light theme charts (dark slate labels, emerald/amber/rose SVG arcs, white track rings).
  - `StudioHandoffCard.tsx`: Light emerald gradient container (`from-emerald-50 via-white to-slate-50`), dark text, and solid emerald CTA.
  - `CalculatorLayout.tsx`: Light breadcrumbs, white FAQ accordions (`bg-white border-slate-200`), and light editorial guide sections.

---

## 3. Technical Architecture & Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             LandingHeader (Light)                           │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┴─────────────────────────────┐
         ▼                                                           ▼
┌─────────────────────────────────┐                         ┌─────────────────┐
│       ToolsHubPage (Light)      │                         │ CalculatorLayout│
│ - Category filter buttons       │                         │ - Light Nav     │
│ - Light card grid               │                         │ - Breadcrumbs   │
│ - ZeperAI Studio Callout        │                         │ - FAQ Accordion │
└─────────────────────────────────┘                         └─────────────────┘
                                                                     │
         ┌───────────────────────────────────────────────────────────┴──────────────────────────────────────────┐
         ▼                                                           ▼                                          ▼
┌──────────────────────────────┐                         ┌───────────────────────┐                  ┌──────────────────────────────┐
│  RoasRtoCalculatorPage       │                         │CreativeFatiguePage    │                  │QuickCommerceCalculatorPage   │
│ - Light Currency & % Inputs  │                         │- Impression Math      │                  │- Blinkit/Zepto presets       │
│ - Light Waterfall Chart      │                         │- Ad Velocity Scenarios│                  │- Donut Margin Breakdown      │
│ - Light ROAS Gauge           │                         │- Light Metric Cards   │                  │- Light Unit Waterfall        │
└──────────────────────────────┘                         └───────────────────────┘                  └──────────────────────────────┘
```

---

## 4. Background Remover Error Handling & Fallback Strategy

1. **Service Diagnostics & Resilience**:
   - In `BackgroundRemoverPro.tsx` and `NicheBackgroundRemoverTool.tsx`, handle any remote API / GCP service exceptions, timeouts, or disk errors.
2. **Seamless In-Browser Fallback**:
   - Automatically fall back to `@imgly/background-removal` local client-side WebAssembly execution without halting the user workflow.
3. **User Feedback**:
   - Display a clean, informative toast: *"Remote service unavailable. Processing image locally via browser WebAssembly."*

---

## 5. Verification & Quality Gates - Status: Complete ✅

- **Light Theme UI Kit Alignment**: Converted `/tools` directory hub, `CalculatorLayout.tsx`, `CurrencyInput.tsx`, `PercentageInput.tsx`, `MetricCard.tsx`, `NativeCharts.tsx`, `StudioHandoffCard.tsx`, `RoasRtoCalculatorPage.tsx`, `CreativeFatigueCalculatorPage.tsx`, and `QuickCommerceCalculatorPage.tsx` to a clean light theme (`bg-slate-50`, `bg-white border-slate-200`, `text-slate-900`, `emerald-600` accents).
- **Background Remover Fallback**: Integrated in-browser `@imgly/background-removal` WebAssembly fallback into `BackgroundRemoverPro.tsx` that refunds credits and processes images locally whenever remote GCP server APIs return errors or time out.
- **Lint & Compilation**: `tsc --noEmit` and `compile_applet` passed with zero errors.
- **Static Build**: `npm run build` completed cleanly; all tool routes verified returning HTTP 200.
