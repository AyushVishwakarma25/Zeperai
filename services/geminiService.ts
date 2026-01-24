
/**
 * FILE: geminiService.ts
 * PURPOSE: Core service for all Google Gemini AI interactions (Image, Text, Vision).
 */

import { GoogleGenAI, Type } from "@google/genai";
import { AI_SUGGESTED, PRO_PRODUCT_STYLE_PRESETS, UGC_STYLE_OPTIONS, AD_STYLE_PRESETS, FASHION_POSE_OPTIONS } from '../constants';
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
        remixReferenceImageUrl, logoImage, resolutionQuality
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
            const baseSubject = productDescription || 'the product';
            let finalPrompt = "";

            if (appMode === AppMode.Festival && params.festivalStyle) {
                finalPrompt = `A festive photoshoot of ${baseSubject}. Theme: ${params.festivalStyle}. Professional studio lighting, 8k resolution.`;
            } else if (productStylePreset && productStylePreset !== AI_SUGGESTED) {
                 const [category, presetName] = productStylePreset.split('|');
                 const foundCategory = PRO_PRODUCT_STYLE_PRESETS.find(c => c.category === category);
                 const foundPreset = foundCategory?.presets.find(p => p.name === presetName);
                 if (foundPreset) {
                     // We replace the placeholder in the preset with the actual product description
                     finalPrompt = foundPreset.prompt.replace(/\[product\]/g, baseSubject);
                 } else {
                     finalPrompt = `Professional studio shot of ${baseSubject}. Clean, high-end commercial lighting.`;
                 }
            } else {
                 finalPrompt = `Professional studio shot of ${baseSubject}. ${backgroundStyle && backgroundStyle !== AI_SUGGESTED ? `Background: ${backgroundStyle}.` : 'Clean, high-end commercial lighting.'}`;
            }
            
            corePrompt = `${finalPrompt} Camera Angle: ${pose || 'Front View'}. ${resolutionQuality === ResolutionQuality.High ? '8K, Ultra-High Definition.' : ''}`;
            break;

        case AppMode.Influencer:
             if (ugcStyle) {
                 const foundUgcPreset = UGC_STYLE_OPTIONS.find(p => p.value === ugcStyle);
                 if (foundUgcPreset) {
                     corePrompt = foundUgcPreset.prompt.replace(/\[product\]/g, productDescription || 'the product');
                     if (modelSeedUrl) {
                         corePrompt += ` Maintain the facial features of the provided reference model.`;
                     } else if (!corePrompt.toLowerCase().includes('indian')) {
                         corePrompt += ` Model should have Indian features and skin tone.`;
                     }
                 } else {
                     corePrompt = `Influencer style photo of ${productDescription}.`;
                 }
             } else {
                 corePrompt = `High-end influencer marketing photo. 
                 Product: ${productDescription}. 
                 Model: ${modelGender} influencer, ${modelPersona} persona. 
                 Pose: ${poseSuggestion || 'Natural'}. 
                 Outfit: ${clothingType}. 
                 Setting: ${backgroundStyle || 'Aesthetic background'}. 
                 Photorealistic, social media quality.`;
                 
                 if (modelSeedUrl) corePrompt += ` Maintain strict consistency with the provided model face.`;
             }
            break;

        case AppMode.Fashion:
            corePrompt = `High-end Fashion Photography.
            Subject: ${productDescription || 'Clothing item'}.
            Category: ${fashionSubCategory || 'Apparel'} (${fashionCategory}).
            Model: ${fashionBodyType || 'Regular'} body type. ${regionalStyle !== RegionalStyle.None ? `Style: ${regionalStyle}.` : ''}
            Shoot Type: ${fashionShootType}. ${fashionShootType === FashionShootType.GhostMannequin ? '(Ghost Mannequin / Invisible Model)' : ''}
            Pose: ${pose || 'Standard Catalog Pose'}.
            ${hyperRealism ? '8K resolution, highly detailed fabric texture, cinematic lighting.' : 'Standard e-commerce quality.'}`;
            
            if (modelLockId) corePrompt += ` Use fixed model persona: ${modelLockId}.`;
            break;

        case AppMode.AdCreative:
        case AppMode.Banner:
        case AppMode.Youtube:
            if (isComparisonMode) {
                corePrompt = `Create a comparison ad layout. 
                Show ${productDescription} (Primary/Hero) vs a generic competitor.
                Layout: ${adLayout}.
                Primary Features: ${productAFeatures || 'Premium Quality'}.
                Competitor Features: ${productBFeatures || 'Basic Quality'}.
                Text Overlay: "${adTitle || 'Comparison'}". 
                CTA: "${params.adCta || 'Shop Now'}".
                Make the primary product look superior in lighting and presentation.`;
            } else {
                let adStyle = "Professional graphic design style.";
                if (adStylePreset && adStylePreset !== AI_SUGGESTED) {
                    const foundAdPreset = AD_STYLE_PRESETS.find(p => p.value === adStylePreset);
                    if (foundAdPreset) adStyle = foundAdPreset.prompt;
                }

                corePrompt = `Create a professional Ad Creative.
                Product: ${productDescription}.
                Layout: ${adLayout}.
                Style: ${adStyle}
                Headline: "${adTitle || ''}".
                Subheading: "${params.adSubheading || ''}".
                CTA Button: "${params.adCta || ''}".
                Ensure text is legible and high contrast.`;
                
                if (logoImage || brandKit?.logoUrl) {
                    corePrompt += ` Include the provided logo naturally.`;
                }
            }
            break;
        
        case AppMode.Remix:
            corePrompt = `Photo Manipulation Task.
            Integrate the product into the reference scene.
            Match lighting, perspective, and shadows of the reference image.
            ${productDescription ? `User Instruction: ${productDescription}` : ''}`;
            break;

        default:
            corePrompt = `Professional marketing image for ${productDescription}. High quality.`;
            break;
    }

    if (marketplacePreset === MarketplacePreset.Amazon) corePrompt += ` White Background (RGB 255,255,255).`;
    
    // --- Step 3: Inject Brand Identity (Global) ---
    if (brandKit) {
        corePrompt += `\nBrand Guidelines: Use ${brandKit.primaryColor} and ${brandKit.secondaryColor} as accent colors.`;
        if (brandKit.negativeConstraints) corePrompt += ` Avoid: ${brandKit.negativeConstraints}.`;
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
    const allResults: GeneratedImage[] = [];
    let completedJobs = 0;

    // Calculate total operations for progress bar
    let totalOps = 0;
    
    // Configs per mode
    const fashionBatchSize = Math.min(params.batchSize || (params.appMode === AppMode.Fashion ? 4 : 1), userTier === 'Agency' ? 12 : userTier === 'Standard' ? 4 : 1);
    
    // For Product Mode: Presets * Angles * Images
    const productPresets = (params.productStylePresets && params.productStylePresets.length > 0) 
        ? params.productStylePresets 
        : (params.productStylePreset ? [params.productStylePreset] : [AI_SUGGESTED]);
    const productAngles = (params.selectedAngles && params.selectedAngles.length > 0) ? params.selectedAngles : ['Front View'];
    const bulkImages = params.bulkImages && params.bulkImages.length > 0 ? params.bulkImages : (params.frontProductImage ? [params.frontProductImage] : [undefined]);

    if (params.appMode === AppMode.Product) {
        totalOps = aspectRatios.length * productPresets.length * productAngles.length * bulkImages.length;
    } else if (params.appMode === AppMode.Fashion) {
        totalOps = aspectRatios.length * fashionBatchSize; // Fashion usually one image context, repeated for batch size
        // If bulk images provided in fashion mode (e.g. multiple garments), multiply by that
        if (params.bulkImages && params.bulkImages.length > 0) totalOps = aspectRatios.length * params.bulkImages.length;
    } else {
        // Standard modes (Influencer, Ad, etc)
        const standardBatch = params.batchSize || 1;
        totalOps = aspectRatios.length * standardBatch;
        if (params.bulkImages && params.bulkImages.length > 0) totalOps = aspectRatios.length * params.bulkImages.length;
    }

    for (const ratio of aspectRatios) {
        if (params.appMode === AppMode.Product) {
            // Product Mode: Iterate All Combinations
            for (const preset of productPresets) {
                for (const angle of productAngles) {
                    for (const img of bulkImages) {
                        completedJobs++;
                        if (onProgress) onProgress(completedJobs, totalOps);

                        const singleParams = { ...params, productStylePreset: preset };
                        const result = await generateSingleImage(singleParams, ratio, userTier, brandKit, img, angle, sourceProductImageUrl, modelSeedUrl);
                        allResults.push(result);
                        
                        if (completedJobs < totalOps) await wait(2000); // Small delay between requests
                    }
                }
            }
        } 
        else if (params.appMode === AppMode.Fashion) {
            const imageList = params.bulkImages && params.bulkImages.length > 0 ? params.bulkImages : [params.frontProductImage];
            
            // Determine poses for the batch
            let poses: string[] = [];
            // Use selected array of poses OR default auto logic
            if (params.fashionPose && params.fashionPose.length > 0) {
                poses = params.fashionPose;
            } else {
                // Auto mode: Use the predefined rotated list from constants
                poses = FASHION_POSE_OPTIONS;
            }

            // If bulk images exist, iterate images. Else iterate batch size (poses).
            if (params.bulkImages && params.bulkImages.length > 0) {
                for (const img of imageList) {
                    completedJobs++;
                    if (onProgress) onProgress(completedJobs, totalOps);
                    
                    // For bulk upload, we pick the first pose logic or random if user didn't specify
                    // If multiple poses selected for bulk... complex. For now, just pick the first.
                    const pose = poses[0]; 
                    
                    const result = await generateSingleImage(params, ratio, userTier, brandKit, img, pose, sourceProductImageUrl, modelSeedUrl);
                    allResults.push(result);
                    if (completedJobs < totalOps) await wait(2000);
                }
            } else {
                // Single image, multiple poses (batch)
                // Iterate through the batch size, rotating through the selected poses
                for (let i = 0; i < fashionBatchSize; i++) {
                    completedJobs++;
                    if (onProgress) onProgress(completedJobs, totalOps);
                    
                    // Rotate through available poses based on index
                    const pose = poses[i % poses.length];
                    
                    const result = await generateSingleImage(params, ratio, userTier, brandKit, undefined, pose, sourceProductImageUrl, modelSeedUrl);
                    allResults.push(result);
                    if (completedJobs < totalOps) await wait(2000);
                }
            }
        }
        else {
            // Default Modes (Influencer, Ad, etc.)
            // Support bulk if present, otherwise single batch
            const imageList = params.bulkImages && params.bulkImages.length > 0 ? params.bulkImages : [params.frontProductImage];
            
            for (const img of imageList) {
                // If standard batch size requested (e.g. variations of same input)
                const iterations = params.batchSize || 1;
                for (let i = 0; i < iterations; i++) {
                    completedJobs++;
                    if (onProgress) onProgress(completedJobs, totalOps);
                    
                    const result = await generateSingleImage(params, ratio, userTier, brandKit, img, undefined, sourceProductImageUrl, modelSeedUrl);
                    allResults.push(result);
                    
                    if (completedJobs < totalOps) await wait(2000);
                }
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
