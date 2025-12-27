
import { GoogleGenAI, Type } from "@google/genai";
import { AI_SUGGESTED, PRO_PRODUCT_STYLE_PRESETS } from '../constants';
import type { GenerateImageParams, GeneratedImage, EditImageParams, GenerateCaptionParams, BrandKit, MoodBoard, BrandAnalysis } from '../types';
import { AspectRatio, AppMode, MarketplacePreset, FashionGender, FashionShootType, FashionBodyType, FashionAgeBracket, RegionalStyle, ProductCategory, ResolutionQuality } from '../types';

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const getFashionPoses = (count: number, gender: string = 'Women', apparel?: string): string[] => {
    const poses = [
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
    return poses.slice(0, count);
};

export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            resolve(result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
};

const dataURLToParts = (dataURL: string) => {
    const parts = dataURL.split(',');
    const meta = parts[0];
    const data = parts[1];
    const mimeType = meta.split(':')[1].split(';')[0];
    return { data, mimeType };
};

const buildPromptParts = async (params: GenerateImageParams, brandKit?: BrandKit | null, activeImage?: File, pose?: string, modelSeedUrl?: string): Promise<any[]> => {
    const { 
        productDescription, appMode, marketplacePreset, hyperRealism, 
        fashionGender, fashionShootType, fashionCategory, fashionSubCategory, fashionBodyType, 
        fashionAgeBracket, regionalStyle, modelLockId, productStylePreset,
        modelGender, modelPersona, poseSuggestion, backgroundStyle, clothingType,
        adLayout, adTitle, overlayText
    } = params;
    
    let parts: any[] = [];

    // Add model seed image first if it exists
    if (modelSeedUrl) {
        const response = await fetch(modelSeedUrl);
        const blob = await response.blob();
        const reader = new FileReader();
        const dataUrl = await new Promise<string>(resolve => {
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
        });
        const { data, mimeType } = dataURLToParts(dataUrl);
        parts.push({ inlineData: { data, mimeType } });
    }

    const imageToUse = activeImage || params.frontProductImage || params.remixReferenceImage;
    if (imageToUse) {
        const base64 = await fileToBase64(imageToUse);
        parts.push({ inlineData: { data: base64, mimeType: imageToUse.type } });
    }

    if (params.remixProductImage) {
        const base64 = await fileToBase64(params.remixProductImage);
        parts.push({ inlineData: { data: base64, mimeType: params.remixProductImage.type } });
    }

    let corePrompt = '';

    switch (appMode) {
        case AppMode.Product:
        case AppMode.Festival:
            let presetPrompt = "A professional studio shot of the [product]. The background is a clean, vibrant, single-color or soft gradient that matches the product's color palette. The lighting is bright and clean, making the product look fresh and appealing.";
            
            if (appMode === AppMode.Festival && params.festivalStyle) {
                presetPrompt = `A festive photoshoot of the [product] with a theme of: ${params.festivalStyle}.`;
            } else if (productStylePreset && productStylePreset !== AI_SUGGESTED) {
                 const [category, presetName] = productStylePreset.split('|');
                 const foundCategory = PRO_PRODUCT_STYLE_PRESETS.find(c => c.category === category);
                 const foundPreset = foundCategory?.presets.find(p => p.name === presetName);
                 if (foundPreset) {
                     presetPrompt = foundPreset.prompt;
                 }
            }
            corePrompt = presetPrompt.replace(/\[product\]/g, productDescription || 'product');
            if (pose) { // pose variable now correctly holds the angle for this mode
                corePrompt += ` Image must be a ${pose}.`;
            }
            break;

        case AppMode.Influencer:
             corePrompt = `Create a high-end influencer-style marketing image.`;
             if (modelSeedUrl) {
                corePrompt += `\n- CRITICAL INSTRUCTION: The model in the generated image must be the *exact same person* as in the provided reference seed image. Replicate all facial features, ethnicity, and hair style precisely.`;
             }
             corePrompt += `
            - Product: ${productDescription || 'the product in the image'}.
            - Model: A ${modelGender} influencer with a ${modelPersona} persona.
            - Pose: ${poseSuggestion || 'A natural, engaging pose'}.
            - Outfit: The model is wearing ${clothingType} clothing.
            - Scene: The background is ${backgroundStyle || 'a visually appealing setting'}.
            The overall mood should be aspirational and authentic. Focus on photorealism.`;
            break;

        case AppMode.Fashion:
            corePrompt = `Professional high-end fashion e-commerce photography. Subject: the specific item/fabric in the provided image.`;
            corePrompt += ` 
            MODEL IDENTITY: Use the fixed persona [Seed ID: ${modelLockId || 'Standard'}]. Facial features, hair, and ethnic appearance must be identical to the brand model.
            BODY SPECIFICATIONS: The model has a ${fashionBodyType || 'Regular'} body type. Adjust skeletal proportions and garment fit accordingly.
            APPAREL: ${fashionSubCategory || 'garment'} in the category of ${fashionCategory}.
            REGIONAL STYLING: ${regionalStyle !== RegionalStyle.None ? `Apply ${regionalStyle} aesthetic including specific drape techniques and cultural jewelry/styling.` : 'Standard modern styling.'}
            SHOOT TYPE: ${fashionShootType}.
            POSE: ${pose || 'Professional catalog pose'}.
            FABRIC DRAPING: If the input is fabric, simulate its weight (GSM), texture, sheen, and fall as a ${fashionSubCategory} on the model's body.`;
            if (fashionShootType === FashionShootType.GhostMannequin) {
                corePrompt += ` Ghost mannequin effect: Model is invisible. Garment retains a perfectly full and worn shape with visible inner tags.`;
            }
            if (hyperRealism) {
                corePrompt += ` 
                PHOTOGRAPHY SETTINGS: Shot on Sony A7R IV with 85mm G Master lens at f/2.8. 
                LIGHTING: Cinematic studio lighting setup with softbox fill and rim lighting to separate subject from background. 
                TEXTURES: Ultra-high definition texture rendering. Visible fabric weave, realistic skin pores, and subsurface scattering on skin. 
                QUALITY: 8K resolution, octane render style, ray-traced reflections, sharp focus on the garment, creamy bokeh background.`;
            }
            break;

        case AppMode.AdCreative:
        case AppMode.Banner:
        case AppMode.Youtube:
            corePrompt = `Create a compelling ad creative for a "${productDescription}".
            - Layout: ${adLayout || 'AI Suggested'}.
            - Text: Use the title "${adTitle || overlayText || ''}".
            - Scene: ${backgroundStyle || 'A background that complements the product.'}
            The final image should be visually striking and optimized for online advertising.`;
            break;
        
        case AppMode.Remix:
            corePrompt = `Using the reference scene image and the new product cutout image, seamlessly integrate the new product into the scene. Adapt lighting, shadows, and reflections for a photorealistic result. Apply the following modification if provided: "${productDescription}". If no modification is provided, just perform the product replacement.`;
            break;

        default:
            corePrompt = `Create a professional marketing image for: "${productDescription}". Use the provided image as the main subject. The style should be clean, modern, and high-quality.`;
            break;
    }

    if (marketplacePreset === MarketplacePreset.Amazon) {
        corePrompt += ` COMPLIANCE: Amazon White Background Standard (RGB 255, 255, 255). No floating shadows. Centered subject. 85% frame filling.`;
    } else if (marketplacePreset === MarketplacePreset.Shopify) {
        corePrompt += ` COMPLIANCE: Shopify High-end Portrait. Refined contrast. Suitable for high-density mobile screens.`;
    }
    
    // BUG FIX: Inject brand voice if available
    if (brandKit?.voice) {
        corePrompt += `\n- Brand Voice: Adhere to a ${brandKit.voice} tone.`;
    }

    return [{ text: corePrompt }, ...parts];
};

const generateSingleImage = async (
    params: GenerateImageParams, 
    aspectRatio: AspectRatio, 
    userTier: 'Free' | 'Starter' | 'Standard' | 'Agency',
    brandKit?: BrandKit | null, 
    activeImage?: File, 
    pose?: string, 
    sourceProductImageUrl?: string, 
    modelSeedUrl?: string
): Promise<GeneratedImage> => {
    const ai = getAI();
    const contents = await buildPromptParts(params, brandKit, activeImage, pose, modelSeedUrl);
    
    let aspectRatioConfig: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1";
    if (aspectRatio === AspectRatio.Portrait) aspectRatioConfig = "9:16";
    if (aspectRatio === AspectRatio.Landscape) aspectRatioConfig = "16:9";
    if (aspectRatio === AspectRatio.PortraitPost) aspectRatioConfig = "3:4";
    if (aspectRatio === AspectRatio.FashionShopify) aspectRatioConfig = "3:4";

    // --- TIER-BASED MODEL SELECTION ---
    const isProTier = userTier === 'Standard' || userTier === 'Agency';
    const modelName = isProTier ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

    const config: any = {
        imageConfig: { aspectRatio: aspectRatioConfig },
        // Add Safety Settings to reduce false positives in creative contexts
        safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_ONLY_HIGH' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
        ]
    };

    // Apply High Quality config if Pro Tier (2K resolution)
    if (isProTier && params.resolutionQuality === ResolutionQuality.High) {
        config.imageConfig.imageSize = '2K'; 
    }

    const response = await ai.models.generateContent({
        model: modelName,
        contents: { parts: contents },
        config: config,
    });

    let imageUrl = '';
    const candidate = response.candidates?.[0];
    const outParts = candidate?.content?.parts || [];
    
    for (const part of outParts) {
        if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
        }
    }
    
    if (!imageUrl) {
        // Attempt to extract refusal message or safety reason for better debugging
        const textPart = outParts.find(p => p.text)?.text;
        if (textPart) {
            throw new Error(`AI Model Refusal: ${textPart}`);
        }
        
        if (candidate?.finishReason) {
             throw new Error(`Generation stopped. Reason: ${candidate.finishReason}. This usually means the input image violated safety policies.`);
        }

        throw new Error("AI pipeline error: No image returned. Try a different prompt or image.");
    }

    return {
        id: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        imageUrl,
        caption: pose || params.fashionSubCategory || "Creative Variation",
        hashtags: "",
        aspectRatio: aspectRatio,
        params,
        sourceProductImageUrl,
        timestamp: Date.now(),
    };
};

export const generateImages = async (
    params: GenerateImageParams, 
    userTier: 'Free' | 'Starter' | 'Standard' | 'Agency',
    brandKit?: BrandKit | null,
    sourceProductImageUrl?: string,
    onProgress?: (current: number, total: number) => void,
    modelSeedUrl?: string
): Promise<GeneratedImage[]> => {
    const allResults: GeneratedImage[] = [];
    const aspectRatiosToGenerate = params.aspectRatios && params.aspectRatios.length > 0 ? params.aspectRatios : [AspectRatio.PortraitPost];

    // --- ENFORCE BATCH LIMITS ---
    let requestedBatchSize = params.batchSize || 1;
    if (params.appMode === AppMode.Fashion && !params.batchSize) {
        requestedBatchSize = 4; // Default for fashion
    }

    let maxAllowedBatch = 1;
    if (userTier === 'Agency') maxAllowedBatch = 12;
    else if (userTier === 'Standard') maxAllowedBatch = 4;
    else maxAllowedBatch = 1;

    // Special allowance for Fashion mode on lower tiers to make it usable, 
    // but capping at 4 even for Starter if logic demands, currently defaulting strict structure.
    const effectiveBatchSize = Math.min(requestedBatchSize, maxAllowedBatch);

    const getJobCount = () => {
        if (params.appMode === AppMode.Fashion) return effectiveBatchSize;
        if (params.appMode === AppMode.Bulk && params.bulkImages) return params.bulkImages.length; 
        if (params.appMode === AppMode.Product) {
             // Calculate effective angles based on tier limit
             let allowedAnglesCount = 1;
             if (userTier === 'Standard') allowedAnglesCount = 4;
             if (userTier === 'Agency') allowedAnglesCount = 10;
             return Math.min(params.selectedAngles.length, allowedAnglesCount) || 1;
        }
        return effectiveBatchSize;
    };

    const totalJobsPerRatio = getJobCount();
    const totalGenerations = aspectRatiosToGenerate.length * totalJobsPerRatio;
    let progressCounter = 0;

    for (const aspectRatio of aspectRatiosToGenerate) {
        if (params.appMode === AppMode.Fashion) {
            const poses = getFashionPoses(effectiveBatchSize, params.fashionGender, params.fashionSubCategory);
            for (let i = 0; i < effectiveBatchSize; i++) {
                progressCounter++;
                if (onProgress) onProgress(progressCounter, totalGenerations);
                const img = await generateSingleImage(params, aspectRatio, userTier, brandKit, undefined, poses[i], sourceProductImageUrl, modelSeedUrl);
                allResults.push(img);
            }
        } else if (params.appMode === AppMode.Bulk && params.bulkImages) {
            // Bulk limits usually handled by UI but good to cap here too
            const limit = Math.min(params.bulkImages.length, userTier === 'Agency' ? 50 : (userTier === 'Standard' ? 10 : 1));
            for (let i = 0; i < limit; i++) {
                progressCounter++;
                if (onProgress) onProgress(progressCounter, totalGenerations);
                const img = await generateSingleImage(params, aspectRatio, userTier, brandKit, params.bulkImages[i], undefined, sourceProductImageUrl, modelSeedUrl);
                allResults.push(img);
            }
        } else if (params.appMode === AppMode.Product) {
             // Enforce Product Mode Angle Limits
             let allowedAnglesCount = 1;
             if (userTier === 'Standard') allowedAnglesCount = 4;
             if (userTier === 'Agency') allowedAnglesCount = 10;
             
             let angles = params.selectedAngles.length > 0 ? params.selectedAngles : ['Front View'];
             // Silently slice to the allowed limit to prevent backend overload/abuse
             if (angles.length > allowedAnglesCount) {
                 angles = angles.slice(0, allowedAnglesCount);
             }

             for (const angle of angles) {
                progressCounter++;
                if (onProgress) onProgress(progressCounter, totalGenerations);
                const img = await generateSingleImage(params, aspectRatio, userTier, brandKit, undefined, angle, sourceProductImageUrl, modelSeedUrl);
                allResults.push(img);
             }
        } else {
            for (let i = 0; i < effectiveBatchSize; i++) {
                progressCounter++;
                if (onProgress) onProgress(progressCounter, totalGenerations);
                const img = await generateSingleImage(params, aspectRatio, userTier, brandKit, undefined, undefined, sourceProductImageUrl, modelSeedUrl);
                allResults.push(img);
            }
        }
    }

    return allResults;
};

export const editImage = async (params: EditImageParams): Promise<{ imageUrl: string }> => {
    const ai = getAI();
    const { originalImageUrl, maskDataUrl, prompt, replacementImage } = params;
    const { data: originalData, mimeType: originalMimeType } = dataURLToParts(originalImageUrl);
    const { data: maskData } = dataURLToParts(maskDataUrl);

    let parts: any[] = [
        { inlineData: { data: originalData, mimeType: originalMimeType } },
        { inlineData: { data: maskData, mimeType: 'image/png' } },
        { text: `Modify masked area: ${prompt}. Blend seamlessly with original lighting.` }
    ];

    if (replacementImage) {
        const replacementBase64 = await fileToBase64(replacementImage);
        parts.push({ inlineData: { data: replacementBase64, mimeType: replacementImage.type } });
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts }
    });

    let imageUrl = originalImageUrl;
    const outParts = response.candidates?.[0]?.content?.parts || [];
    for (const part of outParts) {
        if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
        }
    }
    return { imageUrl };
};

export const generateCaption = async (params: GenerateCaptionParams, brandKit: BrandKit | null) => {
    const ai = getAI();
    const { data, mimeType } = dataURLToParts(params.imageUrl);
    const prompt = `Write marketing ad caption for this fashion item. Tone: ${params.tone}. Platform: ${params.platform}. JSON {caption, hashtags}.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { data, mimeType } }, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    caption: { type: Type.STRING },
                    hashtags: { type: Type.STRING }
                }
            }
        }
    });
    
    try {
        return JSON.parse(response.text || '{}');
    } catch (e) {
        return { caption: response.text || "New looks are here!", hashtags: "#fashion" };
    }
};

export const detectProductCategory = async (base64: string, mimeType: string, description: string): Promise<ProductCategory> => {
    const ai = getAI();
    const categoryList = Object.values(ProductCategory).join('", "');
    const prompt = `Based on the image and this description: "${description}", classify the product into ONE of the following categories: ["${categoryList}"]. Respond with ONLY the category name.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: prompt }] }
    });

    const detected = response.text?.trim();

    if (detected && Object.values(ProductCategory).includes(detected as ProductCategory)) {
        return detected as ProductCategory;
    }
    
    if (detected) {
        const lowerDetected = detected.toLowerCase();
        if (lowerDetected.includes('food') || lowerDetected.includes('beverage')) return ProductCategory.FoodAndBeverage;
        if (lowerDetected.includes('tech') || lowerDetected.includes('gadget')) return ProductCategory.Tech;
        if (lowerDetected.includes('fashion') || lowerDetected.includes('apparel')) return ProductCategory.Fashion;
        if (lowerDetected.includes('home') || lowerDetected.includes('decor')) return ProductCategory.HomeDecor;
        if (lowerDetected.includes('fitness') || lowerDetected.includes('nutrition')) return ProductCategory.Fitness;
        if (lowerDetected.includes('skincare')) return ProductCategory.Skincare;
        if (lowerDetected.includes('perfume')) return ProductCategory.Perfume;
        if (lowerDetected.includes('herbal')) return ProductCategory.Herbal;
    }

    return ProductCategory.Generic;
};

export const generateVariantSuggestions = async (description: string, field: string) => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: `Suggest 4 options for "${field}" based on product: "${description}". JSON array.` }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
        }
    });
    try {
        return JSON.parse(response.text || '[]');
    } catch {
        return ['Minimal', 'Luxury', 'Vibrant', 'Editorial'];
    }
};

export const getABTestSuggestions = async (image: GeneratedImage) => {
    const ai = getAI();
    const { data, mimeType } = dataURLToParts(image.imageUrl);
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { data, mimeType } }, { text: `Suggest 3 A/B test variations. JSON array of {title, description, hypothesis}.` }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        hypothesis: { type: Type.STRING }
                    }
                }
            }
        }
    });
    try {
        return JSON.parse(response.text || '[]');
    } catch {
        return [{ title: 'Lighting Shift', description: 'Try high-contrast', hypothesis: 'Increases conversion' }];
    }
};

export const removeBackground = async (base64: string, mimeType: string): Promise<{ data: string, mimeType: string }> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: "Isolate subject on pure white #FFFFFF background." }] }
    });
    const outParts = response.candidates?.[0]?.content?.parts || [];
    for (const part of outParts) {
        if (part.inlineData) return { data: part.inlineData.data, mimeType: part.inlineData.mimeType };
    }
    return { data: base64, mimeType }; // Fallback to original
};

export const generateMoodBoard = async (description: string): Promise<MoodBoard> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ text: `Mood board for: "${description}". JSON {concept, colors, styles, tones}.` }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    concept: { type: Type.STRING },
                    colors: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, hex: { type: Type.STRING } } } },
                    styles: { type: Type.ARRAY, items: { type: Type.STRING } },
                    tones: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        }
    });
    return JSON.parse(response.text || '{}');
};

export const analyzeBrandLogo = async (base64: string, mimeType: string): Promise<BrandAnalysis> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: `Analyze brand logo JSON {colors, typography, vibe}.` }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    colors: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { name: { type: Type.STRING }, hex: { type: Type.STRING } } } },
                    typography: { type: Type.STRING },
                    vibe: { type: Type.ARRAY, items: { type: Type.STRING } }
                }
            }
        }
    });
    return JSON.parse(response.text || '{}');
};
