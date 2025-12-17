import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { PRO_PRODUCT_STYLE_PRESETS, FESTIVAL_PRESETS, AI_SUGGESTED } from '../constants';
import type { GenerateImageParams, GeneratedImage, EditImageParams, GenerateCaptionParams, ABTestSuggestion, MoodBoard, BrandAnalysis, ProProductStyleCategory } from '../types';
import { AspectRatio, OutfitChoice, AppMode, ClothingType, ResolutionQuality, ProductCategory } from '../types';

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

const SAFETY_SETTINGS = [
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

const buildPrompt = async (params: GenerateImageParams, angle?: string): Promise<any[]> => {
    const { 
        appMode,
        productDescription,
        resolutionQuality,
        frontProductImage,
        backProductImage,
        storyboardSourceImageUrl,
        remixReferenceImage,
        remixProductImage,
        productStylePreset,
    } = params;
    
    let parts: any[] = [];
    let imageContextPrompt = 'Use the following uploaded image(s) as the primary reference for the product.';

    if (storyboardSourceImageUrl) {
        const { data, mimeType } = dataURLToParts(storyboardSourceImageUrl);
        parts.unshift({ inlineData: { data, mimeType } });
    }

    if (frontProductImage) {
        const frontBase64 = await fileToBase64(frontProductImage);
        parts.push({ inlineData: { data: frontBase64, mimeType: frontProductImage.type } });
        imageContextPrompt += ' The first image provided is the FRONT VIEW of the product.';
    }

    if (appMode === AppMode.Product && backProductImage) {
        const backBase64 = await fileToBase64(backProductImage);
        parts.push({ inlineData: { data: backBase64, mimeType: backProductImage.type } });
        imageContextPrompt += ' The second image provided is the BACK VIEW of the product.';
    }

    const productInfo = productDescription.trim()
      ? `The product is described as: "${productDescription}".`
      : (frontProductImage ? `The product is the main object shown in the provided images.` : `The product.`);

    let textPrompt = '';
    
    const qualityInstruction = resolutionQuality === ResolutionQuality.High
        ? `- **Quality & Resolution:** The final image must be exceptionally high-quality, with sharp focus, and look like a 4K resolution photograph suitable for print.`
        : `- **Quality & Resolution:** The final image must have professional studio-quality lighting and sharp focus.`;

    if (appMode === AppMode.Remix) {
        if (!remixReferenceImage) throw new Error("A reference image is required for Remix mode.");
        const refBase64 = await fileToBase64(remixReferenceImage);
        parts = [{ inlineData: { data: refBase64, mimeType: remixReferenceImage.type } }];

        let remixInstruction = '';
        if (remixProductImage) {
             const prodBase64 = await fileToBase64(remixProductImage);
             parts.push({ inlineData: { data: prodBase64, mimeType: remixProductImage.type } });
             remixInstruction = `**Task:** Seamlessly integrate the product shown in the second image into the scene provided in the first image. Match lighting and perspective.`;
        } else {
             if (!productDescription) throw new Error("Please describe how to remix the image.");
             remixInstruction = `**Task:** Modify the uploaded image based on: "${productDescription}".`;
        }
        textPrompt = `${remixInstruction}\n${qualityInstruction}`;
    } else if (appMode === AppMode.Imagen) {
        textPrompt = `**Task:** Generate a professional image based on this prompt: "${productDescription}".\n${qualityInstruction}`;
    } else if (appMode === AppMode.Influencer || appMode === AppMode.Fashion) {
        const { modelGender, modelPersona, skinTone, clothingType, poseSuggestion, backgroundStyle, outfitChoice, outfitReferenceImage, customAvatarImage } = params;
        let personaPrompt = modelPersona === AI_SUGGESTED ? `an Indian ${modelGender} model` : `an Indian ${modelGender} model with a "${modelPersona}" persona`;
        if (customAvatarImage) {
             const avatarBase64 = await fileToBase64(customAvatarImage);
             parts.push({ inlineData: { data: avatarBase64, mimeType: customAvatarImage.type } });
             personaPrompt = `the specific model shown in the avatar image`;
        }
        let outfitPrompt = clothingType === ClothingType.AISuggested ? 'stylish clothing' : clothingType;
        if (outfitChoice === OutfitChoice.Reference && outfitReferenceImage) {
            const outfitBase64 = await fileToBase64(outfitReferenceImage);
            parts.push({ inlineData: { data: outfitBase64, mimeType: outfitReferenceImage.type } });
            outfitPrompt = `the exact outfit shown in the reference image`;
        }
        textPrompt = `Create a stunning lifestyle photoshoot.\n${imageContextPrompt}\n${productInfo}\nModel: ${personaPrompt}\nSkin Tone: ${skinTone}\nOutfit: ${outfitPrompt}\nPose: ${poseSuggestion}\nBackground: ${backgroundStyle}\n${qualityInstruction}`;
    } else if (appMode === AppMode.Product || appMode === AppMode.Amazon || appMode === AppMode.Festival) {
        let stylePresetPrompt = '';
        if (productStylePreset && productStylePreset !== AI_SUGGESTED) {
            const [category, presetName] = productStylePreset.split('|');
            let preset = PRO_PRODUCT_STYLE_PRESETS.find(c => c.category === category)?.presets.find(p => p.name === presetName);
            if (!preset) preset = FESTIVAL_PRESETS.find(c => c.category === category)?.presets.find(p => p.name === presetName);
            if (preset) stylePresetPrompt = preset.prompt.replace('[product]', `the ${productDescription || 'product'}`);
        }
        textPrompt = `Generate a high-end product photograph.\n${imageContextPrompt}\n${productInfo}\n${stylePresetPrompt}\nAngle: ${angle || 'Default'}\n${qualityInstruction}`;
    } else {
         textPrompt = `Design a high-conversion advertisement.\n${imageContextPrompt}\n${productInfo}\nLayout: ${params.adLayout}\nHeadline: ${params.adTitle}\n${qualityInstruction}`;
    }

    return [{ text: textPrompt }, ...parts];
};

const generateSingleImage = async (params: GenerateImageParams, angle?: string, sourceProductImageUrl?: string): Promise<GeneratedImage> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelName = 'gemini-2.5-flash-image'; 
    const contents = await buildPrompt(params, angle);
    const aspectRatioConfig = params.aspectRatio === AspectRatio.Portrait ? '9:16' : params.aspectRatio === AspectRatio.PortraitPost ? '4:5' : params.aspectRatio === AspectRatio.Landscape ? '16:9' : '1:1';

    const response = await ai.models.generateContent({
        model: modelName,
        contents: contents,
        config: { imageConfig: { aspectRatio: aspectRatioConfig }, safetySettings: SAFETY_SETTINGS }
    });

    let imageUrl = '';
    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                break;
            }
        }
    }
    if (!imageUrl) throw new Error("No image generated.");

    return {
        id: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        imageUrl,
        caption: params.adTitle || params.productDescription || "Generated Image",
        hashtags: "",
        aspectRatio: params.aspectRatio,
        params,
        sourceProductImageUrl,
        timestamp: Date.now(),
    };
};

export const generateImages = async (params: GenerateImageParams, sourceProductImageUrl?: string): Promise<GeneratedImage[]> => {
    if (params.appMode === AppMode.Product && params.selectedAngles.length > 0) {
        return Promise.all(params.selectedAngles.map(angle => generateSingleImage(params, angle, sourceProductImageUrl)));
    } 
    return [await generateSingleImage(params, undefined, sourceProductImageUrl)];
};

export const upscaleImage = async (imageUrl: string): Promise<{ imageUrl: string, caption: string, hashtags: string }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const { data, mimeType } = dataURLToParts(imageUrl);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', 
        contents: [{ inlineData: { data, mimeType } }, { text: "Refine and enhance this image for 4K clarity." }],
    });
    let newUrl = imageUrl;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            newUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
        }
    }
    return { imageUrl: newUrl, caption: "Refined Image", hashtags: "#enhanced" };
};

export const editImage = async (params: EditImageParams): Promise<{ imageUrl: string }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const originalParts = dataURLToParts(params.originalImageUrl);
    const contents: any[] = [{ inlineData: { data: originalParts.data, mimeType: originalParts.mimeType } }, { text: `Edit: ${params.prompt}` }];
    if (params.replacementImage) {
        const replacementBase64 = await fileToBase64(params.replacementImage);
        contents.push({ inlineData: { data: replacementBase64, mimeType: params.replacementImage.type } });
    }
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents });
    let newUrl = params.originalImageUrl;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            newUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            break;
        }
    }
    return { imageUrl: newUrl };
};

export const generateCaption = async (params: GenerateCaptionParams): Promise<{ caption: string, hashtags: string }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const { data, mimeType } = dataURLToParts(params.imageUrl);
    const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [{ inlineData: { data, mimeType } }, { text: `Write a ${params.tone} caption for ${params.platform}. JSON output.` }],
        config: {
            responseMimeType: "application/json",
            responseSchema: { type: Type.OBJECT, properties: { caption: { type: Type.STRING }, hashtags: { type: Type.STRING } } }
        }
    });
    return JSON.parse(response.text || '{}');
};

export const generateMoodBoard = async (concept: string): Promise<MoodBoard> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Create a visual mood board for: "${concept}". JSON output.`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
};

export const analyzeBrandLogo = async (logoBase64: string, mimeType: string): Promise<BrandAnalysis> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [{ inlineData: { data: logoBase64, mimeType } }, { text: "Analyze logo brand style. JSON output." }],
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
};

export const getABTestSuggestions = async (image: GeneratedImage): Promise<ABTestSuggestion[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const { data, mimeType } = dataURLToParts(image.imageUrl);
    const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [{ inlineData: { data, mimeType } }, { text: "Suggest 3 A/B test variations. JSON output." }],
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}').suggestions || [];
};

export const generateVariantSuggestions = async (description: string, field: 'modelPersona' | 'poseSuggestion'): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Suggest 6 ideas for ${field} for "${description}". JSON output.`,
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}').suggestions || [];
};

export const detectProductCategory = async (base64Image: string, mimeType: string, description: string): Promise<ProductCategory> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: [{ inlineData: { data: base64Image, mimeType } }, { text: `Detect category for this product: ${description}` }]
        });
        const text = response.text?.trim() || '';
        if (text.includes('Skincare')) return ProductCategory.Skincare;
        if (text.includes('Food') || text.includes('Beverage')) return ProductCategory.FoodAndBeverage;
        if (text.includes('Perfume')) return ProductCategory.Perfume;
        if (text.includes('Herbal')) return ProductCategory.Herbal;
        if (text.includes('Tech')) return ProductCategory.Tech;
        if (text.includes('Fashion')) return ProductCategory.Fashion;
        if (text.includes('Home')) return ProductCategory.HomeDecor;
        if (text.includes('Fitness')) return ProductCategory.Fitness;
        return ProductCategory.Generic;
    } catch (e) {
        return ProductCategory.Generic;
    }
};