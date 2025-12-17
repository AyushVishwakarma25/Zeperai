import { GoogleGenAI, Type } from "@google/genai";
import type { GenerateAdCopyParams, AdCopy } from '../types';

export const generateAdCopy = async (params: GenerateAdCopyParams): Promise<AdCopy[]> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not set.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `Generate ${params.count} ad copy variations for: ${params.productDescription}. Tone: ${params.tone}. Platform: ${params.platform}.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
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

        const result = JSON.parse(response.text.trim());
        return result.copies as AdCopy[];
    } catch (error) {
        throw new Error(`Failed to generate ad copy.`);
    }
};