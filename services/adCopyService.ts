
import { GoogleGenAI, Type } from "@google/genai";
import type { GenerateAdCopyParams, AdCopy } from '../types';

const getAI = () => {
    const apiKey = import.meta.env.VITE_API_KEY || process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
        throw new Error("API Key is missing. Please set VITE_API_KEY in your environment variables.");
    }
    return new GoogleGenAI({ apiKey });
};

export const generateAdCopy = async (params: GenerateAdCopyParams): Promise<AdCopy[]> => {
    const ai = getAI();

    const prompt = `Generate ${params.count} ad copy variations for: ${params.productDescription}. Tone: ${params.tone}. Platform: ${params.platform}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        copies: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    headline: { type: Type.STRING },
                                    body: { type: Type.STRING },
                                    cta: { type: Type.STRING },
                                },
                                required: ['headline', 'body', 'cta'],
                            },
                        },
                    },
                    required: ['copies'],
                },
            },
        });

        const text = response.text?.trim();
        if (!text) {
          throw new Error("AI returned an empty response.");
        }
        
        try {
            const result = JSON.parse(text);
            return result.copies as AdCopy[];
        } catch (jsonError) {
            console.error("Failed to parse AI JSON response:", text);
            throw new Error("AI returned an invalid format. Please try again.");
        }
    } catch (error) {
        console.error("Error generating ad copy:", error);
        throw new Error(`Failed to generate ad copy.`);
    }
};
