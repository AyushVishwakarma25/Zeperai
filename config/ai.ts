/**
 * FILE: config/ai.ts
 * PURPOSE: Secure AI initialization and client-side proxy.
 * SECURITY FIX: API calls are proxied through the server to protect the GEMINI_API_KEY.
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { supabase } from "../services/supabaseClient.js";

let genAIInstance: GoogleGenAI | null = null;
let currentApiKey = '';

/**
 * Resets the in-memory GoogleGenAI instance so that dynamic runtime configuration
 * (e.g. from Admin Dashboard AI & Secrets manager) takes effect immediately.
 */
export const resetAIInstance = () => {
    genAIInstance = null;
    currentApiKey = '';
};

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
                    const data = await response.json();
                    if (typeof window !== 'undefined' && typeof data.remainingCredits === 'number') {
                        window.dispatchEvent(new CustomEvent('credits-updated', { 
                            detail: { remainingCredits: data.remainingCredits } 
                        }));
                    }
                    return data;
                }
            }
        };
    }

    const vertexProjectId = typeof process !== 'undefined' && process.env
        ? (process.env.VERTEX_PROJECT_ID || '')
        : '';
    const gcpProject = typeof process !== 'undefined' && process.env
        ? (process.env.GOOGLE_CLOUD_PROJECT || '')
        : '';
    const location = typeof process !== 'undefined' && process.env
        ? (process.env.GOOGLE_CLOUD_LOCATION || process.env.VERTEX_LOCATION || 'us-central1')
        : 'us-central1';
    const vertexApiKey = typeof process !== 'undefined' && process.env
        ? (process.env.VERTEX_API_KEY || '')
        : '';
    const saJson = typeof process !== 'undefined' && process.env
        ? (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || '')
        : '';

    const apiKey = typeof process !== 'undefined' && process.env 
        ? (process.env.GEMINI_API_KEY || 
           process.env.GeminiAPI || 
           process.env.API_KEY || 
           process.env.GOOGLE_API_KEY || 
           process.env.GOOGLE_GENAI_API_KEY ||
           '') 
        : '';

    // Post-pay Vertex AI mode: used when explicitly requested via USE_VERTEX_AI='true',
    // or when VERTEX_PROJECT_ID is provided, or when no Gemini API key exists but a GCP project is set.
    // NOTE: Cloud Run / App Engine environments automatically inject GOOGLE_CLOUD_PROJECT with an
    // internal project number; we must not default to Vertex AI if a valid AI Studio GEMINI_API_KEY
    // is available unless explicitly opted in.
    const useVertex = Boolean(
        process.env.USE_VERTEX_AI === 'true' ||
        vertexProjectId ||
        (!apiKey && gcpProject)
    );
    const project = vertexProjectId || (useVertex ? gcpProject : '');
        
    if (!useVertex && !apiKey) {
        console.error("Missing Gemini API Key in environment variables!");
        throw new Error("Missing GEMINI_API_KEY / GeminiAPI, or GOOGLE_CLOUD_PROJECT for Vertex AI. Please configure your API key in Settings > Secrets and do a hard refresh of your browser tab.");
    }

    const cacheKey = useVertex ? `vertex:${project}:${location}:${vertexApiKey || (saJson ? 'sa' : 'adc')}` : `studio:${apiKey}`;

    if (!genAIInstance || currentApiKey !== cacheKey) {
        currentApiKey = cacheKey;
        if (useVertex) {
            let googleAuthOptions: any;
            if (saJson) {
                try {
                    googleAuthOptions = { credentials: JSON.parse(saJson) };
                } catch {
                    throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON is not valid JSON. Paste the full service-account key file contents.");
                }
            }

            // In @google/genai, apiKey and project/location are mutually exclusive.
            // If an explicit vertexApiKey is set or if using apiKey in Vertex Express mode:
            if (vertexApiKey) {
                genAIInstance = new GoogleGenAI({
                    vertexai: true,
                    apiKey: vertexApiKey,
                });
            } else if (project || saJson || googleAuthOptions) {
                genAIInstance = new GoogleGenAI({
                    vertexai: true,
                    ...(project ? { project } : {}),
                    location: location || 'us-central1',
                    ...(googleAuthOptions ? { googleAuthOptions } : {}),
                });
            } else if (apiKey) {
                genAIInstance = new GoogleGenAI({
                    vertexai: true,
                    apiKey,
                });
            } else {
                genAIInstance = new GoogleGenAI({
                    vertexai: true,
                    location: location || 'us-central1',
                });
            }
        } else {
            genAIInstance = new GoogleGenAI({ apiKey: apiKey || '' });
        }
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
                if (modelName === 'nano-banana-2' || modelName === 'nano-banana') realModelName = 'gemini-2.5-flash-image';
                if (modelName === 'nano-banana-pro') realModelName = 'gemini-3-pro-image';
                if (modelName === 'gemini-3.1-pro-preview' || modelName === 'gemini-3-pro-preview' || modelName === 'gemini-pro-latest' || modelName === 'gemini-pro') {
                    realModelName = 'gemini-3.1-pro-preview';
                }
                // Vertex AI does not support AI Studio's rolling "-latest" alias convention;
                // it needs a concrete, versioned publisher model id.
                if (useVertex) {
                    if (realModelName === 'gemini-flash-latest' || realModelName === 'gemini-3.7-flash') realModelName = 'gemini-2.5-flash';
                    if (realModelName === 'gemini-3.1-pro-preview' || realModelName === 'gemini-3-pro-preview' || realModelName === 'gemini-pro-latest' || realModelName === 'gemini-pro') realModelName = 'gemini-2.5-flash';
                    if (realModelName === 'gemini-3.1-flash-image' || realModelName === 'gemini-3-pro-image') realModelName = 'gemini-2.5-flash-image';
                }
                // Discontinued Imagen aliases fallback cleanly to Nano Banana models
                if (modelName && (modelName.includes('imagen') || modelName.includes('dall-e'))) {
                    realModelName = 'gemini-2.5-flash-image';
                }

                // Normalize contents roles if passed as structured messages
                let normalizedContents = contents;
                if (Array.isArray(contents)) {
                    normalizedContents = contents.map((c: any) => {
                        if (c && typeof c === 'object' && c.role) {
                            let role = c.role;
                            if (role === 'assistant' || role === 'bot' || role === 'system_response') role = 'model';
                            else if (role === 'system') role = 'user';
                            else if (role !== 'user' && role !== 'model') role = 'user';
                            return { ...c, role };
                        }
                        return c;
                    });
                }

                // Ensure config has safetySettings if not provided
                const finalConfig = {
                    ...config,
                    safetySettings: config?.safetySettings || DEFAULT_SAFETY_SETTINGS
                };

                // Use the modern models.generateContent API
                return await ai.models.generateContent({ 
                    model: realModelName || 'gemini-2.5-flash-image',
                    contents: normalizedContents,
                    config: finalConfig 
                });
            }
        }
    };
};
