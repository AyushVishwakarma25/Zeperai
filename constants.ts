
import { AspectRatio, ModelGender, StylePreset, SkinTone, ClothingType, AppMode, OutputFormat, AdLayout, ResolutionQuality, ProductCategory, MarketplacePreset, CaptionTone, FashionGender, ModelPersona, ProProductStyleCategory, GenerateImageParams, OutfitChoice } from './types';

export const AI_SUGGESTED = 'AI Suggested';
export const FREE_TRIAL_LIMIT = 8;

export const INITIAL_GENERATE_PARAMS: GenerateImageParams = {
  appMode: AppMode.Influencer,
  productDescription: '',
  aspectRatios: [AspectRatio.PortraitPost],
  outputFormat: OutputFormat.JPG,
  resolutionQuality: ResolutionQuality.Standard,
  selectedAngles: ['Front View'],
  productStylePreset: AI_SUGGESTED,
  productStylePresets: [],
  backdropAndProps: AI_SUGGESTED,
  textPlacementSuggestion: AI_SUGGESTED,
  overlayText: '',
  fontStyle: AI_SUGGESTED,
  isBold: false,
  isItalic: false,
  isUnderlined: false,
  productCategory: ProductCategory.Generic,
  modelGender: ModelGender.Female,
  modelPersona: AI_SUGGESTED,
  skinTone: SkinTone.Medium,
  clothingType: ClothingType.AISuggested,
  outfitChoice: OutfitChoice.AI,
  stylePreset: StylePreset.AISuggested,
  poseSuggestion: AI_SUGGESTED,
  backgroundStyle: AI_SUGGESTED,
  ugcStyle: '',
  adLayout: AdLayout.TextRightImageLeft,
  adTitle: '',
  adSubheading: '',
  adFeatures: '',
  adCta: '',
  adAvailability: '',
  remixReferenceImage: undefined,
  remixProductImage: undefined,
  modelSourceOption: 'new',
  isComparisonMode: false,
  productAFeatures: '',
  productBFeatures: '',
};

export const STORAGE_LIMITS: Record<string, number> = {
  'Free': 10,
  'Starter': 50,
  'Standard': 200,
  'Agency': 10000, // Effectively unlimited
};

export const UGC_STYLE_OPTIONS = [
    { value: 'Sun-Kissed Glow', label: 'Sun-Kissed Glow', prompt: 'A radiant Indian model with curly hair holding [product] near face. Warm, golden hour lighting against a clear blue sky. Fresh, summery vibe.' },
    { value: 'Neon Pop Art', label: 'Neon Pop Art', prompt: 'A stylish Indian model holding [product] close to camera. Vibrant neon background, bold makeup, studio lighting. High-fashion commercial look.' },
    { value: 'Dynamic Reach', label: 'Dynamic Reach', prompt: 'Low-angle shot of a trendy Indian model reaching towards the camera with [product]. Pink monochromatic room with checkered floor. Playful, wide-angle perspective.' },
    { value: 'Glamour Close-Up', label: 'Glamour Close-Up', prompt: 'Extreme close-up of an Indian model with bold lipstick holding [product] near lips. Luxurious styling with gold chain accessory. Dramatic ring lighting.' },
    { value: 'Morning Glow', label: 'Morning Glow', prompt: 'Natural light shot of an Indian model with a towel wrap on head, holding [product] up to sunlight. Fresh, no-makeup look, golden hour flare.' },
    { value: 'Mirror Ritual', label: 'Mirror Ritual', prompt: 'Indian model looking into a vanity mirror while applying/holding [product]. Reflection visible. Bathroom setting, clean white aesthetic.' },
];

export const FASHION_MODEL_LOCKS = {
  [FashionGender.Women]: [
    { id: 'W-Aria', name: 'Aria - Elegant Pro', desc: 'Sophisticated, classic model features' },
    { id: 'W-Zara', name: 'Zara - Modern Urban', desc: 'Edgy, contemporary street-style look' },
    { id: 'W-Diya', name: 'Diya - Ethnic Traditional', desc: 'Graceful features for Indian wear' },
  ],
  [FashionGender.Men]: [
    { id: 'M-Kabir', name: 'Kabir - Classic Indian', desc: 'Strong features for Sherwanis/Suits' },
    { id: 'M-Leo', name: 'Leo - Athletic Western', desc: 'Fit build for active/casual wear' },
  ],
  [FashionGender.Kids]: [
    { id: 'K-Noah', name: 'Noah - Playful Boy', desc: 'Cheerful and energetic' },
    { id: 'K-Mia', name: 'Mia - Sweet Girl', desc: 'Natural and charming' },
  ]
};

export const FASHION_CATEGORIES: Record<FashionGender, Record<string, string[]>> = {
  [FashionGender.Women]: {
    'Indian & Fusion Wear': ['Kurtas & Suits', 'Kurtis, Tunics & Tops', 'Sarees', 'Ethnic Wear Sets', 'Leggings, Salwars & Churidars', 'Skirts & Palazzos', 'Lehenga Cholis', 'Dupattas & Shawls', 'Jackets'],
    'Western Wear': ['Dresses', 'Tops', 'T-shirts', 'Jeans', 'Trousers & Capris', 'Shorts & Skirts', 'Co-ords', 'Playsuits', 'Jumpsuits', 'Shrugs', 'Sweaters & Sweatshirts', 'Jackets & Coats', 'Blazers & Waistcoats']
  },
  [FashionGender.Men]: {
    'Topwear': ['T-shirts', 'Casual Shirts', 'Formal Shirts', 'Sweatshirts', 'Sweaters', 'Jackets', 'Blazers & Coats', 'Suits', 'Rain Jackets'],
    'Indian & Festive Wear': ['Kurtas & Kurta Sets', 'Sherwanis', 'Nehru Jackets', 'Dhotis'],
    'Bottomwear': ['Jeans', 'Casual Trousers', 'Formal Trousers', 'Shorts', 'Track Pants & Joggers'],
    'Innerwear & Sleepwear': ['Briefs & Trunks', 'Boxers', 'Vests', 'Sleepwear & Loungewear', 'Thermals']
  },
  [FashionGender.Kids]: {
    'Boys’ Clothing': ['T-shirts', 'Shirts', 'Shorts', 'Jeans', 'Trousers', 'Clothing Sets', 'Ethnic Wear', 'Track Pants & Pyjamas', 'Jackets, Sweaters & Sweatshirts', 'Party Wear', 'Innerwear & Thermals', 'Nightwear & Loungewear', 'Value Packs'],
    'Girls’ Clothing': ['Dresses', 'Tops', 'T-shirts', 'Clothing Sets', 'Lehenga Cholis', 'Kurta Sets', 'Party Wear', 'Dungarees & Jumpsuits', 'Skirts & Shorts', 'Tights & Leggings', 'Jeans, Trousers & Capris', 'Jackets, Sweaters & Sweatshirts', 'Innerwear & Thermals', 'Nightwear & Loungewear']
  },
  [FashionGender.Unisex]: {
    'Casual Wear': ['T-shirts', 'Hoodies', 'Sweatshirts', 'Joggers', 'Caps', 'Beanies'],
    'Accessories': ['Scarf', 'Muffler', 'Socks', 'Gloves']
  }
};

export const MARKETPLACE_RULES: Record<MarketplacePreset, any> = {
  [MarketplacePreset.Amazon]: {
    aspectRatio: AspectRatio.Square,
    background: 'Pure White studio backdrop (RGB 255, 255, 255)',
    allowLifestyle: false,
    format: OutputFormat.JPG,
    hint: 'Strict 1:1. Product fills 85%. No text.'
  },
  [MarketplacePreset.Shopify]: {
    aspectRatio: AspectRatio.FashionShopify,
    background: 'Lifestyle or White',
    allowLifestyle: true,
    format: OutputFormat.PNG,
    hint: 'Flexible 2:3. Centered.'
  },
  [MarketplacePreset.Flipkart]: {
    aspectRatio: AspectRatio.Square,
    background: 'Pure White or Neutral Grey',
    allowLifestyle: false,
    format: OutputFormat.JPG,
    hint: 'Strict 1:1. No floating shadows.'
  },
  [MarketplacePreset.None]: {
    aspectRatio: AspectRatio.PortraitPost,
    background: 'Variable',
    allowLifestyle: true,
    format: OutputFormat.PNG,
    hint: 'Custom settings applied.'
  }
};

export const LOADING_MESSAGES: Record<string, { title: string[]; subtext: { low: string[]; mid: string[]; high: string[] } }> = {
  [AppMode.Product]: {
    title: ["Making the Product Look Expensive..."],
    subtext: {
      low: ["Calibrating the virtual studio..."],
      mid: ["Adjusting lights like a perfectionist..."],
      high: ["Adding the final high-end gloss..."],
    },
  },
  [AppMode.Influencer]: {
    title: [
      "Influencer Energy Loading...",
      "Making It Look Casually Perfect...",
      "Creator Vibes in Progress...",
      "That “Shot on iPhone” Feel...",
      "Not an Ad. Promise.",
    ],
    subtext: {
      low: ["Adding natural chaos (the good kind)..."],
      mid: ["Less studio, more real life...", "Polishing without overdoing it..."],
      high: ["Making it scroll-friendly...", "Authentic, but make it aesthetic..."],
    },
  },
  [AppMode.AdCreative]: { // Used for Banner and Youtube as well
    title: [
      "Cooking the Ad Creative...",
      "Making Scrolls Stop...",
      "Turning Views into Clicks...",
      "Performance Mode Activated...",
      "Building a Thumb-Stopping Visual...",
    ],
    subtext: {
      low: ["Balancing brand and drama..."],
      mid: ["Keeping it bold, not loud...", "Framing for conversions..."],
      high: ["Making sure the CTA pops...", "Designed to be noticed..."],
    },
  },
  // Fallback for other modes
  default: {
    title: ["Generating studio-quality photoshoot..."],
    subtext: {
      low: ["Warming up the AI models..."],
      mid: ["The AI is getting the lighting just right..."],
      high: ["Applying the finishing touches..."],
    },
  },
};

export const PRODUCT_CATEGORY_OPTIONS = [
  { label: 'Generic', value: ProductCategory.Generic },
  { label: 'Skincare', value: ProductCategory.Skincare },
  { label: 'Food & Bev', value: ProductCategory.FoodAndBeverage },
  { label: 'Perfume', value: ProductCategory.Perfume },
  { label: 'Herbal', value: ProductCategory.Herbal },
  { label: 'Tech', value: ProductCategory.Tech },
  { label: 'Fashion', value: ProductCategory.Fashion },
  { label: 'Home Decor', value: ProductCategory.HomeDecor },
  { label: 'Fitness', value: ProductCategory.Fitness },
];

export const FESTIVAL_STYLE_OPTIONS = [
    { label: 'Diwali Sparkle', value: 'Diwali theme with glowing diyas, fairy lights, and marigold flowers' },
    { label: 'Holi Colors', value: 'Vibrant explosion of colored powders, playful and energetic atmosphere' },
    { label: 'Eid Elegance', value: 'Elegant setting with crescent moons, lanterns, and rich fabrics' },
    { label: 'Christmas Wonder', value: 'Cozy Christmas scene with pine trees, ornaments, and soft warm light' },
    { label: 'Generic Festive', value: 'A general festive background with bokeh lights and celebratory elements' },
];

export const AD_LAYOUT_OPTIONS = [
  { value: AdLayout.TextRightImageLeft, label: 'Image Left', icon: 'layout-image-left' },
  { value: AdLayout.TextLeftImageRight, label: 'Image Right', icon: 'layout-image-right' },
  { value: AdLayout.TextTopBottomImageCenter, label: 'Image Center', icon: 'layout-image-center' },
  { value: AdLayout.ProductShowcase, label: 'Showcase', icon: 'layout-showcase' },
];

export const COMPARISON_LAYOUT_OPTIONS = [
  { value: AdLayout.ComparisonSplit, label: 'Split Layout', icon: 'layout-banner' },
  { value: AdLayout.ComparisonOverlay, label: 'Overlay Layout', icon: 'image' },
  { value: AdLayout.ComparisonTable, label: 'Table Layout', icon: 'board' },
];

export const OUTPUT_FORMAT_OPTIONS = [
  { label: 'JPEG', value: OutputFormat.JPG },
  { label: 'PNG', value: OutputFormat.PNG },
  { label: 'WEBP', value: OutputFormat.WEBP },
];

export const RESOLUTION_QUALITY_OPTIONS = [
  { label: 'Standard', value: ResolutionQuality.Standard },
  { label: 'High', value: ResolutionQuality.High },
];

export const ASPECT_RATIO_OPTIONS = [
  { value: AspectRatio.Portrait, label: 'Story', icon: 'aspect-portrait' }, 
  { value: AspectRatio.PortraitPost, label: 'Post', icon: 'aspect-portrait-post' }, 
  { value: AspectRatio.Square, label: 'Square', icon: 'aspect-square' }, 
  { value: AspectRatio.Landscape, label: 'Wide', icon: 'aspect-landscape' }, 
  { value: AspectRatio.FashionShopify, label: '2:3 (Fashion)', icon: 'aspect-portrait' },
];

export const ANGLE_OPTIONS = [
  { value: 'Front View', label: 'Front View' },
  { value: 'Back View', label: 'Back View' },
  { value: 'Side View', label: 'Side View' },
  { value: '45-Degree Angle', label: '45-Degree Angle' },
  { value: 'Top-Down (Flat Lay)', label: 'Top-Down' },
  { value: 'Lifestyle Shot', label: 'Lifestyle' },
];

export const MODEL_GENDER_OPTIONS = [
    { value: ModelGender.Female, label: 'Female', icon: 'gender-female' },
    { value: ModelGender.Male, label: 'Male', icon: 'gender-male' },
];

export const CUSTOM_PERSONA_TRIGGER = 'Custom Persona...';

export const MODEL_PERSONA_OPTIONS: Record<string, string[]> = {
  '✨ AI Suggested': [
    AI_SUGGESTED,
  ],
  'Lifestyle & Everyday': [
    'Minimalist Shopper',
    'Urban Professional',
    'College Student',
    'New Mom',
  ],
  'Wellness & Organic': [
    'Yoga Enthusiast',
    'Eco-Friendly Advocate',
    'Ayurveda/Herbal Believer',
    'Fitness Buff',
  ],
  'Fashion & Style': [
    'Streetwear Trendsetter',
    'Boho Chic',
    'Luxury Minimalist',
    'Festive Glam',
  ],
  'Cultural & Demographic': [
    'Indian Bride/Groom Look',
    'Western Casual',
    'Senior Citizen',
    'Teen Influencer',
  ],
  'Aspirational': [
    'Traveler/Explorer',
    'Entrepreneur/Leader',
    'Artist/Creative',
    'Health-Conscious Parent',
  ],
};

export const STYLE_PRESET_OPTIONS = Object.values(StylePreset);

export const SKIN_TONE_OPTIONS = [
    { value: SkinTone.Light, label: 'Light', color: '#fde3d1' },
    { value: SkinTone.Medium, label: 'Medium', color: '#d1a377' },
    { value: SkinTone.Deep, label: 'Deep', color: '#6a3f25' },
];

export const CLOTHING_TYPE_OPTIONS = [
    { value: ClothingType.AISuggested, label: 'AI Suggested', icon: 'logo' },
    { value: ClothingType.Traditional, label: 'Traditional', icon: 'clothing-traditional' },
    { value: ClothingType.Casual, label: 'Casual', icon: 'clothing-casual' },
    { value: ClothingType.Formal, label: 'Formal', icon: 'clothing-formal' },
];

export const CUSTOM_POSE_TRIGGER = 'Custom Pose...';

export const POSE_SUGGESTIONS: string[] = [
  AI_SUGGESTED,
  'Holding product at chest level, looking at the camera',
  'A casual lifestyle shot with the product naturally in the scene',
  'Unboxing or presenting the product enthusiastically',
  'Pointing towards the product with an excited expression',
  'A dynamic action pose, using the product',
  'Model wearing the product (e.g., clothing, jewelry)',
  'Close-up shot showing product details or application',
  'Happily interacting with or using the product',
  CUSTOM_POSE_TRIGGER,
];

export const ALL_BACKGROUND_OPTIONS: Record<ProductCategory, Record<string, string[]>> = {
  [ProductCategory.Generic]: {
    '✨ AI Suggested': [AI_SUGGESTED],
    'Minimal & Clean': [
      'Solid white, grey, or black backdrop',
      'Matte pastel tones (beige, blush pink, sage green)',
      'Gradient background (soft light-to-dark transition)',
      'Light wooden tabletop with white/cream wall',
    ],
    'Lifestyle & Real-Life Settings': [
      'Living room setup (cozy vibe with cushions, books, candles)',
      'Office desk (for tech/stationery products)',
      'Outdoor café table (for lifestyle brands)',
    ],
    'Trendy & Creative': [
      'Abstract shapes & color blocks',
      'Mirror reflections (modern & stylish)',
      'Transparent acrylic stands with shadows',
    ],
    'Seasonal Themes': [
      'Festive (lights, sparkles, candles, ribbons)',
      'Summer (beach sand, shells, sunny tones)',
      'Autumn (brown leaves, cozy fabrics, warm tones)',
      'Winter (snow texture, frosted glass, pine leaves)',
    ],
  },
  [ProductCategory.Skincare]: {
    '✨ AI Suggested': [AI_SUGGESTED],
    'Beauty, Skincare & Haircare': [
      'Mirror Glow Look — Model in towel wrap, glowing skin, mirror reflection visible, product beside.',
      'Hair Flip Freeze — Female model mid-motion with wind effect, product beside or held in hand.',
      'Serum Drop Macro with Model — Close-up of model’s cheek with serum being applied.',
      'Natural Vanity Setup — Minimalist dressing table, Indian influencer smiling with skincare range.',
      'Bathroom vanity (for skincare/beauty)',
    ],
    'Minimal & Clean': [
      'Solid white, grey, or black backdrop',
      'Matte pastel tones (beige, blush pink, sage green)',
      'Gradient background (soft light-to-dark transition)',
    ],
    'Nature Inspired': [
      'Marble slab with scattered herbs/flowers',
      'Sandy or stone-textured surface',
      'Green leaves / tropical foliage backdrop',
    ],
  },
  [ProductCategory.FoodAndBeverage]: {
    '✨ AI Suggested': [AI_SUGGESTED],
    'Food & Beverage': [
      'Desi Café Vibe — Model sipping beverage with blurred Indian café interior.',
      'Chai Stall Elegance — Female influencer with cup of tea, rain-soaked background.',
      'Home Chef Scene — Apron-wearing model cooking, showcasing spice or oil brand.',
      'Festive Thali Layout — Overhead shot of Indian thali with product beside (masala, atta, ghee, etc.).',
      'Cold Drink Burst — Freeze-frame splash shot with model reacting joyfully.',
    ],
    'Lifestyle & Real-Life Settings': [
      'Kitchen counter (for food/drinks/health products)',
      'Outdoor café table (for lifestyle brands)',
    ],
    'Nature Inspired': [
      'Rustic wooden planks',
      'Marble slab with scattered herbs/flowers',
    ],
  },
  [ProductCategory.Perfume]: {
    '✨ AI Suggested': [AI_SUGGESTED],
    'Cinematic & Luxury': [
      'Slow Smoke Glam Shot — Perfume bottle + model silhouette with glowing rim light.',
      'Glass Prism Illusion — Model and product refracted through glass or water lens.',
      'Desi Futuristic Scene — Indian model in minimalist metallic outfit, abstract CGI background.',
      'Luxury Saree Draping — Mid-motion drape flow, jewelry and soft spotlight.',
    ],
    'Minimal & Clean': [
      'Solid white, grey, or black backdrop',
      'Gradient background (soft light-to-dark transition)',
      'Mirror reflections (modern & stylish)',
    ],
  },
  [ProductCategory.Herbal]: {
    '✨ AI Suggested': [AI_SUGGESTED],
    'Ayurvedic / Herbal / Organic': [
      'Forest Glow Scene — Model wearing light green kurta, surrounded by ferns and sunlight streaks, holding herbal bottle.',
      'Tulsi Tabletop Vibe — Overhead shot with hands arranging herbs, spices, and product on wooden surface.',
      'Morning Chai Glow — Male model in plain kurta pouring tea, brand logo on side.',
      'Earth Essence Scene — Female model applying skincare made from clay, muted brown backdrop.',
      'Coconut Breeze Aesthetic — Kerala vibe setup — white saree with green border, coconut leaves, and beach-like soft light.',
    ],
    'Nature Inspired': [
      'Green leaves / tropical foliage backdrop',
      'Rustic wooden planks',
      'Marble slab with scattered herbs/flowers',
      'Natural daylight with blurred garden background',
    ],
  },
  [ProductCategory.Tech]: {
    '✨ AI Suggested': [AI_SUGGESTED],
    'Professional & Tech': [
      'Tech Reviewer Desk — Indian male influencer with tech gadgets and product on table.',
      'Office desk (for tech/stationery products)',
      'Urban Millennial Setup — Indian influencer in casual crop top & denim with plain pastel backdrop, holding D2C gadget or drink.',
      'Tech-Driven Minimalism — Neutral gray background, model in smart casuals using product with clean gesture.',
    ],
    'Trendy & Creative': [
      'Neon gradient backdrop (purple/blue, pink/orange)',
      'Abstract shapes & color blocks',
      'Floating in mid-air (using editing/AI)',
    ],
  },
  [ProductCategory.Fashion]: {
    '✨ AI Suggested': [AI_SUGGESTED],
    'Fashion & Lifestyle': [
      'Indie Fashion Mood — Model in handloom outfit, terracotta backdrop, jewelry details.',
      'Urban Fusion Look — Western top with Indian dupatta accent, product as accessory.',
      'Mirror Selfie Scene — Influencer clicking mirror shot, brand logo subtly in frame.',
      'Streetstyle India — Model in casual outfit, auto-rickshaw backdrop.',
      'Luxury Saree Draping — Mid-motion drape flow, jewelry and soft spotlight.',
    ],
    'Regional Indian Themes': [
      'South Indian Temple Vibe — Kanjivaram saree, jasmine flowers, gold-toned light.',
      'Punjabi Harvest Mood — Fields or tractor backdrop, food/snack brand in focus.',
      'Gujarati Festive Look — Mirror-work choli, vibrant backdrop.',
      'Bengali Durga Mood — Red-white saree, artistic frame composition.',
      'Goan Beach Lifestyle — Casual wear, coconut drink, bright daylight.',
    ],
  },
  [ProductCategory.HomeDecor]: {
    '✨ AI Suggested': [AI_SUGGESTED],
    'Lifestyle & Real-Life Settings': [
      'Living room setup (cozy vibe with cushions, books, candles)',
      'Bedroom setting with soft lighting',
      'On a stylish bookshelf with decorative items',
    ],
    'Minimal & Clean': [
      'Light wooden tabletop with white/cream wall',
      'Matte pastel tones (beige, blush pink, sage green)',
      'Solid white, grey, or black backdrop',
    ],
  },
  [ProductCategory.Fitness]: {
    '✨ AI Suggested': [AI_SUGGESTED],
    'Health, Nutrition & Fitness': [
      'Morning Yoga Window Light — Model in yoga wear, sitting cross-legged with product beside (protein or supplement).',
      'Running Energy Shot — Motion blur behind model holding drink or snack.',
      'Home Gym Setup — Urban fitness influencer with dumbbells, minimal backdrop.',
      'Healthy Kitchen Scene — Influencer prepping smoothie, smiling toward camera.',
    ],
    'Minimal & Clean': [
      'Solid white, grey, or black backdrop',
      'Gradient background (soft light-to-dark transition)',
    ],
  },
};

export const PRO_PRODUCT_STYLE_PRESETS: ProProductStyleCategory[] = [
  {
    "category": "Drinks & Beverages",
    "presets": [
      { "name": "Citrus Pop", "prompt": "A [product] placed on a white block with sliced citrus and ice cubes, fresh condensation, vibrant gradient background, bright studio lighting.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/design-citrus-pop.webp" },
      { "name": "Tropical Splash", "prompt": "A [product] surrounded by floating fruits and water splashes, dynamic motion freeze, colorful gradient backdrop, high contrast lighting.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/design-tropical-splash.webp" },
      { "name": "Minimal Refresh", "prompt": "A single [product] on a clean pedestal with subtle droplets, soft shadows, and a pastel gradient background.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/design-minimal-refresh.webp" },
      { "name": "Flavor Burst", "prompt": "A [product] surrounded by its core ingredients in mid-air, sharp detail, vivid background, strong directional lighting.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/design-flavor-burst.webp" },
      { "name": "Summer Glow", "prompt": "A [product] bottle shot on reflective surface with fresh fruits around, warm sunlight tone, minimal props.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/design-summer-glow.webp" },
      { "name": "Cool Lift", "prompt": "A levitating [product] with floating ice and vapor mist, clean blue or mint background, cinematic depth and clarity.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/design-cool-lift.webp" },
      { "name": "Vibrant Ingredient Pile", "prompt": "A professional studio shot of the [product] placed centrally on a generous, artful pile of its fresh, whole and sliced ingredients. The background is a clean, vibrant, single-color or soft gradient that matches the product's color palette. The lighting is bright and clean, making the product and ingredients look fresh and appealing, with subtle condensation on the bottle. The overall style is commercial, vibrant, and appetizing.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/design-vibrant-ingredient-pile.webp" },
      { "name": "Vibrant Geo-Steps", "prompt": "A dynamic commercial composition featuring multiple units of [product] arranged on colorful geometric stepped blocks (yellow, pink, lavender). The products are placed at different heights and angles on the steps to create a playful, stacked arrangement. The background is a solid, vibrant blue. Hard sunlight-style lighting creates sharp, defined shadows for a pop-art aesthetic. High-contrast, multipurpose advertising photography.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/design-vibrant-geo-steps.webp" },
      { "name": "Human Connection Stack", "prompt": "A creative composition of three hands with diverse skin tones holding [product], stacked vertically against a plain, light neutral background. Soft, natural studio lighting highlighting the packaging details. Minimalist and modern.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/design-two-hands-holding-product.webp" }
    ]
  },
  {
    "category": "Skincare & Beauty",
    "presets": [
      { "name": "Soft Glow", "prompt": "A [product] tube on pastel background with subtle shadows, minimalist props like petals or leaves, smooth editorial lighting.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Skincare/design-soft-glow.webp" },
      { "name": "Hand Reveal", "prompt": "A hand emerging through a colored paper background holding a [product], bold color contrast, high-end studio lighting.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Skincare/design-hand-reveal.webp" },
      { "name": "Natural Essence", "prompt": "A [product] bottle placed among stones and green leaves, soft daylight tone, spa-inspired composition.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Skincare/design-natural-essence.webp" },
      { "name": "Stone Elegance", "prompt": "A [product] on textured stone block with moody warm lighting and shadow play, premium product photography style.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Skincare/design-stone-elegance.webp" },
      { "name": "Clean Balance", "prompt": "A [product] bottle surrounded by clean ingredients like aloe, cucumber, or citrus, white background, minimalistic setup.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Skincare/design-clean-balance.webp" },
      { "name": "Luxe Mirror", "prompt": "A [product] placed on a reflective mirrored base, subtle gradients in background, glossy reflections, editorial feel.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Skincare/design-luxe-mirror.webp" },
      { "name": "Bold Sunlight Shadow", "prompt": "A minimalist product shot of [product] against a solid, vibrant background. A single, hard light source from the side or top creates a sharp, dramatic shadow, mimicking direct sunlight. The composition is clean, modern, and highlights the product's shape and color.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Skincare/design-bold-sunlight-shadow.webp" }
    ]
  },
  {
    "category": "Snacks & Packaged Foods",
    "presets": [
      { "name": "Snack Tower", "prompt": "Multiple [product] packs stacked neatly on white pedestals, colorful gradient background, vibrant studio lighting.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-snack-tower.webp" },
      { "name": "Flavor Flight", "prompt": "Hands holding [product] packs against bright sky or gradient background, fun, bold, lifestyle-inspired composition.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-flavor-flight.webp" },
      { "name": "Crunch Moment", "prompt": "A [product] packet bursting open mid-air with ingredients or crumbs flying, bold colored backdrop, freeze-frame action.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-crunch-moment.webp" },
      { "name": "Healthy Indulgence", "prompt": "A [product] on beige fabric or wood, surrounded by its key ingredients (e.g. oats, nuts, chocolate chunks), soft warm lighting.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-healthy-indulgence.webp" },
      { "name": "Pop Shot", "prompt": "A single [product] packet surrounded by floating ingredients that represent its flavor, clean pastel background.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-pop-shot.webp" },
      { "name": "Vibrant Shelf", "prompt": "Rows of [product] displayed symmetrically on white cubes, bold lighting, contrasting shadows, magazine aesthetic.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-vibrant-shelf.webp" },
      { "name": "Dramatic Podium Shot", "prompt": "A dramatic, moody shot of the [product] centered on a dark, textured stone or wood podium. The background is dark and out of focus, with a single spotlight illuminating the product. Crumbs or small pieces of the product are scattered artfully on the podium. Cinematic, high-contrast lighting with sharp focus on the packaging.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-dramatic-podium-shot.webp" },
      { "name": "Modern E-comm Showcase", "prompt": "A clean, minimalist studio shot of the [product]. The product is placed on a reflective surface, creating a soft mirror image below. The background is a smooth, simple gradient using brand-cohesive colors. The lighting is bright, even, and professional, ideal for online stores and marketing materials.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-modern-e-comm-showcase.webp" },
      { "name": "Hands-On Flat Lay", "prompt": "A clean, top-down flat lay composition on a bold, solid-colored background. Two hands are in the frame, presenting both the [product] packaging and the product in use (e.g., in a bowl). The lighting is bright and even, creating a modern, graphic, and engaging look ideal for social media.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-hands-on-flat-lay.webp" },
      { "name": "Vibrant Breakfast Scene", "prompt": "A vibrant, energetic lifestyle shot of [product] as part of a breakfast scene. Includes a bowl of the product, a glass of milk, and other relevant props. The shot can be from a top-down or a dynamic three-quarter angle, possibly featuring a hand interacting with the scene (e.g., holding a spoon, pouring milk). The background is a bright, solid color and the lighting is hard, creating crisp shadows for a playful, modern feel.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-vibrant-breakfast-scene.webp" },
      { "name": "Quickcommerce Style", "prompt": "A professional studio shot of the [product] placed centrally in a scene with its key ingredients and final form (e.g., brownies, a prepared dish) artfully scattered around it. The background is a clean, warm, soft-focus gradient that complements the product's colors. The lighting is dramatic yet soft, creating an appetizing and high-quality commercial look. Include dynamic elements like small splashes or floating ingredients for a vibrant, premium feel.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-quickcommerce-style.webp" },
      { "name": "Blinkit Style 2", "prompt": "Studio shot of a standing [product] on a sky or smooth gradient background, with a soft spotlight from the corners and subtle shadows. Add realistic water droplets on the packaging if appropriate for the product. Surround the [product] with its key ingredients, artfully arranged in a rich food styling composition. Premium commercial photography style with crisp details and a shallow depth of field. Do not add any other elements. The [product] should be the main focus, filling approximately 85% of the frame.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-blinkit-style-2.webp" },
      { "name": "Color Block Pop", "prompt": "Three [product] items displayed against a vibrant background featuring bold diagonal color blocks (purple, red, blue). Hard directional lighting creates long, dramatic shadows. Graphic, high-contrast pop-art aesthetic.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-color-block-pop.webp" }
    ]
  },
  {
    "category": "Perfume & Luxury",
    "presets": [
      { "name": "Mirror Elegance", "prompt": "A [product] placed on a reflective surface with moody background gradient, soft light highlights, luxury aesthetic." },
      { "name": "Water Grace", "prompt": "A [product] bottle half-submerged in calm water with ripples and reflections, golden light glow." },
      { "name": "Silk Touch", "prompt": "A [product] placed on smooth flowing fabric folds, soft diffused lighting, gentle highlights." },
      { "name": "Amber Night", "prompt": "A [product] bottle on marble or glass with warm amber light and cinematic shadows, elegant composition." },
      { "name": "Minimal Luxury", "prompt": "A single [product] centered in frame on matte background with sharp top light, premium editorial style." },
      { "name": "Botanical Aura", "prompt": "A [product] surrounded by delicate petals or herbs, soft daylight and depth blur, high-end fragrance style." }
    ]
  },
  {
    "category": "Health, Supplements & Nutrition",
    "presets": [
      { "name": "Vital Boost", "prompt": "A [product] jar on pedestal surrounded by fruits and supplement capsules, bright gradient background, modern lighting." },
      { "name": "Energy Lineup", "prompt": "Multiple [product] bottles aligned symmetrically on white cubes, colorful background, dynamic contrast." },
      { "name": "Natural Power", "prompt": "A [product] bottle with herbs and raw ingredients, neutral organic background, sunlight-inspired lighting." },
      { "name": "Wellness Minimal", "prompt": "A single [product] on pastel backdrop with clean typography style shadows, calm and fresh tone." },
      { "name": "Active Pulse", "prompt": "A [product] captured mid-air with floating ingredients, strong lighting, sports-nutrition vibe." },
      { "name": "Balanced Life", "prompt": "A [product] placed with a glass of water and sliced fruit, clean white or mint background, natural fresh look." }
    ]
  },
  {
    "category": "Natural & Organic",
    "presets": [
      { "name": "Green Harmony", "prompt": "A [product] surrounded by leaves, stones, and wood, soft sunlight tone, eco-organic aesthetic." },
      { "name": "Pure Nature", "prompt": "A [product] placed among natural textures like linen, clay, and herbs, beige tone background." },
      { "name": "Rustic Calm", "prompt": "A [product] jar or bottle on wood or stone with blurred natural background, earthy colors, ambient light." },
      { "name": "Eco Luxe", "prompt": "A [product] with minimalist label, on recycled paper or bamboo base, clean sustainable look." },
      { "name": "Botanic Focus", "prompt": "A close-up of [product] with macro details of surrounding leaves and drops, fresh daylight lighting." },
      { "name": "Nature Flow", "prompt": "A [product] placed beside flowing fabric or natural water texture, calm soft tone, realistic daylight." }
    ]
  },
  {
    "category": "Creative & Dynamic",
    "presets": [
      { "name": "Cinematic Float", "prompt": "A highly detailed, cinematic product photo of the [product] placed on a stylish surface with floating product elements around it, professional studio lighting, and shallow depth of field. The background should match the brand color palette and create a sense of motion and freshness. Add realistic textures, natural shadows, and a soft glow around the main product. The packaging should look premium, clean, and sharp with focus on brand logo and typography. Style inspired by commercial food photography and high-end product ads." },
      { "name": "Bold Geometry", "prompt": "A [product] shot with direct, hard lighting to create strong, defined shadows. The background is composed of bold, geometric blocks of solid color. Minimal, relevant props are arranged artistically. Modern, editorial feel." },
      { "name": "Ingredient Explosion", "prompt": "A dynamic shot of the [product] floating centrally, with its core ingredients (like nuts, berries, or chocolate chunks) exploding outwards from around it in a frozen motion effect. Set against a vibrant, clean, single-color or gradient background with professional studio lighting." },
      { "name": "Artistic Spill", "prompt": "A top-down flat lay shot where the [product] packet is open, and its contents are spilling out artfully onto a clean, textured surface. The composition is clean and visually appealing, with a focus on the texture of the product. The background should be a solid, contrasting color." },
      { "name": "Hand Reveal", "prompt": "A creative studio shot where a hand holds the [product] against a bold, solid-colored background. For a dynamic effect, the hand can emerge from a tear or hole in a paper backdrop. Lighting is clean and focused on the product." },
      { "name": "Dynamic Splash", "prompt": "A high-speed photograph capturing the [product] (if a liquid) or its ingredients splashing into water or milk. The motion is frozen, with droplets and ripples clearly visible. The background is clean and simple to emphasize the action." },
      { "name": "Textured Minimalism", "prompt": "A top-down flat lay of the [product] on a highly textured surface like rough stone, dark slate, or wrinkled linen. The composition is minimal, with natural, directional lighting creating deep shadows that emphasize texture." }
    ]
  }
];

export const CAPTION_TONE_OPTIONS = Object.values(CaptionTone);
export const CAPTION_LENGTH_OPTIONS = [
    { label: 'Short', value: 'Short' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Long', value: 'Long' },
];
export const CAPTION_PLATFORM_OPTIONS = [
    { label: 'Instagram', value: 'Instagram' },
    { label: 'YouTube', value: 'YouTube' },
    { label: 'TikTok', value: 'TikTok' },
    { label: 'Ad Copy', value: 'Ad Copy' },
];
export const CAPTION_LANGUAGE_OPTIONS = [
    { label: 'English', value: 'English' },
    { label: 'Hindi', value: 'Hindi' },
    { label: 'Hinglish', value: 'Hinglish' },
];

export const FESTIVAL_PRESETS: ProProductStyleCategory[] = [
  {
    category: "🪔 Diwali (Festival of Lights)",
    presets: [
      {
        name: "Golden Diya Glow",
        prompt: "A warm, festive Diwali composition. The [product] is center stage, illuminated by the soft, golden glow of clay diyas (oil lamps). Marigold flower petals are scattered artistically on a rich wooden or velvet surface. Background features out-of-focus fairy lights (bokeh) creating a magical atmosphere."
      },
      {
        name: "Royal Card Party",
        prompt: "A luxurious Diwali party setting. The [product] is placed on a silk tablecloth alongside vintage playing cards, poker chips, and brass serving bowls with dry fruits. Moody, dramatic lighting with gold accents to evoke wealth and celebration."
      },
      {
        name: "Traditional Rangoli",
        prompt: "Top-down or high-angle shot of the [product] placed near a colorful, intricate Rangoli design on the floor. Surrounded by flower garlands and traditional brass lamps. Bright, daylight lighting to highlight the vibrant colors."
      },
      {
        name: "Mythological Art Style",
        prompt: "A creative, illustrated-style background inspired by Indian truck art or traditional miniature paintings (like Ramayana scenes). The [product] is integrated into this colorful, quirky, and culturally rich tableau."
      }
    ]
  },
  {
    category: "🎨 Holi (Festival of Colors)",
    presets: [
      {
        name: "Vibrant Gulal Explosion",
        prompt: "A high-energy action shot. The [product] is surrounded by exploding clouds of pink, yellow, and blue herbal powder (gulal). The lighting is bright and crisp to freeze the motion. The vibe is energetic, messy, and joyful."
      },
      {
        name: "Elegant White & Pastel",
        prompt: "A clean, minimalist Holi theme. The [product] is placed on a pristine white surface, with delicate splashes of pastel-colored gulal and a few fresh white flowers (like jasmine or tuberose). Soft, airy lighting. The focus is on subtle color and sophistication."
      }
    ]
  }
];

export const AD_STYLE_PRESETS = [
  { value: '✨ AI Suggested', label: '✨ AI Suggested', prompt: 'Visually striking, professional graphic design.' },
  { value: 'Minimalist', label: 'Minimalist', prompt: 'Clean, ample whitespace, modern typography, focus on product.' },
  { value: 'Bold & Loud', label: 'Bold & Loud', prompt: 'High contrast, large typography, vibrant colors, energetic vibe.' },
  { value: 'Luxury', label: 'Luxury', prompt: 'Elegant fonts, gold/silver accents, dark or premium textures, sophisticated.' },
  { value: 'Playful', label: 'Playful', prompt: 'Bright colors, fun shapes, rounded fonts, energetic and friendly.' }
];
