
/**
 * FILE: adCopyService.ts
 *
 * PURPOSE:
 * - Generates marketing ad copy variations using Gemini text models.
 *
 * FLOW:
 * UI (AdCopywriterPanel) → adCopyService → Gemini API → JSON Response → UI
 *
 * INPUT:
 * - productDescription: string
 * - tone: string
 * - platform: string
 *
 * OUTPUT:
 * - AdCopy[] (headline, body, cta)
 *
 * NOTES:
 * - Enforces JSON schema for structured output.
 */

import { Type } from "@google/genai";
import type { GenerateAdCopyParams, AdCopy } from '../types';
import { getAI } from '../config/ai';

export const generateAdCopy = async (params: GenerateAdCopyParams): Promise<AdCopy[]> => {
    // 1. Validate input
    if (!params.productDescription) {
        throw new Error("Product description is required.");
    }

    // 2. Prepare prompt / config
    const ai = getAI();
    const prompt = `Generate ${params.count} ad copy variations for: ${params.productDescription}. Tone: ${params.tone}. Platform: ${params.platform}.`;

    try {
        // 3. Call AI
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

        // 4. Handle response
        const text = response.text?.trim();
        if (!text) {
          throw new Error("AI returned an empty response.");
        }
        
        try {
            const result = JSON.parse(text);
            
            // 5. Return safe output
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