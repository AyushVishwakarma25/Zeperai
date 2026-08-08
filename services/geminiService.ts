
/**
 * FILE: geminiService.ts
 * PURPOSE: Core service for all Google Gemini AI interactions (Image, Text, Vision).
 */

import { GoogleGenAI, Type } from "@google/genai";
import { getAI } from '../config/ai';
import { supabase } from './supabaseClient';
import { AI_SUGGESTED, PRO_PRODUCT_STYLE_PRESETS, UGC_STYLE_OPTIONS, AD_STYLE_PRESETS, FASHION_POSE_OPTIONS, FESTIVAL_PRESETS, AD_TEMPLATES } from '../constants';
import type { GenerateImageParams, GeneratedImage, EditImageParams, GenerateCaptionParams, BrandKit, MoodBoard, BrandAnalysis, ABTestSuggestion } from '../types';
import { AspectRatio, AppMode, MarketplacePreset, FashionShootType, RegionalStyle, ProductCategory, ResolutionQuality, AdLayout, ImageModel } from '../types';

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

// Standard file to base64 with automatic resizing & compression for API Payload Safety
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                // Cap at 1024px to ensure batch operations and standard uploads fit under Serverless/Proxy limits (4.5MB)
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
                    // Fallback to raw base64 if canvas context fails
                    const rawReader = new FileReader();
                    rawReader.onload = () => {
                        const result = rawReader.result as string;
                        resolve(result.split(',')[1]);
                    };
                    rawReader.readAsDataURL(file);
                    return;
                }
                
                // Draw on white background to handle transparent PNGs converting to JPEG gracefully
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(img, 0, 0, width, height);
                
                // Export as JPEG with 0.85 quality for incredible quality and small size (~100kb - 300kb)
                const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                resolve(dataUrl.split(',')[1]);
            };
            img.onerror = () => {
                const rawReader = new FileReader();
                rawReader.onload = () => resolve((rawReader.result as string).split(',')[1]);
                rawReader.readAsDataURL(file);
            };
        };
        reader.onerror = () => {
            const rawReader = new FileReader();
            rawReader.onload = () => resolve((rawReader.result as string).split(',')[1]);
            rawReader.readAsDataURL(file);
        };
    });
};

// Kept for backward compatibility
const resizeForAI = fileToBase64;

const urlToBase64 = async (url: string): Promise<string> => {
    try {
        // Use server-side proxy-image to bypass CORS restrictions
        const proxyUrl = url.startsWith('data:') 
            ? url 
            : `/api/proxy-image?url=${encodeURIComponent(url)}`;
            
        const response = await fetch(proxyUrl);
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
        console.error("Failed to fetch image from URL via proxy:", url, e);
        // Fallback to direct client-side fetch if proxy fails
        try {
            const response = await fetch(url);
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
        } catch (innerError) {
            throw new Error("Failed to load reference image due to CORS restrictions.");
        }
    }
};

// Helper to moderate prompt
async function moderatePrompt(prompt: string): Promise<{ isAllowed: boolean, reason?: string }> {
    if (!prompt || prompt.length < 3) return { isAllowed: true };
    
    const ai = getAI();
    if (typeof window === 'undefined' && !process.env.GEMINI_API_KEY) {
        console.warn("GEMINI_API_KEY is missing on server. AI features may fail.");
    }
    const systemInstruction = `
    You are a content moderator for an AI application designed for:
    - Product photography
    - E-commerce and D2C assets
    - Advertising and marketing creatives
    - Brand design elements
    - Fashion and apparel shoots

    Your job is to evaluate the user's prompt and determine if it is appropriate for these commercial use cases. 
    BE FLEXIBLE: Users in fashion and D2C can request a vast range of clothing types, body types, and lifestyle settings. 
    
    ONLY REJECT prompts that are:
    - Explicitly NSFW, violent, or hateful.
    - Political propaganda or controversial topics.
    - Completely unrelated to brands, products, or marketing (e.g., "a wizard in space", "historical war scene").

    If the prompt is about fashion, apparel, or any consumer product, ALLOW it even if it seems unconventional.

    Respond in JSON format:
    {
        "isAllowed": boolean,
        "reason": "If rejected, provide a brief, polite explanation why it violates the policy (e.g., 'This app is intended for product and marketing assets. Please provide a prompt related to a product or brand.'). If allowed, leave empty."
    }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `${systemInstruction}\n\nUser Prompt: "${prompt}"`,
            config: { responseMimeType: "application/json" }
        });
        const result = parseGeminiJson(response.text, { isAllowed: true });
        return result;
    } catch (e) {
        console.warn("Prompt moderation failed, allowing by default.", e);
        return { isAllowed: true };
    }
}

// Helper to optimize prompt using Gemini Text Model (The Critic/Optimizer Step)
async function optimizePromptWithBrandKit(originalPrompt: string, brandKit?: BrandKit | null, appMode?: AppMode): Promise<string> {
    // Skip optimization for simple/empty prompts or if no brand kit to enforce
    if (!originalPrompt || originalPrompt.length < 5) return originalPrompt;
    
    const ai = getAI();
    const modeContext = appMode ? `Context: Generating a ${appMode} image.` : '';
    const brandContext = brandKit ? `
    Brand Identity to Enforce (Brand Vault):
    - Voice: ${brandKit.voice}
    - Primary Color (Hex): ${brandKit.primary_hex || brandKit.primaryColor}
    - Font Family: ${brandKit.font_family || brandKit.fonts}
    - Style Keyword: ${brandKit.style_keyword || 'professional'}
    - Avoid: ${brandKit.negativeConstraints}
    ` : '';

    const systemInstruction = `
    You are a Prompt Engineer for a high-end AI Image Generator.
    Your goal is to rewrite the user's raw input into a detailed, high-fidelity prompt.
    
    RULES:
    1. Keep the core subject/product exactly as described.
    2. Enhance lighting, texture, and composition details.
    3. If a Brand Kit is provided, strictly weave its aesthetic into the description.
    4. Use the Style Keyword to set the overall mood.
    5. Output ONLY the optimized prompt text. No explanations.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `${systemInstruction}\n\nUser Input: "${originalPrompt}"\n${modeContext}\n${brandContext}`,
        });
        return response.text?.trim() || originalPrompt;
    } catch (e) {
        console.warn("Prompt optimization failed, using original.", e);
        return originalPrompt;
    }
}

async function buildPromptParts(params: GenerateImageParams, brandKit?: BrandKit | null, activeImages?: File[], pose?: string, modelSeedUrl?: string): Promise<any[]> {
    const { 
        productDescription, appMode, marketplacePreset, hyperRealism, 
        fashionShootType, fashionCategory, fashionSubCategory, fashionBodyType, 
        regionalStyle, modelLockId, productStylePreset,
        modelGender, modelPersona, poseSuggestion, backgroundStyle, clothingType,
        adLayout, adTitle, ugcStyle, adStylePreset,
        isComparisonMode, competitorImage, productAFeatures, productBFeatures,
        remixReferenceImageUrl, logoImage,
        remixSubject, remixBackground, remixElements, remixNegativePrompt
    } = params;
    
    // --- PROMPT CHAINING: OPTIMIZER STEP ---
    // We optimize the core description BEFORE building the final technical prompt
    let optimizedDescription = productDescription;
    if (appMode !== AppMode.Remix && productDescription) { // Skip for Remix as it has its own strict protocol
         optimizedDescription = await optimizePromptWithBrandKit(productDescription, brandKit, appMode);
    }

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
        
        // ADVANCED REMIX PROTOCOL (INSPIRATION-DRIVEN)
        let additionsInstruction = remixElements ? `\n7. ADDITIONS: Integrate these specific elements naturally into the new composition: ${remixElements}.` : '';
        let removalsInstruction = remixNegativePrompt ? `\n8. EXCLUSIONS: Specifically exclude/remove these items or any text/logos: ${remixNegativePrompt}.` : '';

        corePrompt = `
ACT AS AN ELITE CREATIVE DIRECTOR & COMPOSITING EXPERT.
CONTEXT:
1. INSPIRATION REFERENCE: A master template for lighting, camera geometry, and overall scene "vibe".
2. TARGET PRODUCT (FIXED IDENTITY): The actual product asset to be featured.

STRICT PROTOCOL:
1. PIXEL-PERFECT BRANDING: Treat the TARGET PRODUCT as an immutable asset. Never re-interpret or re-draw its text, labels, or logos. You are a lighting and environment engine, not a generative text tool.
2. SUBJECT IDENTIFICATION: Find the primary product in the INSPIRATION REFERENCE and characterize its position, depth, and orientation.
3. SEAMLESS SWAP: Place the TARGET PRODUCT exactly where the original product was. Scale and rotate it to match the perspective perfectly.
4. BRAND PURIFICATION: Strictly REMOVE all text, watermarks, UI overlays, price tags, and generic logos from the INSPIRATION REFERENCE. The final image must only feature the TARGET PRODUCT's branding.
5. NON-DESTRUCTIVE RELIGHTING: Apply light-wraps, shadows, and reflections that conform to the product's shape without breaking the legibility of its typography.
6. USER CUSTOMIZATIONS: ${productDescription || 'Ensure an elegant, high-end commercial finish.'}${additionsInstruction}${removalsInstruction}

GOAL: A final high-resolution creative where the TARGET PRODUCT looks natively embedded and studio-lit in the INSPIRATION REFERENCE scene.
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
                        const base64 = await fileToBase64(img);
                        parts.push({ inlineData: { data: base64, mimeType: 'image/jpeg' } });
                    } catch (e) { console.warn("Skipping invalid image", e); }
                }
            }
        }

        if (isComparisonMode && competitorImage) {
            const base64 = await fileToBase64(competitorImage);
            parts.push({ inlineData: { data: base64, mimeType: 'image/jpeg' } });
        }

        switch (appMode) {
            case AppMode.Product:
            case AppMode.Festival:
                const baseSubject = optimizedDescription || 'the product';
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

                if (params.productCategory === ProductCategory.Jewellery) {
                    finalPrompt = `
                    ACT AS A HIGH-END JEWELLERY PHOTOGRAPHER.
                    FIXED IDENTITY PROTOCOL:
                    1. ASSET INTEGRITY: Maintain the exact design, structure, gemstone cuts, and metal color of the provided jewellery. DO NOT RENDER NEW TEXT or alter existing engravings.
                    2. MACRO FIDELITY: Ensure extreme sharpness on fine details like prongs, engravings, and facets.
                    3. NON-DESTRUCTIVE LIGHTING: Use professional jewellery lighting (soft boxes and reflectors) to create elegant highlights and avoid harsh glares, ensuring the piece's structure is perfectly visible.
                    4. COMPOSITION: ${finalPrompt}
                    `.trim();
                } else {
                    finalPrompt = `
                    ACT AS A PROFESSIONAL PRODUCT PHOTOGRAPHER.
                    PIXEL-PERFECT BRANDING PROTOCOL:
                    1. FIXED IDENTITY: The provided image is the absolute reference. Never re-draw labels, text, or logos. Maintain 100% typography legibility.
                    2. LIGHTING & ENVIRONMENT: ${finalPrompt}
                    3. PHYSICS: Apply realistic contact shadows and depth-of-field based on the product's actual dimensions.
                    `.trim();
                }

                corePrompt = `${finalPrompt} Camera Angle: ${pose || 'Front View'}.`;
                break;
            case AppMode.Influencer:
                const isAiSuggestedInfluencer = params.productStylePreset === AI_SUGGESTED || !params.productStylePreset;
                
                if (isAiSuggestedInfluencer) {
                    corePrompt = `
                    ACT AS AN AI RE-SHAPER & STUDIO DIRECTOR.
                    AI SUGGESTED WORKFLOW (INDIAN INFLUENCER EDITION):
                    1. SUBJECT: A stunning, realistic Indian model (Influencer persona) showcasing the product.
                    2. PRODUCT INTEGRATION: The product must be held naturally, placed in use, or featured centrally in the frame as a genuine UGC (User Generated Content) post.
                    3. LIFESTYLE VIBE: ${params.productDescription || 'A casual, scroll-stopping lifestyle shot.'}
                    4. DYNAMIC VARIATIONS: Use diverse Indian features (South Asian ethnicity), varied natural poses, and authentic lighting (warm sunlit, indoor chic, or urban night).
                    5. PRODUCTION QUALITY: Shot on iPhone aesthetic, high-quality social media finish, natural skin textures. No studio artificiality.
                    
                    MANDATORY: NO generic models. Must look like a relatable Indian influencer.
                    `.trim();
                } else if (ugcStyle) {
                    const foundUgcPreset = UGC_STYLE_OPTIONS.find(p => p.value === ugcStyle);
                    corePrompt = foundUgcPreset ? foundUgcPreset.prompt.replace(/\[product\]/g, optimizedDescription || 'the product') : `Influencer photo of ${optimizedDescription}.`;
                } else {
                    corePrompt = `Influencer photo. Product: ${optimizedDescription}. Model: Indian ${modelGender} influencer. Setting: ${backgroundStyle || 'Aesthetic'}.`;
                }
                
                if (modelSeedUrl) {
                    corePrompt += `\n\n[CRITICAL INSTRUCTION - FACE PRESERVATION ONLY]\nI have provided an image of a model. You MUST use EXACTLY this face identity and skin tone. However, you MUST completely DISCARD the pose, clothing, and background of the attached image. The new pose MUST be exactly: ${pose || poseSuggestion || 'natural and dynamic'}. The background MUST be: ${backgroundStyle || 'Aesthetic'}. Generate an entirely new photo with the new pose, new clothing, and new setting, keeping ONLY the face from the reference image.`;
                }
                break;
            case AppMode.Fashion:
                const isFashionAiSuggested = params.productStylePreset === AI_SUGGESTED || !params.productStylePreset;
                
                if (activeImages && activeImages.length > 0) {
                    corePrompt = `
                    ACT AS A VIRTUAL FASHION STUDIO DIRECTOR (Indian Market Specialist).
                    IP-ADAPTER & GARMENT REPLICATION PROTOCOL:
                    1. REFERENCE CLOTHING: Use the provided image as the ABSOLUTE reference for the garment. 
                    2. REPLICATION: Precisely replicate the fabric texture, pattern, embroidery, and design of the clothing onto the model. Do not alter the dress design.
                    3. MODEL: ${isFashionAiSuggested ? 'A professional Indian fashion model' : 'A professional model'} ${params.fashionGender ? `(${params.fashionGender})` : ''}.
                    4. POSE: ${pose || 'Hero fashion pose'}.
                    5. SCENE: ${optimizedDescription || 'High-end fashion studio with cinematic lighting'}.
                    
                    ${params.fashionCategory ? `Category: ${params.fashionCategory}.` : ''}
                    ${params.fashionSubCategory ? `Apparel Type: ${params.fashionSubCategory}.` : ''}
                    ${params.regionalStyle ? `Cultural Accent: ${params.regionalStyle}.` : ''}
                    `.trim();
                } else {
                    corePrompt = `Fashion Photography. Subject: ${optimizedDescription || 'Professional clothing showcase'}. Indian Model. Pose: ${pose || 'Standard'}.`;
                }
                
                if (modelLockId) corePrompt += ` Use fixed model persona: ${modelLockId}.`;
                
                if (modelSeedUrl) {
                    corePrompt += `\n\n[CRITICAL INSTRUCTION - FACE PRESERVATION ONLY]\nI have provided an image of a model. You MUST use EXACTLY this face identity and skin tone. However, you MUST completely DISCARD the pose, clothing, and background of the attached model image. The new pose MUST be exactly: ${pose || 'Hero fashion pose'}. Generate an entirely new photo with the new garment and pose, keeping ONLY the face from the reference image.`;
                }
                break;
            case AppMode.AdCreative:
                let adStyle = "Graphic design style.";
                let spaceInstruction = "Leave clean negative space for text overlays.";
                
                if (params.adTemplateId) {
                    const template = AD_TEMPLATES.find(t => t.id === params.adTemplateId);
                    if (template) {
                        adStyle = template.promptInstruction;
                    }
                } else if (adStylePreset && adStylePreset !== AI_SUGGESTED) {
                    const foundAdPreset = AD_STYLE_PRESETS.find(p => p.value === adStylePreset);
                    if (foundAdPreset) adStyle = foundAdPreset.prompt;
                }
                
                if (adLayout === AdLayout.TextRightImageLeft) spaceInstruction = "Position the product on the left and leave clean negative space on the right for text overlays.";
                else if (adLayout === AdLayout.TextLeftImageRight) spaceInstruction = "Position the product on the right and leave clean negative space on the left for text overlays.";
                else if (adLayout === AdLayout.TextTopBottomImageCenter) spaceInstruction = "Center the product and leave clean negative space at the top and bottom for text overlays.";
                else if (adLayout === AdLayout.ProductShowcase) spaceInstruction = "Center the product with clean negative space around it.";

                if (activeImages && activeImages.length > 0) {
                    corePrompt = `
                    ACT AS A HIGH-END STUDIO DIRECTOR (BRAND SPECIALIST).
                    PIPELINE EXECUTION:
                    1. SEGMENTATION: Isolate the product from its current background perfectly.
                    2. PIXEL-PERFECT BRANDING (FIXED IDENTITY): Maintain the exact shape, labels, and branding of the product. DO NOT RENDER NEW TEXT. Use the original pixels for all typography.
                    3. NON-DESTRUCTIVE RELIGHTING: Apply light-wraps, shadows, and reflections that conform to the product's shape without breaking the legibility of its branding.
                    4. DEPTH MAPPING: Calculate the geometry of the new environment to ensure the product sits realistically on surfaces.
                    
                    SCENE: ${optimizedDescription || 'a professional advertisement'}.
                    STYLE: ${adStyle} ${spaceInstruction}
                    
                    ${brandKit?.style_keyword ? `OVERALL AESTHETIC: ${brandKit.style_keyword}.` : ''}
                    NEGATIVE CONSTRAINTS: absolutely no text, no words, no typography (except on product), no watermarks, no logos, no changing the product design.
                    `.trim();
                } else {
                    corePrompt = `Commercial Ad. Product: ${optimizedDescription || 'a product'}. Style: ${adStyle} ${spaceInstruction} NEGATIVE CONSTRAINTS: absolutely no text, no words, no typography, no watermarks, no logos.`;
                }
                break;
            default:
                corePrompt = `Commercial photography for ${optimizedDescription}.`;
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

    // Add general negative constraints for better quality
    corePrompt += `\n\nNEGATIVE CONSTRAINTS: DO NOT INCLUDE text, watermarks, distorted proportions, extra limbs, or low-quality artifacts.`;
    
    return [...parts, { text: corePrompt }];
}

async function generateSingleImage(params: GenerateImageParams, aspectRatio: AspectRatio, userTier: 'Free' | 'PayAsYouGo', brandKit?: BrandKit | null, activeImages?: File[], pose?: string, sourceProductImageUrl?: string, modelSeedUrl?: string, retryCount: number = 0): Promise<GeneratedImage> {
    const ai = getAI();
    const contents = await buildPromptParts(params, brandKit, activeImages, pose, modelSeedUrl);
    let aspectRatioConfig: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1";
    if (aspectRatio === AspectRatio.Portrait) aspectRatioConfig = "9:16";
    else if (aspectRatio === AspectRatio.Landscape) aspectRatioConfig = "16:9";
    else if (aspectRatio === AspectRatio.PortraitPost || aspectRatio === AspectRatio.FashionShopify) aspectRatioConfig = "3:4";
    
    // Determine the target Google GenAI model
    let modelName = 'gemini-3.1-flash-image'; // Default legacy fallback
    if (params.imageModel) {
        switch (params.imageModel) {
            case ImageModel.Imagen3Fast:
                modelName = 'gemini-2.5-flash-image';
                break;
            case ImageModel.Imagen3HighQuality:
                modelName = 'gemini-3.1-flash-image';
                break;
            case ImageModel.Imagen3Pro:
                modelName = 'gemini-3-pro-image';
                break;
            case ImageModel.DallE3:
                modelName = 'dall-e-3';
                break;
            case ImageModel.NanoBananaPro:
                modelName = 'gemini-3-pro-image';
                break;
            case ImageModel.NanoBanana2:
                modelName = 'gemini-3.1-flash-image';
                break;
        }
    }

    // Determine target size for supported models
    let imageSize: "512px" | "1K" | "2K" | "4K" = "1K";
    if (params.resolutionQuality === ResolutionQuality.High) {
        imageSize = "2K";
    }

    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: { parts: contents },
            config: { 
                imageConfig: { 
                    aspectRatio: aspectRatioConfig,
                    ...(modelName !== 'gemini-2.5-flash-image' && modelName !== 'dall-e-3' ? { imageSize } : {})
                }
            },
        });
        
        let imageUrl = '';
        for (const part of (response.candidates?.[0]?.content?.parts || [])) {
            if (part.inlineData) {
                imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                break;
            }
        }
        
        if (!imageUrl) throw new Error("AI failed to return an image.");

        // SAFETY FILTER CHECK
        if (response.candidates?.[0]?.finishReason === 'SAFETY') {
            throw new Error("Generation blocked by safety filters. Please modify your prompt to avoid restricted concepts.");
        }
        
        const generatedImage: GeneratedImage = {
            id: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            imageUrl,
            caption: pose || params.productDescription || "Creative Variation",
            hashtags: "",
            aspectRatio: aspectRatio,
            params,
            sourceProductImageUrl,
            timestamp: Date.now(),
        };

        // If saveModel is true, we should ideally trigger a save to the backend here or return a flag
        // For now, we'll just log it as the actual saving logic would likely be in the component or a separate service
        if (params.saveModel) {
            console.log("Model saving requested for this generation.");
            // In a real implementation, you might call a service here to save the model parameters
            // e.g., await modelService.saveModel({ name: 'New Model', params: { ... } });
        }

        return generatedImage;
    } catch (error: any) {
        if (retryCount < 3 && (error.message?.includes('429') || error.status === 429)) {
            await wait((retryCount + 1) * 6000);
            return generateSingleImage(params, aspectRatio, userTier, brandKit, activeImages, pose, sourceProductImageUrl, modelSeedUrl, retryCount + 1);
        }
        throw error;
    }
}

export const generateImages = async (params: GenerateImageParams, userTier: 'Free' | 'PayAsYouGo', brandKit?: BrandKit | null, sourceProductImageUrl?: string, onProgress?: (current: number, total: number) => void, modelSeedUrl?: string): Promise<GeneratedImage[]> => {
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

    // --- MODERATION CHECK ---
    if (params.productDescription) {
        const moderation = await moderatePrompt(params.productDescription);
        if (!moderation.isAllowed) {
            throw new Error(`Policy Violation: ${moderation.reason || 'Your prompt does not align with our acceptable use policy. Please ensure your request is related to product photography, advertising, or marketing assets.'}`);
        }
    }

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
        // Fashion Mode Logic: Poses
        const poses = (params.fashionPose && params.fashionPose.length > 0) ? params.fashionPose : [];
        if (poses.length > 0) {
            for (const pose of poses) variations.push({ pose });
        } else {
            variations.push({});
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
        variations.push({});
    }

    const totalOps = aspectRatios.length * variations.length;

    // --- EXECUTE IN PARALLEL ---
    const promises: Promise<GeneratedImage>[] = [];
    
    for (const ratio of aspectRatios) {
        for (const variation of variations) {
            const singleRunParams = { ...params };
            
            if (variation.preset) {
                if (params.appMode === AppMode.Festival) singleRunParams.festivalStyle = variation.preset;
                else singleRunParams.productStylePreset = variation.preset;
            }
            
            // Map angle or pose to the 'pose' argument
            const poseOrAngle = variation.pose || variation.angle;

            const promise = generateSingleImage(
                singleRunParams, 
                ratio, 
                userTier, 
                brandKit, 
                activeImages, 
                poseOrAngle, 
                sourceProductImageUrl, 
                modelSeedUrl
            ).then(res => {
                completedJobs++;
                if (onProgress) onProgress(completedJobs, totalOps);
                return res;
            });
            
            promises.push(promise);
        }
    }
    
    const results = await Promise.all(promises);
    
    // Auto-generate Ad Copy if left blank
    if (params.appMode === AppMode.AdCreative && !params.adTitle && !params.adSubheading && !params.adCta) {
        try {
            let vibe = undefined;
            if (params.adTemplateId) {
                const template = AD_TEMPLATES.find(t => t.id === params.adTemplateId);
                if (template) vibe = template.copywritingVibe;
            }
            const adCopy = await generateAdCopy(params.productDescription || 'A product', params.adStylePreset || 'Modern', vibe);
            for (const result of results) {
                result.params.adTitle = adCopy.title;
                result.params.adSubheading = adCopy.subheading;
                result.params.adCta = adCopy.cta;
            }
        } catch (e) {
            console.error("Auto-generation of ad copy failed", e);
        }
    }

    allResults.push(...results);
    
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
        model: 'gemini-3.1-flash-image',
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
    let brandContext = '';
    if (brandKit) {
        brandContext = `Brand Info: Voice is ${brandKit.voice || 'Professional'}, Target Keyword: ${brandKit.style_keyword || 'Trendy'}.`;
    }

    const prompt = `
    You are a professional social media marketing expert.
    Generate a compelling caption and relevant hashtags for an image with the following parameters:
    - Tone: ${params.tone}
    - Length: ${params.length}
    - Platform: ${params.platform}
    - Language: ${params.language}
    - Emojis: ${params.includeEmojis ? 'Include appropriate emojis' : 'No emojis'}
    - Hashtags: ${params.includeHashtags ? 'Generate 5-10 relevant hashtags' : 'No hashtags'}
    
    ${brandContext}

    Return the result in JSON format:
    {
        "caption": "string",
        "hashtags": "string (space separated)"
    }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        caption: { type: Type.STRING },
                        hashtags: { type: Type.STRING }
                    },
                    required: ["caption", "hashtags"]
                }
            }
        });
        return parseGeminiJson(response.text, { caption: "Check out this visual!", hashtags: "#design #marketing" });
    } catch (e) {
        console.error("Caption generation failed", e);
        return { caption: "Check out this visual!", hashtags: "#design #marketing" };
    }
};

export const removeBackground = async (base64: string, mimeType: string): Promise<{ data: string, mimeType: string }> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: "Isolate subject on pure white #FFFFFF background." }] }
    });
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    return part?.inlineData ? { data: part.inlineData.data, mimeType: part.inlineData.mimeType } : { data: base64, mimeType };
};

export const removeBackgroundPro = async (params: { imageUrl?: string, imageBase64?: string }): Promise<{ imageUrl: string }> => {
  let token = '';
  try {
    const { data } = await supabase.auth.getSession();
    token = data?.session?.access_token || '';
  } catch (e) {
    console.warn('Could not fetch session token for removeBackgroundPro:', e);
  }

  const response = await fetch('/api/remove-bg-pro', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    let errorMsg = 'Failed to remove background with Pro tool';
    try {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMsg = errorData.error || errorMsg;
      } else {
        const text = await response.text();
        const titleMatch = text.match(/<title>([\s\S]*?)<\/title>/i);
        const headingMatch = text.match(/<h1>([\s\S]*?)<\/h1>/i);
        if (titleMatch) {
          errorMsg = `Server error (${response.status}): ${titleMatch[1].trim()}`;
        } else if (headingMatch) {
          errorMsg = `Server error (${response.status}): ${headingMatch[1].trim()}`;
        } else {
          errorMsg = `Server error (${response.status}): ${text.substring(0, 150).trim()}${text.length > 150 ? '...' : ''}`;
        }
      }
    } catch {
      errorMsg = `Server error (${response.status}): ${response.statusText || 'Unknown Error'}`;
    }
    throw new Error(errorMsg);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Invalid server response format. Expected JSON but received: ${text.substring(0, 100)}`);
  }

  return response.json();
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

export const generateAdCopy = async (productDescription: string, adStyle: string, copywritingVibe?: string): Promise<{ title: string, subheading: string, cta: string }> => {
    const ai = getAI();
    const vibeInstruction = copywritingVibe ? `The tone and vibe of the copy MUST be: ${copywritingVibe}.` : `The tone should match the visual style: ${adStyle}.`;
    
    const prompt = `You are an expert copywriter. Generate ad copy for a product described as: "${productDescription}".
    The ad style/vibe is: "${adStyle}".
    ${vibeInstruction}
    
    Provide a short, catchy Headline (max 5 words).
    Provide a compelling Subheading (max 10 words).
    Provide a strong Call to Action (max 3 words).
    
    Return ONLY JSON format.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        subheading: { type: Type.STRING },
                        cta: { type: Type.STRING }
                    },
                    required: ['title', 'subheading', 'cta']
                }
            }
        });
        return parseGeminiJson(response.text, { title: "Special Offer", subheading: "Get yours today", cta: "Shop Now" });
    } catch (e) {
        console.error("Failed to generate ad copy", e);
        return { title: "Special Offer", subheading: "Get yours today", cta: "Shop Now" };
    }
};

export const analyzeProductContext = async (file: File): Promise<{ 
    context: string[], 
    environments: string[], 
    suggestedPreset?: string,
    fashionInfo?: {
        gender?: string;
        category?: string;
        subCategory?: string;
        color?: string;
        description?: string;
    }
}> => {
    const ai = getAI();
    const base64 = await fileToBase64(file);
    
    const prompt = `Analyze this product image carefully.
    1. Identify 3-5 core context keywords (e.g., "Fitness", "Morning", "Breakfast").
    2. Generate 3 distinct environment options for a high-end advertisement.
    3. If this is clothing/apparel, identify:
       - Estimated Gender (Men, Women, Kids, Unisex)
       - Fashion Category (e.g., Topwear, Indian & Fusion Wear, Western Wear)
       - Specific Apparel Type (e.g., Kurta, T-shirt, Saree, Dress)
       - Primary Color
       - Brief visual description of the garment.
    4. Suggested visual style preset from: "Drinks & Beverages", "Skincare & Beauty", "Snacks & Packaged Foods", "Perfume & Luxury", "Jewellery & Accessories", "Natural & Organic".
    
    Return ONLY JSON format with keys: context, environments, suggestedPreset, fashionInfo (object with keys: gender, category, subCategory, color, description).`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64, mimeType: file.type } },
                    { text: prompt }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        context: { type: Type.ARRAY, items: { type: Type.STRING } },
                        environments: { type: Type.ARRAY, items: { type: Type.STRING } },
                        suggestedPreset: { type: Type.STRING },
                        fashionInfo: {
                            type: Type.OBJECT,
                            properties: {
                                gender: { type: Type.STRING },
                                category: { type: Type.STRING },
                                subCategory: { type: Type.STRING },
                                color: { type: Type.STRING },
                                description: { type: Type.STRING }
                            }
                        }
                    },
                    required: ['context', 'environments']
                }
            }
        });
        return parseGeminiJson(response.text, { context: [], environments: [] });
    } catch (e) {
        console.error("Failed to analyze product context", e);
        return { context: [], environments: ["Studio", "Lifestyle", "Nature"] };
    }
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

export async function generateAdBackground(prompt: string, aspectRatioStr: string): Promise<string> {
    const ai = getAI();
    let aspectRatioConfig: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "3:4";
    if (aspectRatioStr === '9:16') aspectRatioConfig = '9:16';
    else if (aspectRatioStr === '1:1') aspectRatioConfig = '1:1';
    else if (aspectRatioStr === '3:4' || aspectRatioStr === '4:5') aspectRatioConfig = '3:4';
    else if (aspectRatioStr === '16:9') aspectRatioConfig = '16:9';

    const contents = [{ text: prompt }];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image',
            contents: { parts: contents },
            config: {
                imageConfig: {
                    aspectRatio: aspectRatioConfig,
                    imageSize: '1K'
                }
            }
        });

        for (const part of (response.candidates?.[0]?.content?.parts || [])) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("Failed to generate background image.");
    } catch (e) {
        console.error("generateAdBackground error:", e);
        return `https://picsum.photos/seed/${encodeURIComponent(prompt.slice(0, 20))}/800/1000`;
    }
}

