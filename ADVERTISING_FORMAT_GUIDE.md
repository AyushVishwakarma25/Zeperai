# ZeperAI Campaign Studio V2 — Advertising Format Guide

> **Target Audience:** Creative Directors, Performance Marketers, Brand Operators, and AI Prompt Engineers  
> **Registry Source:** `src/campaignStudio/server/formatLibrary.ts`  
> **Total Production Formats:** 15 Commercial Advertising Layouts  

---

## 1. Overview & Format Selection Philosophy

Advertising performance on paid social (Meta, TikTok, Google Performance Max) relies heavily on **creative diversity**. Running identical ad templates with minor copy tweaks triggers rapid creative fatigue. 

ZeperAI Campaign Studio V2 enforces format diversity by maintaining a structured library of **15 commercial advertising formats**. When generating a 5-concept campaign, the **Advertising Format Strategist** evaluates each angle's strategic intent (hook, problem-solution, social proof, urgency, feature spotlight) and automatically selects a distinct format paradigm with at least 3 unique layouts per run.

---

## 2. The 15 Commercial Advertising Formats Catalog

### 1. Promotional Retail Poster (`promotional-retail-poster`)
- **Best-fit Industries:** Food & Beverage, Packaged Goods, Retail, FMCG, Electronics, Fashion.
- **Funnel Stage:** Bottom-of-Funnel (BOFU) / Direct Conversion.
- **Strategic Angle:** Flash Sales, Festive Deals, Clearance, Introductory Pricing.
- **Visual Hierarchy:**
  1. *Level 1:* Urgent promotional offer badge ("FLAT 40% OFF").
  2. *Level 2:* Dominant punchy headline ($\le 6$ words).
  3. *Level 3:* Centered hero product with high-contrast studio rim lighting.
  4. *Level 4:* Full-width high-contrast CTA button pill.
  5. *Level 5:* Brand logo top-left or top-center with clean margins.
- **Design Tips:** Use solid saturated or vibrant gradient backgrounds. Avoid low text contrast and floating products lacking contact shadows.

---

### 2. Editorial Product Advertisement (`editorial-product-ad`)
- **Best-fit Industries:** Beauty, Skincare, Luxury Goods, Fashion, Jewelry, Wellness.
- **Funnel Stage:** Top-of-Funnel (TOFU) / Consideration.
- **Strategic Angle:** Brand Prestige, Artisanal Craftsmanship, Clean Aesthetics.
- **Visual Hierarchy:**
  1. *Level 1:* Minimalist brand logo or subtle category label.
  2. *Level 2:* Elegant editorial headline with generous breathing room.
  3. *Level 3:* Hero product staged on natural stone, linen, or architectural pedestals.
  4. *Level 4:* Understated subline and refined text CTA.
- **Design Tips:** Maintain at least 35% negative space. Use serif headlines (e.g. `Playfair Display`) paired with clean geometric grotesque subtext (`Inter`).

---

### 3. Dynamic Product Advertisement (`dynamic-product-ad`)
- **Best-fit Industries:** Sports, Energy Drinks, Footwear, Gaming, Consumer Tech.
- **Funnel Stage:** Top / Middle-of-Funnel (Pattern Interrupt).
- **Strategic Angle:** High-Energy Performance, Velocity, Unstoppable Durability.
- **Visual Hierarchy:**
  1. *Level 1:* Diagonal display headline spanning across action sightlines.
  2. *Level 2:* Angled hero product bursting through liquid splashes or particle waves.
  3. *Level 3:* Feature callout badge anchored at the opposite corner.
  4. *Level 4:* Dynamic high-contrast CTA pill.
- **Design Tips:** Use 15°–45° diagonal compositions with high-speed freeze-frame splash or burst effects. Avoid static centered products.

---

### 4. Ingredient / Feature Spotlight (`ingredient-feature-spotlight`)
- **Best-fit Industries:** Beauty, Health Supplements, Gourmet Food, Skincare, Audio/Hardware.
- **Funnel Stage:** Middle-of-Funnel (MOFU) / Consideration.
- **Strategic Angle:** Formula Purity, Raw Botanical Extracts, Patented Technology.
- **Visual Hierarchy:**
  1. *Level 1:* Educational benefit headline highlighting the core formula or mechanism.
  2. *Level 2:* Hero product surrounded by 3–4 natural raw ingredients or spec callouts.
  3. *Level 3:* Structured benefit badges or connecting visual pointer lines.
  4. *Level 4:* Clinical / laboratory verification badge and CTA.
- **Design Tips:** Central focal anchor with radiating ingredient components. Keep annotation text concise ($\le 4$ words per callout).

---

### 5. Comparison Advertisement (`comparison-ad`)
- **Best-fit Industries:** D2C Disruptors, Cleaning, Mattresses, Supplements, Financial Apps.
- **Funnel Stage:** Middle / Bottom-of-Funnel (Decisive Conversion).
- **Strategic Angle:** "Us vs. Them", "The Old Way vs. The Future".
- **Visual Hierarchy:**
  1. *Level 1:* Provocative comparison headline ("Why Settle for Outdated Shampoos?").
  2. *Level 2:* 2-column comparative layout (Dull generic left vs. Vibrant hero brand right).
  3. *Level 3:* Green checkmark vs. Red cross comparison checklist.
  4. *Level 4:* Decisive CTA positioned on the winning brand column.
- **Design Tips:** Never disparage registered trademarks directly. Use clear visual contrast (faded grey background for the problem, bright brand color for the solution).

---

### 6. Offer-led Advertisement (`offer-led-ad`)
- **Best-fit Industries:** E-Commerce, Fast Fashion, Food Delivery, Quick-Commerce.
- **Funnel Stage:** Bottom-of-Funnel (BOFU) / Flash Conversion.
- **Strategic Angle:** BOGO (Buy 1 Get 1), Free Gift with Purchase, Seasonal Liquidation.
- **Visual Hierarchy:**
  1. *Level 1:* Massive discount numeral hook ("BUY 1 GET 1 FREE" or "50% OFF").
  2. *Level 2:* Urgency subheadline ("Tonight Only • Free Delivery").
  3. *Level 3:* Bundled product hero packshot.
  4. *Level 4:* Full-width bold CTA bar.
- **Design Tips:** Use condensed high-impact typefaces (`Anton`, `Bebas Neue`). Ensure the promo code or discount condition is immediately readable.

---

### 7. Lifestyle Advertisement (`lifestyle-ad`)
- **Best-fit Industries:** Apparel, Home Decor, Travel, Fitness, Outdoor, Specialty Beverage.
- **Funnel Stage:** Top / Middle-of-Funnel (Emotional Aspiration).
- **Strategic Angle:** Everyday Ritual, Identity Expression, Seamless Integration.
- **Visual Hierarchy:**
  1. *Level 1:* Relatable lifestyle environment with natural ambient sunlight.
  2. *Level 2:* Hero product naturally integrated into hands, kitchen, gym, or workspace.
  3. *Level 3:* Narrative headline reflecting consumer feelings.
  4. *Level 4:* Floating glassmorphic CTA pill.
- **Design Tips:** Use warm cinematic lighting with authentic human context. Avoid staged stock-photo smiles and corporate poses.

---

### 8. Social Proof Advertisement (`social-proof-ad`)
- **Best-fit Industries:** Skincare, Haircare, Supplements, Consumer Tech, D2C Brands.
- **Funnel Stage:** Middle / Bottom-of-Funnel (Trust Barrier Breaker).
- **Strategic Angle:** 5-Star Reviews, Customer Volume, Media Endorsements.
- **Visual Hierarchy:**
  1. *Level 1:* 5 golden stars and verified rating badge ("Over 10,000+ 5-Star Reviews").
  2. *Level 2:* Quotation-marked punchy customer testimonial headline.
  3. *Level 3:* Sharp product hero packshot.
  4. *Level 4:* Reviewer name, verified buyer badge, and direct shop CTA.
- **Design Tips:** Keep quotes under 14 words for instant mobile scanning. Always pair quotes with star icons and buyer badges.

---

### 9. Product Benefit Infographic (`benefit-infographic`)
- **Best-fit Industries:** Health & Wellness, SaaS, Electronics, Smart Appliances, Baby Care.
- **Funnel Stage:** Middle-of-Funnel (MOFU) / Evaluation.
- **Strategic Angle:** Clinical Efficacy, Measurable Results, Technical Metrics.
- **Visual Hierarchy:**
  1. *Level 1:* Big numerical statistic ("94% Saw Visible Reduction in 14 Days").
  2. *Level 2:* 3 structured benefit callout cards with icons.
  3. *Level 3:* Centered hero product with glowing indicator accents.
  4. *Level 4:* Clinical study footnote and CTA button.
- **Design Tips:** Never exceed 3 benefit metrics on a single ad. Use bold tabular numbers and clean white/light neutral cards.

---

### 10. Typography-first Advertisement (`typography-first-ad`)
- **Best-fit Industries:** Media, Streetwear, Disruptive D2C, Beverage, Publishing.
- **Funnel Stage:** Top-of-Funnel (Pattern Interrupt / Viral Hook).
- **Strategic Angle:** Bold Opinion, Contrarian Truth, Manifesto Statement.
- **Visual Hierarchy:**
  1. *Level 1:* Massive headline taking up 50%+ of total canvas area.
  2. *Level 2:* Stark two-tone color contrast (e.g. Electric Yellow on Black).
  3. *Level 3:* Compact product packshot anchored at bottom-right corner.
  4. *Level 4:* Minimalist high-contrast CTA button.
- **Design Tips:** Headline copy must be provocative and unignorable. Use ultra-heavy grotesque sans-serif fonts spanning edge-to-edge.

---

### 11. Product Hero Advertisement (`product-hero-ad`)
- **Best-fit Industries:** Luxury Fragrances, Swiss Watches, Premium Audio, Fine Chocolates.
- **Funnel Stage:** Top / Middle-of-Funnel (Aesthetic Elevation).
- **Strategic Angle:** Architectural Purity, Flawless Detailing, Macro Texture.
- **Visual Hierarchy:**
  1. *Level 1:* Monumental hero product occupying 60%+ of canvas height.
  2. *Level 2:* Subtle luxury brand wordmark top-center.
  3. *Level 3:* Understated product name and signature feature phrase.
  4. *Level 4:* Refined exploration CTA.
- **Design Tips:** Use dramatic directional rim lighting, subtle pedestal reflections, and minimal background clutter.

---

### 12. Seasonal / Festival Advertisement (`seasonal-festival-ad`)
- **Best-fit Industries:** Festive Gifting, Sweets, Jewelry, Fashion, Home Decor.
- **Funnel Stage:** Middle / Bottom-of-Funnel (Seasonal Urgency).
- **Strategic Angle:** Diwali, Holi, Black Friday, Christmas, New Year.
- **Visual Hierarchy:**
  1. *Level 1:* Festive celebration hook ("Light Up Your Diwali With Pure Glow").
  2. *Level 2:* Festive gift box / limited edition packaging hero.
  3. *Level 3:* Festive bonus / gifting discount badge ("Free Gift Box Included").
  4. *Level 4:* Gifting CTA with guaranteed delivery cutoff date.
- **Design Tips:** Incorporate warm celebratory color palettes (deep maroons, royal saffron, liquid gold particles). Avoid generic clipart.

---

### 13. Problem-Solution Advertisement (`problem-solution-ad`)
- **Best-fit Industries:** Problem-solving Skincare, Cleaning Supplies, Pet Care, Ergonomics.
- **Funnel Stage:** Top / Middle-of-Funnel (Empathy Hook).
- **Strategic Angle:** Frustration Agitation & Instant Antidote.
- **Visual Hierarchy:**
  1. *Level 1:* Empathetic frustration question ("Tired of Waking Up with Stiff Neck?").
  2. *Level 2:* Subtle visual agitation of the pain point.
  3. *Level 3:* Transformative hero product presented as the heroic resolution.
  4. *Level 4:* Risk-free 30-day money-back guarantee badge with CTA.
- **Design Tips:** Keep the problem relatable without being repulsive. The transition to the product must feel clean and decisive.

---

### 14. Product Range Advertisement (`product-range-ad`)
- **Best-fit Industries:** Beverages, Snack Foods, Cosmetics Shades, Personal Care Lineups.
- **Funnel Stage:** Middle / Bottom-of-Funnel (Exploration & AOV Expansion).
- **Strategic Angle:** Variety Discovery, Discovery Kits, Flavor Sampling.
- **Visual Hierarchy:**
  1. *Level 1:* Family discovery headline ("Find Your Signature Shade").
  2. *Level 2:* Symmetrical horizontal lineup of 3 to 5 variants.
  3. *Level 3:* Sampler kit or bundle discount badge.
  4. *Level 4:* "Explore All Flavors" CTA button.
- **Design Tips:** Ensure all bottles or boxes share identical optical scale and consistent ground shadows. Avoid overcrowding.

---

### 15. Founder / Expert-led Advertisement (`founder-expert-led-ad`)
- **Best-fit Industries:** Clean Skincare, Specialty Coffee, Artisanal Goods, Health Tech.
- **Funnel Stage:** Middle-of-Funnel (Authenticity & Authority).
- **Strategic Angle:** Dermatologist Formulated, Master Roaster Note, Founder Story.
- **Visual Hierarchy:**
  1. *Level 1:* Personal quote or letter heading from the founder or specialist.
  2. *Level 2:* Warm workshop, laboratory, or kitchen ambient scene.
  3. *Level 3:* Hero product placed right alongside the creator.
  4. *Level 4:* Handcrafted signature or expert credential seal.
- **Design Tips:** Use editorial serif headlines, authentic documentary lighting, and a realistic cursive signature graphic.

