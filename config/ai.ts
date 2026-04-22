/**
 * FILE: config/ai.ts
 * PURPOSE: Secure AI initialization and client-side proxy.
 * SECURITY FIX: API calls are proxied through the server to protect the GEMINI_API_KEY.
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

let genAIInstance: GoogleGenAI | null = null;

const DEFAULT_SAFETY_SETTINGS = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
    },
];

export const getAI = () => {
    if (!genAIInstance) {
        genAIInstance = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
    }

    const ai: any = genAIInstance;

    // Return a wrapper that matches the application's existing usage patterns
    // and strictly follows the @google/genai SDK structure.
    return {
        models: {
            generateContent: async (args: any) => {
                let { model: modelName, contents, config } = args;
                
                // MAP CUSTOM/OLD NAMES TO REAL MODELS FOR @google/genai SDK
                let realModelName = modelName;
                if (modelName === 'gemini-3-flash-preview') realModelName = 'gemini-3.1-flash-lite-preview';
                if (modelName === 'gemini-2.5-flash-preview-tts') realModelName = 'gemini-3.1-flash-tts-preview';
                if (modelName === 'gemini-2.5-flash-image') realModelName = 'gemini-2.5-flash-image';
                if (modelName === 'gemini 2.5') realModelName = 'gemini-2.0-flash-exp';

                // Ensure config has safetySettings if not provided
                const finalConfig = {
                    ...config,
                    safetySettings: config?.safetySettings || DEFAULT_SAFETY_SETTINGS
                };

                // Use the modern models.generateContent API
                return await ai.models.generateContent({ 
                    model: realModelName || 'gemini-3.1-flash-lite-preview',
                    contents,
                    config: finalConfig 
                });
            }
        }
    };
};
