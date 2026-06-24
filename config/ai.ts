/**
 * FILE: config/ai.ts
 * PURPOSE: Secure AI initialization and client-side proxy.
 * SECURITY FIX: API calls are proxied through the server to protect the GEMINI_API_KEY.
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";

let genAIInstance: GoogleGenAI | null = null;
let currentApiKey = '';

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
    // If we're in the browser, ALWAYS use the proxy.
    if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
        return {
            models: {
                generateContent: async (args: any) => {
                    const response = await fetch('/api/gemini/generate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(args)
                    });
                    if (!response.ok) {
                        try {
                            const errData = await response.json();
                            throw new Error(errData.error || `Server failed to generate content: ${response.statusText}`);
                        } catch (e: any) {
                            throw new Error(e.message || `Server failed to generate content with status ${response.status}`);
                        }
                    }
                    return await response.json();
                }
            }
        };
    }

    const apiKey = typeof process !== 'undefined' && process.env 
        ? (process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.GOOGLE_API_KEY || '') 
        : '';
        
    if (!apiKey) {
        console.error("Missing Gemini API Key in environment variables!");
        throw new Error("Missing GEMINI_API_KEY. Please configure your API key in Settings > Secrets and do a hard refresh of your browser tab.");
    }

    if (!genAIInstance || currentApiKey !== apiKey) {
        currentApiKey = apiKey;
        genAIInstance = new GoogleGenAI({ apiKey: apiKey || '' });
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
                if (modelName === 'gemini-3-flash-preview') realModelName = 'gemini-flash-latest';
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
                    model: realModelName || 'gemini-flash-latest',
                    contents,
                    config: finalConfig 
                });
            }
        }
    };
};
