
/**
 * FILE: geminiService.ts
 * PURPOSE: Core service for all Google Gemini AI interactions (Image, Text, Vision).
 */

import { GoogleGenAI, Type } from "@google/genai";
import { AI_SUGGESTED, PRO_PRODUCT_STYLE_PRESETS } from '../constants';
import type { GenerateImageParams, GeneratedImage, EditImageParams, GenerateCaptionParams, BrandKit, MoodBoard, BrandAnalysis } from '../types';
import { AspectRatio, AppMode, MarketplacePreset, FashionShootType, RegionalStyle, ProductCategory, ResolutionQuality } from '../types';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- MODELS CONFIGURATION ---
const MODELS = {
    TEXT: 'gemini-3-flash-preview',
    TEXT_FALLBACK: 'gemini-2.0-flash-exp', // Fallback for 403/500 on primary text model
    // IMAGE_PRO: 'gemini-3-pro-image-preview', // TODO: Re-enable when API access is available
    IMAGE_PRO: 'gemini-2.5-flash-image', // Temporary override: Use 2.5 Flash for all tiers to avoid access errors
    IMAGE_STD: 'gemini-2.5-flash-image',
    EDIT: 'gemini-2.5-flash-image'
};

const getAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
        throw new Error("API Key is missing. Please set VITE_API_KEY in your environment variables.");
    }
    return new GoogleGenAI({ apiKey });
};

// --- HELPER: Safe Content Generation with Fallback ---
const generateContentSafe = async (ai: GoogleGenAI, params: any) => {
    try {
        return await ai.models.generateContent(params);
    } catch (error: any) {
        // Check for Permission Denied (403), Not Found (404), or Internal Error (500)
        const isAccessError = error.status === 403 || error.status === 404 || error.status === 500 || 
                              (error.message && (error.message.includes('403') || error.message.includes('500')));
        
        if (params.model === MODELS.TEXT && isAccessError) {
            console.warn(`Primary model ${MODELS.TEXT} failed (${error.status}). Falling back to ${MODELS.TEXT_FALLBACK}.`);
            try {
                return await ai.models.generateContent({
                    ...params,
                    model: MODELS.TEXT_FALLBACK
                });
            } catch (fallbackError: any) {
                console.error("Fallback text generation also failed:", fallbackError);
                throw error; // Throw original error to retain context if both fail
            }
        }
        throw error;
    }
};

const getFashionPoses = (count: number): string[] => {
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
    // const meta = parts[0]; 
    const data = parts[1];
    const mimeType = parts[0].split(':')[1].split(';')[0];
    return { data, mimeType };
};

async function buildPromptParts(params: GenerateImageParams, brandKit?: BrandKit | null, activeImage?: File, pose?: string, modelSeedUrl?: string): Promise<any[]> {
    const { 
        productDescription, appMode, marketplacePreset, hyperRealism, 
        fashionShootType, fashionCategory, fashionSubCategory, fashionBodyType, 
        regionalStyle, modelLockId, productStylePreset,
        modelGender, modelPersona, poseSuggestion, backgroundStyle, clothingType,
        adLayout, adTitle, overlayText
    } = params;
    
    let parts: any[] = [];

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
            let presetPrompt = "A professional studio shot of the [product]. The background is a clean, vibrant, single-color or soft gradient. Bright, clean lighting.";
            
            if (appMode === AppMode.Festival && params.festivalStyle) {
                presetPrompt = `A festive photoshoot of the [product] with a theme of: ${params.festivalStyle}.`;
            } else if (productStylePreset && productStylePreset !== AI_SUGGESTED) {
                 const [category, presetName] = productStylePreset.split('|');
                 const foundCategory = PRO_PRODUCT_STYLE_PRESETS.find(c => c.category === category);
                 const foundPreset = foundCategory?.presets.find(p => p.name === presetName);
                 if (foundPreset) presetPrompt = foundPreset.prompt;
            }
            corePrompt = presetPrompt.replace(/\[product\]/g, productDescription || 'product');
            if (pose) corePrompt += ` Image must be a ${pose}.`;
            break;

        case AppMode.Influencer:
             corePrompt = `Create a high-end influencer-style marketing image.`;
             if (modelSeedUrl) corePrompt += `\n- CRITICAL: Model must match provided seed image exactly.`;
             corePrompt += `
            - Product: ${productDescription || 'the product'}.
            - Model: ${modelGender} influencer, ${modelPersona} persona.
            - Pose: ${poseSuggestion || 'Natural, engaging'}.
            - Outfit: ${clothingType}.
            - Scene: ${backgroundStyle || 'Aesthetic setting'}.
            Photorealistic, aspirational mood.`;
            break;

        case AppMode.Fashion:
            corePrompt = `High-end fashion e-commerce photography. Subject: specific item in image.`;
            corePrompt += ` 
            MODEL: Fixed persona [Seed ID: ${modelLockId || 'Standard'}].
            BODY: ${fashionBodyType || 'Regular'}.
            APPAREL: ${fashionSubCategory || 'garment'} (${fashionCategory}).
            STYLE: ${regionalStyle !== RegionalStyle.None ? regionalStyle : 'Modern'}.
            SHOOT: ${fashionShootType}.
            POSE: ${pose || 'Catalog pose'}.`;
            if (fashionShootType === FashionShootType.GhostMannequin) corePrompt += ` Ghost mannequin effect: invisible model.`;
            if (hyperRealism) corePrompt += ` 8K resolution, Sony A7R IV style, cinematic lighting, sharp focus.`;
            break;

        case AppMode.AdCreative:
        case AppMode.Banner:
        case AppMode.Youtube:
            corePrompt = `Ad creative for "${productDescription}". Layout: ${adLayout}. Text: "${adTitle || overlayText || ''}". Background: ${backgroundStyle}. Visually striking.`;
            break;
        
        case AppMode.Remix:
            corePrompt = `Seamlessly integrate new product cutout into reference scene. Modification: "${productDescription}". Photorealistic lighting adaption.`;
            break;

        default:
            corePrompt = `Professional marketing image for "${productDescription}". Clean, modern, high-quality.`;
            break;
    }

    if (marketplacePreset === MarketplacePreset.Amazon) corePrompt += ` COMPLIANCE: Amazon White Background (RGB 255,255,255). No shadows.`;
    
    // Inject Brand Kit Identity
    if (brandKit) {
        corePrompt += `\n\nBRAND IDENTITY GUIDELINES:`;
        if (brandKit.brandName) corePrompt += `\n- Brand Name: "${brandKit.brandName}"`;
        if (brandKit.voice) corePrompt += `\n- Tone/Mood: ${brandKit.voice}`;
        if (brandKit.primaryColor) corePrompt += `\n- Primary Color: ${brandKit.primaryColor} (Use for key elements/accents)`;
        if (brandKit.secondaryColor) corePrompt += `\n- Secondary Color: ${brandKit.secondaryColor}`;
        if (brandKit.fonts) corePrompt += `\n- Aesthetic Style: ${brandKit.fonts}`; // Maps fonts to general visual style
        if (brandKit.description) corePrompt += `\n- Context: ${brandKit.description}`;
        if (brandKit.negativeConstraints) corePrompt += `\n- STRICTLY AVOID: ${brandKit.negativeConstraints}`;
    }

    return [{ text: corePrompt }, ...parts];
}

const parseGenerationResponse = (response: any, params: any, aspectRatio: any, pose: any, sourceProductImageUrl: any): GeneratedImage => {
    let imageUrl = '';
    const candidate = response.candidates?.[0];
    const outParts = candidate?.content?.parts || [];
    
    for (const part of outParts) {
        if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
        }
    }
    
    if (!imageUrl) throw new Error("AI pipeline error: No image returned.");

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

async function generateSingleImage(
    params: GenerateImageParams, 
    aspectRatio: AspectRatio, 
    userTier: string,
    brandKit?: BrandKit | null, 
    activeImage?: File, 
    pose?: string, 
    sourceProductImageUrl?: string, 
    modelSeedUrl?: string,
    presetOverride?: string,
    retryCount: number = 0
): Promise<GeneratedImage> {
    const ai = getAI();
    
    // Apply preset override if exists
    const effectiveParams = presetOverride ? { ...params, productStylePreset: presetOverride } : params;
    
    const contents = await buildPromptParts(effectiveParams, brandKit, activeImage, pose, modelSeedUrl);
    
    let aspectRatioConfig: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1";
    if (aspectRatio === AspectRatio.Portrait) aspectRatioConfig = "9:16";
    if (aspectRatio === AspectRatio.Landscape) aspectRatioConfig = "16:9";
    if (aspectRatio === AspectRatio.PortraitPost || aspectRatio === AspectRatio.FashionShopify) aspectRatioConfig = "3:4";

    const isProTier = userTier === 'Standard' || userTier === 'Agency';
    const primaryModel = isProTier ? MODELS.IMAGE_PRO : MODELS.IMAGE_STD;

    const config: any = {
        imageConfig: { aspectRatio: aspectRatioConfig },
        safetySettings: [{ category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' }]
    };

    // Only apply imageSize if the selected model actually supports it (Gemini 3 Pro series).
    // gemini-2.5-flash-image does NOT support imageSize and will error if sent.
    // Since IMAGE_PRO is currently overridden to 2.5-flash, this check prevents the error.
    if (isProTier && params.resolutionQuality === ResolutionQuality.High && primaryModel.includes('gemini-3')) {
        config.imageConfig.imageSize = '2K'; 
    }

    try {
        const response = await ai.models.generateContent({
            model: primaryModel,
            contents: { parts: contents },
            config: config,
        });

        return parseGenerationResponse(response, effectiveParams, aspectRatio, pose, sourceProductImageUrl);

    } catch (error: any) {
        // Fallback Logic for Pro Tier failures (403 Permission Denied or 500 Internal Error)
        const isPermissionError = error.status === 403 || (error.message && error.message.includes('403')) || (error.message && error.message.includes('PERMISSION_DENIED'));
        const isInternalError = error.status === 500 || (error.message && error.message.includes('500')) || (error.message && error.message.includes('INTERNAL'));
        
        if (isProTier && (isPermissionError || isInternalError)) {
            console.warn(`Model ${primaryModel} failed with ${error.status || 'Error'}. Falling back to ${MODELS.IMAGE_STD}.`);
            
            // Remove imageSize config as it is not supported on flash-image
            const fallbackConfig = { ...config };
            if (fallbackConfig.imageConfig) delete fallbackConfig.imageConfig.imageSize;

            // --- Robust Retry Loop for Fallback ---
            let fallbackRetries = 0;
            const maxFallbackRetries = 3;
            
            while (fallbackRetries < maxFallbackRetries) {
                try {
                    const fallbackResponse = await ai.models.generateContent({
                        model: MODELS.IMAGE_STD,
                        contents: { parts: contents },
                        config: fallbackConfig,
                    });
                    return parseGenerationResponse(fallbackResponse, effectiveParams, aspectRatio, pose, sourceProductImageUrl);
                } catch (fallbackError: any) {
                    const isFallbackInternal = fallbackError.status === 500 || (fallbackError.message && fallbackError.message.includes('500'));
                    
                    if (isFallbackInternal) {
                        fallbackRetries++;
                        console.warn(`Fallback attempt ${fallbackRetries} failed with 500. Retrying...`);
                        await wait(2000 * fallbackRetries); // Exponential wait: 2s, 4s, 6s
                        
                        if (fallbackRetries >= maxFallbackRetries) {
                            console.error("All fallback retries failed.");
                            throw fallbackError; 
                        }
                    } else {
                        console.error("Fallback failed with non-retriable error:", fallbackError);
                        throw fallbackError;
                    }
                }
            }
        }

        if (retryCount < 3 && (error.message?.includes('429') || error.status === 429)) {
            await wait((retryCount + 1) * 6000);
            return generateSingleImage(params, aspectRatio, userTier, brandKit, activeImage, pose, sourceProductImageUrl, modelSeedUrl, presetOverride, retryCount + 1);
        }
        throw error;
    }
}

export const generateImages = async (
    params: GenerateImageParams, 
    userTier: 'Free' | 'Starter' | 'Standard' | 'Agency',
    brandKit?: BrandKit | null,
    sourceProductImageUrl?: string,
    onProgress?: (current: number, total: number) => void,
    modelSeedUrl?: string
): Promise<GeneratedImage[]> => {
    const aspectRatios = params.aspectRatios?.length ? params.aspectRatios : [AspectRatio.PortraitPost];
    
    // --- 1. DETERMINE TASKS (Cartesian Product of Images x Variations x Presets) ---
    let tasks: { image?: File, pose?: string, angle?: string, preset?: string }[] = [];

    if (params.appMode === AppMode.Product) {
        // Product Mode: Images x Angles x Presets
        const images = params.bulkImages && params.bulkImages.length > 0 
            ? params.bulkImages 
            : (params.frontProductImage ? [params.frontProductImage] : []);
            
        const angles = params.selectedAngles && params.selectedAngles.length > 0 
            ? params.selectedAngles 
            : ['Front View'];

        // Determine presets (use multi-select list or fallback to single/default)
        const presets = params.productStylePresets && params.productStylePresets.length > 0 
            ? params.productStylePresets 
            : (params.productStylePreset ? [params.productStylePreset] : [AI_SUGGESTED]);

        if (images.length === 0) {
             // Fallback if no images (e.g. text-only gen if supported, or just empty task to trigger default logic)
             for (const angle of angles) {
                 for (const preset of presets) {
                     tasks.push({ angle, pose: angle, preset });
                 }
             }
        } else {
            // Process EVERY image with EVERY selected angle AND EVERY selected preset
            for (const img of images) {
                for (const angle of angles) {
                    for (const preset of presets) {
                        tasks.push({ image: img, angle, pose: angle, preset });
                    }
                }
            }
        }
    } else if (params.appMode === AppMode.Fashion) {
        // Fashion Mode: Bulk Images OR Batch Size
        const images = params.bulkImages && params.bulkImages.length > 0 ? params.bulkImages : [];
        let count = 0;
        
        if (images.length > 0) {
            count = images.length;
        } else {
            const batchSize = params.batchSize || 4;
            const maxBatch = userTier === 'Agency' ? 12 : userTier === 'Standard' ? 4 : 1;
            count = Math.min(batchSize, maxBatch);
        }

        const poses = getFashionPoses(count);
        for (let i = 0; i < count; i++) {
            tasks.push({
                image: images.length > 0 ? images[i] : undefined,
                pose: poses[i % poses.length]
            });
        }
    } else {
        // Other Modes (Influencer, Ad, etc.): Bulk Images OR Batch Size
        const images = params.bulkImages && params.bulkImages.length > 0 ? params.bulkImages : [];
        let count = 0;
        
        if (images.length > 0) {
            count = images.length;
        } else {
            const batchSize = params.batchSize || 1;
            const maxBatch = userTier === 'Agency' ? 12 : userTier === 'Standard' ? 4 : 1;
            count = Math.min(batchSize, maxBatch);
        }

        for (let i = 0; i < count; i++) {
            tasks.push({
                image: images.length > 0 ? images[i] : undefined,
                pose: undefined 
            });
        }
    }

    const allResults: GeneratedImage[] = [];
    let completedJobs = 0;
    const totalJobs = aspectRatios.length * tasks.length;

    // --- 2. EXECUTE TASKS ---
    for (const ratio of aspectRatios) {
        for (let i = 0; i < tasks.length; i++) {
            completedJobs++;
            if (onProgress) onProgress(completedJobs, totalJobs);

            const task = tasks[i];
            
            // Wait buffer to respect rate limits (15 RPM safe zone)
            // If we have already generated something, wait before next
            if (allResults.length > 0) await wait(4000); 

            try {
                const result = await generateSingleImage(
                    params, 
                    ratio, 
                    userTier, 
                    brandKit, 
                    task.image, // Correct image from task list
                    task.pose, 
                    sourceProductImageUrl, 
                    modelSeedUrl,
                    task.preset // Pass preset override
                );
                allResults.push(result);
            } catch (err) {
                console.error("Generation failed for one item in batch:", err);
                // Throwing here to stop the batch and alert user, rather than partial silent failure
                throw err; 
            }
        }
    }
    return allResults;
};

export const editImage = async (params: EditImageParams): Promise<{ imageUrl: string }> => {
    const ai = getAI();
    const { data: originalData, mimeType: originalMimeType } = dataURLToParts(params.originalImageUrl);
    const { data: maskData } = dataURLToParts(params.maskDataUrl);
    
    let parts: any[] = [
        { inlineData: { data: originalData, mimeType: originalMimeType } },
        { inlineData: { data: maskData, mimeType: 'image/png' } },
        { text: `Modify masked area: ${params.prompt}. Blend seamlessly.` }
    ];

    if (params.replacementImage) {
        const replacementBase64 = await fileToBase64(params.replacementImage);
        parts.push({ inlineData: { data: replacementBase64, mimeType: params.replacementImage.type } });
    }

    const response = await ai.models.generateContent({
        model: MODELS.EDIT,
        contents: { parts }
    });

    const outputPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!outputPart?.inlineData) throw new Error("No image generated from edit.");

    return { imageUrl: `data:${outputPart.inlineData.mimeType};base64,${outputPart.inlineData.data}` };
};

export const generateCaption = async (params: GenerateCaptionParams, brandKit: BrandKit | null) => {
    const ai = getAI();
    const { data, mimeType } = dataURLToParts(params.imageUrl);
    const prompt = `Write marketing caption. Tone: ${params.tone}. Platform: ${params.platform}. JSON {caption, hashtags}.`;
    
    const response = await generateContentSafe(ai, {
        model: MODELS.TEXT,
        contents: { parts: [{ inlineData: { data, mimeType } }, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.OBJECT, properties: { caption: { type: Type.STRING }, hashtags: { type: Type.STRING } } }
        }
    });
    
    try { return JSON.parse(response.text || '{}'); } catch { return { caption: "Check this out!", hashtags: "#trending" }; }
};

export const detectProductCategory = async (base64: string, mimeType: string, description: string): Promise<ProductCategory> => {
    if (!process.env.API_KEY) return ProductCategory.Generic;
    const ai = getAI();
    const categories = Object.values(ProductCategory).join('", "');
    const prompt = `Classify product in image based on description "${description}" into ONE category: ["${categories}"]. Return ONLY category name.`;

    const response = await generateContentSafe(ai, {
        model: MODELS.TEXT,
        contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: prompt }] }
    });

    const text = response.text?.trim() as ProductCategory;
    if (Object.values(ProductCategory).includes(text)) return text;
    return ProductCategory.Generic;
};

export const generateVariantSuggestions = async (description: string, field: string) => {
    const ai = getAI();
    const prompt = `Suggest 4 options for "${field}" based on product: "${description}". JSON array.`;

    const response = await generateContentSafe(ai, {
        model: MODELS.TEXT,
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } }
    });

    try { return JSON.parse(response.text || '[]'); } catch { return ['Option 1', 'Option 2']; }
};

export const getABTestSuggestions = async (image: GeneratedImage) => {
    const ai = getAI();
    const { data, mimeType } = dataURLToParts(image.imageUrl);
    
    const response = await generateContentSafe(ai, {
        model: MODELS.TEXT,
        contents: { parts: [{ inlineData: { data, mimeType } }, { text: "Suggest 3 A/B test variations. JSON array {title, description, hypothesis}." }] },
        config: { 
            responseMimeType: "application/json", 
            responseSchema: { 
                type: Type.ARRAY, 
                items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, hypothesis: { type: Type.STRING } } } 
            } 
        }
    });

    try { return JSON.parse(response.text || '[]'); } catch { return []; }
};

export const removeBackground = async (base64: string, mimeType: string): Promise<{ data: string, mimeType: string }> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: MODELS.IMAGE_STD, // Using standard flash for editing tasks
        contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: "Isolate subject on pure white #FFFFFF background." }] }
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData) return { data: part.inlineData.data, mimeType: part.inlineData.mimeType };
    return { data: base64, mimeType };
};

export const generateMoodBoard = async (description: string): Promise<MoodBoard> => {
    const ai = getAI();
    const response = await generateContentSafe(ai, {
        model: MODELS.TEXT,
        contents: `Mood board for: "${description}". JSON {concept, colors:[{name,hex}], styles:[], tones:[]}.`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
};

export const analyzeBrandLogo = async (base64: string, mimeType: string): Promise<BrandAnalysis> => {
    const ai = getAI();
    const response = await generateContentSafe(ai, {
        model: MODELS.TEXT,
        contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: `Analyze logo JSON {colors:[{name,hex}], typography, vibe:[]}.` }] },
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
};
