export interface NicheFAQ {
  question: string;
  answer: string;
}

export interface NicheGuideSection {
  heading: string;
  content: string;
  bulletPoints?: string[];
}

export interface NicheMarketplaceSpec {
  recommendedResolution: string;
  aspectRatio: string;
  colorProfile: string;
  backgroundRule: string;
  frameOccupancy: string;
  allowedFormats: string;
  maxFileSize: string;
}

export interface BackgroundRemoverNiche {
  slug: string;
  name: string;
  shortTitle: string;
  metaTitle: string;
  metaDescription: string;
  targetKeywords: string[];
  marketplace: string;
  category: 'Marketplaces' | 'Fashion & Apparel' | 'Jewellery & Luxury' | 'Beauty & Personal Care' | 'FMCG & Quick Commerce' | 'Electronics & Gadgets' | 'Home & Living' | 'Handicrafts & Art';
  badge: string;
  tagline: string;
  heroHeadline: string;
  heroSubheadline: string;
  specs: NicheMarketplaceSpec;
  guideOverview: string;
  guideSections: NicheGuideSection[];
  rejectionChecklist: string[];
  faqs: NicheFAQ[];
  relatedSlugs: string[];
}

export const BACKGROUND_REMOVER_NICHES: Record<string, BackgroundRemoverNiche> = {
  // 1. Amazon India
  'amazon-india-products': {
    slug: 'amazon-india-products',
    name: 'Amazon India Products',
    shortTitle: 'Amazon India White Background Maker',
    metaTitle: 'Free Amazon India White Background Maker for Products (RGB 255,255,255)',
    metaDescription: 'Instant free Amazon India product image background remover. Generate compliant RGB 255,255,255 pure white backgrounds with 85% frame filling in seconds.',
    targetKeywords: ['Amazon India white background', 'Amazon product image cleaner', 'RGB 255 Amazon background', 'Amazon FBA photo requirements 2026'],
    marketplace: 'Amazon India (IN)',
    category: 'Marketplaces',
    badge: 'Amazon Seller Central 2026 Compliant',
    tagline: 'Pass Amazon India automated catalog audits with 100% pure RGB 255,255,255 white packshots.',
    heroHeadline: 'Free Amazon India White Background Maker',
    heroSubheadline: 'Strip cluttered phone backgrounds and export pure RGB (255, 255, 255) white JPEG/PNG packshots optimized for Amazon India 1:1 zoom.',
    specs: {
      recommendedResolution: '2000 x 2000 px (Min 1000 x 1000 px for zoom)',
      aspectRatio: '1:1 Square',
      colorProfile: 'sRGB / 8-bit',
      backgroundRule: 'Pure RGB (255, 255, 255) / Hex #FFFFFF mandatory for MAIN hero image',
      frameOccupancy: 'Product must occupy 85% or more of the frame',
      allowedFormats: 'JPEG (.jpg), PNG (.png), TIFF (.tif)',
      maxFileSize: '10 MB',
    },
    guideOverview: 'Amazon India enforces strict automated vision algorithms on the MAIN hero image of every ASIN. Listings with off-white, cream, or shaded backgrounds suffer automated suppression or demotion in search rankings.',
    guideSections: [
      {
        heading: '1. The Strict Amazon RGB (255, 255, 255) Rule',
        content: 'Amazon algorithms inspect the four corners and surrounding perimeter of your primary image. If any background pixel deviates from pure white (RGB 255, 255, 255) — even by a micro-shade such as RGB (254, 254, 250) — the system flags the listing for poor contrast or suppression. Our tool guarantees true RGB 255 across every single perimeter pixel.',
        bulletPoints: [
          'Background color must be Hex #FFFFFF (RGB 255,255,255). Off-white or tinted backgrounds are disallowed on MAIN image.',
          'No watermarks, logos, brand badges, or promotional text ("Offer", "Sale", "BOGO") allowed on the hero shot.',
          'The entire physical item must be in full view with zero parts cropped out.',
        ],
      },
      {
        heading: '2. 85% Frame Occupancy Calculation',
        content: 'Amazon policy dictates that the product must fill at least 85% of the image frame. Sellers often leave too much negative whitespace, causing the product to look minuscule on mobile screens. Conversely, cropping edges will cause immediate catalog rejection. Maintain a 7.5% balanced safety margin on all four sides.',
        bulletPoints: [
          'Ensure 2000x2000px resolution so Amazon 3x hover-zoom activates automatically.',
          'Avoid accessory props that are not included in the customer purchase box.',
          'Do not use mannequins or placeholder outlines unless categorized under specific apparel exemptions.',
        ],
      },
      {
        heading: '3. Shadows, Reflections & Ground Contact',
        content: 'While pure white backgrounds are mandatory, natural subtle contact shadows directly underneath the base of the product are permitted and recommended to prevent products from looking artificially "floating". Saturated, colored, or dramatic artificial drop shadows are strictly prohibited.',
      },
    ],
    rejectionChecklist: [
      'Perimeter contains off-white grey or compression artifacts instead of RGB (255, 255, 255)',
      'Product fills less than 85% of the canvas',
      'Text overlays, seller logos, or promotional discount banners included',
      'Multiple product variations crammed into the primary image',
      'Blurry or pixelated low-resolution export under 1000px',
    ],
    faqs: [
      {
        question: 'Does Amazon India require pure white background on all secondary images?',
        answer: 'No. Pure white background (RGB 255, 255, 255) is strictly enforced only on the MAIN (first) hero image. Secondary images can showcase lifestyle settings, infographics, packaging dimensions, and in-use demonstrations.',
      },
      {
        question: 'How do I download the pure white version vs transparent version?',
        answer: 'Our tool gives you two distinct export buttons: "Download Transparent PNG" for marketing materials, and "Download Pure White (RGB 255)" for direct Amazon listing upload.',
      },
      {
        question: 'Will this tool blur delicate product edges like bottles or apparel threads?',
        answer: 'No. Our in-browser WebAssembly model performs sub-pixel alpha matting, preserving intricate edges, reflections, transparent plastics, and textile fringes without halo artifacts.',
      },
    ],
    relatedSlugs: ['flipkart-meesho-sellers', 'blinkit-zepto-products', 'amazon-fba-hero-images', 'packaged-spices-and-masala'],
  },

  // 2. Blinkit & Zepto Quick Commerce
  'blinkit-zepto-products': {
    slug: 'blinkit-zepto-products',
    name: 'Blinkit & Zepto Products',
    shortTitle: 'Blinkit & Zepto Product Image Cleaner',
    metaTitle: 'Blinkit & Zepto Product Image Background Remover (Transparent PNG)',
    metaDescription: 'Clean product photo backgrounds for Blinkit, Zepto, and quick-commerce dark stores. Instant transparent PNG and white cutouts for snacks, beverages, and groceries.',
    targetKeywords: ['Blinkit product photo maker', 'Zepto product image size', 'quick commerce white background', 'instant grocery transparent PNG'],
    marketplace: 'Blinkit & Zepto Quick Commerce',
    category: 'FMCG & Quick Commerce',
    badge: '10-Minute Dark Store Catalog Standard',
    tagline: 'Maximize quick commerce tap-through rates with crystal-clear transparent and white packshots.',
    heroHeadline: 'Blinkit & Zepto Product Image Background Remover',
    heroSubheadline: 'Quick commerce customers make buying decisions in under 3 seconds. Create crisp, high-contrast packshots for dark-store apps with instant transparent PNG exports.',
    specs: {
      recommendedResolution: '1000 x 1000 px or 1200 x 1200 px',
      aspectRatio: '1:1 Square',
      colorProfile: 'sRGB',
      backgroundRule: 'Transparent PNG or Pure White (RGB 255, 255, 255)',
      frameOccupancy: '80% to 90% product visibility',
      allowedFormats: 'PNG (Alpha transparency) or JPEG',
      maxFileSize: '5 MB',
    },
    guideOverview: 'Quick commerce interfaces are fast-paced, dense grids viewed almost exclusively on mobile devices. Dull backgrounds make grocery pouches, FMCG bottles, and snack packs unreadable, leading to lost cart additions.',
    guideSections: [
      {
        heading: '1. Why Transparent & Pure White Cutouts Win on Blinkit/Zepto',
        content: 'Blinkit and Zepto dynamic cards shift between white and neutral grey containers depending on app theme updates and promotional banners. Uploading a transparent PNG ensures your product renders seamlessly without an ugly boxed silhouette.',
        bulletPoints: [
          'High contrast bottle and box outlines ensure readability at 90x90px thumbnail scale.',
          'Front label text, net quantity (e.g. 500g, 1L), and key certifications must remain razor sharp.',
          'Transparent PNG cutouts allow quick-commerce merchandising teams to composite festive ribbons and sale badges.',
        ],
      },
      {
        heading: '2. Pouch & Bottle Reflection Management',
        content: 'FMCG pouches and glossy plastic bottles often catch harsh ceiling glare. When removing backgrounds, retain genuine label colors while discarding glare bleed. Our tool isolates the package silhouette cleanly.',
      },
      {
        heading: '3. Multipack and Bundle Guidelines',
        content: 'If listing a "Pack of 2" or "Buy 1 Get 1", align both physical units side-by-side on a shared horizon line. Never use artificial duplicate copy-pastes that skew perspective.',
      },
    ],
    rejectionChecklist: [
      'Low contrast against white dark-store app background',
      'Net weight or expiration date text obscured by poor background cutout',
      'Excessive padding causing product to appear smaller than competitor SKUs',
      'Jagged pixelated borders around translucent liquid bottles',
    ],
    faqs: [
      {
        question: 'Should I upload transparent PNG or white background to Blinkit seller onboarding?',
        answer: 'Both are widely accepted. Transparent PNG is preferred for listing kits and category banners, while pure white JPEG is standard for primary SKU cards.',
      },
      {
        question: 'Can I batch-process multiple snack or beverage SKUs?',
        answer: 'Yes! The tool runs directly in your browser with zero upload limits or server queues.',
      },
    ],
    relatedSlugs: ['swiggy-instamart-groceries', 'packaged-spices-and-masala', 'tea-and-coffee-packaging', 'amazon-india-products'],
  },

  // 3. Flipkart & Meesho Sellers
  'flipkart-meesho-sellers': {
    slug: 'flipkart-meesho-sellers',
    name: 'Flipkart & Meesho Sellers',
    shortTitle: 'Flipkart & Meesho Photo Cleaner',
    metaTitle: 'Flipkart & Meesho Seller Studio Photo Cleaner - Free Background Remover',
    metaDescription: 'Remove product photo backgrounds for Flipkart and Meesho seller listings. Pass automated QC checks with 100% pure white backgrounds for fashion, home, and electronics.',
    targetKeywords: ['Flipkart seller image rules', 'Meesho product photo cleaner', 'Flipkart white background maker', 'Meesho reseller photo tool'],
    marketplace: 'Flipkart & Meesho',
    category: 'Marketplaces',
    badge: 'Flipkart QC & Meesho Verified',
    tagline: 'Pass automated QC checks and stop listing rejections on Flipkart and Meesho.',
    heroHeadline: 'Flipkart & Meesho Seller Studio Photo Cleaner',
    heroSubheadline: 'Turn smartphone inventory photos into studio-quality white packshots that pass Flipkart QC checks on the first attempt.',
    specs: {
      recommendedResolution: '1200 x 1200 px (Min 500 x 500 px)',
      aspectRatio: '1:1 Square (or 3:4 for vertical fashion)',
      colorProfile: 'sRGB',
      backgroundRule: 'Pure White (RGB 255, 255, 255) for Hero Image',
      frameOccupancy: '80% minimum subject coverage',
      allowedFormats: 'JPEG / PNG',
      maxFileSize: '10 MB',
    },
    guideOverview: 'Flipkart quality compliance (QC) automated bots reject thousands of seller listings weekly due to uneven background lighting, home shadows, and non-white backgrounds. Meesho resellers also see up to 3x higher orders with clean white packshots.',
    guideSections: [
      {
        heading: '1. Passing Flipkart Automated Image QC',
        content: 'Flipkart automated listing QC scans the background RGB values at 12 distinct edge points. If shadow spill or non-white color is detected, the catalog status is marked "Rejected: Background Not Clean White".',
        bulletPoints: [
          'Guaranteed RGB (255,255,255) eliminates the dreaded "QC Image Ineligible" error.',
          'Zero distortion of product colors or fabric prints.',
          'Supports both square 1:1 and vertical fashion catalog orientations.',
        ],
      },
      {
        heading: '2. The Meesho Reseller Conversion Secret',
        content: 'Meesho buyers browse rapidly on budget smartphones. Clean white backgrounds highlight the product value, giving home-run brands an immediate edge over amateur snapshots with bedsheets or tiles in the background.',
      },
    ],
    rejectionChecklist: [
      'Room lighting gradient visible along corners',
      'Floor tiles or bedsheet patterns in background',
      'Watermarks or phone camera brand stamps ("Shot on Redmi")',
      'Product cut off at edge of frame',
    ],
    faqs: [
      {
        question: 'Can I use this for Meesho sarees and kurtis?',
        answer: 'Yes! Our tool cleanly separates intricate garment hemlines, dupatta folds, and laces while placing them onto a flawless white canvas.',
      },
      {
        question: 'Will this resize my image to Flipkart specs?',
        answer: 'The background removal preserves your source resolution and clarity, allowing high-resolution export up to 4K.',
      },
    ],
    relatedSlugs: ['amazon-india-products', 'sarees-and-ethnic-wear', 'handbags-and-leather-goods', 'footwear-and-sneakers'],
  },

  // 4. Jewellery & Watches
  'jewellery-and-diamonds': {
    slug: 'jewellery-and-diamonds',
    name: 'Jewellery & Diamonds',
    shortTitle: 'Jewellery Transparent Background Tool',
    metaTitle: 'Jewellery & Watch Transparent Background Tool | High Precision AI Cutout',
    metaDescription: 'Remove backgrounds from diamond rings, gold necklaces, and luxury watches with micro-precision. Sub-pixel AI matting for intricate chains and gemstones.',
    targetKeywords: ['jewellery background remover', 'diamond ring cutout tool', 'gold necklace transparent PNG', 'watch photoshoot background cleaner'],
    marketplace: 'CaratLane, Tanishq, Bluestone & DTC Stores',
    category: 'Jewellery & Luxury',
    badge: 'Micro-Gemstone Sub-Pixel Matting',
    tagline: 'Preserve gemstone refractions and micro-links with ultra-fine edge separation.',
    heroHeadline: 'Jewellery & Watch Transparent Background Tool',
    heroSubheadline: 'Eliminate velvet display props, ring holders, and dust. Keep every diamond facet, gold specular highlight, and sapphire glow intact.',
    specs: {
      recommendedResolution: '2400 x 2400 px Ultra HD',
      aspectRatio: '1:1 Square',
      colorProfile: 'Display P3 or sRGB',
      backgroundRule: 'Transparent PNG or Studio White / Pure Black #000000',
      frameOccupancy: '75% to 85% to highlight micro-details',
      allowedFormats: 'PNG (Lossless 24-bit with 8-bit Alpha)',
      maxFileSize: '15 MB',
    },
    guideOverview: 'Jewellery photography is the most difficult category in e-commerce. Conventional background removers destroy delicate chain links, clip diamond prongs, and blur metallic specular glints. Our model is optimized for high-frequency micro-edges.',
    guideSections: [
      {
        heading: '1. Preserving Gold & Platinum Highlights',
        content: 'Reflective gold and platinum pick up surrounding room lighting. The AI distinguishes between external background reflections and genuine metallic curvature, cleanly removing the backdrop without eating into gold prongs.',
        bulletPoints: [
          'Preserves filigree, hollow chain links, and diamond pavé settings.',
          'Eliminates acrylic risers, white putty, and ring clamps cleanly.',
          'Dual export: transparent PNG for luxury brochures or pure white for marketplace compliance.',
        ],
      },
      {
        heading: '2. Diamond Facet & Transparency Preservation',
        content: 'Natural diamonds refract background light. Our sub-pixel matting algorithm retains internal gemstone fire while eliminating murky velvet backdrops.',
      },
    ],
    rejectionChecklist: [
      'Chain links erased or turned blurry',
      'Diamond prong edges clipped by aggressive masking',
      'Velvet fuzz or dust specks left around base',
    ],
    faqs: [
      {
        question: 'Does it remove ring clamp stands?',
        answer: 'Yes! It isolates the metal band and gem crown, eliminating standard display putty and acrylic clamps.',
      },
      {
        question: 'Can I place the diamond cutout onto a luxury marble or dark velvet studio scene?',
        answer: 'Yes! After downloading your transparent PNG, click "Generate 1-Click Studio Background" to composite it directly onto photorealistic marble, velvet, or pedestal lighting with 10 free credits.',
      },
    ],
    relatedSlugs: ['gold-and-silver-ornaments', 'watches-and-smartwatches', 'cosmetics-and-skincare', 'amazon-india-products'],
  },

  // 5. Gold & Silver Ornaments
  'gold-and-silver-ornaments': {
    slug: 'gold-and-silver-ornaments',
    name: 'Gold & Silver Ornaments',
    shortTitle: 'Gold & Silver Jewellery Photo Cleaner',
    metaTitle: 'Gold & Silver Jewellery Photo Background Remover - Free Pure White Cutout',
    metaDescription: 'Clean backgrounds for traditional Indian gold bangles, silver payals, mangalsutras, and kundan sets. Retain authentic gold sheen and gemstone colors.',
    targetKeywords: ['Indian gold jewellery photo tool', 'silver payal background removal', 'kundan necklace white background', 'bangle studio cutout'],
    marketplace: 'Indian Gold Retailers & D2C Stores',
    category: 'Jewellery & Luxury',
    badge: 'Kundan & Polki Approved',
    tagline: 'Showcase authentic 22K gold luster and polki detailing with zero background distraction.',
    heroHeadline: 'Gold & Silver Jewellery Background Remover',
    heroSubheadline: 'Isolate intricate jhumkas, temple necklaces, and silver anklets with high-precision edge boundary detection.',
    specs: {
      recommendedResolution: '2000 x 2000 px',
      aspectRatio: '1:1 Square',
      colorProfile: 'sRGB',
      backgroundRule: 'Transparent PNG / Pure White #FFFFFF',
      frameOccupancy: '80% coverage',
      allowedFormats: 'PNG / JPEG',
      maxFileSize: '12 MB',
    },
    guideOverview: 'Traditional Indian gold and silver jewellery features complex jaali work, hanging pearls, and meenakari enameling. Standard photo editors butcher these delicate elements. Our tool preserves every tassel and bead.',
    guideSections: [
      {
        heading: '1. Preserving Meenakari and Kundan Textures',
        content: 'Indian traditional jewellery relies on vivid enamel colors. Our algorithm protects color fidelity across reds, greens, and pearls while erasing the display board.',
      },
    ],
    rejectionChecklist: ['Tassels cut off', 'Pearls blurred', 'Display stand clips visible'],
    faqs: [
      {
        question: 'Can this handle heavy bridal necklace sets?',
        answer: 'Yes, it accurately isolates broad choker neckpieces and earrings in a single pass.',
      },
    ],
    relatedSlugs: ['jewellery-and-diamonds', 'watches-and-smartwatches', 'sarees-and-ethnic-wear', 'amazon-india-products'],
  },

  // 6. Sarees & Ethnic Wear
  'sarees-and-ethnic-wear': {
    slug: 'sarees-and-ethnic-wear',
    name: 'Sarees & Ethnic Wear',
    shortTitle: 'Saree & Ethnic Wear Photo Cleaner',
    metaTitle: 'Indian Saree & Kurti Photo Cutout Studio - Free Background Remover',
    metaDescription: 'Remove backgrounds from saree pallus, lehengas, anarkalis, and kurtis. Retain authentic zari embroidery, silk sheen, and border fringes cleanly.',
    targetKeywords: ['saree photo background changer', 'kurti white background editor', 'lehenga cutout tool', 'ethnic wear catalog creator'],
    marketplace: 'Myntra, Ajio, Meesho, Nykaa Fashion',
    category: 'Fashion & Apparel',
    badge: 'Zari & Silk Fiber Preserving',
    tagline: 'Clean catalog images for Banarasi, Kanjeevaram, and designer ethnic wear.',
    heroHeadline: 'Saree & Ethnic Wear Background Remover',
    heroSubheadline: 'Isolate full-length models and flat-lay ethnic apparel from warehouse walls, mannequins, and uneven lighting.',
    specs: {
      recommendedResolution: '1800 x 2400 px (3:4 Fashion Ratio) or 2000 x 2000 px',
      aspectRatio: '3:4 Portrait or 1:1 Square',
      colorProfile: 'sRGB',
      backgroundRule: 'Pure White (RGB 255, 255, 255) or Soft Studio Neutral',
      frameOccupancy: '85% to 90%',
      allowedFormats: 'JPEG / PNG',
      maxFileSize: '10 MB',
    },
    guideOverview: 'Apparel marketplaces like Myntra and Ajio demand high visual fidelity on fabric textures. Zari threads and silk borders frequently get blurred by low-tier background removers.',
    guideSections: [
      {
        heading: '1. Handling Zari and Metallic Embroidery',
        content: 'Fine metallic zari work reflects flash lighting. Our tool differentiates fabric reflections from background clutter.',
      },
    ],
    rejectionChecklist: ['Pallu fringes amputated', 'Fabric color shifted', 'Mannequin pole remaining'],
    faqs: [
      {
        question: 'Does this work for mannequin ghost-neck photos?',
        answer: 'Yes! It cleanly removes the outer wall and floor while preserving the hollow collar outline.',
      },
    ],
    relatedSlugs: ['myntra-fashion-catalog', 'ajio-footwear-apparel', 'flipkart-meesho-sellers', 'handcrafts-and-ethnic-apparel'],
  },

  // 7. Myntra Fashion Catalog
  'myntra-fashion-catalog': {
    slug: 'myntra-fashion-catalog',
    name: 'Myntra Fashion Catalog',
    shortTitle: 'Myntra Studio Photo Cleaner',
    metaTitle: 'Myntra Studio Fashion & Apparel Background Remover (White & Neutral)',
    metaDescription: 'Format model photos and flat-lays to Myntra seller guidelines. Pure white and neutral grey studio backgrounds with precise 3:4 aspect ratio compliance.',
    targetKeywords: ['Myntra seller image guidelines', 'Myntra fashion photo editor', '3:4 portrait background remover', 'apparel white background Myntra'],
    marketplace: 'Myntra Studio & Marketplace',
    category: 'Fashion & Apparel',
    badge: 'Myntra 3:4 Studio Compliance',
    tagline: 'Pass strict Myntra brand partner guidelines with flawless model and flat-lay cutouts.',
    heroHeadline: 'Myntra Fashion Catalog Background Remover',
    heroSubheadline: 'Clean fashion model photos and apparel flat-lays with professional edge matting tuned for Myntra 3:4 portrait ratios.',
    specs: {
      recommendedResolution: '1080 x 1440 px or 2160 x 2880 px',
      aspectRatio: '3:4 Vertical Portrait',
      colorProfile: 'sRGB',
      backgroundRule: 'Off-White or Pure White RGB (255, 255, 255)',
      frameOccupancy: 'Model full body 85% frame height',
      allowedFormats: 'JPEG / PNG',
      maxFileSize: '8 MB',
    },
    guideOverview: 'Myntra has India’s highest fashion aesthetic standards. Uploading unedited warehouse shoots causes immediate batch rejection by catalog auditors.',
    guideSections: [
      {
        heading: '1. The Myntra 3:4 Vertical Framing Requirement',
        content: 'Unlike Amazon’s square format, Myntra prioritizes 3:4 portrait cards to maximize garment verticality on mobile feeds.',
      },
    ],
    rejectionChecklist: ['Incorrect aspect ratio', 'Shadow spill on floor', 'Hanging threads clipped'],
    faqs: [
      {
        question: 'Can I export in 3:4 portrait format?',
        answer: 'Yes! The removed background can be placed directly onto your 3:4 canvas or exported as transparent PNG.',
      },
    ],
    relatedSlugs: ['sarees-and-ethnic-wear', 'ajio-footwear-apparel', 'footwear-and-sneakers', 'handbags-and-leather-goods'],
  },

  // 8. Footwear & Sneakers
  'footwear-and-sneakers': {
    slug: 'footwear-and-sneakers',
    name: 'Footwear & Sneakers',
    shortTitle: 'Sneaker & Footwear White Background Tool',
    metaTitle: 'Sneaker & Footwear White Background Converter | Clean Shoe Photos',
    metaDescription: 'Remove backgrounds from sneakers, heels, sandals, and formal leather shoes. Generate pure white Amazon & Flipkart compliant footwear packshots in 1 click.',
    targetKeywords: ['shoe background remover', 'sneaker white background', 'footwear catalog photo tool', 'clean shoe photos online'],
    marketplace: 'Amazon, Flipkart, Myntra, Ajio',
    category: 'Fashion & Apparel',
    badge: 'Sole & Laces Clean Separation',
    tagline: 'Eliminate floor dust and shadows from sneaker and shoe photoshoots.',
    heroHeadline: 'Footwear & Sneaker Background Remover',
    heroSubheadline: 'Get crisp shoe cutouts with clean tread boundaries, loose lace preservation, and flawless pure white backgrounds.',
    specs: {
      recommendedResolution: '2000 x 2000 px',
      aspectRatio: '1:1 Square (Hero)',
      colorProfile: 'sRGB',
      backgroundRule: 'Pure White (RGB 255, 255, 255)',
      frameOccupancy: '80% length coverage',
      allowedFormats: 'JPEG / PNG',
      maxFileSize: '10 MB',
    },
    guideOverview: 'Shoe soles, micro-lugs, and eyelet laces are notorious for trapping unwanted background artifacts. Our AI cleanly isolates tread geometry without flattening sole contours.',
    guideSections: [
      {
        heading: '1. Eliminating Floor Reflections Without Losing Grounding',
        content: 'Shoe photos taken on glossy studio floors often have heavy reflections that confuse basic editors. Our tool cleanly separates the rubber outsole.',
      },
    ],
    rejectionChecklist: ['Treads cut off', 'Shoelaces erased', 'Mud/dirt on base'],
    faqs: [
      {
        question: 'Does this work for floating 45-degree angle shoe photos?',
        answer: 'Yes! The algorithm separates angled and side-profile shoe poses effortlessly.',
      },
    ],
    relatedSlugs: ['handbags-and-leather-goods', 'myntra-fashion-catalog', 'ajio-footwear-apparel', 'amazon-india-products'],
  },

  // 9. Cosmetics & Skincare
  'cosmetics-and-skincare': {
    slug: 'cosmetics-and-skincare',
    name: 'Cosmetics & Skincare',
    shortTitle: 'Cosmetics & Skincare Jar Cutout Tool',
    metaTitle: 'Serum Bottles & Skincare Jar Transparent PNG Maker | Nykaa & Purplle',
    metaDescription: 'Extract transparent cutouts for glass serum bottles, cosmetic jars, lipsticks, and lotion pumps. Flawless glass refractions and label preservation.',
    targetKeywords: ['cosmetics background remover', 'serum bottle cutout tool', 'Nykaa seller image clean', 'skincare transparent PNG'],
    marketplace: 'Nykaa, Purplle, Amazon Beauty, D2C',
    category: 'Beauty & Personal Care',
    badge: 'Glass Refraction & Liquid Preserving',
    tagline: 'High-end aesthetic packshots for D2C beauty and cosmetic brands.',
    heroHeadline: 'Cosmetics & Skincare Background Remover',
    heroSubheadline: 'Clean glass dropper bottles, amber jars, and frosted cosmetic containers while keeping authentic liquid color and transparency.',
    specs: {
      recommendedResolution: '2000 x 2000 px',
      aspectRatio: '1:1 Square',
      colorProfile: 'sRGB',
      backgroundRule: 'Transparent PNG / Pure White #FFFFFF',
      frameOccupancy: '80% vertical height',
      allowedFormats: 'PNG (Alpha) / JPEG',
      maxFileSize: '10 MB',
    },
    guideOverview: 'Cosmetic packaging uses translucent glass, metallic pump caps, and glossy labels that reflect studio softboxes. Our tool isolates the bottle silhouette without wiping out the liquid inside.',
    guideSections: [
      {
        heading: '1. Glass Droppers and Liquid Levels',
        content: 'Dropper pipettes and amber glass bottles require delicate alpha blending to prevent the liquid boundary from turning grey.',
      },
    ],
    rejectionChecklist: ['Glass transparency turned opaque black', 'Dropper tip clipped', 'Label text washed out'],
    faqs: [
      {
        question: 'Can I add luxury bathroom or botanical studio backgrounds after cutout?',
        answer: 'Yes! Simply click "Generate Studio Scene" after downloading to place your bottle on stone pedestals or luxury foam ripples with 10 free credits.',
      },
    ],
    relatedSlugs: ['nykaa-purplle-cosmetics', 'packaged-spices-and-masala', 'ayurvedic-supplements', 'amazon-india-products'],
  },

  // 10. Nykaa & Purplle Cosmetics
  'nykaa-purplle-cosmetics': {
    slug: 'nykaa-purplle-cosmetics',
    name: 'Nykaa & Purplle Cosmetics',
    shortTitle: 'Nykaa & Purplle Photo Cleaner',
    metaTitle: 'Nykaa & Purplle Beauty Product Cutout Tool | Clean White Backgrounds',
    metaDescription: 'Prepare beauty product packshots for Nykaa and Purplle seller onboarding. Meets strict D2C cosmetics photography guidelines with pure white exports.',
    targetKeywords: ['Nykaa product photo requirements', 'Purplle seller image tool', 'beauty packshot cleaner', 'lipstick white background'],
    marketplace: 'Nykaa & Purplle',
    category: 'Beauty & Personal Care',
    badge: 'Nykaa Brand Partner Compliant',
    tagline: 'Meet India’s top beauty marketplaces’ strict aesthetic standards.',
    heroHeadline: 'Nykaa & Purplle Beauty Product Cutout Tool',
    heroSubheadline: 'Instantly prepare makeup compacts, lipsticks, perfume flacons, and shampoo bottles for seamless Nykaa & Purplle listing approval.',
    specs: {
      recommendedResolution: '1500 x 1500 px to 2000 x 2000 px',
      aspectRatio: '1:1 Square',
      colorProfile: 'sRGB',
      backgroundRule: 'Pure White (RGB 255, 255, 255)',
      frameOccupancy: '85% frame filling',
      allowedFormats: 'JPEG / PNG',
      maxFileSize: '8 MB',
    },
    guideOverview: 'Beauty shoppers judge quality through visual cleanliness. Smudged reflections and murky studio corners drive bounce rates up on Nykaa brand pages.',
    guideSections: [
      {
        heading: '1. Shade Accuracy in Lipstick and Foundations',
        content: 'Maintaining exact color swatches is paramount in beauty. The tool strips backgrounds without color grading or hue shifting your cosmetics.',
      },
    ],
    rejectionChecklist: ['Color shift in cosmetic shades', 'Reflections of photographer in bottle caps'],
    faqs: [
      {
        question: 'Does it preserve gold embossing on perfume caps?',
        answer: 'Yes! Highly reflective gold and silver foil embossings are cleanly recognized as foreground elements.',
      },
    ],
    relatedSlugs: ['cosmetics-and-skincare', 'ayurvedic-supplements', 'amazon-india-products', 'jewellery-and-diamonds'],
  },

  // 11. Swiggy Instamart Groceries
  'swiggy-instamart-groceries': {
    slug: 'swiggy-instamart-groceries',
    name: 'Swiggy Instamart Groceries',
    shortTitle: 'Swiggy Instamart Packaged Goods Tool',
    metaTitle: 'Swiggy Instamart Packaged Goods Photo Cleaner | Transparent PNG & White',
    metaDescription: 'Clean packaged food, beverages, and household goods photos for Swiggy Instamart seller catalog. Fast in-browser transparent PNG cutout tool.',
    targetKeywords: ['Swiggy Instamart product photo', 'grocery image background remover', 'Instamart seller portal image', 'FMCG packshot clean'],
    marketplace: 'Swiggy Instamart',
    category: 'FMCG & Quick Commerce',
    badge: 'Swiggy Instamart Catalog Ready',
    tagline: 'Get your FMCG brand listed on 10-minute grocery delivery apps with compliant packshots.',
    heroHeadline: 'Swiggy Instamart Packaged Goods Photo Cleaner',
    heroSubheadline: 'Eliminate warehouse backgrounds and glare from pulses, biscuits, cooking oils, and dairy items for instant Instamart catalog onboarding.',
    specs: {
      recommendedResolution: '1000 x 1000 px',
      aspectRatio: '1:1 Square',
      colorProfile: 'sRGB',
      backgroundRule: 'Pure White #FFFFFF or Transparent PNG',
      frameOccupancy: '85% subject filling',
      allowedFormats: 'PNG / JPEG',
      maxFileSize: '5 MB',
    },
    guideOverview: 'Grocery items in quick commerce are viewed by time-pressed shoppers. Clear separation between packaging and background prevents misclicks and returns.',
    guideSections: [
      {
        heading: '1. Bag & Pouch Contour Handling',
        content: 'Crinkled chip bags and flexible flour pouches have uneven silhouettes. Our AI tracks organic edges accurately without cutting into brand typography.',
      },
    ],
    rejectionChecklist: ['Weight text unreadable', 'Distorted pouch corners'],
    faqs: [
      {
        question: 'Can I use this for glass honey and pickle jars?',
        answer: 'Yes, it cleanly handles glass pickle jars, ghee tins, and oil containers.',
      },
    ],
    relatedSlugs: ['blinkit-zepto-products', 'packaged-spices-and-masala', 'tea-and-coffee-packaging', 'jiomart-kirana-products'],
  },

  // 12. Packaged Spices & Masalas
  'packaged-spices-and-masala': {
    slug: 'packaged-spices-and-masala',
    name: 'Packaged Spices & Masalas',
    shortTitle: 'Spice Pouch Photo Background Remover',
    metaTitle: 'Indian Spices & FMCG Pouch Photo Cleaner - Free Background Remover',
    metaDescription: 'Remove backgrounds from turmeric, garam masala, chilli powder, and spice boxes. Pure white backgrounds for Amazon, Blinkit, and export catalogs.',
    targetKeywords: ['spice pouch background removal', 'masala packshot cleaner', 'Indian grocery white background', 'spice box photo editor'],
    marketplace: 'Amazon Pantry, Blinkit, Zepto, JioMart',
    category: 'FMCG & Quick Commerce',
    badge: 'FMCG Pouch Contrast Optimizer',
    tagline: 'Make your spice brand pop on Indian grocery app feeds.',
    heroHeadline: 'Packaged Spices & Masala Background Remover',
    heroSubheadline: 'Highlight vibrant brand packaging, organic badges, and FSSAI license marks with 100% distraction-free pure white cutouts.',
    specs: {
      recommendedResolution: '1500 x 1500 px',
      aspectRatio: '1:1 Square',
      colorProfile: 'sRGB',
      backgroundRule: 'Pure White (RGB 255, 255, 255)',
      frameOccupancy: '85% coverage',
      allowedFormats: 'JPEG / PNG',
      maxFileSize: '8 MB',
    },
    guideOverview: 'Spice packaging often uses metallic foil or bold red/yellow palettes that get degraded by poor lighting. Our tool isolates the pouch cleanly without color bleed.',
    guideSections: [
      {
        heading: '1. Foil Packaging Glare Reduction',
        content: 'Foil zip pouches reflect camera flash. The background remover removes ambient reflections while preserving package branding.',
      },
    ],
    rejectionChecklist: ['Torn pouch corner artifacts', 'FSSAI mark cut off'],
    faqs: [
      {
        question: 'Does it work on standing pouches with gussets?',
        answer: 'Yes, bottom gusset folds and zip-lock headers are fully preserved.',
      },
    ],
    relatedSlugs: ['tea-and-coffee-packaging', 'ayurvedic-supplements', 'swiggy-instamart-groceries', 'amazon-india-products'],
  },

  // 13. Tea & Coffee Packaging
  'tea-and-coffee-packaging': {
    slug: 'tea-and-coffee-packaging',
    name: 'Tea & Coffee Packaging',
    shortTitle: 'Tea & Coffee Packshot Cleaner',
    metaTitle: 'Artisanal Coffee & Tea Packshot Cutout Tool | Transparent PNG & White',
    metaDescription: 'Clean backgrounds for artisanal coffee bean bags, Darjeeling tea tins, and filter coffee packs. Professional e-commerce ready transparent cutouts.',
    targetKeywords: ['coffee bag background remover', 'tea tin cutout tool', 'artisanal coffee packshot', 'beverage white background'],
    marketplace: 'Amazon India, D2C, Blinkit',
    category: 'FMCG & Quick Commerce',
    badge: 'Artisanal Beverage Packshot Ready',
    tagline: 'Give your artisanal coffee and single-estate tea the luxury packshot it deserves.',
    heroHeadline: 'Tea & Coffee Packaging Background Remover',
    heroSubheadline: 'Isolate tin canisters, craft paper coffee pouches, and dip bags from messy kitchen counters into flawless studio packshots.',
    specs: {
      recommendedResolution: '2000 x 2000 px',
      aspectRatio: '1:1 Square',
      colorProfile: 'sRGB',
      backgroundRule: 'Pure White (RGB 255, 255, 255) / Transparent',
      frameOccupancy: '80% to 85%',
      allowedFormats: 'PNG / JPEG',
      maxFileSize: '10 MB',
    },
    guideOverview: 'Craft beverage brands rely heavily on packaging texture (matte craft paper, debossed tin). Our tool keeps paper grain intact while eliminating the background.',
    guideSections: [
      {
        heading: '1. Matte Craft Paper Texture Preservation',
        content: 'Retains micro-fibers of textured coffee bags without softening edges.',
      },
    ],
    rejectionChecklist: ['Degassing valve blurred', 'Canister rim chopped'],
    faqs: [
      {
        question: 'Can I generate a warm café table background after removal?',
        answer: 'Yes! Click "Generate 1-Click Studio Background" to composite your coffee bag onto wooden counters with roasted beans.',
      },
    ],
    relatedSlugs: ['packaged-spices-and-masala', 'ayurvedic-supplements', 'blinkit-zepto-products', 'amazon-india-products'],
  },

  // 14. Ayurvedic & Health Supplements
  'ayurvedic-supplements': {
    slug: 'ayurvedic-supplements',
    name: 'Ayurvedic Supplements',
    shortTitle: 'Ayurvedic Product Background Cleaner',
    metaTitle: 'Ayurvedic & Herbal Product Label Isolation Tool | Free White Background',
    metaDescription: 'Remove backgrounds from chyawanprash jars, herbal capsule bottles, and ayurvedic oils. Clean white Amazon, Flipkart, and 1mg compliant exports.',
    targetKeywords: ['ayurvedic bottle background remover', 'herbal medicine photo clean', 'supplement bottle white background', 'Tata 1mg product photo'],
    marketplace: 'Tata 1mg, Apollo, Amazon, Flipkart',
    category: 'Beauty & Personal Care',
    badge: 'Pharma & Herbal Standard',
    tagline: 'Build immediate consumer trust with crisp, clinical-grade supplement packshots.',
    heroHeadline: 'Ayurvedic & Herbal Product Background Remover',
    heroSubheadline: 'Isolate supplement bottles, dropper vials, and herbal jars with 100% readable ingredients labels on a pure white background.',
    specs: {
      recommendedResolution: '2000 x 2000 px',
      aspectRatio: '1:1 Square',
      colorProfile: 'sRGB',
      backgroundRule: 'Pure White (RGB 255, 255, 255)',
      frameOccupancy: '85% frame height',
      allowedFormats: 'JPEG / PNG',
      maxFileSize: '8 MB',
    },
    guideOverview: 'Health and ayurvedic products require high trust. Grainy, poorly isolated photos trigger customer suspicion regarding counterfeit medicine.',
    guideSections: [
      {
        heading: '1. Ensuring Ingredient Table Legibility',
        content: 'Medicine portals like Tata 1mg reject images where background clipping interferes with dosage tables or safety seals.',
      },
    ],
    rejectionChecklist: ['Tamper-evident cap seal erased', 'Label text blurred'],
    faqs: [
      {
        question: 'Does this meet Tata 1mg and Apollo 24/7 seller specs?',
        answer: 'Yes, pure RGB (255,255,255) white meets all online pharmacy standards in India.',
      },
    ],
    relatedSlugs: ['cosmetics-and-skincare', 'packaged-spices-and-masala', 'tata-1mg-pharma-products', 'amazon-india-products'],
  },

  // 15. Handbags & Leather Goods
  'handbags-and-leather-goods': {
    slug: 'handbags-and-leather-goods',
    name: 'Handbags & Leather Goods',
    shortTitle: 'Handbag & Wallet Cutout Tool',
    metaTitle: 'Handbag & Wallet Product Cutout Tool | Clean White Backgrounds',
    metaDescription: 'Remove backgrounds from leather tote bags, clutches, backpacks, and wallets. Preserve leather grain, metallic buckles, and strap silhouettes cleanly.',
    targetKeywords: ['handbag photo background removal', 'leather wallet cutout tool', 'backpack white background', 'handbag catalog maker'],
    marketplace: 'Myntra, Amazon, Ajio, Flipkart',
    category: 'Fashion & Apparel',
    badge: 'Leather Grain & Strap Matting',
    tagline: 'Clean strap cutouts and metallic clasp preservation for luxury and D2C leather brands.',
    heroHeadline: 'Handbag & Leather Goods Background Remover',
    heroSubheadline: 'Isolate hanging bag straps, zipper pulls, and textured vegan leather without background bleeding through gaps.',
    specs: {
      recommendedResolution: '2000 x 2000 px',
      aspectRatio: '1:1 Square',
      colorProfile: 'sRGB',
      backgroundRule: 'Pure White (RGB 255, 255, 255)',
      frameOccupancy: '80% to 85%',
      allowedFormats: 'JPEG / PNG',
      maxFileSize: '10 MB',
    },
    guideOverview: 'Handbag handles create closed loops with background showing through. Basic editors fail to clear the space inside the handle loop, ruining the listing.',
    guideSections: [
      {
        heading: '1. Hollow Handle Loop Isolation',
        content: 'Our advanced algorithm detects negative spaces inside bag handles, clearing background clutter completely.',
      },
    ],
    rejectionChecklist: ['Background trapped inside handle hole', 'Zipper pull clipped'],
    faqs: [
      {
        question: 'Does it remove the background inside the strap loop?',
        answer: 'Yes! Hollow voids between bag handles and the body are automatically emptied.',
      },
    ],
    relatedSlugs: ['footwear-and-sneakers', 'watches-and-smartwatches', 'myntra-fashion-catalog', 'amazon-india-products'],
  },

  // 16. Watches & Smartwatches
  'watches-and-smartwatches': {
    slug: 'watches-and-smartwatches',
    name: 'Watches & Smartwatches',
    shortTitle: 'Watch & Smartwatch Photo Cleaner',
    metaTitle: 'Wristwatch & Luxury Timepiece Photo Cleaner | Transparent PNG & White',
    metaDescription: 'Clean backgrounds for analog watches, smartwatches, fitness bands, and strap accessories. High-contrast dial clarity and bezel preservation.',
    targetKeywords: ['watch photo background remover', 'smartwatch cutout tool', 'watch dial photo clean', 'luxury watch white background'],
    marketplace: 'Amazon India, Flipkart, Myntra, Tata CLiQ',
    category: 'Jewellery & Luxury',
    badge: 'Sapphire Crystal & Dial Preserving',
    tagline: 'Zero glare distortion on smartwatch AMOLED displays and luxury sapphire dials.',
    heroHeadline: 'Watch & Smartwatch Background Remover',
    heroSubheadline: 'Extract luxury chronographs and fitness bands with crisp strap textures, sharp crown buttons, and pure white backgrounds.',
    specs: {
      recommendedResolution: '2400 x 2400 px',
      aspectRatio: '1:1 Square',
      colorProfile: 'sRGB',
      backgroundRule: 'Pure White (RGB 255, 255, 255) / Transparent',
      frameOccupancy: '80% height coverage',
      allowedFormats: 'PNG / JPEG',
      maxFileSize: '12 MB',
    },
    guideOverview: 'Smartwatch screens and domed watch crystals reflect ambient surroundings. Our tool cleanly separates the casing and strap while maintaining dial legibility.',
    guideSections: [
      {
        heading: '1. Dial Anti-Reflective Clarity',
        content: 'Preserves the contrast of printed hour markers and digital AMOLED digits.',
      },
    ],
    rejectionChecklist: ['Strap holes clogged with background color', 'Bezel edge melted'],
    faqs: [
      {
        question: 'Can I isolate mesh and stainless steel link straps?',
        answer: 'Yes, fine metal link bracelets are isolated without blur.',
      },
    ],
    relatedSlugs: ['jewellery-and-diamonds', 'electronics-and-cables', 'handbags-and-leather-goods', 'amazon-india-products'],
  },

  // 17. Electronics & Cables
  'electronics-and-cables': {
    slug: 'electronics-and-cables',
    name: 'Electronics & Mobile Cables',
    shortTitle: 'Electronics & Cable Photo Cleaner',
    metaTitle: 'Electronics & Mobile Accessories Pure White Maker - Free Background Remover',
    metaDescription: 'Remove backgrounds from power banks, USB cables, earphones, and chargers. Amazon & Flipkart compliant white background tool for electronics sellers.',
    targetKeywords: ['electronics background remover', 'cable photo cutout tool', 'charger white background', 'Amazon electronics image spec'],
    marketplace: 'Amazon India, Flipkart, JioMart',
    category: 'Electronics & Gadgets',
    badge: 'Wire & Connector Precision Cutout',
    tagline: 'Accurate thin wire and metallic connector matting for tech accessories.',
    heroHeadline: 'Electronics & Mobile Cable Background Remover',
    heroSubheadline: 'Clean charging cables, wireless earbuds, adapters, and power banks into 100% white e-commerce catalog packshots.',
    specs: {
      recommendedResolution: '2000 x 2000 px',
      aspectRatio: '1:1 Square',
      colorProfile: 'sRGB',
      backgroundRule: 'Pure White (RGB 255, 255, 255)',
      frameOccupancy: '85% area coverage',
      allowedFormats: 'JPEG / PNG',
      maxFileSize: '8 MB',
    },
    guideOverview: 'Thin cords and USB tips often get erased by background removal tools. Our model recognizes long continuous wire paths cleanly.',
    guideSections: [
      {
        heading: '1. Thin Cord and Port Pin Matting',
        content: 'Maintains connector pins and braided cord texture without breakage.',
      },
    ],
    rejectionChecklist: ['Cable broken into disconnected segments', 'Charging pins wiped out'],
    faqs: [
      {
        question: 'Can it handle coiled cables?',
        answer: 'Yes, both coiled and straight cables are preserved without gaps.',
      },
    ],
    relatedSlugs: ['mobile-cases-and-covers', 'watches-and-smartwatches', 'amazon-india-products', 'flipkart-meesho-sellers'],
  },

  // 18. Mobile Cases & Covers
  'mobile-cases-and-covers': {
    slug: 'mobile-cases-and-covers',
    name: 'Mobile Cases & Covers',
    shortTitle: 'Phone Case Background Cleaner',
    metaTitle: 'Phone Case E-Commerce Transparent PNG Maker | Clean White Backgrounds',
    metaDescription: 'Extract phone case graphics and covers cleanly. Pure white and transparent PNG cutouts for iPhone and Android cases on Amazon, Meesho, and Flipkart.',
    targetKeywords: ['phone case background remover', 'mobile cover photo cleaner', 'iPhone case transparent PNG', 'Meesho phone cover editor'],
    marketplace: 'Amazon, Meesho, Flipkart, D2C',
    category: 'Electronics & Gadgets',
    badge: 'Camera Cutout & Print Preserving',
    tagline: 'High volume background cleaner for phone cover manufacturers and resellers.',
    heroHeadline: 'Mobile Case & Cover Background Remover',
    heroSubheadline: 'Isolate printed phone cases, silicon bumpers, and leather flip covers. Empties camera cutouts cleanly.',
    specs: {
      recommendedResolution: '1500 x 1500 px or 2000 x 2000 px',
      aspectRatio: '1:1 Square or 3:4',
      colorProfile: 'sRGB',
      backgroundRule: 'Pure White (RGB 255, 255, 255)',
      frameOccupancy: '85% frame height',
      allowedFormats: 'JPEG / PNG',
      maxFileSize: '8 MB',
    },
    guideOverview: 'Camera module lens cutouts must show transparent or pure white backdrops, not the table underneath. Our tool empties camera holes automatically.',
    guideSections: [
      {
        heading: '1. Clearing Lens and Flash Openings',
        content: 'Automatically identifies and clears internal cutouts for camera rings, flash holes, and charging ports.',
      },
    ],
    rejectionChecklist: ['Background visible inside camera hole', 'Case edges blurred'],
    faqs: [
      {
        question: 'Does it remove the table surface inside the camera hole?',
        answer: 'Yes! The camera lens cutout is recognized as a negative space and wiped clean.',
      },
    ],
    relatedSlugs: ['electronics-and-cables', 'flipkart-meesho-sellers', 'amazon-india-products', 'handbags-and-leather-goods'],
  },

  // 19. Indian Handicrafts & Brassware
  'home-decor-and-handicrafts': {
    slug: 'home-decor-and-handicrafts',
    name: 'Home Decor & Handicrafts',
    shortTitle: 'Handicraft & Decor Photo Cleaner',
    metaTitle: 'Indian Handicrafts & Brassware Background Remover | Amazon Karigar Ready',
    metaDescription: 'Remove backgrounds from brass diyas, wooden statues, marble vases, and handmade pottery. Amazon Karigar & Etsy ready pure white and transparent cutouts.',
    targetKeywords: ['handicrafts background remover', 'brass diya photo clean', 'Amazon Karigar image specs', 'wooden statue cutout'],
    marketplace: 'Amazon Karigar, Etsy, Flipkart Samarth',
    category: 'Handicrafts & Art',
    badge: 'Artisan & Carving Preserving',
    tagline: 'Showcase authentic Indian artisan craftsmanship without workshop clutter.',
    heroHeadline: 'Indian Handicrafts & Decor Background Remover',
    heroSubheadline: 'Turn artisan workshop photos into clean e-commerce listings while retaining hand-carved wood grain and brass patina.',
    specs: {
      recommendedResolution: '2000 x 2000 px',
      aspectRatio: '1:1 Square',
      colorProfile: 'sRGB',
      backgroundRule: 'Pure White (RGB 255, 255, 255) / Transparent',
      frameOccupancy: '80% to 85%',
      allowedFormats: 'JPEG / PNG',
      maxFileSize: '12 MB',
    },
    guideOverview: 'Handmade products are photographed in rural artisan workshops with uneven walls. Our tool transforms rustic workshop snapshots into high-value export catalog assets.',
    guideSections: [
      {
        heading: '1. Protecting Intricate Wood and Metal Carvings',
        content: 'Preserves micro-indentations in carved Sheesham wood and engraved brass artifacts.',
      },
    ],
    rejectionChecklist: ['Workshop tools visible in background', 'Carved tips rounded off'],
    faqs: [
      {
        question: 'Does it work for brass idols with halo prabhavalis?',
        answer: 'Yes! Fine filigree arches and diya nozzles are isolated with high boundary precision.',
      },
    ],
    relatedSlugs: ['kitchenware-and-cookware', 'amazon-india-products', 'flipkart-meesho-sellers', 'jewellery-and-diamonds'],
  },

  // 20. Kitchenware & Cookware
  'kitchenware-and-cookware': {
    slug: 'kitchenware-and-cookware',
    name: 'Kitchenware & Cookware',
    shortTitle: 'Cookware & Utensil Photo Cleaner',
    metaTitle: 'Cookware, Kadai & Utensils White Studio Tool | Amazon & Flipkart Ready',
    metaDescription: 'Remove backgrounds from stainless steel pots, pressure cookers, non-stick tawas, and knives. Amazon and Flipkart compliant pure white cutouts.',
    targetKeywords: ['cookware background remover', 'utensil photo cleaner', 'pressure cooker white background', 'kitchenware catalog tool'],
    marketplace: 'Amazon India, Flipkart, JioMart',
    category: 'Home & Living',
    badge: 'Stainless Steel & Handle Matting',
    tagline: 'Clean stainless steel reflections and bakelite handles effortlessly.',
    heroHeadline: 'Kitchenware & Cookware Background Remover',
    heroSubheadline: 'Transform kitchen photos of pressure cookers, kadais, and frying pans into studio-standard white marketplace images.',
    specs: {
      recommendedResolution: '2000 x 2000 px',
      aspectRatio: '1:1 Square',
      colorProfile: 'sRGB',
      backgroundRule: 'Pure White (RGB 255, 255, 255)',
      frameOccupancy: '85% frame width',
      allowedFormats: 'JPEG / PNG',
      maxFileSize: '10 MB',
    },
    guideOverview: 'Polished stainless steel acts like a curved mirror reflecting room walls. The tool strips away external room borders while keeping metal surface gloss authentic.',
    guideSections: [
      {
        heading: '1. Stainless Steel Mirroring Isolation',
        content: 'Separates edge boundaries cleanly despite extreme reflectivity.',
      },
    ],
    rejectionChecklist: ['Pan handles chopped off', 'Steel rim distorted'],
    faqs: [
      {
        question: 'Does it keep black bakelite handle details?',
        answer: 'Yes, dark handles are cleanly distinguished from dark shadows and preserved.',
      },
    ],
    relatedSlugs: ['home-decor-and-handicrafts', 'amazon-india-products', 'flipkart-meesho-sellers', 'blinkit-zepto-products'],
  },

  // 21. Toys & Baby Products
  'toys-and-baby-products': {
    slug: 'toys-and-baby-products',
    name: 'Toys & Baby Products',
    shortTitle: 'Toy & Baby Product Photo Cleaner',
    metaTitle: 'Kids Toys & Baby Care Marketplace Image Prep | Free White Background',
    metaDescription: 'Clean backgrounds for soft toys, baby feeding bottles, strollers, and games. Pass Amazon and FirstCry seller photo compliance in seconds.',
    targetKeywords: ['toy background remover', 'baby bottle photo cleaner', 'FirstCry seller image guidelines', 'plush toy white background'],
    marketplace: 'FirstCry, Amazon, Flipkart',
    category: 'Home & Living',
    badge: 'FirstCry & Amazon Approved',
    tagline: 'Safe, colorful, and clinical white packshots for parents and baby care portals.',
    heroHeadline: 'Toys & Baby Products Background Remover',
    heroSubheadline: 'Isolate plush teddy bears, feeding bottles, and baby toys from nursery floors into compliant pure white packshots.',
    specs: {
      recommendedResolution: '2000 x 2000 px',
      aspectRatio: '1:1 Square',
      colorProfile: 'sRGB',
      backgroundRule: 'Pure White (RGB 255, 255, 255)',
      frameOccupancy: '85% frame filling',
      allowedFormats: 'JPEG / PNG',
      maxFileSize: '8 MB',
    },
    guideOverview: 'Soft toys have fuzzy textile hairs that turn blocky with bad masking. Our sub-pixel matting keeps plush fabric soft and natural.',
    guideSections: [
      {
        heading: '1. Plush Fuzz Preservation',
        content: 'Maintains soft fur edges on stuffed animals without harsh cutout lines.',
      },
    ],
    rejectionChecklist: ['Fuzzy fur trimmed into jagged blocks', 'Baby bottle measurement markings lost'],
    faqs: [
      {
        question: 'Does it work for FirstCry listing compliance?',
        answer: 'Yes, it outputs compliant RGB (255,255,255) images suitable for FirstCry.',
      },
    ],
    relatedSlugs: ['cosmetics-and-skincare', 'amazon-india-products', 'flipkart-meesho-sellers', 'packaged-spices-and-masala'],
  },

  // 22. Amazon FBA Hero Images
  'amazon-fba-hero-images': {
    slug: 'amazon-fba-hero-images',
    name: 'Amazon FBA Hero Images',
    shortTitle: 'Amazon FBA Main Hero Packshot Tool',
    metaTitle: 'Amazon FBA Main Hero Image 85% Frame Filler | Pure White RGB 255',
    metaDescription: 'Optimize primary Amazon FBA product images. Perfect 85% frame coverage, pure RGB 255,255,255 white background, and high-resolution zoom readiness.',
    targetKeywords: ['Amazon FBA main image tool', 'Amazon 85 percent rule checker', 'FBA hero packshot generator', 'Amazon listing optimizer'],
    marketplace: 'Amazon Global & India FBA',
    category: 'Marketplaces',
    badge: 'Amazon FBA Prime Certified',
    tagline: 'Never fail Amazon automated image suppression bots again.',
    heroHeadline: 'Amazon FBA Main Hero Packshot Tool',
    heroSubheadline: 'Ensure full compliance with Amazon 2026 Seller Central imaging rules. 100% true white RGB 255 perimeter with 85% frame filling.',
    specs: {
      recommendedResolution: '2000 x 2000 px (3x Hover Zoom)',
      aspectRatio: '1:1 Square',
      colorProfile: 'sRGB',
      backgroundRule: 'Mandatory Pure White (RGB 255, 255, 255)',
      frameOccupancy: 'Strictly 85% or greater',
      allowedFormats: 'JPEG (.jpg)',
      maxFileSize: '10 MB',
    },
    guideOverview: 'Amazon automated bots scan for negative space and edge RGB values. Suppressed listings lose buy-box eligibility and search placement instantly.',
    guideSections: [
      {
        heading: '1. The Automated FBA Bot Audit',
        content: 'Explains how Amazon crawler measures color variance and padding before approving prime badges.',
      },
    ],
    rejectionChecklist: ['Corner pixels != (255, 255, 255)', 'Padding exceeds 15%'],
    faqs: [
      {
        question: 'Can I re-upload a previously suppressed ASIN photo?',
        answer: 'Yes, processing your image here will fix the non-white background and pass reinstatement.',
      },
    ],
    relatedSlugs: ['amazon-india-products', 'flipkart-meesho-sellers', 'blinkit-zepto-products', 'footwear-and-sneakers'],
  },

  // 23. JioMart Kirana Products
  'jiomart-kirana-products': {
    slug: 'jiomart-kirana-products',
    name: 'JioMart Kirana Products',
    shortTitle: 'JioMart Seller Photo Tool',
    metaTitle: 'JioMart Seller White Background Tool | Clean Grocery & FMCG Packshots',
    metaDescription: 'Clean product photo backgrounds for JioMart merchant listings. Fast pure white background maker for packaged groceries, personal care, and kirana supplies.',
    targetKeywords: ['JioMart seller image size', 'JioMart product photo clean', 'kirana store product background', 'JioMart white background tool'],
    marketplace: 'JioMart Seller Portal',
    category: 'FMCG & Quick Commerce',
    badge: 'JioMart Merchant Onboarding Compliant',
    tagline: 'Fast-track your kirana and grocery catalog approvals on JioMart.',
    heroHeadline: 'JioMart Kirana Product Background Remover',
    heroSubheadline: 'Convert smartphone inventory photos of rice bags, cooking oils, and pulses into approved JioMart catalog images.',
    specs: {
      recommendedResolution: '1200 x 1200 px',
      aspectRatio: '1:1 Square',
      colorProfile: 'sRGB',
      backgroundRule: 'Pure White (RGB 255, 255, 255)',
      frameOccupancy: '80% to 90%',
      allowedFormats: 'JPEG / PNG',
      maxFileSize: '5 MB',
    },
    guideOverview: 'JioMart onboarding checks reject poorly lit shop photos. A pure white cutout ensures instant merchant approval.',
    guideSections: [
      {
        heading: '1. Standardizing Kirana Inventory Photos',
        content: 'Provides quick ways for local store owners to scan items against plain backgrounds.',
      },
    ],
    rejectionChecklist: ['Shop shelves visible behind product', 'Uneven yellow fluorescent lighting'],
    faqs: [
      {
        question: 'Can I use photos taken inside my physical shop?',
        answer: 'Yes! Our tool removes all shop counters, racks, and wall tiles completely.',
      },
    ],
    relatedSlugs: ['blinkit-zepto-products', 'swiggy-instamart-groceries', 'packaged-spices-and-masala', 'amazon-india-products'],
  },

  // 24. Tata 1mg Pharma Products
  'tata-1mg-pharma-products': {
    slug: 'tata-1mg-pharma-products',
    name: 'Tata 1mg Pharma Products',
    shortTitle: 'Tata 1mg & Apollo Packshot Cleaner',
    metaTitle: 'Tata 1mg & Apollo Medicine Packshot Tool | Clinical White Backgrounds',
    metaDescription: 'Clinical grade white background maker for medicines, syrups, strips, and wellness products on Tata 1mg and Apollo 24/7.',
    targetKeywords: ['Tata 1mg medicine photo', 'Apollo 247 product image', 'tablet strip background remover', 'pharma white background'],
    marketplace: 'Tata 1mg, Apollo 24/7, PharmEasy',
    category: 'Beauty & Personal Care',
    badge: 'Healthcare & Pharma Compliant',
    tagline: 'Crisp, clinical-white images for pharmaceutical strips and bottles.',
    heroHeadline: 'Tata 1mg & Apollo Pharma Background Remover',
    heroSubheadline: 'Isolate medicine blister strips, syrup bottles, and medical equipment with crystal-clear label legibility.',
    specs: {
      recommendedResolution: '1500 x 1500 px',
      aspectRatio: '1:1 Square',
      colorProfile: 'sRGB',
      backgroundRule: 'Pure White (RGB 255, 255, 255)',
      frameOccupancy: '85% frame height',
      allowedFormats: 'JPEG / PNG',
      maxFileSize: '8 MB',
    },
    guideOverview: 'Online pharmacies follow strict regulatory standards. Blurry blister packs or shadow-cast labels prevent pharmacist verification.',
    guideSections: [
      {
        heading: '1. Reflective Blister Foil Isolation',
        content: 'Blister packs have reflective silver foil. Our model preserves tablet pocket silhouettes cleanly.',
      },
    ],
    rejectionChecklist: ['Foil reflections eating into tablet edges', 'Batch number unreadable'],
    faqs: [
      {
        question: 'Can it clean shiny silver tablet strips?',
        answer: 'Yes, it cleanly traces the perimeter of shiny silver and transparent blister packs.',
      },
    ],
    relatedSlugs: ['ayurvedic-supplements', 'cosmetics-and-skincare', 'amazon-india-products', 'swiggy-instamart-groceries'],
  },

  // 25. Ajio Footwear & Apparel
  'ajio-footwear-apparel': {
    slug: 'ajio-footwear-apparel',
    name: 'Ajio Footwear & Apparel',
    shortTitle: 'Ajio Fashion Catalog Photo Cleaner',
    metaTitle: 'Ajio Fashion & Sneaker Catalog White Background Tool | Free Cutout',
    metaDescription: 'Create clean white background photos for Ajio seller catalog. Compliant 3:4 and 1:1 formats for western wear, denim, ethnic, and sneakers.',
    targetKeywords: ['Ajio seller image specs', 'Ajio fashion background remover', 'Ajio shoe photo tool', 'clean fashion cutout Ajio'],
    marketplace: 'Ajio & Reliance Retail',
    category: 'Fashion & Apparel',
    badge: 'Ajio Catalog Ready',
    tagline: 'Meet Reliance Ajio’s strict fashion brand standards.',
    heroHeadline: 'Ajio Fashion & Footwear Background Remover',
    heroSubheadline: 'Clean models, mannequins, and flat-lays into crisp, high-converting packshots ready for Ajio marketplace onboarding.',
    specs: {
      recommendedResolution: '1440 x 1920 px (3:4) or 2000 x 2000 px (1:1)',
      aspectRatio: '3:4 or 1:1',
      colorProfile: 'sRGB',
      backgroundRule: 'Pure White (RGB 255, 255, 255)',
      frameOccupancy: '85% model coverage',
      allowedFormats: 'JPEG / PNG',
      maxFileSize: '10 MB',
    },
    guideOverview: 'Ajio is known for sleek urban and ethnic fashion. Our background remover handles complex denim frays, leather jackets, and sneaker soles.',
    guideSections: [
      {
        heading: '1. Denim and Textile Boundary Preservation',
        content: 'Maintains raw edge denim distressing and knitwear contours without jagged lines.',
      },
    ],
    rejectionChecklist: ['Studio floor gradient visible', 'Color imbalance'],
    faqs: [
      {
        question: 'Does this work for flat-lay t-shirts and jeans?',
        answer: 'Yes, flat-lays on neutral or colored surfaces are isolated instantly.',
      },
    ],
    relatedSlugs: ['myntra-fashion-catalog', 'sarees-and-ethnic-wear', 'footwear-and-sneakers', 'handbags-and-leather-goods'],
  },
};

// Programmatic generation of 26 additional specialized Indian commerce niches
// to reach 51 comprehensive, high-volume search categories.
const ADDITIONAL_NICHES: Array<{
  slug: string;
  name: string;
  shortTitle: string;
  category: BackgroundRemoverNiche['category'];
  marketplace: string;
  badge: string;
  tagline: string;
  keywords: string[];
}> = [
  {
    slug: 'sunglasses-and-eyewear',
    name: 'Sunglasses & Eyewear',
    shortTitle: 'Eyewear & Sunglass Photo Cleaner',
    category: 'Fashion & Apparel',
    marketplace: 'Lenskart, Amazon, Myntra',
    badge: 'Tinted Lens & Wire Frame Precision',
    tagline: 'Clean translucent sunglass lenses and ultra-thin metal frames without wiping out the tint.',
    keywords: ['sunglasses background remover', 'eyewear photo cutout', 'Lenskart image specs', 'spectacles white background'],
  },
  {
    slug: 'dry-fruits-and-nuts',
    name: 'Dry Fruits & Nuts Packaging',
    shortTitle: 'Dry Fruits & Nut Pouch Cleaner',
    category: 'FMCG & Quick Commerce',
    marketplace: 'Blinkit, Zepto, Amazon, Flipkart',
    badge: 'Window Pouch Clarity Preserving',
    tagline: 'Clean transparent plastic window pouches showing almonds, cashews, and walnuts.',
    keywords: ['dry fruit pouch background remover', 'cashew packaging photo tool', 'almond packshot clean', 'Blinkit dry fruit photo'],
  },
  {
    slug: 'pooja-items-and-incense',
    name: 'Pooja Items & Incense',
    shortTitle: 'Pooja Item & Agarbatti Photo Cleaner',
    category: 'Handicrafts & Art',
    marketplace: 'Amazon India, Flipkart, Meesho',
    badge: 'Brass & Dhoop Packaging Approved',
    tagline: 'Isolate brass aarti lamps, dhoop sticks, and camphor jars cleanly onto white.',
    keywords: ['pooja item background remover', 'agarbatti packet cutout tool', 'brass diya white background', 'puja samagri image tool'],
  },
  {
    slug: 'ceramic-pottery-and-planters',
    name: 'Ceramic Pottery & Planters',
    shortTitle: 'Ceramic Planter & Pot Photo Cleaner',
    category: 'Home & Living',
    marketplace: 'Ugaoo, Amazon, Pepperfry',
    badge: 'Glaze & Curved Contour Matting',
    tagline: 'Clean glazed ceramic pots, indoor planters, and clay cups from garden dirt.',
    keywords: ['ceramic pot background remover', 'planter cutout tool', 'indoor plant pot white background', 'pottery photo clean'],
  },
  {
    slug: 'stationery-and-office-supplies',
    name: 'Stationery & Office Supplies',
    shortTitle: 'Stationery & Notebook Photo Cleaner',
    category: 'Home & Living',
    marketplace: 'Amazon India, Blinkit, Flipkart',
    badge: 'Stationery Packshot Standard',
    tagline: 'Clean spiral notebooks, pens, highlighters, and desk organizers for online sale.',
    keywords: ['stationery background remover', 'notebook photo cutout', 'pen packshot white background', 'office supply photo tool'],
  },
  {
    slug: 'bedding-and-curtains',
    name: 'Bedding & Home Furnishing',
    shortTitle: 'Bedsheet & Curtain Photo Cleaner',
    category: 'Home & Living',
    marketplace: 'Amazon, Flipkart, Myntra, Meesho',
    badge: 'Fabric Drape & Hemline Preserving',
    tagline: 'Clean bedsheet packaging, cushion covers, and curtain panels into studio packshots.',
    keywords: ['bedsheet background remover', 'curtain photo cleaner', 'cushion cover white background', 'home furnishing image tool'],
  },
  {
    slug: 'sports-gear-and-fitness-equipment',
    name: 'Sports Gear & Fitness',
    shortTitle: 'Fitness Gear & Dumbbell Cleaner',
    category: 'Home & Living',
    marketplace: 'Amazon, Decathlon, Flipkart',
    badge: 'Equipment Silhouette Isolation',
    tagline: 'Clean dumbbells, yoga mats, resistance bands, and cricket gear effortlessly.',
    keywords: ['dumbbell background remover', 'yoga mat cutout tool', 'cricket bat white background', 'fitness equipment photo clean'],
  },
  {
    slug: 'pet-food-and-accessories',
    name: 'Pet Food & Accessories',
    shortTitle: 'Pet Food Bag & Toy Cleaner',
    category: 'FMCG & Quick Commerce',
    marketplace: 'Heads Up For Tails, Supertails, Amazon',
    badge: 'Pet Care Catalog Compliant',
    tagline: 'Clean pet food bags, dog collars, pet grooming brushes, and leashes for D2C stores.',
    keywords: ['pet food bag background remover', 'dog collar photo cleaner', 'pet accessory white background', 'Supertails image specs'],
  },
  {
    slug: 'indian-sweets-and-mithai',
    name: 'Indian Sweets & Mithai Packaging',
    shortTitle: 'Mithai Box Photo Cleaner',
    category: 'FMCG & Quick Commerce',
    marketplace: 'Blinkit, Zepto, Swiggy, Zomato',
    badge: 'Festive Box & Sweet Foil Preserving',
    tagline: 'Clean festive sweet gift hampers, kaju katli boxes, and gulab jamun tins for Diwali and festivals.',
    keywords: ['mithai box background remover', 'sweet box cutout tool', 'Indian confectionery photo clean', 'festive hamper white background'],
  },
  {
    slug: 'lighting-and-chandeliers',
    name: 'Lighting & Smart Bulbs',
    shortTitle: 'Lamp & Light Bulb Photo Cleaner',
    category: 'Electronics & Gadgets',
    marketplace: 'Amazon, Flipkart, Pepperfry',
    badge: 'Glass Bulb & Metal Lamp Matting',
    tagline: 'Clean desk lamps, LED strip packages, and smart bulb boxes onto pure white.',
    keywords: ['lamp background remover', 'smart bulb photo cutout', 'LED light white background', 'lighting catalog photo tool'],
  },
  {
    slug: 'luggage-and-travel-bags',
    name: 'Luggage & Trolley Bags',
    shortTitle: 'Trolley Suitcase Photo Cleaner',
    category: 'Fashion & Apparel',
    marketplace: 'Amazon, Flipkart, Myntra, VIP/Safari Stores',
    badge: 'Wheel & Telescopic Handle Matting',
    tagline: 'Clean polycarbonate trolley cases, duffles, and gym bags with perfect wheel details.',
    keywords: ['suitcase background remover', 'trolley bag photo clean', 'luggage white background', 'duffle bag cutout tool'],
  },
  {
    slug: 'water-bottles-and-flasks',
    name: 'Water Bottles & Thermos Flasks',
    shortTitle: 'Insulated Bottle Photo Cleaner',
    category: 'Home & Living',
    marketplace: 'Amazon, Blinkit, Flipkart, D2C',
    badge: 'Metallic Cylinder Reflection Handling',
    tagline: 'Clean stainless steel thermos flasks, copper bottles, and gym shakers with zero edge distortion.',
    keywords: ['water bottle background remover', 'thermos flask photo clean', 'copper bottle white background', 'shaker bottle cutout'],
  },
  {
    slug: 'perfumes-and-fragrances',
    name: 'Perfumes & Attar Bottles',
    shortTitle: 'Perfume & Fragrance Bottle Cleaner',
    category: 'Beauty & Personal Care',
    marketplace: 'Nykaa, Tata CLiQ Luxury, Amazon',
    badge: 'Luxury Crystal Flacon Isolation',
    tagline: 'Clean luxury perfume glass bottles, attar decanters, and body mists into high-end packshots.',
    keywords: ['perfume bottle background remover', 'attar bottle cutout', 'fragrance white background', 'luxury flacon photo clean'],
  },
  {
    slug: 'mens-grooming-and-beard-oils',
    name: 'Men\'s Grooming & Beard Care',
    shortTitle: 'Beard Oil & Shaving Kit Cleaner',
    category: 'Beauty & Personal Care',
    marketplace: 'The Man Company, Beardo, Amazon',
    badge: 'Dark Glass Amber Bottle Precision',
    tagline: 'Clean beard wash tubes, razor kits, and amber oil dropper bottles onto pure white.',
    keywords: ['beard oil background remover', 'mens grooming photo clean', 'razor cutout tool', 'The Man Company image tool'],
  },
  {
    slug: 'baby-clothing-and-rompers',
    name: 'Baby Clothing & Rompers',
    shortTitle: 'Baby Clothes & Romper Cleaner',
    category: 'Fashion & Apparel',
    marketplace: 'FirstCry, Amazon, Myntra',
    badge: 'Soft Cotton & Button Matting',
    tagline: 'Clean infant onesies, cotton jablas, and baby booties without harsh edges.',
    keywords: ['baby clothes background remover', 'romper photo cutout', 'infant onesie white background', 'FirstCry clothing photo'],
  },
  {
    slug: 'clocks-and-wall-art',
    name: 'Wall Clocks & Canvas Art',
    shortTitle: 'Wall Clock & Canvas Photo Cleaner',
    category: 'Home & Living',
    marketplace: 'Pepperfry, Amazon, Flipkart',
    badge: 'Square & Circular Frame Matting',
    tagline: 'Clean pendulum clocks, modern minimal dials, and framed canvas prints for online decor stores.',
    keywords: ['wall clock background remover', 'framed art cutout', 'canvas print white background', 'clock catalog tool'],
  },
  {
    slug: 'carpets-and-rugs',
    name: 'Carpets & Dhurries',
    shortTitle: 'Carpet & Rug Photo Cleaner',
    category: 'Home & Living',
    marketplace: 'Amazon, Pepperfry, Etsy',
    badge: 'Fringe & Border Matting',
    tagline: 'Isolate Kashmiri silk carpets, woven jute rugs, and doormats from dirty floors.',
    keywords: ['carpet background remover', 'rug photo cutout tool', 'dhurrie white background', 'jute mat photo clean'],
  },
  {
    slug: 'musical-instruments-and-accessories',
    name: 'Musical Instruments & Gear',
    shortTitle: 'Guitar & Tabla Photo Cleaner',
    category: 'Handicrafts & Art',
    marketplace: 'Amazon India, Furtados, Flipkart',
    badge: 'Acoustic Curve & String Matting',
    tagline: 'Clean acoustic guitars, flutes, tablas, and keyboard synthesizers onto clean white.',
    keywords: ['guitar background remover', 'tabla photo cutout', 'musical instrument white background', 'flute photo clean'],
  },
  {
    slug: 'eyelashes-and-nail-art',
    name: 'False Eyelashes & Nail Art',
    shortTitle: 'Eyelash & Nail Kit Photo Cleaner',
    category: 'Beauty & Personal Care',
    marketplace: 'Nykaa, Amazon, Purplle',
    badge: 'Micro-Hair & Acrylic Isolation',
    tagline: 'Isolate false lash bands, press-on nails, and nail polish bottles with micro precision.',
    keywords: ['eyelash background remover', 'nail polish cutout tool', 'press on nails white background', 'beauty lash photo clean'],
  },
  {
    slug: 'handcrafts-and-ethnic-apparel',
    name: 'Handcrafted Kurtis & Tunics',
    shortTitle: 'Handcrafted Kurti Photo Cleaner',
    category: 'Fashion & Apparel',
    marketplace: 'FabIndia, Jaypore, Myntra, Ajio',
    badge: 'Kalamkari & Chikankari Preserving',
    tagline: 'Protect hand-block prints, Lucknawi Chikankari, and Ajrakh motifs with clear white cutouts.',
    keywords: ['Chikankari kurti background remover', 'handblock tunic cutout', 'FabIndia seller photo', 'Ajrakh white background'],
  },
  {
    slug: 'copper-utensils-and-jugs',
    name: 'Copper Utensils & Jugs',
    shortTitle: 'Copper Bottle & Jug Photo Cleaner',
    category: 'Home & Living',
    marketplace: 'Amazon India, Flipkart, D2C',
    badge: 'Reddish-Gold Specular Preserving',
    tagline: 'Clean hammered copper bottles, dispensers, and tumblers with zero discoloration.',
    keywords: ['copper bottle background remover', 'copper jug photo cleaner', 'ayurvedic copper vessel white background', 'hammered copper cutout'],
  },
  {
    slug: 'hair-care-and-shampoos',
    name: 'Hair Care & Herbal Shampoos',
    shortTitle: 'Shampoo & Hair Oil Bottle Cleaner',
    category: 'Beauty & Personal Care',
    marketplace: 'Nykaa, Amazon, Purplle, D2C',
    badge: 'Pump Dispenser & Bottle Matting',
    tagline: 'Clean hair mask tubs, pump bottles, and onion hair oil dropper vials onto crisp white.',
    keywords: ['shampoo bottle background remover', 'hair oil photo cleaner', 'hair serum cutout tool', 'Nykaa hair care specs'],
  },
  {
    slug: 'cleaning-supplies-and-mops',
    name: 'Household Cleaning Supplies',
    shortTitle: 'Cleaning Spray & Mop Photo Cleaner',
    category: 'Home & Living',
    marketplace: 'Blinkit, Zepto, Amazon, JioMart',
    badge: 'Trigger Spray & Handle Matting',
    tagline: 'Clean disinfectant bottles, sprayers, microfiber cloths, and floor wipers for FMCG listings.',
    keywords: ['cleaning spray background remover', 'detergent bottle cutout', 'mop photo white background', 'household FMCG packshot'],
  },
  {
    slug: 'automotive-accessories-and-helmets',
    name: 'Automotive Accessories & Helmets',
    shortTitle: 'Helmet & Bike Accessory Cleaner',
    category: 'Electronics & Gadgets',
    marketplace: 'Amazon India, Flipkart',
    badge: 'Visor & Aerodynamic Shell Matting',
    tagline: 'Clean motorcycle helmets, tire inflators, car dash cams, and seat cushions onto white.',
    keywords: ['helmet background remover', 'bike accessory photo clean', 'car dashcam cutout tool', 'automotive white background'],
  },
  {
    slug: 'books-and-educational-kits',
    name: 'Books & Educational Kits',
    shortTitle: 'Book Cover & Science Kit Cleaner',
    category: 'Home & Living',
    marketplace: 'Amazon India, Flipkart, FirstCry',
    badge: 'Spine & Flat Cover Matting',
    tagline: 'Clean paperback book covers, board games, and STEM learning kits for e-commerce.',
    keywords: ['book cover background remover', 'board game cutout tool', 'STEM kit white background', 'book packshot cleaner'],
  },
  {
    slug: 'gaming-accessories-and-headsets',
    name: 'Gaming Accessories & Headsets',
    shortTitle: 'Gaming Headset & Mouse Cleaner',
    category: 'Electronics & Gadgets',
    marketplace: 'Amazon, Flipkart, Croma',
    badge: 'RGB Light & Headband Preserving',
    tagline: 'Clean gaming mice, mechanical keyboards, and surround headsets onto pure white.',
    keywords: ['gaming headset background remover', 'gaming mouse cutout', 'mechanical keyboard white background', 'gamer tech packshot'],
  },
];

// Populate the additional 26 programmatic niches into the registry
for (const n of ADDITIONAL_NICHES) {
  BACKGROUND_REMOVER_NICHES[n.slug] = {
    slug: n.slug,
    name: n.name,
    shortTitle: n.shortTitle,
    metaTitle: `${n.shortTitle} - Free Pure White Background (RGB 255)`,
    metaDescription: `Instant free background remover for ${n.name.toLowerCase()}. Generate compliant pure white (RGB 255,255,255) and transparent PNG packshots in seconds.`,
    targetKeywords: n.keywords,
    marketplace: n.marketplace,
    category: n.category,
    badge: n.badge,
    tagline: n.tagline,
    heroHeadline: `${n.shortTitle}`,
    heroSubheadline: `Isolate ${n.name.toLowerCase()} with high-precision sub-pixel edge detection and export compliant pure white (RGB 255) or transparent PNGs.`,
    specs: {
      recommendedResolution: '2000 x 2000 px',
      aspectRatio: '1:1 Square',
      colorProfile: 'sRGB',
      backgroundRule: 'Pure White (RGB 255, 255, 255) / Transparent PNG',
      frameOccupancy: '80% to 85% area coverage',
      allowedFormats: 'JPEG / PNG',
      maxFileSize: '10 MB',
    },
    guideOverview: `Selling ${n.name.toLowerCase()} across Indian marketplaces like Amazon, Blinkit, and Flipkart requires clean, distraction-free packshots with zero color bleed and pure white backgrounds.`,
    guideSections: [
      {
        heading: `1. 2026 Marketplace Compliance for ${n.name}`,
        content: `Marketplaces use automated image inspection to verify background purity. An off-white or cluttered backdrop causes immediate listing de-ranking. Our tool guarantees true RGB (255, 255, 255) across the entire canvas perimeter.`,
        bulletPoints: [
          'Guaranteed RGB (255, 255, 255) white eliminates automated listing suppression.',
          'Preserves fine details, contours, and labels without halo artifacts.',
          'Sub-second in-browser WebAssembly processing with zero privacy risks.',
        ],
      },
      {
        heading: '2. Professional 1-Click Studio Background Upgrade',
        content: `While plain white is required for the main search hero image, secondary social and listing images convert 3x higher when placed in contextual lifestyle scenes. Use our 1-click studio generator to upgrade your transparent cutout into a 3D photoshoot.`,
      },
    ],
    rejectionChecklist: [
      'Perimeter background deviates from pure RGB (255, 255, 255)',
      'Product cut off at frame border',
      'Unwanted studio floor glare remaining',
    ],
    faqs: [
      {
        question: `Is this background remover free for ${n.name.toLowerCase()}?`,
        answer: 'Yes! Our in-browser WebAssembly tool offers unlimited transparent PNG and pure white JPEG exports with zero cost or credit card requirements.',
      },
      {
        question: 'How do I pass marketplace listing approval with my exported photo?',
        answer: 'Select "Download Pure White (RGB 255)" after processing. The resulting file adheres to Amazon, Flipkart, and Blinkit catalog contrast and color requirements.',
      },
    ],
    relatedSlugs: ['amazon-india-products', 'blinkit-zepto-products', 'flipkart-meesho-sellers', 'jewellery-and-diamonds'],
  };
}

export const ALL_NICHE_SLUGS = Object.keys(BACKGROUND_REMOVER_NICHES);
