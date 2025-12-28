
import { GoogleGenAI, Type } from "@google/genai";
import { GenerateContentParams, CopyVariation, RewriteCopyParams, RewriteAction } from '../types';

const getAI = () => {
    const apiKey = import.meta.env.VITE_API_KEY || process.env.API_KEY;
    if (!apiKey || apiKey === 'undefined' || apiKey === '') {
        throw new Error("API Key is missing. Please set VITE_API_KEY in your environment variables.");
    }
    return new GoogleGenAI({ apiKey });
};

export const generateMarketingCopy = async (params: GenerateContentParams): Promise<CopyVariation[]> => {
    const ai = getAI();

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

        const text = response.text?.trim();
        if (!text) {
          throw new Error("AI returned an empty response.");
        }

        try {
            const result = JSON.parse(text);
            return result.copies as CopyVariation[];
        } catch (jsonError) {
            console.error("Failed to parse AI JSON response:", text);
            throw new Error("AI returned an invalid format. Please try again.");
        }
    } catch (error) {
        console.error("Error generating marketing copy:", error);
        throw new Error(`Failed to generate copy.`);
    }
};

export const rewriteMarketingCopy = async (params: RewriteCopyParams): Promise<CopyVariation> => {
    const ai = getAI();

    const prompt = `Rewrite following copy with action "${params.action}":\n${JSON.stringify(params.copy)}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
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
        
        const text = response.text?.trim();
        if (!text) {
          throw new Error("AI returned an empty response for rewrite.");
        }

        try {
            return JSON.parse(text) as CopyVariation;
        } catch (jsonError) {
            console.error("Failed to parse AI JSON response for rewrite:", text);
            throw new Error("AI returned an invalid format for rewrite. Please try again.");
        }
    } catch (error) {
        console.error("Error rewriting copy:", error);
        throw new Error(`Failed to rewrite copy.`);
    }
};
