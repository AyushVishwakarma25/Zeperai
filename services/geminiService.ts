
/**
 * FILE: geminiService.ts
 *
 * PURPOSE:
 * - Core service for all Google Gemini AI interactions (Image, Text, Vision).
 *
 * FLOW:
 * UI Component → geminiService → Google Gemini API → Response → UI Component
 *
 * INPUT:
 * - params: GenerateImageParams | GenerateCaptionParams | ...
 *
 * OUTPUT:
 * - GeneratedImage[] | CaptionData | ...
 *
 * NOTES:
 * - Rate limiting is handled internally via retries.
 * - API Key is retrieved from environment variables.
 */

import { GoogleGenAI, Type } from "@google/genai";
import { AI_SUGGESTED, PRO_PRODUCT_STYLE_PRESETS } from '../constants';
import type { GenerateImageParams, GeneratedImage, EditImageParams, GenerateCaptionParams, BrandKit, MoodBoard, BrandAnalysis } from '../types';
import { AspectRatio, AppMode, MarketplacePreset, FashionGender, FashionShootType, RegionalStyle, ProductCategory, ResolutionQuality } from '../types';

// --- PRIVATE HELPERS ---

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
        throw new Error("API Key is missing. Please set VITE_API_KEY in your environment variables.");
    }
    return new GoogleGenAI({ apiKey });
};

const getFashionPoses = (count: number): string[] => {
    // Logic to get diverse poses
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

// --- CORE GENERATION LOGIC ---

async function buildPromptParts(params: GenerateImageParams, brandKit?: BrandKit | null, activeImage?: File, pose?: string, modelSeedUrl?: string): Promise<any[]> {
    const { 
        productDescription, appMode, marketplacePreset, hyperRealism, 
        fashionShootType, fashionCategory, fashionSubCategory, fashionBodyType, 
        regionalStyle, modelLockId, productStylePreset,
        modelGender, modelPersona, poseSuggestion, backgroundStyle, clothingType,
        adLayout, adTitle, overlayText
    } = params;
    
    let parts: any[] = [];

    // Add Image Assets
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

    // Construct Text Prompt
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

    // Append Compliance/Brand Rules
    if (marketplacePreset === MarketplacePreset.Amazon) corePrompt += ` COMPLIANCE: Amazon White Background (RGB 255,255,255). No shadows.`;
    if (brandKit?.voice) corePrompt += `\n- Brand Voice: ${brandKit.voice}.`;

    return [{ text: corePrompt }, ...parts];
}

async function generateSingleImage(
    params: GenerateImageParams, 
    aspectRatio: AspectRatio, 
    userTier: string,
    brandKit?: BrandKit | null, 
    activeImage?: File, 
    pose?: string, 
    sourceProductImageUrl?: string, 
    modelSeedUrl?: string,
    retryCount: number = 0
): Promise<GeneratedImage> {
    // 1. Validate & Init
    const ai = getAI();
    
    // 2. Prepare Config & Prompt
    const contents = await buildPromptParts(params, brandKit, activeImage, pose, modelSeedUrl);
    
    let aspectRatioConfig: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1";
    if (aspectRatio === AspectRatio.Portrait) aspectRatioConfig = "9:16";
    if (aspectRatio === AspectRatio.Landscape) aspectRatioConfig = "16:9";
    if (aspectRatio === AspectRatio.PortraitPost || aspectRatio === AspectRatio.FashionShopify) aspectRatioConfig = "3:4";

    const isProTier = userTier === 'Standard' || userTier === 'Agency';
    const modelName = isProTier ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';

    const config: any = {
        imageConfig: { aspectRatio: aspectRatioConfig },
        safetySettings: [{ category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' }]
    };

    if (isProTier && params.resolutionQuality === ResolutionQuality.High) {
        config.imageConfig.imageSize = '2K'; 
    }

    try {
        // 3. Call AI
        const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts: contents },
            config: config,
        });

        // 4. Handle Response
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

        // 5. Return Safe Output
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

    } catch (error: any) {
        if (retryCount < 3 && (error.message?.includes('429') || error.status === 429)) {
            await wait((retryCount + 1) * 6000);
            return generateSingleImage(params, aspectRatio, userTier, brandKit, activeImage, pose, sourceProductImageUrl, modelSeedUrl, retryCount + 1);
        }
        throw error;
    }
}

// --- PUBLIC API ---

export const generateImages = async (
    params: GenerateImageParams, 
    userTier: 'Free' | 'Starter' | 'Standard' | 'Agency',
    brandKit?: BrandKit | null,
    sourceProductImageUrl?: string,
    onProgress?: (current: number, total: number) => void,
    modelSeedUrl?: string
): Promise<GeneratedImage[]> => {
    // 1. Validate Input & Setup Queues
    const aspectRatios = params.aspectRatios?.length ? params.aspectRatios : [AspectRatio.PortraitPost];
    const batchSize = params.batchSize || (params.appMode === AppMode.Fashion ? 4 : 1);
    const maxBatch = userTier === 'Agency' ? 12 : userTier === 'Standard' ? 4 : 1;
    const effectiveBatch = Math.min(batchSize, maxBatch);

    const allResults: GeneratedImage[] = [];
    const totalJobs = aspectRatios.length * effectiveBatch;
    let completedJobs = 0;

    // 2. Execution Loop
    for (const ratio of aspectRatios) {
        const poses = params.appMode === AppMode.Fashion ? getFashionPoses(effectiveBatch) : [];
        const angles = params.appMode === AppMode.Product ? (params.selectedAngles || ['Front View']) : [];
        const iterations = params.appMode === AppMode.Product ? angles.length : effectiveBatch;

        for (let i = 0; i < iterations; i++) {
            completedJobs++;
            if (onProgress) onProgress(completedJobs, totalJobs);

            const activeImage = params.bulkImages ? params.bulkImages[i % params.bulkImages.length] : undefined;
            const pose = params.appMode === AppMode.Fashion ? poses[i] : (params.appMode === AppMode.Product ? angles[i] : undefined);

            // 3. Call Internal Generator
            const result = await generateSingleImage(params, ratio, userTier, brandKit, activeImage, pose, sourceProductImageUrl, modelSeedUrl);
            allResults.push(result);

            if (i < iterations - 1) await wait(5000); // Rate limit buffer
        }
    }

    // 4. Return Results
    return allResults;
};

export const editImage = async (params: EditImageParams): Promise<{ imageUrl: string }> => {
    // 1. Validate
    const ai = getAI();
    
    // 2. Prepare Config
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

    // 3. Call AI
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts }
    });

    // 4. Handle Response
    const outputPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!outputPart?.inlineData) throw new Error("No image generated from edit.");

    // 5. Return Safe Output
    return { imageUrl: `data:${outputPart.inlineData.mimeType};base64,${outputPart.inlineData.data}` };
};

export const generateCaption = async (params: GenerateCaptionParams, brandKit: BrandKit | null) => {
    // 1. Validate
    const ai = getAI();
    
    // 2. Prepare Prompt
    const { data, mimeType } = dataURLToParts(params.imageUrl);
    const prompt = `Write marketing caption. Tone: ${params.tone}. Platform: ${params.platform}. JSON {caption, hashtags}.`;
    
    // 3. Call AI
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { data, mimeType } }, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.OBJECT, properties: { caption: { type: Type.STRING }, hashtags: { type: Type.STRING } } }
        }
    });
    
    // 4. Handle & Return
    try {
        return JSON.parse(response.text || '{}');
    } catch {
        return { caption: "Check this out!", hashtags: "#trending" };
    }
};

export const detectProductCategory = async (base64: string, mimeType: string, description: string): Promise<ProductCategory> => {
    // 1. Validate
    if (!process.env.API_KEY) return ProductCategory.Generic;
    const ai = getAI();

    // 2. Prepare Prompt
    const categories = Object.values(ProductCategory).join('", "');
    const prompt = `Classify product in image based on description "${description}" into ONE category: ["${categories}"]. Return ONLY category name.`;

    // 3. Call AI
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: prompt }] }
    });

    // 4. Handle Response
    const text = response.text?.trim() as ProductCategory;
    if (Object.values(ProductCategory).includes(text)) return text;

    // 5. Return Safe Default
    return ProductCategory.Generic;
};

export const generateVariantSuggestions = async (description: string, field: string) => {
    // 1. Validate & Prepare
    const ai = getAI();
    const prompt = `Suggest 4 options for "${field}" based on product: "${description}". JSON array.`;

    // 2. Call AI
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } }
    });

    // 3. Handle & Return
    try { return JSON.parse(response.text || '[]'); } catch { return ['Option 1', 'Option 2']; }
};

export const getABTestSuggestions = async (image: GeneratedImage) => {
    // 1. Validate & Prepare
    const ai = getAI();
    const { data, mimeType } = dataURLToParts(image.imageUrl);
    
    // 2. Call AI
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { data, mimeType } }, { text: "Suggest 3 A/B test variations. JSON array {title, description, hypothesis}." }] },
        config: { 
            responseMimeType: "application/json", 
            responseSchema: { 
                type: Type.ARRAY, 
                items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING }, hypothesis: { type: Type.STRING } } } 
            } 
        }
    });

    // 3. Handle & Return
    try { return JSON.parse(response.text || '[]'); } catch { return []; }
};

export const removeBackground = async (base64: string, mimeType: string): Promise<{ data: string, mimeType: string }> => {
    // 1. Validate & Prepare
    const ai = getAI();
    
    // 2. Call AI
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: "Isolate subject on pure white #FFFFFF background." }] }
    });

    // 3. Handle & Return
    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part?.inlineData) return { data: part.inlineData.data, mimeType: part.inlineData.mimeType };
    return { data: base64, mimeType };
};

export const generateMoodBoard = async (description: string): Promise<MoodBoard> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Mood board for: "${description}". JSON {concept, colors:[{name,hex}], styles:[], tones:[]}.`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
};

export const analyzeBrandLogo = async (base64: string, mimeType: string): Promise<BrandAnalysis> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: `Analyze logo JSON {colors:[{name,hex}], typography, vibe:[]}.` }] },
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
};
