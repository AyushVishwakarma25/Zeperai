# ZeperAI Campaign Studio V2 — Operator & User Manual

> **Product:** ZeperAI Campaign Studio V2 (`zeperai.in`)  
> **Audience:** Growth Marketers, Media Buyers, Brand Founders, and Creative Operators  
> **Status:** Production Ready  

---

## 1. Quick Start: Launching a Campaign Run

Follow these steps to produce a full 5-concept advertising campaign:

### Step 1: Input & Configuration
1. Navigate to **Campaign Studio** in the ZeperAI web application.
2. Select your input mode:
   - **Website URL:** Paste your brand or product landing page URL (e.g. `https://mybrand.com/product`). The system automatically extracts brand identity, logos, color codes, USPs, and product descriptions.
   - **Manual Details:** Upload your product cutout or packshot image (PNG with transparent background or clean JPG) and type your product details, key USPs, and promotional offers.
3. **Reference Advertisements (Optional but Recommended):**
   - Upload 1 to 3 reference advertisements you admire. The **Visual Reference Analyst** extracts their layout geometry, typography personality, and visual density to inform your creative direction.
4. Select your **Campaign Objective** (e.g., *Sales & Conversions*, *Brand Awareness*, *Lead Generation*).
5. Click **Start Campaign**.

---

## 2. The Phase-Gated Review Workflow

Campaign Studio V2 uses a human-in-the-loop review workflow. You can inspect, modify, or regenerate data at every milestone before credits are spent:

```
[ Step 1: Brand Intelligence ] ──► [ Review Gate 0: Brand DNA ]
                                              │ (Approve or Hand-Edit)
[ Step 2: Market & Competitors ] ──► [ Review Gate 1: Research ]
                                              │ (Approve or Add Competitor)
[ Step 3: Campaign Strategy ] ───► [ Review Gate 2: 5 Concepts ]
                                              │ (Approve or Regenerate Angle)
[ Step 4: Creative Blueprints ] ─► [ Review Gate 3: Master Creatives ]
```

### Review Gate 0: Brand DNA
- **What to check:** Verify extracted brand name, tone of voice, hex color palette, and target audience personas.
- **Actions:** Click *Edit* to adjust hex codes or refine value propositions. Click *Approve* to advance.

### Review Gate 1: Market & Competitor Research
- **What to check:** Review competitor angles, customer frustrations, and whitespace opportunities.
- **Actions:** Inspect `searchGaps` or `askUserGaps` if prompted. Click *Approve* to advance.

### Review Gate 2: 5 Campaign Concepts
- **What to check:** Verify that the 5 concepts cover distinct angles across the funnel:
  1. *Hook / Pattern Interrupt*
  2. *Problem-Solution*
  3. *Social Proof / Reviews*
  4. *Urgency & Offer*
  5. *Feature / Ingredient Spotlight*
- **Actions:** Regenerate any concept that feels misaligned with your brand voice before generating visuals.

---

## 3. Creative Review & The Quality Score Badge

Once visuals are generated, each creative displays an automated **Quality Score Badge**:

| Score Tier | Status | Meaning & Recommended Action |
| :--- | :--- | :--- |
| **90 – 100** | 🟢 **Excellent** | Production-ready commercial ad. Ready for immediate ad deployment. |
| **75 – 89** | 🟡 **Good** | Meets commercial standards with minor aesthetic suggestions. Safe to run. |
| **< 75** | 🔴 **Needs Revision** | Failed one or more hard rules (e.g., text overlap, low contrast, boundary clip). Requires adjustment. |

### The 7 Quality Dimensions:
1. **Product Fidelity & Lighting:** Is the packshot sharp, accurately colored, and grounded with realistic cast shadows?
2. **Brand Consistency:** Do the colors and fonts reflect your official Brand DNA?
3. **Advertising Design & Hierarchy:** Is there a clear focal order (`Headline -> Product -> Offer -> CTA`)?
4. **Typography Legibility:** Is all copy readable on mobile screens with sufficient contrast against backgrounds?
5. **Copy Accuracy:** Is copy free from fabricated testimonials, fake claims, or spelling errors?
6. **Platform Adherence:** Does the ad observe platform safe zones with zero edge-clipping?
7. **Conversion Viability:** Does the visual deliver a compelling reason to click?

---

## 4. Surgical Targeted Regeneration

If you love a creative's visual background but want to alter the headline or tweak the CTA button, **do not regenerate the entire creative**. Use **Targeted Regeneration**:

1. Click on the creative card to open the **Creative Inspector**.
2. Select the **Targeted Edit** tab.
3. Choose the specific layer to update:
   - **Headline:** Change copy, font weight, or color without touching the background or product.
   - **Subheadline:** Revise supporting value proposition text.
   - **Background:** Request a fresh background scene while locking the exact product packshot, headline, and CTA in place.
   - **Product Anchor:** Adjust packshot scale, horizontal/vertical position, or contact shadow.
   - **Promotional Badge:** Update discount text (e.g., `"FLAT 25% OFF"` to `"BUY 1 GET 1"`).
   - **CTA Button:** Modify button copy or accent background color.
4. Enter your new copy or instructions and click **Apply Targeted Update**.
5. The system modifies only the designated vector layer. All other layers remain 100% byte-for-byte identical.

---

## 5. Multi-Aspect Ratio Preview & Reflow

High-performing ad campaigns require distinct aspect ratios for each ad placement. Campaign Studio V2 includes instant content-aware adaptation:

- **1:1 Square (1080×1080):** Optimized for Instagram/Facebook Feed and Desktop Carousels.
- **4:5 Portrait (1080×1350):** Maximum vertical screen estate in mobile feeds.
- **9:16 Full Vertical (1080×1920):** Tailored for Instagram Stories, Facebook Stories, and Reels. Automatically respects the **top 250px** and **bottom 350px platform UI safe zones** so handles, captions, and reaction drawers never block your copy or CTA.
- **1.91:1 Landscape (1200×628):** Desktop feeds and Audience Network. Automatically reflows the design into an intelligent **side-by-side composition** (headline and CTA on the left, packshot on the right).

**To preview:** Use the ratio switcher tabs (`[ 1:1 ]`, `[ 4:5 ]`, `[ 9:16 ]`, `[ 1.91:1 ]`) at the top of the creative previewer.

---

## 6. Exporting for Meta Ads Manager

Once you are satisfied with your campaign creatives:

1. Click the **Export Meta Ad Package (.ZIP)** button in the top-right toolbar.
2. The system generates and downloads a self-contained ZIP archive:
   ```
   campaign-ad-package/
   ├── README.txt
   ├── copy-sheet.txt
   ├── campaign-summary.json
   ├── 1x1/
   │   ├── concept-1-square.svg
   │   └── ...
   ├── 4x5/
   │   ├── concept-1-portrait.svg
   │   └── ...
   ├── 9x16/
   │   ├── concept-1-stories.svg
   │   └── ...
   └── 1_91x1/
       ├── concept-1-landscape.svg
       └── ...
   ```
3. Open `copy-sheet.txt` to find:
   - **Primary Text:** 3 character-budget-checked variations ($\le 250$ chars) per concept.
   - **Headlines:** 3 punchy variations ($\le 40$ chars).
   - **Descriptions:** 3 link-card descriptions ($\le 30$ chars).
   - **Meta Call-to-Action:** Recommended button setting (`SHOP_NOW`, `ORDER_NOW`, `GET_OFFER`, etc.).
4. In **Meta Ads Manager**, create an *Advantage+ Creative* or manual campaign, drag and drop the SVG/raster assets from the corresponding ratio folders into the media library, and copy-paste the text variations directly from `copy-sheet.txt`.

---

## 7. Credit Economics & System Invariants

- **Standard Generation:** Generates 5 distinct creative concepts for 5 credits (1 credit per creative).
- **Targeted Edits:** Updating copy, typography, or layout styles in vector layers incurs **0 credits**. Re-generating a background environment via Gemini costs 1 credit.
- **Zero-Waste Failure Guarantee:** If visual asset generation fails due to a network interruption or model error, the system automatically triggers an atomic credit refund via Supabase RPC (`refund_credits_atomic`). You are never billed for failed runs.
- **Offline / Test Mode:** When external AI services are unreachable, the system automatically falls back to deterministic heuristic design scoring and local SVG generation to ensure uninterrupted workflow testing.

