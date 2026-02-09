
/**
 * FILE: geminiService.ts
 * PURPOSE: Core service for all Google Gemini AI interactions (Image, Text, Vision).
 */

import { GoogleGenAI, Type } from "@google/genai";
import { AI_SUGGESTED, PRO_PRODUCT_STYLE_PRESETS, UGC_STYLE_OPTIONS, AD_STYLE_PRESETS, FASHION_POSE_OPTIONS, FESTIVAL_PRESETS } from '../constants';
import type { GenerateImageParams, GeneratedImage, EditImageParams, GenerateCaptionParams, BrandKit, MoodBoard, BrandAnalysis } from '../types';
import { AspectRatio, AppMode, MarketplacePreset, FashionShootType, RegionalStyle, ProductCategory, ResolutionQuality } from '../types';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to safely parse JSON from Gemini, which might be wrapped in markdown
const parseGeminiJson = <T>(text: string | undefined, fallback: T): T => {
    if (!text) return fallback;
    try {
        const jsonMatch = text.match(/```(json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[2]) {
            return JSON.parse(jsonMatch[2]);
        }
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
        throw new Error("Failed to load reference image from URL.");
    }
};

const dataURLToParts = (dataURL: string) => {
    const parts = dataURL.split(',');
    const data = parts[1];
    const mimeType = parts[0].split(':')[1].split(';')[0];
    return { data, mimeType };
};

async function buildPromptParts(params: GenerateImageParams, brandKit?: BrandKit | null, activeImages?: File[], pose?: string, modelSeedUrl?: string): Promise<any[]> {
    const { 
        productDescription, appMode, marketplacePreset, hyperRealism, 
        fashionShootType, fashionCategory, fashionSubCategory, fashionBodyType, 
        regionalStyle, modelLockId, productStylePreset,
        modelGender, modelPersona, poseSuggestion, backgroundStyle, clothingType,
        adLayout, adTitle, ugcStyle, adStylePreset,
        isComparisonMode, competitorImage, productAFeatures, productBFeatures,
        remixReferenceImageUrl, logoImage, resolutionQuality
    } = params;
    
    let parts: any[] = [];
    let corePrompt = '';

    if (appMode === AppMode.Remix) {
        if (params.remixReferenceImage) {
            const base64 = await fileToBase64(params.remixReferenceImage);
            parts.push({ inlineData: { data: base64, mimeType: params.remixReferenceImage.type } });
        } else if (remixReferenceImageUrl) {
            try {
                const base64 = await urlToBase64(remixReferenceImageUrl);
                parts.push({ inlineData: { data: base64, mimeType: 'image/png' } });
            } catch (e) { console.warn("Skipping remix reference URL."); }
        }
        if (params.remixProductImage) {
            const base64 = await fileToBase64(params.remixProductImage);
            parts.push({ inlineData: { data: base64, mimeType: params.remixProductImage.type } });
        }
    } else {
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
            } catch (e) { console.warn("Failed to load model seed", e); }
        }

        // Send ALL active images to AI as a unified set of references
        // This ensures whether 1, 2, or 5 images are uploaded, the AI sees them all
        if (activeImages && activeImages.length > 0) {
            for (const img of activeImages) {
                // Double check it's a file before reading
                if (img && img.size > 0) {
                    try {
                        const base64 = await fileToBase64(img);
                        parts.push({ inlineData: { data: base64, mimeType: img.type } });
                    } catch (readError) {
                        console.warn("Skipping invalid image file:", readError);
                    }
                }
            }
        }

        if (isComparisonMode && competitorImage) {
            const base64 = await fileToBase64(competitorImage);
            parts.push({ inlineData: { data: base64, mimeType: competitorImage.type } });
        }

        if (appMode === AppMode.AdCreative && (logoImage || brandKit?.logoUrl)) {
            try {
                const url = logoImage ? URL.createObjectURL(logoImage) : brandKit?.logoUrl;
                if (url) {
                    const base64 = await urlToBase64(url);
                    parts.push({ inlineData: { data: base64, mimeType: 'image/png' } });
                }
            } catch (e) { console.warn("Logo load error", e); }
        }
    }

    switch (appMode) {
        case AppMode.Product:
        case AppMode.Festival:
            const baseSubject = productDescription || 'the product';
            let finalPrompt = "";
            if (appMode === AppMode.Festival && params.festivalStyle) {
                let searchName = params.festivalStyle.includes('|') ? params.festivalStyle.split('|')[1] : params.festivalStyle;
                let foundPreset = null;
                for (const cat of FESTIVAL_PRESETS) {
                    const p = cat.presets.find(p => p.name === searchName);
                    if (p) { foundPreset = p; break; }
                }
                finalPrompt = foundPreset ? foundPreset.prompt.replace(/\[product\]/g, baseSubject) : `Festive photoshoot of ${baseSubject}. Theme: ${params.festivalStyle}.`;
            } else if (productStylePreset && productStylePreset !== AI_SUGGESTED) {
                 const pParts = productStylePreset.split('|');
                 const presetName = pParts.length > 1 ? pParts[1] : pParts[0];
                 const categoryName = pParts.length > 1 ? pParts[0] : null;
                 let foundPreset = null;
                 for (const cat of PRO_PRODUCT_STYLE_PRESETS) {
                     if (categoryName && cat.category !== categoryName) continue;
                     const p = cat.presets.find(p => p.name === presetName);
                     if (p) { foundPreset = p; break; }
                 }
                 finalPrompt = foundPreset ? foundPreset.prompt.replace(/\[product\]/g, baseSubject) : `Studio shot of ${baseSubject}. Style: ${presetName}.`;
            } else {
                 finalPrompt = `Professional studio shot of ${baseSubject}. ${backgroundStyle && backgroundStyle !== AI_SUGGESTED ? `Background: ${backgroundStyle}.` : ''}`;
            }
            corePrompt = `${finalPrompt} Camera Angle: ${pose || 'Front View'}.`;
            if (activeImages && activeImages.length > 1) {
                corePrompt += ` Use the multiple input images to understand the product from different angles.`;
            }
            break;
        case AppMode.Influencer:
             if (ugcStyle) {
                 const foundUgcPreset = UGC_STYLE_OPTIONS.find(p => p.value === ugcStyle);
                 corePrompt = foundUgcPreset ? foundUgcPreset.prompt.replace(/\[product\]/g, productDescription || 'the product') : `Influencer photo of ${productDescription}.`;
             } else {
                 corePrompt = `Influencer marketing photo. Product: ${productDescription}. Model: ${modelGender} influencer. Pose: ${poseSuggestion || 'Natural'}. Outfit: ${clothingType}. Setting: ${backgroundStyle || 'Aesthetic'}.`;
             }
             if (modelSeedUrl) corePrompt += ` Maintain facial features of reference model.`;
            break;
        case AppMode.Fashion:
            corePrompt = `Fashion Photography. Subject: ${productDescription || 'Clothing'}. Category: ${fashionSubCategory || 'Apparel'}. Model: ${fashionBodyType || 'Regular'}. Pose: ${pose || 'Standard'}.`;
            if (modelLockId) corePrompt += ` Use fixed model persona: ${modelLockId}.`;
            break;
        case AppMode.AdCreative:
            if (isComparisonMode) {
                corePrompt = `Comparison ad. ${productDescription} vs competitor. Layout: ${adLayout}. Features: ${productAFeatures || 'Premium'}.`;
            } else {
                let adStyle = "Graphic design style.";
                if (adStylePreset && adStylePreset !== AI_SUGGESTED) {
                    const foundAdPreset = AD_STYLE_PRESETS.find(p => p.value === adStylePreset);
                    if (foundAdPreset) adStyle = foundAdPreset.prompt;
                }
                corePrompt = `Ad Creative. Product: ${productDescription}. Layout: ${adLayout}. Style: ${adStyle} Headline: "${adTitle || ''}".`;
            }
            break;
        case AppMode.Remix:
            corePrompt = `Integrate product into reference scene. Match lighting and perspective. ${productDescription ? `Instruction: ${productDescription}` : ''}`;
            break;
        default:
            corePrompt = `Marketing image for ${productDescription}.`;
            break;
    }
    if (marketplacePreset === MarketplacePreset.Amazon) corePrompt += ` White Background.`;
    if (brandKit) corePrompt += `\nBrand: Use ${brandKit.primaryColor} accents.`;
    return [...parts, { text: corePrompt }];
}

async function generateSingleImage(params: GenerateImageParams, aspectRatio: AspectRatio, userTier: string, brandKit?: BrandKit | null, activeImages?: File[], pose?: string, sourceProductImageUrl?: string, modelSeedUrl?: string, retryCount: number = 0): Promise<GeneratedImage> {
    const ai = getAI();
    const contents = await buildPromptParts(params, brandKit, activeImages, pose, modelSeedUrl);
    let aspectRatioConfig: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1";
    if (aspectRatio === AspectRatio.Portrait) aspectRatioConfig = "9:16";
    if (aspectRatio === AspectRatio.Landscape) aspectRatioConfig = "16:9";
    if (aspectRatio === AspectRatio.PortraitPost || aspectRatio === AspectRatio.FashionShopify) aspectRatioConfig = "3:4";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: contents },
            config: { imageConfig: { aspectRatio: aspectRatioConfig } },
        });
        let imageUrl = '';
        for (const part of (response.candidates?.[0]?.content?.parts || [])) {
            if (part.inlineData) {
                imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                break;
            }
        }
        if (!imageUrl) throw new Error("AI failed to return an image.");
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
            return generateSingleImage(params, aspectRatio, userTier, brandKit, activeImages, pose, sourceProductImageUrl, modelSeedUrl, retryCount + 1);
        }
        throw error;
    }
}

export const generateImages = async (params: GenerateImageParams, userTier: 'Free' | 'Starter' | 'Standard' | 'Agency', brandKit?: BrandKit | null, sourceProductImageUrl?: string, onProgress?: (current: number, total: number) => void, modelSeedUrl?: string): Promise<GeneratedImage[]> => {
    const aspectRatios = params.aspectRatios?.length ? params.aspectRatios : [AspectRatio.PortraitPost];
    const allResults: GeneratedImage[] = [];
    let completedJobs = 0;

    // RESILIENT IMAGE DETECTION LOGIC
    // 1. Start with the explicit array
    let allPotentialImages: File[] = [];
    if (params.bulkImages && Array.isArray(params.bulkImages)) {
        allPotentialImages = [...params.bulkImages];
    }
    
    // 2. Add frontProductImage if it exists and isn't already included
    if (params.frontProductImage) {
        const alreadyExists = allPotentialImages.some(img => img === params.frontProductImage || (img.name === params.frontProductImage!.name && img.size === params.frontProductImage!.size));
        if (!alreadyExists) {
            allPotentialImages.unshift(params.frontProductImage);
        }
    }

    // 3. Filter for actual valid File objects
    // We strictly check for File instances or objects that look like files (have name, type, size)
    const activeImages = allPotentialImages.filter(f => {
        return (f instanceof File) || (f && typeof f === 'object' && 'name' in f && 'size' in f && (f as any).size > 0);
    });

    const needsAsset = [AppMode.Product, AppMode.Fashion, AppMode.Influencer, AppMode.Festival].includes(params.appMode);
    
    // Critical validation
    if (needsAsset && activeImages.length === 0) {
        console.error("Image Validation Failed. Active Images Array Empty.", { bulk: params.bulkImages, single: params.frontProductImage });
        throw new Error("Please upload at least one image to start the shoot.");
    }

    // Determine Loop logic based on mode
    const iterations = (params.appMode === AppMode.Remix) ? 1 : (params.batchSize || 1);
    const presets = (params.appMode === AppMode.Product && params.productStylePresets?.length) ? params.productStylePresets : [params.productStylePreset || AI_SUGGESTED];
    const angles = (params.appMode === AppMode.Product && params.selectedAngles?.length) ? params.selectedAngles : ['Front View'];
    const poses = (params.appMode === AppMode.Fashion && params.fashionPose?.length) ? params.fashionPose : [undefined];

    let totalOps = aspectRatios.length * iterations;
    if (params.appMode === AppMode.Product) totalOps = aspectRatios.length * presets.length * angles.length;
    if (params.appMode === AppMode.Fashion && poses[0]) totalOps = aspectRatios.length * Math.max(iterations, poses.length);

    for (const ratio of aspectRatios) {
        if (params.appMode === AppMode.Product) {
            for (const preset of presets) {
                for (const angle of angles) {
                    completedJobs++;
                    if (onProgress) onProgress(completedJobs, totalOps);
                    
                    // Pass ALL valid images. The prompt builder will attach them all as context.
                    // This generates 1 result per Preset/Angle combination, utilizing all uploaded angles as input.
                    const res = await generateSingleImage({...params, productStylePreset: preset}, ratio, userTier, brandKit, activeImages, angle, sourceProductImageUrl, modelSeedUrl);
                    
                    allResults.push(res);
                    if (completedJobs < totalOps) await wait(2000);
                }
            }
        } else if (params.appMode === AppMode.Remix) {
            completedJobs++;
            if (onProgress) onProgress(completedJobs, totalOps);
            const res = await generateSingleImage(params, ratio, userTier, brandKit, [], undefined, sourceProductImageUrl, modelSeedUrl);
            allResults.push(res);
            if (completedJobs < totalOps) await wait(2000);
        } else {
            // General modes: Influencer, Ad, Fashion
            for (let i = 0; i < iterations; i++) {
                completedJobs++;
                if (onProgress) onProgress(completedJobs, totalOps);
                const pose = (params.appMode === AppMode.Fashion) ? poses[i % poses.length] : undefined;
                const res = await generateSingleImage(params, ratio, userTier, brandKit, activeImages, pose, sourceProductImageUrl, modelSeedUrl);
                allResults.push(res);
                if (completedJobs < totalOps) await wait(2000);
            }
        }
    }
    return allResults;
};

export const editImage = async (params: EditImageParams): Promise<{ imageUrl: string }> => {
    const ai = getAI();
    const { data: originalData, mimeType: originalMimeType } = dataURLToParts(params.originalImageUrl);
    const { data: maskData } = dataURLToParts(params.maskDataUrl);
    let parts: any[] = [{ inlineData: { data: originalData, mimeType: originalMimeType } }, { inlineData: { data: maskData, mimeType: 'image/png' } }, { text: `Modify masked area: ${params.prompt}.` }];
    if (params.replacementImage) {
        const base64 = await fileToBase64(params.replacementImage);
        parts.push({ inlineData: { data: base64, mimeType: params.replacementImage.type } });
    }
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts } });
    const outPart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!outPart?.inlineData) throw new Error("No image generated.");
    return { imageUrl: `data:${outPart.inlineData.mimeType};base64,${outPart.inlineData.data}` };
};

export const generateCaption = async (params: GenerateCaptionParams, brandKit: BrandKit | null) => {
    const ai = getAI();
    const { data, mimeType } = dataURLToParts(params.imageUrl);
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { data, mimeType } }, { text: `Caption tone: ${params.tone}. Platform: ${params.platform}. JSON {caption, hashtags}.` }] },
        config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { caption: { type: Type.STRING }, hashtags: { type: Type.STRING } } } }
    });
    return parseGeminiJson(response.text, { caption: "New visual!", hashtags: "#studio" });
};

export const detectProductCategory = async (base64: string, mimeType: string, description: string): Promise<ProductCategory> => {
    const ai = getAI();
    const categories = Object.values(ProductCategory).join('", "');
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: `Classify product into ONE: ["${categories}"]. Description: ${description}.` }] }
    });
    const text = response.text?.trim() as ProductCategory;
    return Object.values(ProductCategory).includes(text) ? text : ProductCategory.Generic;
};

export const generateVariantSuggestions = async (description: string, field: string) => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Suggest 4 options for "${field}" based on: "${description}". JSON array.`,
        config: { responseMimeType: "application/json" }
    });
    return parseGeminiJson(response.text, []);
};

export const getABTestSuggestions = async (image: GeneratedImage) => {
    const ai = getAI();
    const { data, mimeType } = dataURLToParts(image.imageUrl);
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { data, mimeType } }, { text: "Suggest 3 A/B test variations. JSON array {title, description, hypothesis}." }] },
        config: { responseMimeType: "application/json" }
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
    return part?.inlineData ? { data: part.inlineData.data, mimeType: part.inlineData.mimeType } : { data: base64, mimeType };
};

export const generateMoodBoard = async (description: string): Promise<MoodBoard> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Mood board for: "${description}". JSON {concept, colors:[{hex}], styles:[], tones:[]}.`,
        config: { responseMimeType: "application/json" }
    });
    return parseGeminiJson(response.text, { concept: '', colors: [], styles: [], tones: [] });
};

export const analyzeBrandLogo = async (base64: string, mimeType: string): Promise<BrandAnalysis> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: `Analyze logo JSON {colors:[{hex}], typography, vibe:[]}.` }] },
        config: { responseMimeType: "application/json" }
    });
    return parseGeminiJson(response.text, { colors: [], typography: '', vibe: [] });
};
