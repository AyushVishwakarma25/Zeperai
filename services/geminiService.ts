
/**
 * FILE: geminiService.ts
 * PURPOSE: Core service for all Google Gemini AI interactions (Image, Text, Vision).
 */

import { GoogleGenAI, Type } from "@google/genai";
import { AI_SUGGESTED, PRO_PRODUCT_STYLE_PRESETS, UGC_STYLE_OPTIONS, AD_STYLE_PRESETS, FASHION_POSE_OPTIONS, FESTIVAL_PRESETS } from '../constants';
import type { GenerateImageParams, GeneratedImage, EditImageParams, GenerateCaptionParams, BrandKit, MoodBoard, BrandAnalysis, ABTestSuggestion } from '../types';
import { AspectRatio, AppMode, MarketplacePreset, FashionShootType, RegionalStyle, ProductCategory, ResolutionQuality } from '../types';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to safely parse JSON from Gemini
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
        throw new Error("API Key is missing. Please select an API key to continue.");
    }
    return new GoogleGenAI({ apiKey });
};

// Standard file to base64
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

// Client-side resizing for API Payload Safety (Fashion Mode Only)
const resizeForAI = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                // Cap at 1024px to ensure batch operations fit in payload
                const MAX_SIZE = 1024;

                if (width > MAX_SIZE || height > MAX_SIZE) {
                    if (width > height) {
                        height = Math.round(height * (MAX_SIZE / width));
                        width = MAX_SIZE;
                    } else {
                        width = Math.round(width * (MAX_SIZE / height));
                        height = MAX_SIZE;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(fileToBase64(file)); // Fallback
                    return;
                }
                
                // Draw on white background to handle transparent PNGs converting to JPEG
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                
                // Export as JPEG 0.9 quality for optimal size/quality ratio
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                resolve(dataUrl.split(',')[1]);
            };
            img.onerror = () => resolve(fileToBase64(file)); // Fallback
        };
        reader.onerror = () => resolve(fileToBase64(file)); // Fallback
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
        console.error("Failed to fetch image from URL:", url, e);
        throw new Error("Failed to load reference image.");
    }
};

async function buildPromptParts(params: GenerateImageParams, brandKit?: BrandKit | null, activeImages?: File[], pose?: string, modelSeedUrl?: string): Promise<any[]> {
    const { 
        productDescription, appMode, marketplacePreset, hyperRealism, 
        fashionShootType, fashionCategory, fashionSubCategory, fashionBodyType, 
        regionalStyle, modelLockId, productStylePreset,
        modelGender, modelPersona, poseSuggestion, backgroundStyle, clothingType,
        adLayout, adTitle, ugcStyle, adStylePreset,
        isComparisonMode, competitorImage, productAFeatures, productBFeatures,
        remixReferenceImageUrl, logoImage
    } = params;
    
    let parts: any[] = [];
    let corePrompt = '';

    if (appMode === AppMode.Remix) {
        // PRECISION REMIX PROTOCOL
        if (params.remixReferenceImage) {
            const base64 = await fileToBase64(params.remixReferenceImage);
            parts.push({ inlineData: { data: base64, mimeType: params.remixReferenceImage.type } });
        } else if (remixReferenceImageUrl) {
            try {
                const base64 = await urlToBase64(remixReferenceImageUrl);
                parts.push({ inlineData: { data: base64, mimeType: 'image/png' } });
            } catch (e) { console.warn("Skipping remix reference URL."); }
        }

        if (activeImages && activeImages.length > 0) {
            for (const img of activeImages) {
                if (img && img.size > 0) {
                    try {
                        const base64 = await fileToBase64(img);
                        parts.push({ inlineData: { data: base64, mimeType: img.type } });
                    } catch (e) { console.warn("Skipping invalid image"); }
                }
            }
        }
        
        corePrompt = `
ACT AS A PRECISION COMPOSITING ENGINE.
INPUT ANALYSIS:
- IMAGE 1 (SCENE TEMPLATE): Analyze lighting, camera geometry (angle/perspective), and focal depth.
- IMAGE 2+ (PRODUCT CANON): This is the target subject. It is an immutable asset.

TASK:
Replace the dominant foreground object in the SCENE TEMPLATE with the PRODUCT CANON.

STRICT EXECUTION RULES:
1. NO RE-IMAGINING: Do not generate a "similar" product. Use the EXACT packaging, labels, colors, and textures from the PRODUCT CANON. Do not alter text or logo details.
2. SPATIAL BLUEPRINTING: Transform the product to mirror the exact X,Y coordinates, orientation, and vanishing point of the original object in the template.
3. PHYSICS SYNC: Sample the light color temperature and shadow intensity from the template. Apply matching highlights and contact shadows so the product looks natively integrated.
4. TEXTURE FIDELITY: Maintain the sharp surface finish and material properties (glossy/matte) of the provided product asset.
5. MODIFICATION: ${productDescription || 'Perform a 100% faithful replication of the template style and product identity.'}
        `.trim();
    } else {
        // Standard modes logic
        if (modelSeedUrl) {
            try {
                const response = await fetch(modelSeedUrl);
                const blob = await response.blob();
                const base64 = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve((reader.result as string).split(',')[1]);
                    reader.readAsDataURL(blob);
                });
                parts.push({ inlineData: { data: base64, mimeType: blob.type } });
            } catch (e) { console.warn("Failed model seed load", e); }
        }

        if (activeImages && activeImages.length > 0) {
            for (const img of activeImages) {
                if (img && img.size > 0) {
                    try {
                        // PAYLOAD SAFETY FIX: Only resize for Fashion Mode to handle bulk uploads safely
                        const base64 = (appMode === AppMode.Fashion) 
                            ? await resizeForAI(img) 
                            : await fileToBase64(img);
                            
                        const mimeType = (appMode === AppMode.Fashion) ? 'image/jpeg' : img.type;
                        parts.push({ inlineData: { data: base64, mimeType } });
                    } catch (e) { console.warn("Skipping invalid image", e); }
                }
            }
        }

        if (isComparisonMode && competitorImage) {
            const base64 = await fileToBase64(competitorImage);
            parts.push({ inlineData: { data: base64, mimeType: competitorImage.type } });
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
                    let foundPreset = null;
                    for (const cat of PRO_PRODUCT_STYLE_PRESETS) {
                        const p = cat.presets.find(p => p.name === presetName);
                        if (p) { foundPreset = p; break; }
                    }
                    finalPrompt = foundPreset ? foundPreset.prompt.replace(/\[product\]/g, baseSubject) : `Studio shot of ${baseSubject}. Style: ${presetName}.`;
                } else {
                    finalPrompt = `Professional studio shot of ${baseSubject}. ${backgroundStyle && backgroundStyle !== AI_SUGGESTED ? `Background: ${backgroundStyle}.` : ''}`;
                }
                corePrompt = `${finalPrompt} Camera Angle: ${pose || 'Front View'}.`;
                break;
            case AppMode.Influencer:
                if (ugcStyle) {
                    const foundUgcPreset = UGC_STYLE_OPTIONS.find(p => p.value === ugcStyle);
                    corePrompt = foundUgcPreset ? foundUgcPreset.prompt.replace(/\[product\]/g, productDescription || 'the product') : `Influencer photo of ${productDescription}.`;
                } else {
                    corePrompt = `Influencer photo. Product: ${productDescription}. Model: ${modelGender} influencer. Setting: ${backgroundStyle || 'Aesthetic'}.`;
                }
                break;
            case AppMode.Fashion:
                corePrompt = `Fashion Photography. Subject: ${productDescription || 'Clothing'}. Pose: ${pose || 'Standard'}.`;
                if (modelLockId) corePrompt += ` Use fixed model persona: ${modelLockId}.`;
                break;
            case AppMode.AdCreative:
                let adStyle = "Graphic design style.";
                if (adStylePreset && adStylePreset !== AI_SUGGESTED) {
                    const foundAdPreset = AD_STYLE_PRESETS.find(p => p.value === adStylePreset);
                    if (foundAdPreset) adStyle = foundAdPreset.prompt;
                }
                corePrompt = `Commercial Ad. Product: ${productDescription}. Layout: ${adLayout}. Style: ${adStyle} Headline: "${adTitle || ''}".`;
                break;
            default:
                corePrompt = `Commercial photography for ${productDescription}.`;
                break;
        }
    }

    if (marketplacePreset === MarketplacePreset.Amazon) corePrompt += ` White Background.`;
    
    // --- SMART BRAND INJECTION ---
    if (brandKit && params.applyBrandIdentity !== false) {
        let brandSection = `\n\nBRAND IDENTITY PROTOCOL (Strictly Follow):\n`;
        brandSection += `- Primary Color Priority: Use ${brandKit.primaryColor} for lighting accents, props, or background elements.\n`;
        if (brandKit.secondaryColor) brandSection += `- Secondary Palette: Incorporate ${brandKit.secondaryColor} subtly.\n`;
        if (brandKit.accentColor) brandSection += `- Accent Highlights: Use ${brandKit.accentColor} for small details.\n`;
        if (brandKit.voice) brandSection += `- Brand Mood/Voice: ${brandKit.voice}.\n`;
        if (brandKit.negativeConstraints) brandSection += `- NEGATIVE CONSTRAINTS (DO NOT INCLUDE): ${brandKit.negativeConstraints}\n`;
        
        corePrompt += brandSection;
    }
    
    return [...parts, { text: corePrompt }];
}

async function generateSingleImage(params: GenerateImageParams, aspectRatio: AspectRatio, userTier: string, brandKit?: BrandKit | null, activeImages?: File[], pose?: string, sourceProductImageUrl?: string, modelSeedUrl?: string, retryCount: number = 0): Promise<GeneratedImage> {
    const ai = getAI();
    const contents = await buildPromptParts(params, brandKit, activeImages, pose, modelSeedUrl);
    let aspectRatioConfig: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1";
    if (aspectRatio === AspectRatio.Portrait) aspectRatioConfig = "9:16";
    else if (aspectRatio === AspectRatio.Landscape) aspectRatioConfig = "16:9";
    else if (aspectRatio === AspectRatio.PortraitPost || aspectRatio === AspectRatio.FashionShopify) aspectRatioConfig = "3:4";
    
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
            caption: pose || params.productDescription || "Creative Variation",
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

    let allPotentialImages: File[] = [];
    if (params.bulkImages && Array.isArray(params.bulkImages)) {
        allPotentialImages = [...params.bulkImages];
    }
    
    if (params.frontProductImage) {
        const alreadyExists = allPotentialImages.some(img => img === params.frontProductImage || (img.name === params.frontProductImage!.name && img.size === params.frontProductImage!.size));
        if (!alreadyExists) allPotentialImages.unshift(params.frontProductImage);
    }

    const activeImages = allPotentialImages.filter(f => f instanceof File && f.size > 0);
    const needsAsset = [AppMode.Product, AppMode.Fashion, AppMode.Influencer, AppMode.Festival, AppMode.Remix].includes(params.appMode);
    
    if (needsAsset && activeImages.length === 0) throw new Error("Please upload at least one product image.");
    if (params.appMode === AppMode.Remix && !params.remixReferenceImage && !params.remixReferenceImageUrl) throw new Error("Remix mode requires a scene template.");

    // --- DETERMINE VARIATIONS ---
    let variations: Array<{ preset?: string, pose?: string, angle?: string }> = [];

    if (params.appMode === AppMode.Product) {
        // Product Mode Logic: Presets * Angles
        const presets = (params.productStylePresets && params.productStylePresets.length > 0) 
            ? params.productStylePresets 
            : [params.productStylePreset || AI_SUGGESTED];
            
        const angles = (params.selectedAngles && params.selectedAngles.length > 0) 
            ? params.selectedAngles 
            : ['Front View'];

        for (const preset of presets) {
            for (const angle of angles) {
                variations.push({ preset, angle });
            }
        }
    } else if (params.appMode === AppMode.Fashion) {
        // Fashion Mode Logic: Poses OR Batch Size
        const poses = (params.fashionPose && params.fashionPose.length > 0) ? params.fashionPose : [];
        if (poses.length > 0) {
            for (const pose of poses) variations.push({ pose });
        } else {
            const count = params.batchSize || 1;
            for (let i = 0; i < count; i++) variations.push({});
        }
    } else if (params.appMode === AppMode.Festival) {
         // Festival Mode Logic: Presets
         const presets = (params.festivalStylePresets && params.festivalStylePresets.length > 0) 
            ? params.festivalStylePresets 
            : [params.festivalStyle || '']; 
         
         for (const preset of presets) {
             variations.push({ preset });
         }
    } else if (params.appMode === AppMode.Remix) {
        variations.push({});
    } else {
        // Standard / Influencer / AdCreative / Others
        const count = params.batchSize || 1;
        for (let i = 0; i < count; i++) {
            variations.push({});
        }
    }

    const totalOps = aspectRatios.length * variations.length;

    // --- EXECUTE ---
    for (const ratio of aspectRatios) {
        for (const variation of variations) {
            completedJobs++;
            if (onProgress) onProgress(completedJobs, totalOps);

            // Construct overridden params for this specific generation
            const singleRunParams = { ...params };
            
            if (variation.preset) {
                if (params.appMode === AppMode.Festival) singleRunParams.festivalStyle = variation.preset;
                else singleRunParams.productStylePreset = variation.preset;
            }
            
            // Map angle or pose to the 'pose' argument
            const poseOrAngle = variation.pose || variation.angle;

            const res = await generateSingleImage(
                singleRunParams, 
                ratio, 
                userTier, 
                brandKit, 
                activeImages, 
                poseOrAngle, 
                sourceProductImageUrl, 
                modelSeedUrl
            );
            allResults.push(res);
            
            if (completedJobs < totalOps) await wait(1500);
        }
    }
    return allResults;
};

// FIX: Updated editImage to actually send image + prompt to the model
export const editImage = async (params: EditImageParams): Promise<{ imageUrl: string }> => {
    const ai = getAI();
    const parts: any[] = [];

    // 1. Add Original Image
    try {
        if (!params.originalImageUrl) throw new Error("Missing original image");
        // Handle both data URI and potential URL logic if needed, currently assumes data URI
        const base64Original = params.originalImageUrl.includes(',') 
            ? params.originalImageUrl.split(',')[1] 
            : await urlToBase64(params.originalImageUrl);
            
        parts.push({ inlineData: { data: base64Original, mimeType: 'image/png' } });
    } catch (e) {
        console.error("Edit image upload failed", e);
        throw new Error("Failed to process original image for editing.");
    }

    // 2. Add Replacement Image (if any)
    if (params.replacementImage) {
        const base64Replacement = await fileToBase64(params.replacementImage);
        parts.push({ inlineData: { data: base64Replacement, mimeType: params.replacementImage.type } });
    }

    // 3. Add Prompt
    parts.push({ text: params.prompt || "Edit this image according to the visual context." });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: parts }
    });
    
    // Extract Result
    let imageUrl = '';
    for (const part of (response.candidates?.[0]?.content?.parts || [])) {
        if (part.inlineData) {
            imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
        }
    }
    
    if (!imageUrl) throw new Error("AI failed to return an edited image.");
    return { imageUrl };
};

export const generateCaption = async (params: GenerateCaptionParams, brandKit: BrandKit | null) => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Generate a marketing caption.",
        config: { responseMimeType: "application/json" }
    });
    return parseGeminiJson(response.text, { caption: "New visual!", hashtags: "#studio" });
};

export const removeBackground = async (base64: string, mimeType: string): Promise<{ data: string, mimeType: string }> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: "Isolate subject on pure white #FFFFFF background." }] }
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return part?.inlineData ? { data: part.inlineData.data, mimeType: part.inlineData.mimeType } : { data: base64, mimeType };
};

export const generateMoodBoard = async (description: string): Promise<MoodBoard> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Mood board for: "${description}". JSON format.`,
        config: { responseMimeType: "application/json" }
    });
    return parseGeminiJson(response.text, { concept: '', colors: [], styles: [], tones: [] });
};

export const analyzeBrandLogo = async (base64: string, mimeType: string): Promise<BrandAnalysis> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: `Analyze logo palette and vibe. JSON format.` }] },
        config: { responseMimeType: "application/json" }
    });
    return parseGeminiJson(response.text, { colors: [], typography: '', vibe: [] });
};

export const getABTestSuggestions = async (image: GeneratedImage): Promise<ABTestSuggestion[]> => {
    const ai = getAI();
    const { productDescription } = image.params;
    
    const prompt = `Analyze this generated creative for a product: "${productDescription}".
    Suggest 3 distinct variations for an A/B test to optimize performance.
    Provide a title for each test, what exactly to change, and the hypothesis why it would perform better.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { data: await urlToBase64(image.imageUrl), mimeType: 'image/png' } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestions: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    hypothesis: { type: Type.STRING },
                                },
                                required: ['title', 'description', 'hypothesis'],
                            }
                        }
                    },
                    required: ['suggestions']
                }
            }
        });

        const result = parseGeminiJson(response.text, { suggestions: [] });
        return result.suggestions;
    } catch (error) {
        console.error("Error fetching A/B test suggestions:", error);
        return [
            { title: "Visual Emphasis", description: "Increase product size by 20%", hypothesis: "Focusing more on the product reduces cognitive load." },
            { title: "Color Contrast", description: "Use complementary background colors", hypothesis: "Higher contrast draws attention to the subject faster." },
            { title: "Lifestyle Context", description: "Show the product in use", hypothesis: "Contextual usage helps users visualize the benefit better." }
        ];
    }
};
