import { GoogleGenAI, Type } from "@google/genai";
import { GenerateContentParams, CopyVariation, RewriteCopyParams, RewriteAction } from '../types';

export const generateMarketingCopy = async (params: GenerateContentParams): Promise<CopyVariation[]> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not set.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `
        You are an expert marketing copywriter. Generate 3 distinct variations of engaging copy.
        Context: ${params.context}
        Platform: ${params.platform}
        Goal: ${params.goal}
        Style: ${params.style}
        Tone: ${params.tone}
        Language: ${params.language}
    `;

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
                                    hashtags: { type: Type.STRING },
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
        return result.copies as CopyVariation[];
    } catch (error) {
        throw new Error(`Failed to generate copy.`);
    }
};

export const rewriteMarketingCopy = async (params: RewriteCopyParams): Promise<CopyVariation> => {
    if (!process.env.API_KEY) throw new Error("API_KEY not set.");
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `Rewrite following copy with action "${params.action}":\n${JSON.stringify(params.copy)}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        headline: { type: Type.STRING },
                        body: { type: Type.STRING },
                        cta: { type: Type.STRING },
                        hashtags: { type: Type.STRING },
                    },
                    required: ['headline', 'body', 'cta'],
                },
            },
        });
        return JSON.parse(response.text.trim()) as CopyVariation;
    } catch (error) {
        throw new Error(`Failed to rewrite copy.`);
    }
};