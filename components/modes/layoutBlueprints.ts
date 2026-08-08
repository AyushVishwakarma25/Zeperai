import { ElementTransform } from '../../types';

export type { ElementTransform };

export type AdElementKey = 
  | 'title' 
  | 'subheading' 
  | 'badge' 
  | 'cta' 
  | 'features' 
  | 'contactBlock' 
  | 'stickers' 
  | 'platformIcons' 
  | 'logo';

export const ELEMENT_LABELS: Record<AdElementKey, string> = {
    title: 'Headline / Title',
    subheading: 'Subheading',
    badge: 'Badge / Tag',
    cta: 'Call To Action (CTA)',
    features: 'Features List',
    contactBlock: 'Contact / Handle',
    stickers: 'Stickers / Emoji',
    platformIcons: 'Platform Icons',
    logo: 'Logo',
};

export const ELEMENT_CONTENT_SOURCE: Record<AdElementKey, string | null> = {
    title: 'adTitle',
    subheading: 'adSubheading',
    badge: 'adAvailability',
    cta: 'adCta',
    features: 'adFeatures',
    contactBlock: null,
    stickers: null,
    platformIcons: null,
    logo: null,
};

export const LAYOUT_BLUEPRINTS: Record<string, Partial<Record<AdElementKey, ElementTransform>>> = {
    'marketplace-seasonal-promo': {
        badge: { x: 35, y: 8, fontSize: 13, fontFamily: 'Montserrat', fontWeight: 700, color: '#FFFFFF', backgroundColor: '#E11D48', borderRadius: '20px', visible: true },
        title: { x: 10, y: 18, width: 80, fontSize: 24, fontFamily: 'Playfair Display', fontWeight: 700, color: '#1E1B4B', visible: true },
        subheading: { x: 15, y: 32, width: 70, fontSize: 14, fontFamily: 'Inter', fontWeight: 500, color: '#4C1D95', visible: true },
        cta: { x: 30, y: 44, width: 40, fontSize: 14, fontFamily: 'Montserrat', fontWeight: 700, color: '#FFFFFF', backgroundColor: '#4338CA', borderRadius: '8px', visible: true },
    },
    'discount-badge-hero-product': {
        badge: { x: 10, y: 8, fontSize: 12, fontFamily: 'Montserrat', fontWeight: 800, color: '#FFFFFF', backgroundColor: '#2563EB', borderRadius: '6px', visible: true },
        title: { x: 10, y: 16, width: 80, fontSize: 22, fontFamily: 'Outfit', fontWeight: 700, color: '#0F172A', visible: true },
        subheading: { x: 10, y: 28, width: 80, fontSize: 13, fontFamily: 'Inter', fontWeight: 400, color: '#334155', visible: true },
        cta: { x: 25, y: 82, width: 50, fontSize: 14, fontFamily: 'Outfit', fontWeight: 700, color: '#FFFFFF', backgroundColor: '#1D4ED8', borderRadius: '24px', visible: true },
    },
    'social-grid-organic-cta': {
        title: { x: 8, y: 15, width: 45, fontSize: 20, fontFamily: 'Plus Jakarta Sans', fontWeight: 800, color: '#FFFFFF', visible: true },
        subheading: { x: 8, y: 38, width: 45, fontSize: 12, fontFamily: 'Inter', fontWeight: 400, color: '#94A3B8', visible: true },
        cta: { x: 8, y: 55, width: 38, fontSize: 12, fontFamily: 'Plus Jakarta Sans', fontWeight: 700, color: '#0F172A', backgroundColor: '#F8FAFC', borderRadius: '20px', visible: true },
    },
    'minimalist-rack-feature': {
        badge: { x: 38, y: 6, fontSize: 11, fontFamily: 'Inter', fontWeight: 600, color: '#475569', backgroundColor: '#E2E8F0', borderRadius: '12px', visible: true },
        title: { x: 10, y: 14, width: 80, fontSize: 26, fontFamily: 'Playfair Display', fontWeight: 600, color: '#1E293B', visible: true },
        subheading: { x: 15, y: 28, width: 70, fontSize: 13, fontFamily: 'Inter', fontWeight: 400, color: '#64748B', visible: true },
        cta: { x: 30, y: 88, width: 40, fontSize: 13, fontFamily: 'Inter', fontWeight: 600, color: '#FFFFFF', backgroundColor: '#0F172A', borderRadius: '4px', visible: true },
    },
    'multi-model-lineup': {
        title: { x: 10, y: 5, width: 80, fontSize: 22, fontFamily: 'Cinzel', fontWeight: 700, color: '#0F172A', visible: true },
        subheading: { x: 15, y: 14, width: 70, fontSize: 12, fontFamily: 'Inter', fontWeight: 500, color: '#475569', visible: true },
        cta: { x: 25, y: 85, width: 50, fontSize: 13, fontFamily: 'Montserrat', fontWeight: 700, color: '#FFFFFF', backgroundColor: '#000000', borderRadius: '0px', visible: true },
    },
    'bold-statement-overlay': {
        badge: { x: 10, y: 10, fontSize: 12, fontFamily: 'Space Grotesk', fontWeight: 700, color: '#FFFFFF', backgroundColor: '#15803D', borderRadius: '4px', visible: true },
        title: { x: 10, y: 18, width: 80, fontSize: 28, fontFamily: 'Space Grotesk', fontWeight: 700, color: '#064E3B', visible: true },
        subheading: { x: 10, y: 38, width: 75, fontSize: 14, fontFamily: 'Inter', fontWeight: 500, color: '#047857', visible: true },
        cta: { x: 10, y: 52, width: 45, fontSize: 14, fontFamily: 'Space Grotesk', fontWeight: 700, color: '#FFFFFF', backgroundColor: '#047857', borderRadius: '8px', visible: true },
    },
    'emoji-sticker-social-post': {
        title: { x: 10, y: 12, width: 80, fontSize: 24, fontFamily: 'Fredoka', fontWeight: 700, color: '#1E1B4B', visible: true },
        subheading: { x: 10, y: 28, width: 80, fontSize: 13, fontFamily: 'Fredoka', fontWeight: 400, color: '#312E81', visible: true },
        badge: { x: 65, y: 6, fontSize: 14, fontFamily: 'Fredoka', fontWeight: 700, color: '#FFFFFF', backgroundColor: '#EC4899', borderRadius: '50%', visible: true },
        cta: { x: 25, y: 40, width: 50, fontSize: 14, fontFamily: 'Fredoka', fontWeight: 700, color: '#FFFFFF', backgroundColor: '#4F46E5', borderRadius: '20px', visible: true },
    },
    'brand-collab-cart-promo': {
        title: { x: 10, y: 8, width: 80, fontSize: 24, fontFamily: 'Montserrat', fontWeight: 800, color: '#FFFFFF', visible: true },
        subheading: { x: 10, y: 20, width: 80, fontSize: 13, fontFamily: 'Inter', fontWeight: 500, color: '#F1F5F9', visible: true },
        cta: { x: 30, y: 30, width: 40, fontSize: 13, fontFamily: 'Montserrat', fontWeight: 700, color: '#0F172A', backgroundColor: '#FFFFFF', borderRadius: '30px', visible: true },
    },
};
