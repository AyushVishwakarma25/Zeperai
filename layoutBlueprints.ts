// layoutBlueprints.ts
// Default positions/sizes for each editable element, keyed by
// AdPromptTemplate.layoutBlueprintId. These seed the overlay when a
// template is first picked; the user then drags/restyles from there.
// All x/y/width values are percentages of the canvas.

export interface ElementTransform {
    x: number;
    y: number;
    width?: number;
    fontSize?: number;
    fontFamily?: string;   // Google Font family name, e.g. "Poppins"
    fontWeight?: number;   // 400 / 600 / 700 / 900
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    rotation?: number;
    visible?: boolean;
}

export type AdElementKey =
    | 'title' | 'subheading' | 'cta' | 'badge' | 'logo'
    | 'features' | 'availability' | 'disclaimer' | 'platformIcons'
    | 'priceTag' | 'stickers' | 'contactBlock';

export const LAYOUT_BLUEPRINTS: Record<string, Partial<Record<AdElementKey, ElementTransform>>> = {
    'marketplace-seasonal-promo': {
        badge: { x: 30, y: 6, width: 40, fontSize: 20, fontFamily: 'Poppins', fontWeight: 600, color: '#FFFFFF' },
        title: { x: 10, y: 18, width: 80, fontSize: 40, fontFamily: 'Poppins', fontWeight: 700, color: '#FFFFFF' },
        availability: { x: 30, y: 27, width: 40, fontSize: 16, fontFamily: 'Poppins', fontWeight: 500, color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999 },
        // NOTE: this template's giant "40% OFF" callout reuses the 'cta' key
        // by convention (it's the dominant discount text, closest semantic fit).
        cta: { x: 5, y: 33, width: 90, fontSize: 84, fontFamily: 'Poppins', fontWeight: 800, color: '#FFFFFF' },
        subheading: { x: 20, y: 48, width: 60, fontSize: 22, fontFamily: 'Poppins', fontWeight: 500, color: '#FFFFFF' },
        disclaimer: { x: 30, y: 94, width: 40, fontSize: 12, fontFamily: 'Poppins', fontWeight: 400, color: 'rgba(255,255,255,0.7)' },
    },
    'discount-badge-hero-product': {
        logo: { x: 25, y: 6, width: 50, fontSize: 24, fontFamily: 'Playfair Display', fontWeight: 700, color: '#FFFFFF' },
        title: { x: 10, y: 14, width: 80, fontSize: 42, fontFamily: 'Playfair Display', fontWeight: 800, color: '#FFFFFF' },
        badge: { x: 5, y: 32, width: 26, fontSize: 28, fontFamily: 'Poppins', fontWeight: 800, color: '#FFFFFF', backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 999 },
        availability: { x: 15, y: 80, width: 70, fontSize: 16, fontFamily: 'Poppins', fontWeight: 500, color: '#FFFFFF' },
        platformIcons: { x: 10, y: 90, width: 80 },
    },
    'social-grid-organic-cta': {
        title: { x: 8, y: 18, width: 55, fontSize: 28, fontFamily: 'Montserrat', fontWeight: 800, color: '#FFFFFF' },
        priceTag: { x: 8, y: 55, width: 40, fontSize: 22, fontFamily: 'Montserrat', fontWeight: 700, color: '#FFFFFF' },
        contactBlock: { x: 8, y: 78, width: 60, fontSize: 11, fontFamily: 'Inter', fontWeight: 400, color: 'rgba(255,255,255,0.85)' },
        cta: { x: 8, y: 70, width: 22, fontSize: 12, fontFamily: 'Montserrat', fontWeight: 700, color: '#0A0A0A', backgroundColor: '#A3E635', borderRadius: 999 },
    },
    'minimalist-rack-feature': {
        logo: { x: 30, y: 4, width: 40, fontSize: 22, fontFamily: 'Archivo Black', fontWeight: 400, color: '#111111' },
        title: { x: 10, y: 10, width: 80, fontSize: 38, fontFamily: 'Archivo Black', fontWeight: 400, color: '#111111' },
        features: { x: 10, y: 24, width: 80, fontSize: 11, fontFamily: 'Inter', fontWeight: 500, color: '#111111' },
        badge: { x: 35, y: 82, width: 30, fontSize: 11, fontFamily: 'Inter', fontWeight: 600, color: '#FFFFFF', backgroundColor: '#111111', borderRadius: 999 },
        cta: { x: 5, y: 90, width: 40, fontSize: 20, fontFamily: 'Inter', fontWeight: 800, color: '#111111' },
    },
    'multi-model-lineup': {
        title: { x: 15, y: 4, width: 70, fontSize: 46, fontFamily: 'Anton', fontWeight: 400, color: '#111111' },
        subheading: { x: 15, y: 12, width: 70, fontSize: 15, fontFamily: 'Inter', fontWeight: 500, color: '#111111' },
        badge: { x: 32, y: 17, width: 36, fontSize: 12, fontFamily: 'Inter', fontWeight: 600, color: '#FFFFFF', backgroundColor: '#111111', borderRadius: 999 },
        features: { x: 5, y: 84, width: 90, fontSize: 11, fontFamily: 'Inter', fontWeight: 500, color: '#FFFFFF', backgroundColor: 'rgba(17,17,17,0.9)' },
    },
    'bold-statement-overlay': {
        title: { x: 5, y: 10, width: 70, fontSize: 44, fontFamily: 'Anton', fontWeight: 400, color: '#FFFFFF' },
        contactBlock: { x: 25, y: 48, width: 40, fontSize: 14, fontFamily: 'Inter', fontWeight: 400, color: 'rgba(255,255,255,0.6)' },
    },
    'emoji-sticker-social-post': {
        badge: { x: 4, y: 4, width: 16, fontSize: 12, fontFamily: 'Baloo 2', fontWeight: 700, color: '#111111', backgroundColor: '#FBBF24', borderRadius: 8 },
        title: { x: 10, y: 10, width: 60, fontSize: 30, fontFamily: 'Baloo 2', fontWeight: 800, color: '#FBBF24' },
        stickers: { x: 70, y: 6, width: 25, fontSize: 26 },
        contactBlock: { x: 5, y: 84, width: 90, fontSize: 11, fontFamily: 'Inter', fontWeight: 400, color: 'rgba(255,255,255,0.85)' },
    },
    'brand-collab-cart-promo': {
        logo: { x: 20, y: 5, width: 60, fontSize: 18, fontFamily: 'Montserrat', fontWeight: 700, color: '#111111' },
        title: { x: 10, y: 14, width: 80, fontSize: 50, fontFamily: 'Montserrat', fontWeight: 900, color: '#FFFFFF' },
    },
};

export const ELEMENT_LABELS: Record<AdElementKey, string> = {
    title: 'Title', subheading: 'Subheading', cta: 'CTA / Callout', badge: 'Badge',
    logo: 'Logo', features: 'Features', availability: 'Availability / Date',
    disclaimer: 'Disclaimer', platformIcons: 'Platform Icons', priceTag: 'Price Tag',
    stickers: 'Stickers', contactBlock: 'Contact Block',
};

// Which existing GenerateImageParams field each element's text content
// defaults to. Editing the layer directly overrides this via adElementText.
export const ELEMENT_CONTENT_SOURCE: Partial<Record<AdElementKey, string>> = {
    title: 'adTitle',
    subheading: 'adSubheading',
    cta: 'adCta',
    availability: 'adAvailability',
    features: 'adFeatures',
};
