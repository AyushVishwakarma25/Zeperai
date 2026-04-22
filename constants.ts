
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
  fashionPose: [],
  festivalStylePresets: [],
  applyBrandIdentity: true,
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

export const FASHION_POSE_OPTIONS = [
    'Full length front view hero shot, standing confidently looking at camera',
    'Mid-shot (thigh-high) 45-degree angle, one hand on waist, sophisticated expression',
    'Close-up portrait showing garment neckline and jewelry detail',
    'Full length side profile, showcasing the silhouette and fit',
    'Full length back view, looking slightly over the shoulder',
    'Detailed close-up on fabric texture and embroidery',
    'Sitting elegantly on a minimal stool, showcasing drape',
    'Walking motion shot, capturing natural movement of the fabric',
    'High-angle creative shot looking down at the model',
    'Low-angle hero shot for dramatic flair and height',
    'Natural candid smile, lifestyle vibe',
    'Adjusting garment (pallu or sleeve) naturally'
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
  { label: 'Jewellery', value: ProductCategory.Jewellery },
];

export const FESTIVAL_STYLE_OPTIONS = [
    { label: 'Diwali Sparkle', value: 'Diwali theme with glowing diyas, fairy lights, and marigold flowers' },
    { label: 'Holi Colors', value: 'Vibrant explosion of colored powders, playful and energetic atmosphere' },
    { label: 'Eid Elegance', value: 'Elegant setting with crescent moons, lanterns, and rich fabrics' },
    { label: 'Christmas Wonder', value: 'Cozy Christmas scene with pine trees, ornaments, and soft warm light' },
    { label: 'Generic Festive', value: 'A general festive background with bokeh lights and celebratory elements' },
];

export const AD_LAYOUT_OPTIONS = [
  { 
      value: AdLayout.TextRightImageLeft, 
      label: 'Image Left', 
      icon: 'layout-image-left',
      thumbnail: 'https://placehold.co/400x500/F1F5F9/334155?text=IMG+LEFT%0A+%0AText+Right'
  },
  { 
      value: AdLayout.TextLeftImageRight, 
      label: 'Image Right', 
      icon: 'layout-image-right',
      thumbnail: 'https://placehold.co/400x500/F1F5F9/334155?text=Text+Left%0A+%0AIMG+RIGHT'
  },
  { 
      value: AdLayout.TextTopBottomImageCenter, 
      label: 'Image Center', 
      icon: 'layout-image-center',
      thumbnail: 'https://placehold.co/400x500/F1F5F9/334155?text=Headline%0A+%0AIMG+CENTER%0A+%0ACTA'
  },
  { 
      value: AdLayout.ProductShowcase, 
      label: 'Showcase', 
      icon: 'layout-showcase',
      thumbnail: 'https://placehold.co/400x500/F1F5F9/334155?text=PRODUCT%0AFOCUS%0A(Minimal+Text)'
  },
];

export const COMPARISON_LAYOUT_OPTIONS = [
  { 
      value: AdLayout.ComparisonSplit, 
      label: 'Split Layout', 
      icon: 'layout-banner',
      thumbnail: 'https://placehold.co/400x500/F1F5F9/334155?text=US+vs+THEM%0A(Split+Screen)'
  },
  { 
      value: AdLayout.ComparisonOverlay, 
      label: 'Overlay Layout', 
      icon: 'image',
      thumbnail: 'https://placehold.co/400x500/F1F5F9/334155?text=Product%0A+%0AOverlay+Stats'
  },
  { 
      value: AdLayout.ComparisonTable, 
      label: 'Table Layout', 
      icon: 'board',
      thumbnail: 'https://placehold.co/400x500/F1F5F9/334155?text=Feature%0AChecklist%0ATable'
  },
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
  [ProductCategory.Jewellery]: {
    '✨ AI Suggested': [AI_SUGGESTED],
    'Luxury & Studio': [
      'White geometric pedestal with soft shadows',
      'Dark velvet bust (black, navy, or emerald)',
      'Luxury jewellery box (open, velvet interior)',
      'Reflective mirror surface with bokeh lights',
    ],
    'Lifestyle & Human': [
      'Hand model wearing rings/bracelets',
      'Close-up of neck/ears for necklaces/earrings',
      'Elegant lifestyle setting (vanity table, silk fabric)',
    ],
    'Cinematic & Moody': [
      'Dark textured background with dramatic spotlight',
      'Floating in a void with particle effects',
      'Macro shot with extreme shallow depth of field',
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
      { "name": "Hero Box Reach", "prompt": "A high-energy commercial photoshoot for [product]. A human arm reaches upwards from a branded brown cardboard box that is overflowing with many units of [product]. The person is holding one [product] aloft against a bold, solid red background. The foreground surface is a clean white square-tiled surface with red grout lines. Sharp studio lighting with energetic composition and vibrant colors.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-hero-box-reach.webp" },
      { "name": "Artisanal Tile Setup", "prompt": "Appetizing professional photography of [product]. Multiple units of [product] are standing upright on a smooth white stone countertop. In front of the packs, the actual loose snack pieces are artfully displayed in small minimalist terracotta and stone ceramic dishes. The background is a vibrant yellow square-tiled wall with a floating rustic wooden shelf. The shelf holds dark green ceramic jars and a lush leafy indoor plant. Bright, clean natural lighting with soft side-shadows for a fresh, premium look.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-artisanal-tile-setup.webp" },
      { "name": "Pop Color Spread", "prompt": "A modern graphic commercial spread of [product] packages against a high-contrast two-tone background consisting of a magenta-pink wall and a bright red floor. One unit of [product] stands upright while others lie artfully at angles. The scene is decorated with scattered ingredients relevant to the [product]'s flavor and small white porcelain bowls containing the product. Sharp editorial lighting with hard shadows creating a graphic and trendy aesthetic.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-pop-color-spread.webp" },
      { "name": "Dynamic Bundle Showcase", "prompt": "A professional studio group shot of the provided products arranged as a premium bundle. A central anchor element (like a box or main package) is positioned in the lower-ground. The other items are arranged artfully around it few lie on surface: place one on top of the central element, lean others against the base, and place flat items in the foreground. Soft, diffused studio lighting from the upper right. Background: A studio soft pastle, or brand colors). High-end commercial photography style, eye-level, sharp focus.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-pop-shot.webp" },
      { "name": "Healthy Indulgence", "prompt": "A [product] on beige fabric or wood, surrounded by its key ingredients (e.g. oats, nuts, chocolate chunks), soft warm lighting.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-healthy-indulgence.webp" },
      { "name": "Pop Shot", "prompt": "A single [product] packet surrounded by floating ingredients that represent its flavor, clean pastel background.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-pop-shot.webp" },
      { "name": "Vibrant Shelf", "prompt": "Rows of [product] displayed symmetrically on white cubes, bold lighting, contrasting shadows, magazine aesthetic.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-vibrant-shelf.webp" },
      { "name": "Dramatic Podium Shot", "prompt": "A dramatic, moody shot of the [product] centered on a dark, textured stone or wood podium. The background is dark and out of focus, with a single spotlight illuminating the product. Crumbs or small pieces of the product are scattered artfully on the podium. Cinematic, high-contrast lighting with sharp focus on the packaging.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-dramatic-podium-shot.webp" },
      { "name": "Modern E-comm Showcase", "prompt": "A clean, minimalist studio shot of the [product]. The product is placed on a reflective surface, creating a soft mirror image below. The background is a smooth, simple gradient using brand-cohesive colors. The lighting is bright, even, and professional, ideal for online stores and marketing materials.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-modern-e-comm-showcase.webp" },
      { "name": "Hands-On Flat Lay", "prompt": "A clean, top-down flat lay composition on a bold, solid-colored background. Two hands are in the frame, presenting both the [product] packaging and the product in use (e.g., in a bowl). The lighting is bright and even, creating a modern, graphic, and engaging look ideal for social media.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-hands-on-flat-lay.webp" },
      { "name": "Vibrant Breakfast Scene", "prompt": "A vibrant, energetic lifestyle shot of [product] as part of a breakfast scene. Includes a bowl of the product, a glass of milk, and other relevant props. The shot can be from a top-down or a dynamic three-quarter angle, possibly featuring a hand interacting with the scene (e.g., holding a spoon, pouring milk). The background is a bright, solid color and the lighting is hard, creating crisp shadows for a playful, modern feel.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-vibrant-breakfast-scene.webp" },
      { "name": "Quickcommerce Style", "prompt": "A professional studio shot of the [product] placed centrally in a scene with its key ingredients and final form (e.g., brownies, a prepared dish) artfully scattered around it. The background is a clean, warm, soft-focus gradient that complements the product's colors. The lighting is dramatic yet soft, creating an appetizing and high-quality commercial look. Include dynamic elements like small splashes or floating ingredients for a vibrant, premium feel.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-quickcommerce-style.webp" },
      { "name": "Blinkit Style 2", "prompt": "Studio shot of a standing [product] on a sky or smooth gradient background, with a soft spotlight from the corners and subtle shadows. Add realistic water droplets on the packaging if appropriate for the product. Surround the [product] with its key ingredients, artfully arranged in a rich food styling composition. Premium commercial photography style with crisp details and a shallow depth of field. Do not add any other elements. The [product] should be the main focus, filling approximately 85% of the frame.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-blinkit-style-2.webp" },
      { "name": "Color Block Pop", "prompt": "Three [product] items displayed against a vibrant background featuring bold diagonal color blocks (purple, red, blue). Hard directional lighting creates long, dramatic shadows. Graphic, high-contrast pop-art aesthetic.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-color-block-pop.webp" },
      { "name": "Hero Product", "prompt": "A stunning 'Hero Product' composition of [product]. The background is a solid, vibrant color that dynamically matches the product's primary branding color for a seamless, monochromatic look. The product stands boldly in the center. In the background, a bowl or artful arrangement of the product's key ingredients (e.g., grains, fruits, nuts, spices) is displayed to showcase flavor and quality. The lighting is soft yet defining, highlighting the texture of the packaging and the freshness of the ingredients. High-end commercial aesthetic.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-vibrant-breakfast-scene.webp" }
    ]
  },
  {
    "category": "Perfume & Luxury",
    "presets": [
      { "name": "Mirror Elegance", "prompt": "A [product] placed on a reflective surface with moody background gradient, soft light highlights, luxury aesthetic.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/design-luxe-mirror.webp" },
      { "name": "Water Grace", "prompt": "A [product] bottle half-submerged in calm water with ripples and reflections, golden light glow.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/design-tropical-splash.webp" },
      { "name": "Silk Touch", "prompt": "A [product] placed on smooth flowing fabric folds, soft diffused lighting, gentle highlights.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Skincare/design-soft-glow.webp" },
      { "name": "Amber Night", "prompt": "A [product] bottle on marble or glass with warm amber light and cinematic shadows, elegant composition.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Skincare/design-stone-elegance.webp" },
      { "name": "Minimal Luxury", "prompt": "A single [product] centered in frame on matte background with sharp top light, premium editorial style.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/design-minimal-refresh.webp" },
      { "name": "Botanical Aura", "prompt": "A [product] surrounded by delicate petals or herbs, soft daylight and depth blur, high-end fragrance style.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Skincare/design-natural-essence.webp" }
    ]
  },
  {
    "category": "Health, Supplements & Nutrition",
    "presets": [
      { "name": "Vital Boost", "prompt": "A [product] jar on pedestal surrounded by fruits and supplement capsules, bright gradient background, modern lighting.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/design-vibrant-geo-steps.webp" },
      { "name": "Energy Lineup", "prompt": "Multiple [product] bottles aligned symmetrically on white cubes, colorful background, dynamic contrast.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/design-vibrant-geo-steps.webp" },
      { "name": "Natural Power", "prompt": "A [product] bottle with herbs and raw ingredients, neutral organic background, sunlight-inspired lighting.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Skincare/design-natural-essence.webp" },
      { "name": "Wellness Minimal", "prompt": "A single [product] on pastel backdrop with clean typography style shadows, calm and fresh tone.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/design-minimal-refresh.webp" },
      { "name": "Active Pulse", "prompt": "A [product] captured mid-air with floating ingredients, strong lighting, sports-nutrition vibe.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/design-flavor-burst.webp" },
      { "name": "Balanced Life", "prompt": "A [product] placed with a glass of water and sliced fruit, clean white or mint background, natural fresh look.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/design-summer-glow.webp" }
    ]
  },
  {
    "category": "Natural & Organic",
    "presets": [
      { "name": "Green Harmony", "prompt": "A [product] surrounded by leaves, stones, and wood, soft sunlight tone, eco-organic aesthetic.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Skincare/design-natural-essence.webp" },
      { "name": "Pure Nature", "prompt": "A [product] placed among natural textures like linen, clay, and herbs, beige tone background.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Skincare/design-stone-elegance.webp" },
      { "name": "Rustic Calm", "prompt": "A [product] jar or bottle on wood or stone with blurred natural background, earthy colors, ambient light.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Skincare/design-bold-sunlight-shadow.webp" },
      { "name": "Eco Luxe", "prompt": "A [product] with minimalist label, on recycled paper or bamboo base, clean sustainable look.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Skincare/design-soft-glow.webp" },
      { "name": "Botanic Focus", "prompt": "A close-up of [product] with macro details of surrounding leaves and drops, fresh daylight lighting.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Skincare/design-natural-essence.webp" },
      { "name": "Nature Flow", "prompt": "A [product] placed beside flowing fabric or natural water texture, calm soft tone, realistic daylight.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Skincare/design-soft-glow.webp" }
    ]
  },
  {
    "category": "Creative & Dynamic",
    "presets": [
      { "name": "Cinematic Float", "prompt": "A highly detailed, cinematic product photo of the [product] placed on a stylish surface with floating product elements around it, professional studio lighting, and shallow depth of field. The background should match the brand color palette and create a sense of motion and freshness. Add realistic textures, natural shadows, and a soft glow around the main product. The packaging should look premium, clean, and sharp with focus on brand logo and typography. Style inspired by commercial food photography and high-end product ads.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/design-vibrant-ingredient-pile.webp" },
      { "name": "Bold Geometry", "prompt": "A [product] shot with direct, hard lighting to create strong, defined shadows. The background is composed of bold, geometric blocks of solid color. Minimal, relevant props are arranged artistically. Modern, editorial feel.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Skincare/design-bold-sunlight-shadow.webp" },
      { "name": "Ingredient Explosion", "prompt": "A dynamic shot of the [product] floating centrally, with its core ingredients (like nuts, berries, or chocolate chunks) exploding outwards from around it in a frozen motion effect. Set against a vibrant, clean, single-color or gradient background with professional studio lighting.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/design-flavor-burst.webp" },
      { "name": "Artistic Spill", "prompt": "A top-down flat lay shot where the [product] packet is open, and its contents are spilling out artfully onto a clean, textured surface. The composition is clean and visually appealing, with a focus on the texture of the product. The background should be a solid, contrasting color.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Snacks%20/design-hands-on-flat-lay.webp" },
      { "name": "Hand Reveal", "prompt": "A creative studio shot where a hand holds the [product] against a bold, solid-colored background. For a dynamic effect, the hand can emerge from a tear or hole in a paper backdrop. Lighting is clean and focused on the product.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Skincare/design-hand-reveal.webp" },
      { "name": "Dynamic Splash", "prompt": "A high-speed photograph capturing the [product] (if a liquid) or its ingredients splashing into water or milk. The motion is frozen, with droplets and ripples clearly visible. The background can be clean and simple to emphasize the action.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/design-tropical-splash.webp" },
      { "name": "Textured Minimalism", "prompt": "A top-down flat lay of the [product] on a highly textured surface like rough stone, dark slate, or wrinkled linen. The composition is minimal, with natural, directional lighting creating deep shadows that emphasize texture.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Skincare/design-stone-elegance.webp" }
    ]
  },
  {
    "category": "Jewellery & Accessories",
    "presets": [
      { "name": "Geometric Pedestal", "prompt": "A [product] placed on a clean, white geometric pedestal with soft shadows and a warm, minimalist background. Elegant and high-end studio lighting.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Jewellery/design-geometric-pedestal.webp" },
      { "name": "Emerald Bokeh", "prompt": "A [product] suspended in front of a dark green textured background with beautiful bokeh lights. Dramatic and luxurious lighting with a focus on gemstones.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Jewellery/design-emerald-bokeh.webp" },
      { "name": "Teardrop Blue", "prompt": "A [product] placed on a light blue textured surface with soft, diffused lighting. Clean and sophisticated composition.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Jewellery/design-teardrop-blue.webp" },
      { "name": "Hand Model Showcase", "prompt": "A professional hand model wearing the [product], showcasing its fit and detail. Soft, natural lighting with a blurred lifestyle background.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Jewellery/design-hand-model.webp" },
      { "name": "Royal Velvet Bust", "prompt": "A [product] displayed on a professional jewellery mannequin bust with a rich velvet finish. Dramatic spotlighting to highlight craftsmanship and sparkle.", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Jewellery/design-velvet-bust.webp" },
      { "name": "Luxury Box Reveal", "prompt": "A [product] presented inside a luxury velvet jewellery box, nestled in soft fabric. Rich, warm lighting with elegant textures (silk or velvet).", "thumbnail": "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Jewellery/design-luxury-box.webp" }
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
    category: "🎨 Holi",
    presets: [
      {
        name: "Herbal Gulal Box",
        prompt: "A festive Holi composition. The [product] is placed centrally on a rustic wooden surface covered with small heaps of vibrant gulal powder (pink, yellow, green). Background features blurred colorful powder explosions or traditional thali. House of Veda aesthetic, organic and premium vibe.",
        thumbnail: "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Festiveshoot/Herbal%20Gulal%20Box.webp"
      },
      {
        name: "Vibrant Color Spread",
        prompt: "A bright, high-key commercial shot. [product] arranged alongside open bowls of herbal gulal and folded paper packets of colors (Yellow, Pink, Green). Clean white or light yellow background to make colors pop. Geometric and modern composition. Joyful and energetic lighting.",
        thumbnail: "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Festiveshoot/Vibrant%20Color%20Spread.webp"
      },
      {
        name: "Festive Gift Hamper",
        prompt: "A celebratory Holi gift hamper setup. [product] nestled in a box with Indian sweets (mithai), playing cards (UNO), and Rakhis. Warm, golden-hour lighting suggesting a family gathering. Joyful background with soft colors.",
        thumbnail: "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Festiveshoot/Festive%20Gift%20Hamper.webp"
      },
      {
        name: "Vibrant Gulal Explosion",
        prompt: "A high-energy action shot. The [product] is surrounded by exploding clouds of pink, yellow, and blue herbal powder (gulal). The lighting is bright and crisp to freeze the motion. The vibe is energetic, messy, and joyful.",
        thumbnail: "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Festiveshoot/design-vibrant-gulal-explosion.webp"
      },
      {
        name: "Elegant White & Pastel",
        prompt: "A clean, minimalist Holi theme. The [product] is placed on a pristine white surface, with delicate splashes of pastel-colored gulal and a few fresh white flowers (like jasmine or tuberose). Soft, airy lighting. The focus is on subtle color and sophistication.",
        thumbnail: "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Festiveshoot/design-elegant-white-pastel.webp"
      }
    ]
  },
  {
    category: "🪔 Diwali",
    presets: [
      {
        name: "Golden Diya Glow",
        prompt: "A warm, festive Diwali composition. The [product] is center stage, illuminated by the soft, golden glow of clay diyas (oil lamps). Marigold flower petals are scattered artistically on a rich wooden or velvet surface. Background features out-of-focus fairy lights (bokeh) creating a magical atmosphere.",
        thumbnail: "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Festiveshoot/Golden%20Glow%20Diya.webp"
      },
      {
        name: "Royal Card Party",
        prompt: "A luxurious Diwali party setting. The [product] is placed on a silk tablecloth alongside vintage playing cards, poker chips, and brass serving bowls with dry fruits. Moody, dramatic lighting with gold accents to evoke wealth and celebration.",
        thumbnail: "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Festiveshoot/Royal%20Card%20Party.webp"
      },
      {
        name: "Traditional Rangoli",
        prompt: "Top-down or high-angle shot of the [product] placed near a colorful, intricate Rangoli design on the floor. Surrounded by flower garlands and traditional brass lamps. Bright, daylight lighting to highlight the vibrant colors.",
        thumbnail: "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Festiveshoot/Traditional%20Rangoli.webp"
      },
      {
        name: "Mythological Art Style",
        prompt: "A creative, illustrated-style background inspired by Indian truck art or traditional meta-paintings (like Ramayana scenes). The [product] is integrated into this colorful, quirky, and culturally rich tableau.",
        thumbnail: "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Festiveshoot/Mythological%20Art%20style.webp"
      }
    ]
  },
  {
    category: "🌙 Eid",
    presets: [
      { name: "Moonlight Feast", prompt: "Elegant evening setting. [product] placed on an ornate tray with dates and lanterns. Background features a crescent moon glow. Rich blue and gold tones.", thumbnail: "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Festiveshoot/Golden%20Glow%20Diya.webp" },
      { name: "Morning Celebration", prompt: "Bright and airy Eid morning. [product] on a white marble table with sheer curtains and soft sunlight. Simple elegant props like a tasbih.", thumbnail: "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Festiveshoot/Traditional%20Rangoli.webp" }
    ]
  },
  {
    category: "🎄 Christmas",
    presets: [
      { name: "Cozy Fireplace", prompt: "Warm Christmas vibe. [product] placed on a wooden mantelpiece with stockings and pine cones. Soft glow from a fireplace in the background.", thumbnail: "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Festiveshoot/design-vibrant-gulal-explosion.webp" },
      { name: "Winter Wonderland", prompt: "Crisp winter scene. [product] nestled in fake snow with silver ornaments and white pine branches. Cool blue and white lighting.", thumbnail: "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Festiveshoot/design-elegant-white-pastel.webp" },
      { name: "Gift Unboxing", prompt: "Exciting holiday gift scene. [product] emerging from a wrapped gift box with ribbons and confetti. Bright, joyful lighting.", thumbnail: "https://gaekuvdnewzzwckmlntc.supabase.co/storage/v1/object/public/thumbnails/Festiveshoot/Vibrant%20Color%20Spread.webp" }
    ]
  }
];

export const AD_STYLE_PRESETS = [
  { 
    value: '✨ AI Suggested', 
    label: '✨ AI Suggested', 
    prompt: 'Visually striking, professional graphic design.',
    thumbnail: 'https://placehold.co/300x300/F1F5F9/334155?text=AI+Auto'
  },
  { 
    value: 'Minimalist', 
    label: 'Minimalist', 
    prompt: 'Clean, ample whitespace, modern typography, focus on product.',
    thumbnail: 'https://placehold.co/300x300/F8FAFC/64748B?text=Minimal' 
  },
  { 
    value: 'Bold & Loud', 
    label: 'Bold & Loud', 
    prompt: 'High contrast, large typography, vibrant colors, energetic vibe.',
    thumbnail: 'https://placehold.co/300x300/EF4444/FFFFFF?text=BOLD'
  },
  { 
    value: 'Luxury', 
    label: 'Luxury', 
    prompt: 'Elegant fonts, gold/silver accents, dark or premium textures, sophisticated.',
    thumbnail: 'https://placehold.co/300x300/1E293B/FCD34D?text=Luxury'
  },
  { 
    value: 'Playful', 
    label: 'Playful', 
    prompt: 'Bright colors, fun shapes, rounded fonts, energetic and friendly.',
    thumbnail: 'https://placehold.co/300x300/F0ABFC/1E293B?text=Playful'
  }
];

export const AD_TEMPLATES = [
  {
      id: 'neon-cyber',
      name: 'Neon Cyber Sale',
      category: 'Electronics',
      promptInstruction: 'Cyberpunk aesthetic, neon lighting, dark background, high tech vibe, glowing accents.',
      adLayout: AdLayout.TextLeftImageRight,
      fontFamily: 'font-mono',
      textColor: 'text-cyan-400',
      copywritingVibe: 'Futuristic, urgent, tech-focused.',
      previewColor: 'bg-slate-900 border-cyan-500'
  },
  {
      id: 'luxury-minimal',
      name: 'Luxury Minimalist',
      category: 'Beauty',
      promptInstruction: 'High-end luxury, soft diffused lighting, marble or silk textures, elegant and clean.',
      adLayout: AdLayout.TextRightImageLeft,
      fontFamily: 'font-serif',
      textColor: 'text-slate-800',
      copywritingVibe: 'Elegant, sophisticated, exclusive.',
      previewColor: 'bg-stone-100 border-stone-300'
  },
  {
      id: 'bold-fitness',
      name: 'Bold Fitness',
      category: 'Fitness',
      promptInstruction: 'High contrast, dramatic shadows, gym or urban environment, energetic and powerful.',
      adLayout: AdLayout.TextTopBottomImageCenter,
      fontFamily: 'font-sans font-black uppercase tracking-tighter',
      textColor: 'text-red-600',
      copywritingVibe: 'Aggressive, motivational, punchy.',
      previewColor: 'bg-zinc-900 border-red-600'
  },
  {
      id: 'fresh-organic',
      name: 'Fresh & Organic',
      category: 'Food',
      promptInstruction: 'Bright natural sunlight, green leaves, wooden textures, fresh and healthy vibe.',
      adLayout: AdLayout.TextLeftImageRight,
      fontFamily: 'font-sans font-medium',
      textColor: 'text-emerald-700',
      copywritingVibe: 'Natural, healthy, inviting.',
      previewColor: 'bg-green-50 border-emerald-500'
  },
  {
      id: 'pop-art',
      name: 'Pop Art Splash',
      category: 'Fashion',
      promptInstruction: 'Vibrant solid color blocks, hard shadows, pop art style, trendy and youthful.',
      adLayout: AdLayout.TextRightImageLeft,
      fontFamily: 'font-sans font-extrabold tracking-tight',
      textColor: 'text-yellow-400',
      copywritingVibe: 'Fun, trendy, exciting.',
      previewColor: 'bg-fuchsia-600 border-yellow-400'
  }
];
