# ZeperAI Campaign Studio V2 — System Architecture & Engineering Blueprint

> **Product:** ZeperAI Campaign Studio V2 (`zeperai.in`)  
> **Classification:** Autonomous Advertising Creative Production Engine  
> **Runtime Environment:** Node.js (ESM), Express, Vite/React, Supabase PostgreSQL with RLS, Google Gemini AI (Pro & Flash)  

---

## 1. Executive Summary & V1 to V2 Paradigm Shift

ZeperAI Campaign Studio V1 operated primarily as an AI image generator paired with flat text overlays: product photographs placed onto AI backgrounds with basic font captions. This led to outputs that resembled raw product photos rather than high-converting commercial advertising.

**Campaign Studio V2** transforms the system into a complete, professional, AI-powered advertising production engine. V2 separates visual background synthesis from vector typography, visual hierarchy, branding, and conversion architecture. It introduces structured **Creative Blueprints**, an extensible library of **15 commercial advertising formats**, a deterministic **SVG Vector Compositor**, automated **7-dimension quality evaluation**, surgical **targeted layer regeneration**, and an **ad-ready Meta export engine** that generates placement-adapted creatives (`1:1`, `4:5`, `9:16`, `1.91:1`) alongside full Meta Ads copy packages.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               ZEPERAI CAMPAIGN STUDIO V2                               │
│                         END-TO-END AUTONOMOUS AD PIPELINE                              │
└────────────────────────────────────────────────────────────────────────────────────────┘

 [ Brand URL / Details ] ────► [ Stage 1: Brand Intelligence ]
                                           │
                                           ▼
                               [ Stage 2: Market & Competitor ]
                                           │
                                           ▼
                               [ Stage 3: Campaign Strategy ] ── (5 Diverse Pillars)
                                           │
               ┌───────────────────────────┴───────────────────────────┐
               ▼                                                       ▼
 [ Reference Ad Uploads ]                                    [ Format Strategist ]
               │                                                       │
               ▼                                                       ▼
 [ Visual Reference Analyst ] ────────► [ AI Art Director ] ◄──────────┘
                                                │
                                                ▼
                                    [ Creative Blueprint JSON ]
                                                │
                                                ▼
                                    [ Visual Asset Generator ]
                                     (Text-Free AI Backgrounds)
                                                │
                                                ▼
                                    [ Vector Layer Compositor ]
                                  (SVG Engine + Shadows + Type)
                                                │
                                                ▼
                                    [ 1:1 Master Creative ]
                                                │
                                                ▼
                                    [ Quality Evaluator Engine ]
                                  (Deterministic + AI Inspection)
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
             [ Human Approval Gate ]                           [ Targeted Regenerator ]
                       │                                       (Surgical layer patches)
                       ▼
        [ Multi-Ratio Adaptation Engine ]
       (1:1 Square, 4:5 Feed, 9:16 Stories, 1.91:1 Banner)
                       │
                       ▼
         [ Meta Package Export Engine ]
      (Copy Variations, Meta CTAs, ZIP Archive)
```

---

## 2. Multi-Stage Pipeline Architecture

### Stage 1: Brand Intelligence Agent
- **Source**: `src/campaignStudio/server/agents/brand.ts`
- **Model**: `gemini-2.5-pro` (Structured JSON output)
- **Role**: Extracts brand DNA, tone of voice, target customer archetypes, value propositions, and official brand palette (primary, secondary, accent hex colors).
- **Security Boundary**: URL inspection runs via SSRF-safe HTTP fetching (`safeFetch.ts`) with DNS pinning, private range blocking, and HTML sanitization.

### Stage 2: Market & Competitor Research Agent
- **Source**: `src/campaignStudio/server/agents/market.ts` & `competitors.ts`
- **Model**: `gemini-2.5-pro` with Google Search grounding
- **Role**: Identifies competitor ad angles, customer pain points, unmet expectations, and differentiation opportunities. Populates `searchGaps` and `askUserGaps` when external signals require human clarification.

### Stage 3: Campaign Strategy Agent
- **Source**: `src/campaignStudio/server/agents/strategy.ts`
- **Role**: Develops five distinct commercial advertising concepts across the conversion funnel:
  1. **Hook**: Scroll-stopping pattern interrupt or contrarian truth.
  2. **Problem-Solution**: Pain point agitation followed by product resolution.
  3. **Social Proof**: Trust-building, reviews, clinical claims, or customer volume.
  4. **Urgency & Offer**: Scarcity, introductory discounts, or seasonal promotions.
  5. **Feature Spotlight**: Key ingredient, technical USP, or proprietary mechanism.

### Stage 4A: Visual Reference Analyst
- **Source**: `src/campaignStudio/server/agents/referenceAnalyst.ts`
- **Input**: Up to 3 user-uploaded reference advertisement images.
- **Role**: Deconstructs design DNA into:
  - Visual hierarchy and reading order.
  - Composition layout (split, center, diagonal, grid).
  - Color harmony (monochromatic, complementary, high-contrast).
  - Typography personality (bold grotesque, elegant serif, modern sans).
  - Graphic elements (badges, borders, pills, floating annotations).
  - Lighting and shadows (studio softbox, dramatic rim light, hard sunlight).

### Stage 4B: Advertising Format Strategist
- **Source**: `src/campaignStudio/server/agents/formatStrategist.ts` & `formatLibrary.ts`
- **Catalog**: 15 commercial advertising formats (Bold Claim, Split Comparison, 3-Benefit Grid, Review Showcase, Founder Letter, Before & After, Minimalist Luxury, etc.).
- **Role**: Maps marketing angles to format definitions using rule-based scoring and variety penalization. Guarantees that a 5-concept campaign employs at least 3 distinct layout paradigms.

### Stage 4C & 4D: AI Art Director & Design System Architect
- **Source**: `src/campaignStudio/server/agents/creativeDirection.ts` & `blueprintSchema.ts`
- **Output**: Validated `CreativeBlueprint` adhering to strict Zod schema constraints.
- **Blueprint Components**:
  - `canvas`: Dimensions and aspect ratio.
  - `marketingAngle` & `advertisingFormat`: Strategic classification.
  - `composition`: Normalized bounding boxes (`x`, `y`, `width`, `height` in $[0.0, 1.0]$) for hero product, headline, subheadline, CTA, and offer badge.
  - `visualHierarchy`: Strict reading order (`headline -> product -> badge -> cta`).
  - `typography`: Font families, weights, letter spacing, line heights, and colors.
  - `colorPalette`: Background, foreground, text, and accent hex codes.
  - `backgroundPrompt`: Photographic environment prompt containing zero references to text.
  - `qualityGuidelines`: Guardrails against invented claims, logo distortions, and edge clashing.

---

## 3. Creative Production & Vector Layer Compositor

### Stage 5: Visual Asset Generation
- **Source**: `src/campaignStudio/server/agents/assetGenerator.ts`
- **Prompt Sanitization**: Enforces strict negative prompting (`"no text, no words, no letters, no labels, no watermark, no overlays, clean commercial photography"`).
- **Product Integration**: Preserves the original uploaded product packshot or cutout without generative distortion.

### Stage 6: Vector Layer Compositor & SVG Engine
- **Source**: `src/campaignStudio/server/composition/compositor.ts` & `svgRenderer.ts`
- **Architecture**: `CreativeDocument` multi-layer stack:
  1. `layer-background` (z-index 0): High-resolution background environment with optional scrim overlay.
  2. `layer-product` (z-index 5): Hero product packshot with realistic elliptical ambient ground shadow and Gaussian blur filter (`product-ground-shadow`).
  3. `layer-graphic-*` (z-index 10+): Accent shapes, glassmorphism cards, or dividing borders.
  4. `layer-logo` (z-index 15): Brand wordmark / high-res SVG or PNG logo.
  5. `layer-badge` (z-index 20): Promotional pill badge with dropshadow filter (`button-shadow`).
  6. `layer-headline` (z-index 25): Dominant commercial headline rendered via dynamic multiline word-wrapping (`wrapText`) with SVG `<tspan>` coordinates.
  7. `layer-subheadline` (z-index 30): Supporting value proposition copy.
  8. `layer-cta` (z-index 35): High-converting button pill with uppercase typography.
- **Rendering Pipeline**: Generates clean, standards-compliant SVG with embedded Google Fonts (`Poppins`, `Inter`, `Montserrat`, `Playfair Display`), drop shadows, and XML entity escaping (`escapeXml`). Outputs data URIs (`data:image/svg+xml;base64,...`) for instant client rendering.

---

## 4. Multi-Aspect Ratio Adaptation Engine

- **Source**: `src/campaignStudio/server/adaptation/creativeAdapter.ts`
- **Supported Placements**:
  - `1:1` Square (1080×1080) — Instagram / Facebook Feed & Desktop Carousel.
  - `4:5` Portrait (1080×1350) — Instagram / Facebook Mobile Feed (maximum feed real estate).
  - `9:16` Full Vertical (1080×1920) — Instagram Stories, Facebook Stories, Reels, TikTok.
  - `1.91:1` Landscape (1200×628) — Facebook Desktop Feed, Audience Network, Twitter/X Cards.

### Content-Aware Reflow Rules:
1. **Stories/Reels Safe-Zone Clamping (9:16)**:
   - Instagram Stories UI obscures the top 250px (profile header, account name, close icon) and bottom 350px (message input, share bar, reaction drawer).
   - In 9:16 coordinates ($H=1920$), top buffer is $y < 0.1302$ and bottom buffer is $y > 0.8177$.
   - The adapter clamps all copy and CTA layers strictly into the central safe zone ($y \in [0.15, 0.80]$).
2. **Landscape Side-by-Side Reflow (1.91:1)**:
   - On wide 1200×628 banners, vertical stacking causes severe compression.
   - The engine splits the canvas into two horizontal columns:
     - **Left Column ($x \in [0.06, 0.50]$)**: Brand wordmark, headline, subheadline, and CTA button.
     - **Right Column ($x \in [0.52, 0.94]$)**: Hero product packshot and promotional offer badge.

---

## 5. Quality Assurance & Evaluation Layer

- **Source**: `src/campaignStudio/server/evaluation/qualityRules.ts` & `qualityEvaluator.ts`
- **Evaluation Dual-Pass**:
  1. **Deterministic Rule Validation (Synchronous, Zero Cost)**:
     - Text legibility & minimum font sizes ($\ge 20\text{px}$).
     - Text boundary containment (no text extending past canvas edges).
     - Product anchor presence and minimum size ($\ge 12\%$ of canvas area).
     - Visual overlap collision detection (IoU between product and headline $< 0.15$).
     - Platform safe-zone adherence.
  2. **Multi-Dimension AI Visual Evaluation (Gemini 2.5 Pro)**:
     - Product fidelity & lighting integration (15 pts).
     - Brand consistency & palette matching (15 pts).
     - Advertising design & layout balance (15 pts).
     - Typography hierarchy & legibility (15 pts).
     - Copy accuracy & tone (15 pts).
     - Platform compliance & safe zones (15 pts).
     - Overall conversion viability (10 pts).
  - Total score $\ge 75/100$ passes. If hard rules fail, creative is marked `needs_revision`.

### Targeted Layer Regenerator
- **Source**: `src/campaignStudio/server/evaluation/targetedRegenerator.ts`
- Enables surgical updating of a single component (`headline`, `subheadline`, `background`, `product`, `badge`, `cta`) without regenerating or disturbing any approved adjacent layers.
- Preserves unedited layers byte-for-byte in the layer tree.

---

## 6. Meta Ad Package Export & Archiving Engine

- **Source**: `src/campaignStudio/server/export/metaPackageGenerator.ts`, `zipWriter.ts`, `exportArchive.ts`
- **Copy Package Generation**:
  - 3 Primary Text variations ($\le 250$ chars each).
  - 3 Headline variations ($\le 40$ chars each).
  - 3 Description variations ($\le 30$ chars each).
  - Exact Meta CTA mapping (`SHOP_NOW`, `ORDER_NOW`, `GET_OFFER`, `LEARN_MORE`, `SIGN_UP`).
- **Zero-Dependency PKZIP Builder**:
  - Implements standard PKZIP file headers (`0x04034b50`), CRC-32 checksums, and Deflate compression via Node.js native `zlib`.
  - Produces clean, ad-ready ZIP archives organized by ratio:
    ```
    my-campaign-ad-package/
    ├── README.txt
    ├── copy-sheet.txt
    ├── campaign-summary.json
    ├── 1x1/
    │   └── concept-1-square.svg
    ├── 4x5/
    │   └── concept-1-portrait.svg
    ├── 9x16/
    │   └── concept-1-stories.svg
    └── 1_91x1/
        └── concept-1-landscape.svg
    ```

---

## 7. Hardened Security & Architectural Invariants

1. **Credit Ledger Security**:
   - Every generation operation executes server-side atomic deductions via the PostgreSQL RPC function `deduct_credits_atomic`.
   - Strict idempotency prevents double charges.
   - Guaranteed automatic refunds if visual rendering fails.
   - Internal QA and deterministic rule checks incur zero credit cost.
2. **Admin Authentication**:
   - Admin credentials verified strictly using `crypto.timingSafeEqual` against server-only environment variables (`ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`). Fail-closed immediately if variables are unset.
   - No client-side token forging or loose substring email matching.
3. **SSRF & Network Safety**:
   - `safeFetch.ts` resolves DNS records prior to connection and blocks loopback, private IPv4/IPv6 ranges, link-local, CGNAT, and cloud metadata IPs (`169.254.169.254`).
4. **Mandatory `.js` Imports**:
   - Codebase enforces `"type": "module"`. All relative imports throughout frontend and backend explicitly include `.js` extensions.

