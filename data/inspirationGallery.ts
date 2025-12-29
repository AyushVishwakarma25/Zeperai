
import { AppMode, AspectRatio, InspirationItem, ProductCategory, AdLayout, FashionGender, FashionShootType, RegionalStyle } from '../types';

export const INSPIRATION_GALLERY: InspirationItem[] = [
  {
    id: 'insp-skincare-minimal',
    imageUrl: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80',
    title: 'Minimalist Serum',
    category: 'Skincare',
    appMode: AppMode.Product,
    isRemixable: true,
    badge: 'Trending',
    remixParams: {
        productCategory: ProductCategory.Skincare,
        productStylePreset: 'Skincare & Beauty|Soft Glow',
        aspectRatios: [AspectRatio.PortraitPost],
        productDescription: 'A premium vitamin C serum bottle with a dropper.',
    }
  },
  {
    id: 'insp-perfume-luxury',
    imageUrl: 'https://images.unsplash.com/photo-1594035910387-fea477942698?auto=format&fit=crop&w=800&q=80',
    title: 'Noir Elegance',
    category: 'Perfume',
    appMode: AppMode.Product,
    isRemixable: true,
    remixParams: {
        productCategory: ProductCategory.Perfume,
        productStylePreset: 'Perfume & Luxury|Amber Night',
        aspectRatios: [AspectRatio.PortraitPost],
        productDescription: 'Luxury perfume bottle in a dark, moody setting.',
    }
  },
  {
    id: 'insp-fashion-urban',
    imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80',
    title: 'Urban Chic',
    category: 'Fashion',
    appMode: AppMode.Fashion,
    isRemixable: true,
    badge: 'Pro Style',
    remixParams: {
        fashionGender: FashionGender.Women,
        fashionShootType: FashionShootType.ModelShoot,
        fashionCategory: 'Western Wear',
        fashionSubCategory: 'Dresses',
        productDescription: 'A chic urban summer dress.',
        hyperRealism: true,
        aspectRatios: [AspectRatio.PortraitPost]
    }
  },
  {
    id: 'insp-ad-tech',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    title: 'Premium Audio Ad',
    category: 'Tech',
    appMode: AppMode.AdCreative,
    isRemixable: true,
    remixParams: {
        adLayout: AdLayout.TextLeftImageRight,
        adTitle: 'Sound Redefined.',
        adSubheading: 'Noise cancelling perfection.',
        adCta: 'Shop Now',
        backgroundStyle: 'Minimalist studio grey with soft lighting',
        productDescription: 'High-end wireless headphones.'
    }
  },
  {
    id: 'insp-influencer-coffee',
    imageUrl: 'https://images.unsplash.com/photo-1512314889357-e157c22f938d?auto=format&fit=crop&w=800&q=80',
    title: 'Morning Brew',
    category: 'Beverage',
    appMode: AppMode.Influencer,
    isRemixable: true,
    remixParams: {
        productCategory: ProductCategory.FoodAndBeverage,
        modelPersona: 'Lifestyle & Everyday',
        poseSuggestion: 'Holding product at chest level, looking at the camera',
        backgroundStyle: 'Cozy morning kitchen with sunlight',
        productDescription: 'Artisan coffee bag.',
    }
  },
  {
    id: 'insp-festival-diwali',
    imageUrl: 'https://images.unsplash.com/photo-1576487248805-cf45f6bcc67f?auto=format&fit=crop&w=800&q=80',
    title: 'Festive Glow',
    category: 'Festival',
    appMode: AppMode.Festival,
    isRemixable: true,
    badge: 'Seasonal',
    remixParams: {
        festivalStyle: 'Diwali Sparkle',
        aspectRatios: [AspectRatio.PortraitPost],
        productDescription: 'Gift hamper box.',
    }
  },
  {
    id: 'insp-skincare-nature',
    imageUrl: 'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=800&q=80',
    title: 'Organic Essence',
    category: 'Skincare',
    appMode: AppMode.Product,
    isRemixable: true,
    remixParams: {
        productCategory: ProductCategory.Skincare,
        productStylePreset: 'Natural & Organic|Green Harmony',
        aspectRatios: [AspectRatio.Square],
        productDescription: 'Essential oil bottle.',
    }
  },
  {
    id: 'insp-fashion-street',
    imageUrl: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=800&q=80',
    title: 'Streetwear Edits',
    category: 'Fashion',
    appMode: AppMode.Fashion,
    isRemixable: true,
    remixParams: {
        fashionGender: FashionGender.Men,
        fashionShootType: FashionShootType.ModelShoot,
        fashionCategory: 'Western Wear',
        fashionSubCategory: 'Jackets & Coats',
        regionalStyle: RegionalStyle.None,
        productDescription: 'Urban bomber jacket.',
    }
  },
  {
    id: 'insp-home-decor',
    imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=800&q=80',
    title: 'Modern Living',
    category: 'Home Decor',
    appMode: AppMode.Product,
    isRemixable: true,
    remixParams: {
        productCategory: ProductCategory.HomeDecor,
        productStylePreset: '✨ AI Suggested',
        backgroundStyle: 'Minimalist living room with soft daylight',
        aspectRatios: [AspectRatio.PortraitPost],
        productDescription: 'Modern accent chair.',
    }
  },
  {
    id: 'insp-remix-creative',
    imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=80',
    title: 'Neon Vibes',
    category: 'Creative',
    appMode: AppMode.Remix,
    isRemixable: true,
    remixParams: {
       productDescription: 'Add neon lighting effects and cyber-punk aesthetic.',
    }
  }
];
