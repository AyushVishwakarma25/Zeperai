
import { AspectRatio, ModelGender, ModelPersona, StylePreset, SkinTone, ClothingType, AppMode, OutputFormat, AdLayout, CaptionTone, ResolutionQuality, ProductCategory, ProProductStyleCategory } from './types';

export const AI_SUGGESTED = 'AI Suggested';

export const APP_MODE_OPTIONS = [
  { label: 'Influencer', value: AppMode.Influencer },
  { label: 'Product\nPhotoshoot', value: AppMode.Product },
  { label: 'Festival\nShoot', value: AppMode.Festival },
  { label: 'Ad\nCreative', value: AppMode.AdCreative },
  { label: 'Remix', value: AppMode.Remix },
  { label: 'Imagen', value: AppMode.Imagen },
];

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

export const AD_LAYOUT_OPTIONS = [
  { value: AdLayout.TextRightImageLeft, label: 'Image Left', icon: 'layout-image-left' },
  { value: AdLayout.TextLeftImageRight, label: 'Image Right', icon: 'layout-image-right' },
  { value: AdLayout.TextTopBottomImageCenter, label: 'Image Center', icon: 'layout-image-center' },
  { value: AdLayout.ProductShowcase, label: 'Showcase', icon: 'layout-showcase' },
];

export const OUTPUT_FORMAT_OPTIONS = [
  { label: 'JPEG', value: OutputFormat.JPEG },
  { label: 'PNG', value: OutputFormat.PNG },
  { label: 'WEBP', value: OutputFormat.WEBP },
];

export const RESOLUTION_QUALITY_OPTIONS = [
  { label: 'Standard', value: ResolutionQuality.Standard },
  { label: 'High', value: ResolutionQuality.High },
];

export const ASPECT_RATIO_OPTIONS = [
  { value: AspectRatio.Portrait, label: 'Story', icon: 'aspect-portrait' }, // 9:16
  { value: AspectRatio.PortraitPost, label: 'Post', icon: 'aspect-portrait-post' }, // 4:5
  { value: AspectRatio.Square, label: 'Square', icon: 'aspect-square' }, // 1:1
  { value: AspectRatio.Landscape, label: 'Wide', icon: 'aspect-landscape' }, // 16:9
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
  '🇮🇳 Indian Ethnic & Festive': [
    'Saree Elegance (Silk/Kanjivaram)',
    'Modern Kurti with Jeans',
    'Festive Anarkali Look',
    'Sherwani Groom / Traditional',
    'Lehenga Bridal Glow',
    'Handloom Cotton Vibe',
    'Indo-Western Fusion',
    'Indian Bride/Groom Look',
    'Festive Glam',
  ],
  '🏙️ Urban India (Gen Z & Millennial)': [
    'South Bombay (SoBo) Chic',
    'Delhi Streetwear Aesthetic',
    'Bangalore Techie Casual',
    'Urban Cafe Lifestyle',
    'College Campus Vibe',
    'Airport Look (Casual Luxe)',
    'Gym & Fitness Influencer',
  ],
  '🌎 Global & Generic': [
    'Minimalist Shopper',
    'Urban Professional',
    'College Student',
    'New Mom',
    'Yoga Enthusiast',
    'Eco-Friendly Advocate',
    'Fitness Buff',
    'Streetwear Trendsetter',
    'Boho Chic',
    'Luxury Minimalist',
    'Western Casual',
    'Senior Citizen',
    'Teen Influencer',
    'Traveler/Explorer',
    'Entrepreneur/Leader',
    'Artist/Creative',
    'Health-Conscious Parent',
  ],
  '🌿 Natural & Authentic': [
    'Ayurveda / Yoga Practitioner',
    'Morning Chai Veranda Vibe',
    'Home Chef / Homemaker',
    'Organic/Sustainable Living',
    'No-Makeup Natural Glow',
    'Ayurveda/Herbal Believer',
  ],
  '💼 Professional & Corporate': [
    'Corporate Saree Power Dressing',
    'Indian Startup Founder (Smart Casual)',
    'Office Formal (Western)',
    'Creative Agency Vibe',
  ],
  '🗺️ Regional Authenticity': [
    'Punjabi Swag',
    'Bengali Artistic Aesthetic',
    'South Indian Traditional',
    'Goan Holiday Vibe',
    'Jaipur/Rajasthan Royal',
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
  // --- Generic / Functional ---
  'Holding product like a recommendation',
  'Applying product (Skincare/Beauty)',
  'Sipping drink / Eating snack naturally',
  'Walking confidently towards camera',
  'Sitting in a relaxed cafe pose',
  'Holding phone/gadget and smiling',
  'Mirror selfie style',
  'Unboxing gesture',
  'Pointing at product',
  'Looking surprised/excited',
  // --- Indian / Cultural ---
  'Festive celebration pose (holding Diya/Gift)',
  'Traditional greeting (Namaste) with product',
  'Adjusting Dupatta/Saree pallu elegantly',
  'Holding product in a Puja Thali',
  'Dancing pose (Garba/Bollywood style)',
  CUSTOM_POSE_TRIGGER,
];

export const ALL_BACKGROUND_OPTIONS: Record<ProductCategory, Record<string, string[]>> = {
  [ProductCategory.Generic]: {
    '✨ AI Suggested': [AI_SUGGESTED],
    '🇮🇳 Indian Context': [
      'Modern Mumbai Apartment Living Room',
      'Traditional Indian Veranda with Plants',
      'Bright Indian Kitchen',
      'Festive Background with Marigold Flowers',
      'Indian Street Market Blur',
      'Goa Beach Sunset',
      'Himalayan Mountain View',
    ],
    '🌎 Global & Studio': [
      'Solid white studio backdrop',
      'Soft beige/cream wall',
      'Gradient pastel background',
      'Abstract geometric shapes',
      'Modern minimal interior',
      'Sunlit window shadow',
      'Urban street blur',
      'Neon studio lights',
    ],
  },
  [ProductCategory.Skincare]: {
    '✨ AI Suggested': [AI_SUGGESTED],
    '🇮🇳 Indian Context': [
      'Tropical/Kerala Greenery Background',
      'Ayurvedic Spa Setting with Brass Bowls',
      'Jasmine & Marigold Flower Bed',
      'Indian Bathroom Luxury Setup',
    ],
    '🌎 Global & Studio': [
      'Morning Sunlight in Bedroom',
      'Bathroom Vanity with Warm Light',
      'Clean White Marble Surface',
      'Spa Setting with Towels & Candles',
      'Water Ripples / Poolside',
      'Soft Focus Mirror Reflection',
      'Pastel geometric podiums',
    ],
  },
  [ProductCategory.FoodAndBeverage]: {
    '✨ AI Suggested': [AI_SUGGESTED],
    '🇮🇳 Indian Context': [
      'Indian Dining Table with Cutlery',
      'Vibrant Street Food Background',
      'Cozy Indian Tea Stall / Cafe',
      'Festive Diwali Sweet Table',
      'Traditional Kitchen Shelf',
    ],
    '🌎 Global & Studio': [
      'Rustic Wooden Table Top',
      'Cozy Cafe Interior',
      'Picnic Setup on Grass',
      'Bright Modern Kitchen Counter',
      'Solid color pop background',
      'Marble countertop with ingredients',
    ],
  },
  [ProductCategory.Perfume]: {
    '✨ AI Suggested': [AI_SUGGESTED],
    '🇮🇳 Indian Context': [
      'Royal Rajasthani Palace Interior',
      'Mysore Sandalwood & Silk Texture',
      'Indian Wedding Mandap Blur',
    ],
    '🌎 Global & Studio': [
      'Dark Moody Luxury Studio',
      'Golden Hour Sunlight',
      'Silk Fabric Drape Background',
      'Reflective Glass Surface',
      'Floating in water/smoke',
      'Minimal concrete texture',
    ],
  },
  [ProductCategory.Herbal]: {
    '✨ AI Suggested': [AI_SUGGESTED],
    '🇮🇳 Indian Context': [
      'Lush Green Ayurvedic Garden',
      'Traditional Wooden Mortar & Pestle',
      'Himalayan Herbs Background',
    ],
    '🌎 Global & Studio': [
      'Wooden Table with Herbs & Spices',
      'Morning Sun with Window Shadow',
      'Bamboo or Jute Texture Background',
      'Clean white clinical background',
      'Greenhouse interior',
    ],
  },
  [ProductCategory.Tech]: {
    '✨ AI Suggested': [AI_SUGGESTED],
    '🇮🇳 Indian Context': [
      'Bangalore Tech Park Office View',
      'Cozy Indian Home Workstation',
      'Indian Cafe with Laptop',
    ],
    '🌎 Global & Studio': [
      'Modern Office Desk Setup',
      'Urban Co-working Space',
      'Neon Gaming Setup',
      'Minimalist Tech Review Desk',
      'Abstract futuristic circuit background',
      'Clean grey gradient',
    ],
  },
  [ProductCategory.Fashion]: {
    '✨ AI Suggested': [AI_SUGGESTED],
    '🇮🇳 Indian Context': [
      'Old Delhi Architecture (Red Sandstone)',
      'Jaipur Pink City Vibe',
      'Goa Portuguese Villa',
      'Indian Wedding Venue',
    ],
    '🌎 Global & Studio': [
      'Modern Shopping Mall Atrium',
      'Clean Grey Studio Wall',
      'Bohemian Cafe Outdoor',
      'Street Style Urban Blur',
      'Fashion runway background',
      'Abstract art gallery',
    ],
  },
  [ProductCategory.HomeDecor]: {
    '✨ AI Suggested': [AI_SUGGESTED],
    '🇮🇳 Indian Context': [
      'Modern Indian Living Room',
      'Festive Decorated Hall (Diwali/Eid)',
      'Traditional Courtyard House',
    ],
    '🌎 Global & Studio': [
      'Cozy Reading Corner',
      'Minimalist Bedroom',
      'Scandinavian Living Room',
      'Sunlit window ledge',
      'Bohemian plant corner',
    ],
  },
  [ProductCategory.Fitness]: {
    '✨ AI Suggested': [AI_SUGGESTED],
    '🇮🇳 Indian Context': [
      'Morning Yoga in Lodhi Garden',
      'Indian Gym Interior',
      'Terrace Workout with City View',
    ],
    '🌎 Global & Studio': [
      'Modern Gym Interior',
      'Urban Running Track',
      'Home Workout Corner',
      'Abstract dynamic lines background',
      'Dark gritty crossfit gym',
    ],
  },
};

export const CLOTHING_STYLE_PRESETS = {
  '✨ AI Suggested': [
    { name: AI_SUGGESTED, prompt: AI_SUGGESTED },
  ],
  'Studio & Editorial': [
    { name: 'Corduroy Elegance', 
      prompt: 'Model wearing the uploaded outfit in a clean studio with a soft beige background, minimal props, soft diffused lighting highlighting the corduroy texture. Slight shadow under the model’s feet, editorial fashion pose, focus on fabric detail and silhouette.' },
    { name: 'Blue Retro Twist',
      prompt: 'Model wearing the uploaded clothing in a cozy Scandinavian room with wooden furniture and soft warm light. Retro styling, calm mood, light film grain texture. Neutral tones with pastel color balance for a classic editorial look.' },
    { name: 'Embroidered Texture Focus',
      prompt: 'Macro fashion shot focusing on fabric details and embroidery of the uploaded outfit. Minimal background, smooth shadows, warm tone highlights on thread and texture. Perfect for showing craftsmanship.' },
    { name: 'Textured Contrast',
      prompt: 'Fashion editorial shot — dark moody background with soft rim light accentuating the corduroy fabric lines. High-contrast tones, cinematic lighting, strong angular pose for premium feel.' },
    { name: 'Soft Pastel Pop',
      prompt: 'Model standing in front of a pastel-colored wall (light blue, blush pink). Soft, bright light and minimal accessories. Youthful, clean, and ad-ready tone.' },
    { name: 'Mono-Tone Scandinavian',
      prompt: 'Model styled in uploaded outfit inside a Scandinavian interior — clean lines, plants, white walls, natural wooden textures. Balanced ambient lighting and calm minimal composition.' },
  ],
  'Urban & Outdoor': [
    { name: 'Urban Corduroy Street',
      prompt: 'Model wearing the uploaded outfit standing near a textured city wall or brick background, natural daylight with soft shadows, streetwear-inspired pose, slight motion blur for realism.' },
    { name: 'Nature Contrast',
      prompt: 'Model in uploaded outfit outdoors surrounded by greenery or a soft garden background. Gentle backlight and natural colors. Slight wind in fabric, authentic lifestyle vibe.' },
  ]
};

export const PRODUCT_STYLE_PRESETS = {
    '✨ AI Suggested': [
      AI_SUGGESTED,
    ],
    '🛒 E-commerce Ready': [
      'White background minimalism – clean, distraction-free shots ideal for online stores.',
      'Flat lays with order – top-down, neat arrangements that highlight product features.',
      '360-degree spin views – interactive, rotational images that show every detail.',
      'Macro magic – extreme close-ups that reveal textures, materials, or fine design.',
      'Group Arrangement – product with multiples (bundle shot) styled symmetrically.',
      '45-Degree Angled Shot – product slightly elevated and angled for dynamic perspective.',
    ],
    '🎨 Creative & Advertising': [
      'Floating illusions – products appearing to levitate for futuristic appeal.',
      'Hanging shots – suspend items with invisible support for a playful look.',
      'Reflection play – mirror, glass, or water surfaces to create luxury vibes.',
      'Photo manipulation art – surreal edits that make products feel larger-than-life.',
      'Creative lighting drama – bold shadows, colorful gels, or gradient lights for mood.',
      'Strange perspectives – tilted, upside-down, or exaggerated angles to surprise viewers.',
      'Props storytelling – adding objects that hint at the product’s use or vibe.',
      'Coloured backdrops – bold, brand-matched backgrounds that pop.',
      'Textured setups – using wood, fabric, stone, or sand for depth and tactility.',
    ],
    'Luxury & Editorial': [
      'Luxury Glamour – glossy black or gold backdrop, dramatic shadows, spotlight on product.',
      'Modern Editorial – bold color blocks, abstract shapes, and studio lighting highlighting the product.',
      'High-Tech Futuristic – neon accents, metallic surfaces, reflective backgrounds.',
    ],
    'Natural & Lifestyle': [
      'Natural Lifestyle – product placed on wooden/linen textures with soft daylight.',
      'Eco-Friendly / Organic – earthy tones, jute, bamboo, plants around the product.',
      'Outdoor Natural Light – blurred greenery, beach sand, or street-style background.',
    ],
    'Dynamic & Action': [
        'Product in Water Splashes – dynamic shot with water frozen mid-air, refreshing vibe.',
        'Product on Ice / Frosted – placed on ice cubes or frosted surface, cold/fresh look.',
        'Snack/Food Burst – packet slightly open, with chips/snacks spilling out naturally.',
    ],
    'Themed & Situational': [
      'Festive India – product surrounded by diyas, flowers, rangoli (Diwali vibe) or Holi colors.',
      'Bathroom / Vanity Setup (for beauty/skincare) – product near mirror, towels, soft warm lighting.',
      'Desk Productivity Setup (for gadgets/stationery) – clean workspace with laptop, coffee mug, neutral tones.',
      'Cafe / Lifestyle Aesthetic – product on a a table with coffee, books, cozy textures.',
    ],
};

// FIX: Explicitly type PRO_PRODUCT_STYLE_PRESETS to prevent type inference issues downstream.
export const PRO_PRODUCT_STYLE_PRESETS: ProProductStyleCategory[] = [
  {
    "category": "E-commerce & Web",
    "presets": [
      {
        "name": "Classic White Background",
        "prompt": "A clean, professional studio shot of the [product] on a pure white background (#FFFFFF). The lighting is bright, even, and shadowless, highlighting the product's details. Ideal for e-commerce listings on Amazon, Shopify, etc."
      },
      {
        "name": "Gradient Backdrop",
        "prompt": "A professional studio shot of the [product] on a smooth, subtle two-tone gradient background. The colors should complement the product's branding. Soft shadows and clean lighting for a modern web look."
      }
    ]
  },
  {
    "category": "Drinks & Beverages",
    "presets": [
      {
        "name": "Citrus Pop",
        "prompt": "A [product] placed on a white block with sliced citrus and ice cubes, fresh condensation, vibrant gradient background, bright studio lighting."
      },
      {
        "name": "Tropical Splash",
        "prompt": "A [product] surrounded by floating fruits and water splashes, dynamic motion freeze, colorful gradient backdrop, high contrast lighting."
      },
      {
        "name": "Minimal Refresh",
        "prompt": "A single [product] on a clean pedestal with subtle droplets, soft shadows, and a pastel gradient background."
      },
      {
        "name": "Flavor Burst",
        "prompt": "A [product] surrounded by its core ingredients in mid-air, sharp detail, vivid background, strong directional lighting."
      },
      {
        "name": "Summer Glow",
        "prompt": "A [product] bottle shot on reflective surface with fresh fruits around, warm sunlight tone, minimal props."
      },
      {
        "name": "Cool Lift",
        "prompt": "A levitating [product] can with floating ice and vapor mist, clean blue or mint background, cinematic depth and clarity."
      },
      {
        "name": "Vibrant Ingredient Pile",
        "prompt": "A professional studio shot of the [product] placed centrally on a generous, artful pile of its fresh, whole and sliced ingredients. The background is a clean, vibrant, single-color or soft gradient that matches the product's color palette. The lighting is bright and clean, making the product and ingredients look fresh and appealing, with subtle condensation on the bottle. The overall style is commercial, vibrant, and appetizing."
      }
    ]
  },

  {
    "category": "Skincare & Beauty",
    "presets": [
      {
        "name": "Soft Glow",
        "prompt": "A [product] tube on pastel background with subtle shadows, minimalist props like petals or leaves, smooth editorial lighting."
      },
      {
        "name": "Hand Reveal",
        "prompt": "A hand emerging through a colored paper background holding a [product], bold color contrast, high-end studio lighting."
      },
      {
        "name": "Natural Essence",
        "prompt": "A [product] bottle placed among stones and green leaves, soft daylight tone, spa-inspired composition."
      },
      {
        "name": "Stone Elegance",
        "prompt": "A [product] on textured stone block with moody warm lighting and shadow play, premium product photography style."
      },
      {
        "name": "Clean Balance",
        "prompt": "A [product] bottle surrounded by clean ingredients like aloe, cucumber, or citrus, white background, minimalistic setup."
      },
      {
        "name": "Luxe Mirror",
        "prompt": "A [product] placed on a reflective mirrored base, subtle gradients in background, glossy reflections, editorial feel."
      },
      {
        "name": "Bold Sunlight Shadow",
        "prompt": "A minimalist product shot of [product] against a solid, vibrant background. A single, hard light source from the side or top creates a sharp, dramatic shadow, mimicking direct sunlight. The composition is clean, modern, and highlights the product's shape and color."
      }
    ]
  },

  {
    "category": "Snacks & Packaged Foods",
    "presets": [
      {
        "name": "Snack Tower",
        "prompt": "Multiple [product] packs stacked neatly on white pedestals, colorful gradient background, vibrant studio lighting."
      },
      {
        "name": "Flavor Flight",
        "prompt": "Hands holding [product] packs against bright sky or gradient background, fun, bold, lifestyle-inspired composition."
      },
      {
        "name": "Crunch Moment",
        "prompt": "A [product] packet bursting open mid-air with ingredients or crumbs flying, bold colored backdrop, freeze-frame action."
      },
      {
        "name": "Healthy Indulgence",
        "prompt": "A [product] on beige fabric or wood, surrounded by its key ingredients (e.g. oats, nuts, chocolate chunks), soft warm lighting."
      },
      {
        "name": "Pop Shot",
        "prompt": "A single [product] packet surrounded by floating ingredients that represent its flavor, clean pastel background."
      },
      {
        "name": "Vibrant Shelf",
        "prompt": "Rows of [product] displayed symmetrically on white cubes, bold lighting, contrasting shadows, magazine aesthetic."
      },
      {
        "name": "Dramatic Podium Shot",
        "prompt": "A dramatic, moody shot of the [product] centered on a dark, textured stone or wood podium. The background is dark and out of focus, with a single spotlight illuminating the product. Crumbs or small pieces of the product are scattered artfully on the podium. Cinematic, high-contrast lighting with sharp focus on the packaging."
      },
      {
        "name": "Modern E-comm Showcase",
        "prompt": "A clean, minimalist studio shot of the [product]. The product is placed on a reflective surface, creating a soft mirror image below. The background is a smooth, simple gradient using brand-cohesive colors. The lighting is bright, even, and professional, ideal for online stores and marketing materials."
      },
      {
        "name": "Hands-On Flat Lay",
        "prompt": "A clean, top-down flat lay composition on a bold, solid-colored background. Two hands are in the frame, presenting both the [product] packaging and the product in use (e.g., in a bowl). The lighting is bright and even, creating a modern, graphic, and engaging look ideal for social media."
      },
      {
        "name": "Vibrant Breakfast Scene",
        "prompt": "A vibrant, energetic lifestyle shot of [product] as part of a breakfast scene. Includes a bowl of the product, a glass of milk, and other relevant props. The shot can be from a top-down or a dynamic three-quarter angle, possibly featuring a hand interacting with the scene (e.g., holding a spoon, pouring milk). The background is a bright, solid color and the lighting is hard, creating crisp shadows for a playful, modern feel."
      },
      {
        "name": "Quickcommerc Style",
        "prompt": "A professional studio shot of the [product] placed centrally in a scene with its key ingredients and final form (e.g., brownies, a prepared dish) artfully scattered around it. The background is a clean, warm, soft-focus gradient that complements the product's colors. The lighting is dramatic yet soft, creating an appetizing and high-quality commercial look. Include dynamic elements like small splashes or floating ingredients for a vibrant, premium feel."
      },
      {
        "name": "Blinkit Style 2",
        "prompt": "Studio shot of a standing [product] on a sky or smooth gradient background, with a soft spotlight from the corners and subtle shadows. Add realistic water droplets on the packaging if appropriate for the product. Surround the [product] with its key ingredients, artfully arranged in a rich food styling composition. Premium commercial photography style with crisp details and a shallow depth of field. Do not add any other elements. The [product] should be the main focus, filling approximately 85% of the frame."
      }
    ]
  },

  {
    "category": "Perfume & Luxury",
    "presets": [
      {
        "name": "Mirror Elegance",
        "prompt": "A [product] placed on a reflective surface with moody background gradient, soft light highlights, luxury aesthetic."
      },
      {
        "name": "Water Grace",
        "prompt": "A [product] bottle half-submerged in calm water with ripples and reflections, golden light glow."
      },
      {
        "name": "Silk Touch",
        "prompt": "A [product] placed on smooth flowing fabric folds, soft diffused lighting, gentle highlights."
      },
      {
        "name": "Amber Night",
        "prompt": "A [product] bottle on marble or glass with warm amber light and cinematic shadows, elegant composition."
      },
      {
        "name": "Minimal Luxury",
        "prompt": "A single [product] centered in frame on matte background with sharp top light, premium editorial style."
      },
      {
        "name": "Botanical Aura",
        "prompt": "A [product] surrounded by delicate petals or herbs, soft daylight and depth blur, high-end fragrance style."
      }
    ]
  },

  {
    "category": "Health, Supplements & Nutrition",
    "presets": [
      {
        "name": "Vital Boost",
        "prompt": "A [product] jar on pedestal surrounded by fruits and supplement capsules, bright gradient background, modern lighting."
      },
      {
        "name": "Energy Lineup",
        "prompt": "Multiple [product] bottles aligned symmetrically on white cubes, colorful background, dynamic contrast."
      },
      {
        "name": "Natural Power",
        "prompt": "A [product] bottle with herbs and raw ingredients, neutral organic background, sunlight-inspired lighting."
      },
      {
        "name": "Wellness Minimal",
        "prompt": "A single [product] on pastel backdrop with clean typography style shadows, calm and fresh tone."
      },
      {
        "name": "Active Pulse",
        "prompt": "A [product] captured mid-air with floating ingredients, strong lighting, sports-nutrition vibe."
      },
      {
        "name": "Balanced Life",
        "prompt": "A [product] placed with a glass of water and sliced fruit, clean white or mint background, natural fresh look."
      }
    ]
  },

  {
    "category": "Natural & Organic",
    "presets": [
      {
        "name": "Green Harmony",
        "prompt": "A [product] surrounded by leaves, stones, and wood, soft sunlight tone, eco-organic aesthetic."
      },
      {
        "name": "Pure Nature",
        "prompt": "A [product] placed among natural textures like linen, clay, and herbs, beige tone background."
      },
      {
        "name": "Rustic Calm",
        "prompt": "A [product] jar or bottle on wood or stone with blurred natural background, earthy colors, ambient light."
      },
      {
        "name": "Eco Luxe",
        "prompt": "A [product] with minimalist label, on recycled paper or bamboo base, clean sustainable look."
      },
      {
        "name": "Botanic Focus",
        "prompt": "A close-up of [product] with macro details of surrounding leaves and drops, fresh daylight lighting."
      },
      {
        "name": "Nature Flow",
        "prompt": "A [product] placed beside flowing fabric or natural water texture, calm soft tone, realistic daylight."
      }
    ]
  },
  {
    "category": "Creative & Dynamic",
    "presets": [
      {
        "name": "Cinematic Float",
        "prompt": "A highly detailed, cinematic product photo of the [product] placed on a stylish surface with floating product elements around it, professional studio lighting, and shallow depth of field. The background should match the brand color palette and create a sense of motion and freshness. Add realistic textures, natural shadows, and a soft glow around the main product. The packaging should look premium, clean, and sharp with focus on brand logo and typography. Style inspired by commercial food photography and high-end product ads."
      },
      {
        "name": "Bold Geometry",
        "prompt": "A [product] shot with direct, hard lighting to create strong, defined shadows. The background is composed of bold, geometric blocks of solid color. Minimal, relevant props are arranged artistically. Modern, editorial feel."
      },
      {
        "name": "Ingredient Explosion",
        "prompt": "A dynamic shot of the [product] floating centrally, with its core ingredients (like nuts, berries, or chocolate chunks) exploding outwards from around it in a frozen motion effect. Set against a vibrant, clean, single-color or gradient background with professional studio lighting."
      },
      {
        "name": "Artistic Spill",
        "prompt": "A top-down flat lay shot where the [product] packet is open, and its contents are spilling out artfully onto a clean, textured surface. The composition is clean and visually appealing, with a focus on the texture of the product. The background should be a solid, contrasting color."
      },
      {
        "name": "Hand Reveal",
        "prompt": "A creative studio shot where a hand holds the [product] against a bold, solid-colored background. For a dynamic effect, the hand can emerge from a tear or hole in a paper backdrop. Lighting is clean and focused on the product."
      },
      {
        "name": "Dynamic Splash",
        "prompt": "A high-speed photograph capturing the [product] (if a liquid) or its ingredients splashing into water or milk. The motion is frozen, with droplets and ripples clearly visible. The background is clean and simple to emphasize the action."
      },
      {
        "name": "Textured Minimalism",
        "prompt": "A top-down flat lay of the [product] on a highly textured surface like rough stone, dark slate, or wrinkled linen. The composition is minimal, with natural, directional lighting creating deep shadows that emphasize texture."
      }
    ]
  }
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
        prompt: "A sophisticated Holi aesthetic. The [product] sits on a pristine white surface, dusted lightly with pastel-colored powders. Props include a brass plate with organized heaps of organic colors and a glass of Thandai. Soft, diffused daylight."
      },
      {
        name: "Playful Water Fight",
        prompt: "A fun, outdoor Holi scene. The [product] is placed on a wet surface with colorful water splashes. Props include traditional pichkaris (water guns) and water balloons in the background. Sunlight and lens flares add to the outdoor feel."
      }
    ]
  },
  {
    category: "🎄 Christmas & New Year",
    presets: [
      {
        name: "Cozy Winter Gift",
        prompt: "A warm Christmas setting. The [product] is nestled in a gift box with red ribbon, surrounded by pine cones, cinnamon sticks, and dried orange slices. Background is a blurred Christmas tree with warm lights."
      },
      {
        name: "Snowy Wonderland",
        prompt: "The [product] placed on a surface of fresh, white snow (or faux snow texture). Props include silver and blue ornaments and frosted pine branches. Cool, crisp lighting evoking a winter morning."
      },
      {
        name: "Santa's Surprise",
        prompt: "A playful Christmas shot. The [product] is wearing a mini Santa hat or placed inside a red stocking. Background features red and white candy cane stripes or wrapping paper patterns."
      }
    ]
  },
  {
    category: "🌙 Eid & Ramadan",
    presets: [
      {
        name: "Moonlit Feast",
        prompt: "An elegant evening setup. The [product] is placed on a textured table with dates, dried fruits, and a vintage metal lantern (Fanoos). A crescent moon prop is visible in the background. Rich blue and gold color palette."
      }
    ]
  }
];

export const CUSTOM_BACKDROP_TRIGGER = 'Custom Backdrop/Props...';

export const BACKDROP_PROPS_OPTIONS = {
  '✨ AI Suggested': [
    AI_SUGGESTED,
  ],
  'Minimal & Geometric': [
    'On a simple podium or block',
    'With floating geometric shapes (spheres, cubes)',
    'Using archways or curved backdrops',
    'Clean two-tone color block background',
    'Artistic flat lay of product family',
    'Symmetrical group shot of product variations',
    'On a bold, single-color studio background',
  ],
  'Natural & Organic': [
    'On a stone or marble slab',
    'Surrounded by relevant natural ingredients (e.g., fruits, flowers, herbs)',
    'With water elements (splashes, ripples, submerged)',
    'On sand or with pebbles',
  ],
  'Lifestyle & Contextual': [
    'On a textured fabric (silk, linen, velvet)',
    'On a wooden surface (table, planks)',
    'With lifestyle props (books, glasses, tech gadgets)',
  ],
  'Custom': [
    CUSTOM_BACKDROP_TRIGGER
  ]
};

export const CUSTOM_TEXT_PLACEMENT_TRIGGER = 'Custom Suggestion...';

export const TEXT_PLACEMENT_OPTIONS: string[] = [
  AI_SUGGESTED,
  'Behind product in embossed or semi-transparent layer',
  'Small, centered sans-serif tagline',
  'Small centered tagline below product',
  'Right-aligned for structured balance',
  'Bold headline at top or slightly diagonal for energy',
  'Floating text behind burst effect for motion feel',
  'Bottom-left subtle placement for authenticity',
  'Clean serif font along base of product',
  'Small center text aligned with natural props',
  'Top-center or slightly diagonal overlay for bold visibility',
  'Floating semi-transparent text behind product for 3D depth',
  'Center-aligned tagline under can or bottle',
  'Center-bottom for balance and minimalism',
  'Behind or curved around the product for elegant branding',
  'Top-right in a small, clean font for luxury positioning',
  CUSTOM_TEXT_PLACEMENT_TRIGGER,
];

export const FONT_STYLE_OPTIONS: string[] = [
  AI_SUGGESTED,
  'Elegant Serif',
  'Modern Sans-Serif',
  'Playful Script',
  'Bold & Impactful Display',
  'Minimalist Grotesk',
  'Vintage & Retro',
  'Futuristic & Techy',
  'Handwritten & Casual',
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

export const AI_WRITER_ICON = 'https://cdn-icons-png.flaticon.com/512/1077/1077110.png';
