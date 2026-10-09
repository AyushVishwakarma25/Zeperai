# ZeperAI Model Architecture, Feature Mapping & Credit Unit Economics

## 1. Executive Summary & Model Tiering Strategy

### Should We Use `gemini-3.8-flash` vs Lower Models?
**Yes, lower models like `gemini-3.1-flash-lite` are strongly recommended for high-volume text tasks, and our codebase is now optimized for this tiered approach.**

* **The Reality of Deprecated Models**: Older models like `gemini-1.5-flash`, `gemini-1.5-pro`, `gemini-2.0-flash`, and `gemini-2.0-pro` are officially deprecated by Google and rejected by modern `@google/genai` endpoints.
* **The Cost-Optimal Replacement is `gemini-3.1-flash-lite`**:
  * **Cost**: $0.075 / 1M input tokens and $0.30 / 1M output tokens (compared to $0.15 / $0.60 for `gemini-3.8-flash` and $1.25 / $5.00 for `gemini-3.1-pro-preview`).
  * **Latency**: 30–45% faster Time-To-First-Token (TTFT), creating an instant, responsive UI for copywriting, rewriting, and live chat.
  * **Quality**: Handles 3 variations of ad headlines, body copy, hashtags, CTAs, and conversational support with near-identical creative fidelity.
* **Where `gemini-3.8-flash` Still Shines**:
  * Complex research tasks with live Google Search grounding (Campaign Studio Market Research and Competitor Research).
  * Long-context website parsing and Brand Kit multimodal logo analysis.
* **Where `gemini-3.1-pro-preview` is Essential**:
  * High-order reasoning with thinking tokens enabled (Campaign Studio Strategy Agent and Creative Direction Agent).
* **Where Image Models (Nano Banana Family) MUST Be Used**:
  * Product photoshoot rendering, model shoots, canvas inpainting, and creative asset generation. `gemini-3.8-flash` or `gemini-3.1-flash-lite` can **never** be used for images; attempting to do so triggers a fatal `400 Bad Request` from the Gemini API.

---

## 2. Complete Feature-to-Model Mapping Table

| Feature / Studio | Agent / Component | Tier / Quality Setting | Canonical Model Name | Internal Alias | Input/Output Modality | User Credit Charge | Raw Google API Cost (Est.) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Product Photoshoot** | Free Tier Product Generation | Free Trial (7 Days) | `gemini-3.1-flash-lite-image` | `nano-banana-2-lite` | Text + Ref Image → Image | 1 Credit | ~$0.020 (₹1.65) |
| **Product Photoshoot** | Standard Studio Generation | Paid: Standard Quality | `gemini-nano-banana-2.1` | `nano-banana-2` | Text + Ref Image → Image | 1 Credit | ~$0.025 (₹2.05) |
| **Product Photoshoot** | Pro Flagship Photorealism | Paid: Pro Quality | `gemini-3-pro-image` | `nano-banana-pro` | Text + Ref Image → Image | 2 Credits (+1 for 2K) | ~$0.045 (₹3.70) |
| **Fashion & Influencer** | Model Studio & Pose Synthesis | Standard Quality | `gemini-nano-banana-2.1` | `nano-banana-2` | Image + Face Lock → Image | 1 Credit | ~$0.025 (₹2.05) |
| **Fashion & Influencer** | Model Studio & Pose Synthesis | Pro Quality | `gemini-3-pro-image` | `nano-banana-pro` | Image + Face Lock → Image | 2 Credits | ~$0.045 (₹3.70) |
| **Canvas Inpainting** | Object Replacement (`editImage`) | Standard / Pro | `gemini-nano-banana-2.1` | `nano-banana-2` | Masked Image → Image | 1 Credit | ~$0.025 (₹2.05) |
| **Background Removal** | Subject Cutout (`removeBackground`) | All Users | `gemini-nano-banana-2.1` | `nano-banana-2` | Image → Masked Image | 1 Credit | ~$0.025 (₹2.05) |
| **Background Pro** | Studio Cutout (`removeBackgroundPro`)| Paid Users | `gemini-nano-banana-2.1` | `nano-banana-2` | Image → Masked Image | 2 Credits | ~$0.025 (₹2.05) |
| **AI Content Writer** | Marketing Copy & Ad Variations | All Users | `gemini-3.1-flash-lite` | `flash-lite` | Text Context → JSON Array | 1 Credit | ~$0.00015 (₹0.012) |
| **AI Content Writer** | Copy Rewriter (Shorter, Humor, Luxury) | All Users | `gemini-3.1-flash-lite` | `flash-lite` | Text Snippet → JSON | 1 Credit | ~$0.00010 (₹0.008) |
| **Ad Copywriter** | Ad Copy Generator (Headline, Body, CTA) | All Users | `gemini-3.1-flash-lite` | `flash-lite` | Text Description → JSON | 1 Credit | ~$0.00015 (₹0.012) |
| **AI Assistant** | Ecommerce Brand Chatbot | All Users | `gemini-3.1-flash-lite` | `flash-lite` | Chat History → Text | 0 Credits | ~$0.00012 (₹0.010) |
| **Voice Assistant** | Indian Persona Text-to-Speech (TTS) | All Users | `gemini-3.8-flash-lite-tts`| `gemini-tts` | Text → Base64 Audio | 1 Credit | ~$0.00050 (₹0.041) |
| **Brand Kit** | Logo Color & Font Analysis | All Users | `gemini-3.8-flash` | `gemini-flash-latest` | Image Logo → JSON | 1 Credit | ~$0.00045 (₹0.037) |
| **A/B Test Studio** | Visual Creative Optimization Feedback | All Users | `gemini-3.8-flash` | `gemini-flash-latest` | Image + Copy → JSON | 1 Credit | ~$0.00045 (₹0.037) |
| **Campaign Studio** | **Agent 1: Brand Analysis** | Pipeline Step | `gemini-3.8-flash` | `gemini-flash-latest` | Scraped Web HTML → JSON | Included | ~$0.00080 (₹0.066) |
| **Campaign Studio** | **Agent 2: Market Research** | Pipeline Step | `gemini-3.8-flash` | `gemini-flash-latest` | Search Grounding → JSON | Included | ~$0.00120 (₹0.098) |
| **Campaign Studio** | **Agent 3: Competitor Research** | Pipeline Step | `gemini-3.8-flash` | `gemini-flash-latest` | Search Grounding → JSON | Included | ~$0.00120 (₹0.098) |
| **Campaign Studio** | **Agent 4: Strategy Formulation** | Pipeline Step | `gemini-3.1-pro-preview` | `gemini-pro-latest` | Deep Reasoning → JSON | Included | ~$0.01200 (₹0.985) |
| **Campaign Studio** | **Agent 5: Creative Direction** | Pipeline Step | `gemini-3.1-pro-preview` | `gemini-pro-latest` | Deep Reasoning → JSON | Included | ~$0.01000 (₹0.820) |
| **Campaign Studio** | **Agent 6: Master Prompts** | Pipeline Step | `gemini-3.8-flash` | `gemini-flash-latest` | Creative Specs → JSON | Included | ~$0.00060 (₹0.049) |
| **Campaign Studio** | **Agent 7: Creatives (Standard)** | Bulk Ad Generation | `gemini-nano-banana-2.1` | `nano-banana-2` | Multi-prompt → Images | 1 Credit / image | ~$0.025 / creative |
| **Campaign Studio** | **Agent 7: Creatives (Pro)** | Bulk Ad Generation | `gemini-3-pro-image` | `nano-banana-pro` | Multi-prompt → Images | 2 Credits / creative | ~$0.045 / creative |

---

## 3. Pricing Tiers & Credit Denominations

ZeperAI offers 4 tiers with calibrated credit economics:

| Plan Name | Retail Price | Included Credits | Effective Price Per Credit (INR) | Effective Price Per Credit (USD) | Best For |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Free Trial** | ₹0 (7 days) | 10 Credits | ₹0.00 | $0.00 | Initial onboarding and Product Studio preview |
| **Pay As You Go** | ₹999 (one-time) | 120 Credits | **₹8.33 / credit** | **$0.101 / credit** | Occasional creators, seasonal campaigns |
| **Pro Subscription** | ₹1,999 / month | 300 Credits / mo | **₹6.66 / credit** | **$0.081 / credit** | Active D2C brands, daily creative testing |
| **Agency Plan** | ₹4,999 / month | 1,000 Credits / mo | **₹5.00 / credit** | **$0.060 / credit** | E-commerce agencies, high-volume catalogs |

---

## 4. Unit Economics Analysis

### A. AI Text & Copywriting Generation (`gemini-3.1-flash-lite`)
* **User Charge**: 1 Credit = **₹5.00 to ₹8.33**
* **Google Cloud Cost**: ~500 input + 400 output tokens = **₹0.012** ($0.00015)
* **Gross Profit**: **₹4.98 to ₹8.31 per generation**
* **Gross Margin**: **> 99.7%**
* *Switching from `gemini-3.8-flash` to `gemini-3.1-flash-lite` cuts text inference costs by 50–70% while improving response speed.*

### B. Standard Image Generation (`gemini-nano-banana-2.1`)
* **User Charge**: 1 Credit = **₹5.00 to ₹8.33**
* **Google Cloud Cost**: ~$0.025 = **₹2.05**
* **Gross Profit**: **₹2.95 to ₹6.28 per image**
* **Gross Margin**: **59.0% (Agency) to 75.3% (PAYG)**

### C. Pro Photorealism Image Generation (`gemini-3-pro-image`)
* **User Charge**: 2 Credits = **₹10.00 to ₹16.66**
* **Google Cloud Cost**: ~$0.045 = **₹3.70**
* **Gross Profit**: **₹6.30 to ₹12.96 per image**
* **Gross Margin**: **63.0% (Agency) to 77.8% (PAYG)**
* *If the user selects 2K resolution (+1 Credit = 3 Credits total = ₹15.00 to ₹25.00), margin increases to **75–84%**.*

### D. Full Campaign Studio Run (6 Strategic Agents + 5 Standard Creatives)
* **Inference Pipeline Cost**:
  * Agent 1 (Brand Analysis): ₹0.066
  * Agent 2 (Market Research with Search Grounding): ₹0.098
  * Agent 3 (Competitor Research with Search Grounding): ₹0.098
  * Agent 4 (Strategy - Pro Reasoning): ₹0.985
  * Agent 5 (Creative Direction - Pro Reasoning): ₹0.820
  * Agent 6 (Master Prompts): ₹0.049
  * Agent 7 (5 Standard Creatives @ ₹2.05 ea): ₹10.25
  * **Total Run Infrastructure Cost**: **₹12.37** ($0.15)
* **User Credit Consumption**: 5 Credits (Standard) = **₹25.00 to ₹41.65**
* **Gross Profit Per Campaign Run**: **₹12.63 to ₹29.28**
* **Gross Margin**: **50.5% (Agency) to 70.3% (PAYG)**

### E. Voice Audio Synthesis (`gemini-3.8-flash-lite-tts`)
* **User Charge**: 1 Credit = **₹5.00 to ₹8.33**
* **Google Cloud Cost**: ~$0.00050 = **₹0.041**
* **Gross Profit**: **₹4.96 to ₹8.29**
* **Gross Margin**: **> 99.2%**

---

## 5. Summary of Profitability & Scalability

1. **Blended Gross Margin**: Across typical usage (70% Standard Images, 20% Pro Images, 10% Text & Audio), ZeperAI achieves an aggregate **Gross Margin of 64% to 78%**.
2. **Breakeven Point**:
   * A Pro subscriber (₹1,999/mo) consuming all 300 credits generates ~₹550–₹650 in Google API costs, netting **~₹1,350 to ₹1,450 pure margin per subscriber per month**.
   * An Agency subscriber (₹4,999/mo) consuming all 1,000 credits generates ~₹1,800–₹2,100 in Google API costs, netting **~₹2,900 to ₹3,200 pure margin per subscriber per month**.
3. **Credit Breakage**: Across SaaS credit systems, 18% to 25% of credits expire or remain unspent at the end of each billing cycle, further expanding net realized margins by an estimated 8–12%.
