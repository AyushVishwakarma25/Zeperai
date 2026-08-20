/**
 * FILE: config/ai.ts
 * PURPOSE: Secure AI initialization and client-side proxy.
 * SECURITY FIX: API calls are proxied through the server to protect the GEMINI_API_KEY.
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { supabase } from "../services/supabaseClient";

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
                    let token = '';
                    try {
                        const { data } = await supabase.auth.getSession();
                        token = data?.session?.access_token || '';
                    } catch (e) {
                        console.warn('Could not fetch Supabase auth token for AI call:', e);
                    }

                    const response = await fetch('/api/gemini/generate', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify(args)
                    });
                    if (!response.ok) {
                        let rawError = 'Something went wrong. Please try again.';
                        try {
                            const contentType = response.headers.get('content-type') || '';
                            if (contentType.includes('application/json')) {
                                const errData = await response.json();
                                rawError = errData.error || errData.message || rawError;
                            }
                        } catch (e: any) {
                            // ignore parse error
                        }

                        // Sanitize error message to prevent exposing internal stack traces or path names
                        const cleanError = rawError && !rawError.includes('at ') && !rawError.includes('node_modules') && !rawError.includes('<html')
                            ? rawError
                            : 'Oops! Something went wrong. Our team has been notified.';

                        if (typeof window !== 'undefined') {
                            window.dispatchEvent(new CustomEvent('app-toast', {
                                detail: { message: cleanError, type: 'error' }
                            }));
                        }
                        throw new Error(cleanError);
                    }
                    
                    const contentType = response.headers.get('content-type') || '';
                    if (!contentType.includes('application/json')) {
                        const text = await response.text();
                        throw new Error(`Invalid server response format. Expected JSON but received: ${text.substring(0, 100)}`);
                    }
                    return await response.json();
                }
            }
        };
    }

    const apiKey = typeof process !== 'undefined' && process.env 
        ? (process.env.GEMINI_API_KEY || 
           process.env.GeminiAPI || 
           process.env.API_KEY || 
           process.env.GOOGLE_API_KEY || 
           process.env.GOOGLE_GENAI_API_KEY ||
           '') 
        : '';
        
    if (!apiKey) {
        console.error("Missing Gemini API Key in environment variables!");
        throw new Error("Missing GEMINI_API_KEY / GeminiAPI. Please configure your API key in Settings > Secrets and do a hard refresh of your browser tab.");
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

                // MAP CUSTOM/OLD NAMES TO REAL GOOGLE NANO BANANA MODELS FOR @google/genai SDK
                let realModelName = modelName;
                if (modelName === 'gemini-3-flash-preview') realModelName = 'gemini-flash-latest';
                if (modelName === 'gemini-2.5-flash-preview-tts') realModelName = 'gemini-3.1-flash-tts-preview';
                if (modelName === 'nano-banana-2-lite') realModelName = 'gemini-2.5-flash-image';
                if (modelName === 'nano-banana-2' || modelName === 'nano-banana') realModelName = 'gemini-3.1-flash-image';
                if (modelName === 'nano-banana-pro') realModelName = 'gemini-3-pro-image';
                // Discontinued Imagen aliases fallback cleanly to Nano Banana models
                if (modelName && (modelName.includes('imagen') || modelName.includes('dall-e'))) {
                    realModelName = 'gemini-3.1-flash-image';
                }

                // Ensure config has safetySettings if not provided
                const finalConfig = {
                    ...config,
                    safetySettings: config?.safetySettings || DEFAULT_SAFETY_SETTINGS
                };

                // Use the modern models.generateContent API
                return await ai.models.generateContent({ 
                    model: realModelName || 'gemini-3.1-flash-image',
                    contents,
                    config: finalConfig 
                });
            }
        }
    };
};
