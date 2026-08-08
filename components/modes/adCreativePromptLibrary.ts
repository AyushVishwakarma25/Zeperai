// adCreativePromptLibrary.ts (v2 — background-only)
// Prompts explicitly exclude text. The model renders scene/product composition
// leaving clean negative space where text belongs. Text/badges/CTA rendered as HTML/CSS layers.

export interface AdPromptTemplate {
    id: string;
    name: string;
    category: string;
    thumbnail: string;
    aspectRatio: '4:5' | '1:1' | '3:4' | '9:16';
    prompt: string;     // background/scene generation prompt — NO text
    layoutBlueprintId: string; // matches keys in layoutBlueprints.ts
}

export const AD_CREATIVE_PROMPT_LIBRARY: AdPromptTemplate[] = [
    {
        id: 'marketplace-seasonal-promo',
        name: 'Seasonal Marketplace Promo',
        category: 'Promo / Sale',
        thumbnail: 'https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/thumbnails/AdCreative/marketplace-seasonal-promo.webp',
        aspectRatio: '3:4',
        prompt: `Deep purple-to-warm-peach gradient night-to-dawn background, soft textured sandy surface in the lower half. [PRODUCT] arranged elegantly on the sand in the lower third of frame, dramatic soft studio lighting, a few scattered flower petals for texture. Leave the upper two-thirds of the frame clean and uncluttered — this space will have text added afterward. Portrait composition, premium editorial advertising photography, cinematic lighting. Absolutely no text, letters, numbers, or logos anywhere in the image.`,
        layoutBlueprintId: 'marketplace-seasonal-promo',
    },
    {
        id: 'discount-badge-hero-product',
        name: 'Discount Badge + Hero Product',
        category: 'Promo / Sale',
        thumbnail: 'https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/thumbnails/AdCreative/discount-badge-hero.webp',
        aspectRatio: '4:5',
        prompt: `Deep-to-bright blue gradient studio background with a diagonal light streak. A single hero shot of [PRODUCT] floating center-frame with dramatic rim lighting and a soft reflection beneath it. Leave the top third and bottom fifth of frame clean for text to be added afterward. Glossy premium product advertising photography. Absolutely no text, letters, numbers, or logos anywhere in the image.`,
        layoutBlueprintId: 'discount-badge-hero-product',
    },
    {
        id: 'social-grid-organic-cta',
        name: 'Social Grid — Organic CTA',
        category: 'Social Post',
        thumbnail: 'https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/thumbnails/AdCreative/social-grid-cta.webp',
        aspectRatio: '1:1',
        prompt: `A bold organic blob shape in [BRAND_COLOR] over a near-black background, high-contrast modern e-commerce style. [PRODUCT] photographed isolated on the right side of frame, clean studio lighting. Leave the left half of frame clean for text and a CTA button to be added afterward. Square composition. Absolutely no text, letters, numbers, or logos anywhere in the image.`,
        layoutBlueprintId: 'social-grid-organic-cta',
    },
    {
        id: 'minimalist-rack-feature',
        name: 'Minimalist Product Feature',
        category: 'Product Launch',
        thumbnail: 'https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/thumbnails/AdCreative/minimalist-rack-feature.webp',
        aspectRatio: '4:5',
        prompt: `A clean neutral beige studio wall with soft directional shadow. [PRODUCT] photographed cleanly, filling the lower two-thirds of the frame with soft studio lighting. Leave the top third of frame clean for a logo and headline to be added afterward. Portrait composition, minimalist DTC product photography. Absolutely no text, letters, numbers, or logos anywhere in the image.`,
        layoutBlueprintId: 'minimalist-rack-feature',
    },
    {
        id: 'multi-model-lineup',
        name: 'Multi-Model Lineup',
        category: 'Apparel',
        thumbnail: 'https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/thumbnails/AdCreative/multi-model-lineup.webp',
        aspectRatio: '4:5',
        prompt: `A neutral studio backdrop with soft shadow. Three models standing side by side wearing [PRODUCT] in different colorways, natural poses, even studio lighting, filling the lower two-thirds of frame. Leave the top fifth of frame clean for a headline, and the bottom fifth clean for a feature strip, to be added afterward. Portrait composition, premium apparel lookbook photography. Absolutely no text, letters, numbers, or logos anywhere in the image.`,
        layoutBlueprintId: 'multi-model-lineup',
    },
    {
        id: 'bold-statement-overlay',
        name: 'Bold Statement Overlay',
        category: 'Food / Lifestyle',
        thumbnail: 'https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/thumbnails/AdCreative/bold-statement-overlay.webp',
        aspectRatio: '4:5',
        prompt: `A split color block background, deep green transitioning to warm yellow. Along the bottom, a diagonal row of small bowls containing [PRODUCT], shot from a slight overhead angle with a few scattered fresh ingredients around them. Leave the upper two-thirds of frame clean and open — a large headline will be added afterward. Portrait composition, bold modern food-brand advertising style. Absolutely no text, letters, numbers, or logos anywhere in the image.`,
        layoutBlueprintId: 'bold-statement-overlay',
    },
    {
        id: 'emoji-sticker-social-post',
        name: 'Emoji Sticker Social Post',
        category: 'Social Post',
        thumbnail: 'https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/thumbnails/AdCreative/emoji-sticker-social.webp',
        aspectRatio: '4:5',
        prompt: `Solid bold [BRAND_COLOR] background. [PRODUCT] photographed overhead with visible toppings/details, bright saturated colors, filling the lower half of the frame. Leave the upper half of frame clean for a headline and decorative elements to be added afterward. Playful, high-saturation social ad style. Absolutely no text, letters, numbers, or logos anywhere in the image.`,
        layoutBlueprintId: 'emoji-sticker-social-post',
    },
    {
        id: 'brand-collab-cart-promo',
        name: 'Brand Collab Cart Promo',
        category: 'Promo / Sale',
        thumbnail: 'https://kvqzfiezakcbnxbagxjs.supabase.co/storage/v1/object/public/thumbnails/AdCreative/brand-collab-cart.webp',
        aspectRatio: '4:5',
        prompt: `Solid saturated [BRAND_COLOR] background with a glossy reflective studio floor. A shopping cart filled with [PRODUCT] items sits in the lower two-thirds of frame, with a long white receipt tape spilling out of the cart onto the floor. Dramatic product photography lighting with a soft shadow beneath the cart. Leave the top third of frame clean for a logo lockup and headline to be added afterward. Portrait composition, glossy commercial e-commerce advertising style. Absolutely no text, letters, numbers, or logos anywhere in the image.`,
        layoutBlueprintId: 'brand-collab-cart-promo',
    },
];
