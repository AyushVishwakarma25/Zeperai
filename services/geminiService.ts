
/**
 * FILE: geminiService.ts
 * PURPOSE: Core service for all Google Gemini AI interactions (Image, Text, Vision).
 */

import { GoogleGenAI, Type } from "@google/genai";
import { AI_SUGGESTED, PRO_PRODUCT_STYLE_PRESETS, UGC_STYLE_OPTIONS, AD_STYLE_PRESETS } from '../constants';
import type { GenerateImageParams, GeneratedImage, EditImageParams, GenerateCaptionParams, BrandKit, MoodBoard, BrandAnalysis } from '../types';
import { AspectRatio, AppMode, MarketplacePreset, FashionShootType, RegionalStyle, ProductCategory, ResolutionQuality } from '../types';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to safely parse JSON from Gemini, which might be wrapped in markdown
const parseGeminiJson = <T>(text: string | undefined, fallback: T): T => {
    if (!text) return fallback;
    try {
        // Find the start and end of the JSON block
        const jsonMatch = text.match(/```(json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[2]) {
            return JSON.parse(jsonMatch[2]);
        }
        // If no markdown block, try parsing the whole string
        return JSON.parse(text);
    } catch (e) {
        console.warn("Failed to parse Gemini JSON response, returning fallback.", text);
        return fallback;
    }
};


const getAI = () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
        throw new Error("API Key is missing. Please set VITE_API_KEY in your environment variables.");
    }
    return new GoogleGenAI({ apiKey });
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

const urlToBase64 = async (url: string): Promise<string> => {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = () => {
                const result = reader.result as string;
                resolve(result.split(',')[1]);
            };
            reader.onerror = reject;
        });
    } catch (e) {
        console.error("Failed to fetch image from URL (likely CORS issue):", url, e);
        throw new Error("Failed to load reference image from URL. Try uploading directly.");
    }
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
        adLayout, adTitle, overlayText, ugcStyle, adStylePreset,
        isComparisonMode, competitorImage, productAFeatures, productBFeatures,
        remixReferenceImageUrl, logoImage
    } = params;
    
    let parts: any[] = [];
    let corePrompt = '';

    // --- Step 1: Add Image Parts based on App Mode ---
    
    if (appMode === AppMode.Remix) {
        // For Remix mode, order is: Reference (scene) first, then Product.
        if (params.remixReferenceImage) {
            const base64 = await fileToBase64(params.remixReferenceImage);
            parts.push({ inlineData: { data: base64, mimeType: params.remixReferenceImage.type } });
        } else if (remixReferenceImageUrl) {
            try {
                const base64 = await urlToBase64(remixReferenceImageUrl);
                parts.push({ inlineData: { data: base64, mimeType: 'image/png' } });
            } catch (e) {
                console.warn("Skipping remix reference URL due to fetch error.");
            }
        }

        if (params.remixProductImage) {
            const base64 = await fileToBase64(params.remixProductImage);
            parts.push({ inlineData: { data: base64, mimeType: params.remixProductImage.type } });
        }
    } else {
        // 1a. Model Seed (Influencer Mode)
        if (modelSeedUrl) {
            try {
                const response = await fetch(modelSeedUrl);
                const blob = await response.blob();
                const reader = new FileReader();
                const dataUrl = await new Promise<string>(resolve => {
                    reader.onload = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
                const { data, mimeType } = dataURLToParts(dataUrl);
                parts.push({ inlineData: { data, mimeType } });
            } catch (e) {
                console.warn("Failed to load model seed image", e);
            }
        }

        // 1b. Main Product Image
        // 'activeImage' is for bulk jobs, otherwise use the main 'frontProductImage'.
        const imageToUse = activeImage || params.frontProductImage;
        if (imageToUse) {
            const base64 = await fileToBase64(imageToUse);
            parts.push({ inlineData: { data: base64, mimeType: imageToUse.type } });
        }

        // 1c. Competitor Image (Comparison Mode)
        if (isComparisonMode && competitorImage) {
            const base64 = await fileToBase64(competitorImage);
            parts.push({ inlineData: { data: base64, mimeType: competitorImage.type } });
        }

        // 1d. Brand Logo (Ad Creative Mode)
        // Priority: Explicitly uploaded logo > Brand Kit Logo
        if (appMode === AppMode.AdCreative) {
            if (logoImage) {
                const base64 = await fileToBase64(logoImage);
                parts.push({ inlineData: { data: base64, mimeType: logoImage.type } });
            } else if (brandKit?.logoUrl) {
                try {
                    // Check if it's a blob URL (local) or external
                    if (brandKit.logoUrl.startsWith('blob:')) {
                         const response = await fetch(brandKit.logoUrl);
                         const blob = await response.blob();
                         const reader = new FileReader();
                         const dataUrl = await new Promise<string>(resolve => {
                             reader.onload = () => resolve(reader.result as string);
                             reader.readAsDataURL(blob);
                         });
                         const { data, mimeType } = dataURLToParts(dataUrl);
                         parts.push({ inlineData: { data, mimeType } });
                    } else {
                         const base64 = await urlToBase64(brandKit.logoUrl);
                         parts.push({ inlineData: { data: base64, mimeType: 'image/png' } });
                    }
                } catch (e) {
                    console.warn("Could not load brand kit logo for prompt:", e);
                }
            }
        }
    }


    // --- Step 2: Build Text Prompt based on App Mode ---

    switch (appMode) {
        case AppMode.Product:
        case AppMode.Festival:
            const baseSubject = productDescription || 'a product';
            let stylePrompt = "A professional studio shot with a clean, vibrant, single-color or soft gradient background and bright, clean lighting.";

            if (appMode === AppMode.Festival && params.festivalStyle) {
                stylePrompt = `A festive photoshoot with a theme of: ${params.festivalStyle}.`;
            } else if (productStylePreset && productStylePreset !== AI_SUGGESTED) {
                 const [category, presetName] = productStylePreset.split('|');
                 const foundCategory = PRO_PRODUCT_STYLE_PRESETS.find(c => c.category === category);
                 const foundPreset = foundCategory?.presets.find(p => p.name === presetName);
                 if (foundPreset) {
                     stylePrompt = foundPreset.prompt.replace(/\[product\]/g, 'the described product');
                 }
            }
            
            corePrompt = `
              You are an expert product photographer. Create a single, professional studio photograph based on the following instructions.
              
              Primary Subject: "${baseSubject}". This is the most important instruction. The final image must accurately represent this subject. Any details in this description (e.g., specific colors, ingredients, text) override conflicting details in the style guide below.
              
              Visual Style Guide: "${stylePrompt}". Use this as a guide for the overall look, feel, lighting, and composition.
            `;

            if (pose) { // 'pose' is the angle for product mode
                corePrompt += `\nCamera Angle: The image must be a ${pose}.`;
            }
            break;

        case AppMode.Influencer:
             // Priority 1: UGC Style Preset
             if (ugcStyle) {
                 const foundUgcPreset = UGC_STYLE_OPTIONS.find(p => p.value === ugcStyle);
                 if (foundUgcPreset) {
                     corePrompt = foundUgcPreset.prompt.replace(/\[product\]/g, productDescription || 'product');
                     if (modelSeedUrl) corePrompt += `\n- CRITICAL: Use the person from the seed image but apply the requested style/vibe/pose.`;
                     // Enforce "Indian faces and tone" if not explicit in the seed image
                     if (!modelSeedUrl && !corePrompt.toLowerCase().includes('indian')) {
                         corePrompt += ` Model should have Indian features and skin tone as requested.`;
                     }
                 } else {
                     corePrompt = `Create a high-end influencer-style marketing image.`;
                 }
             } else {
                 // Priority 2: Manual Configuration
                 corePrompt = `Create a high-end influencer-style marketing image.`;
                 if (modelSeedUrl) corePrompt += `\n- CRITICAL: Model must match provided seed image exactly.`;
                 corePrompt += `
                - Product: ${productDescription || 'the product'}.
                - Model: ${modelGender} influencer, ${modelPersona} persona.
                - Pose: ${poseSuggestion || 'Natural, engaging'}.
                - Outfit: ${clothingType}.
                - Scene: ${backgroundStyle || 'Aesthetic setting'}.
                Photorealistic, aspirational mood.`;
             }
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
            if (isComparisonMode) {
                // FIX: Explicitly label image order for Comparison Mode
                corePrompt = `Create a high-conversion comparison ad for a D2C brand.
                
                CRITICAL IMAGE ORDER:
                - The FIRST image provided is the [Primary Product] (Your Brand).
                - The SECOND image provided is the [Competitor/Generic Product] (Other Brand).
                
                INSTRUCTIONS:
                - Visually compare the two products in a clean, modern style.
                - Emphasize the [Primary Product]. Make it vibrant, sharp, and the "hero".
                - Make the [Competitor/Generic Product] slightly desaturated, neutral, or less prominent to visually highlight the superiority of the Primary Product.

                TEXT ELEMENTS:
                - Headline: "${adTitle || 'Comparison'}"
                - Subheading: "${params.adSubheading || ''}"
                - CTA Button: "${params.adCta || 'Shop Now'}"
                
                COMPARISON POINTS:
                - Primary Product Features: ${productAFeatures || 'High Quality, Premium'}
                - Competitor Features: ${productBFeatures || 'Standard Quality, Basic'}

                LAYOUT: ${adLayout}.
                Automatically adapt layout composition based on product type, comparison points count, and aspect ratio.
                Ensure brand colors dominate while competitor visuals remain neutral.
                Maintain D2C-style energy (bold, playful, relatable).
                `;
            } else {
                let adStyleInstructions = "Visually striking, professional graphic design.";
                if (adStylePreset && adStylePreset !== AI_SUGGESTED) {
                    const foundAdPreset = AD_STYLE_PRESETS.find(p => p.value === adStylePreset);
                    if (foundAdPreset) adStyleInstructions = foundAdPreset.prompt;
                }

                corePrompt = `Create a high-converting Ad Creative optimized for social media performance.

                PRODUCT CONTEXT: "${productDescription}".
                LAYOUT STRUCTURE: ${adLayout}.
                CREATIVE STYLE: ${adStyleInstructions}

                TEXT ELEMENTS (Render these clearly):
                - HEADLINE: "${adTitle || ''}" (Hook attention)
                - SUBHEADING: "${params.adSubheading || ''}" (Build desire)
                - CTA BUTTON: "${params.adCta || ''}" (Drive action)

                DESIGN PRINCIPLES:
                1. Visual Hierarchy: Make the headline and product the largest, most contrasting elements.
                2. Stopping Power: Use the requested style to create a "scroll-stopping" visual.
                3. Clarity: Text must be legible against the background. Use overlays or shadows if necessary.
                4. Composition: Balance the "Visual Element" (image) with the copy according to the Layout Structure.
                `;
                
                if (logoImage || brandKit?.logoUrl) {
                    corePrompt += `\nBRANDING: Include the provided logo naturally in the layout (e.g., top corner or bottom center).`;
                }
            }
            break;
        
        case AppMode.Remix:
            corePrompt = `You are an expert photo editor. Your task is to use two images: the first image is the scene/style reference, and the second is a product cutout.
            
            Instructions:
            1. Seamlessly integrate the product from the second image into the scene of the first image.
            2. The final result must adopt the lighting, shadows, style, and mood of the first image.
            3. If the first image has a main subject, replace it with the product from the second image.
            4. Apply the following modifications if provided: "${productDescription}". If the prompt is empty, just perform the integration.
            5. The final output should be photorealistic.`;
            break;

        default:
            corePrompt = `Professional marketing image for "${productDescription}". Clean, modern, high-quality.`;
            break;
    }

    if (marketplacePreset === MarketplacePreset.Amazon) corePrompt += ` COMPLIANCE: Amazon White Background (RGB 255,255,255). No shadows.`;
    
    // --- Step 3: Inject Brand Identity (Global) ---
    if (brandKit) {
        corePrompt += `\n\nBRAND IDENTITY GUIDELINES (Strictly Adhere):`;
        if (brandKit.brandName) corePrompt += `\n- Brand Name: "${brandKit.brandName}"`;
        if (brandKit.voice) corePrompt += `\n- Tone of Voice: ${brandKit.voice}`;
        if (brandKit.primaryColor) corePrompt += `\n- Primary Color: ${brandKit.primaryColor} (Use for key elements/CTA)`;
        if (brandKit.secondaryColor) corePrompt += `\n- Secondary Color: ${brandKit.secondaryColor}`;
        if (brandKit.accentColor) corePrompt += `\n- Accent Color: ${brandKit.accentColor}`;
        if (brandKit.fonts) corePrompt += `\n- Typography Style: ${brandKit.fonts}`;
        if (brandKit.negativeConstraints) corePrompt += `\n- STRICTLY AVOID: ${brandKit.negativeConstraints}`;
        
        corePrompt += `\n\nEnsure the final output reflects this brand identity for consistency.`;
    }

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
    const ai = getAI();
    const contents = await buildPromptParts(params, brandKit, activeImage, pose, modelSeedUrl);
    
    let aspectRatioConfig: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1";
    if (aspectRatio === AspectRatio.Portrait) aspectRatioConfig = "9:16";
    if (aspectRatio === AspectRatio.Landscape) aspectRatioConfig = "16:9";
    if (aspectRatio === AspectRatio.PortraitPost || aspectRatio === AspectRatio.FashionShopify) aspectRatioConfig = "3:4";

    const modelName = 'gemini-2.5-flash-image';

    const config: any = {
        imageConfig: { aspectRatio: aspectRatioConfig },
        safetySettings: [{ category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' }]
    };

    try {
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

    } catch (error: any) {
        if (retryCount < 3 && (error.message?.includes('429') || error.status === 429)) {
            await wait((retryCount + 1) * 6000);
            return generateSingleImage(params, aspectRatio, userTier, brandKit, activeImage, pose, sourceProductImageUrl, modelSeedUrl, retryCount + 1);
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
    const batchSize = params.batchSize || (params.appMode === AppMode.Fashion ? 4 : 1);
    const maxBatch = userTier === 'Agency' ? 12 : userTier === 'Standard' ? 4 : 1;
    const effectiveBatch = Math.min(batchSize, maxBatch);

    const allResults: GeneratedImage[] = [];
    let completedJobs = 0;

    for (const ratio of aspectRatios) {
        const poses = params.appMode === AppMode.Fashion ? getFashionPoses(effectiveBatch) : [];
        // FIX: Default to 'Front View' if angles are empty to prevent 0 iterations
        const angles = params.appMode === AppMode.Product ? (params.selectedAngles && params.selectedAngles.length > 0 ? params.selectedAngles : ['Front View']) : [];
        const iterations = params.appMode === AppMode.Product ? angles.length : effectiveBatch;

        for (let i = 0; i < iterations; i++) {
            completedJobs++;
            if (onProgress) onProgress(completedJobs, aspectRatios.length * iterations);

            const activeImage = params.bulkImages ? params.bulkImages[i % params.bulkImages.length] : undefined;
            const pose = params.appMode === AppMode.Fashion ? poses[i] : (params.appMode === AppMode.Product ? angles[i] : undefined);

            const result = await generateSingleImage(params, ratio, userTier, brandKit, activeImage, pose, sourceProductImageUrl, modelSeedUrl);
            allResults.push(result);

            if (i < iterations - 1) await wait(5000); 
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
        model: 'gemini-2.5-flash-image',
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
    
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { data, mimeType } }, { text: prompt }] },
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.OBJECT, properties: { caption: { type: Type.STRING }, hashtags: { type: Type.STRING } } }
        }
    });
    
    return parseGeminiJson(response.text, { caption: "Check this out!", hashtags: "#trending" });
};

export const detectProductCategory = async (base64: string, mimeType: string, description: string): Promise<ProductCategory> => {
    if (!process.env.API_KEY) return ProductCategory.Generic;
    const ai = getAI();
    const categories = Object.values(ProductCategory).join('", "');
    const prompt = `Classify product in image based on description "${description}" into ONE category: ["${categories}"]. Return ONLY category name.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: prompt }] }
        });

        const text = response.text?.trim() as ProductCategory;
        if (Object.values(ProductCategory).includes(text)) return text;
        return ProductCategory.Generic;
    } catch (error: any) {
        if (error.status === 403 || error.message?.includes('403')) {
            console.warn("API Permission Denied for category detection. Defaulting to Generic.");
            return ProductCategory.Generic;
        }
        throw error;
    }
};

export const generateVariantSuggestions = async (description: string, field: string) => {
    const ai = getAI();
    const prompt = `Suggest 4 options for "${field}" based on product: "${description}". JSON array.`;

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json", responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } } }
    });

    return parseGeminiJson(response.text, ['Option 1', 'Option 2']);
};

export const getABTestSuggestions = async (image: GeneratedImage) => {
    const ai = getAI();
    const { data, mimeType } = dataURLToParts(image.imageUrl);
    
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

    return parseGeminiJson(response.text, []);
};

export const removeBackground = async (base64: string, mimeType: string): Promise<{ data: string, mimeType: string }> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: "Isolate subject on pure white #FFFFFF background." }] }
    });

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
    return parseGeminiJson(response.text, { concept: '', colors: [], styles: [], tones: [] });
};

export const analyzeBrandLogo = async (base64: string, mimeType: string): Promise<BrandAnalysis> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: `Analyze logo JSON {colors:[{name,hex}], typography, vibe:[]}.` }] },
        config: { responseMimeType: "application/json" }
    });
    return parseGeminiJson(response.text, { colors: [], typography: '', vibe: [] });
};
