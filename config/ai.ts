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

    const isVertexExplicitlyRequested = process.env.USE_VERTEX_AI === 'true';

    let parsedSaProject = '';
    let googleAuthOptions: any;
    if (saJson) {
        try {
            let cleanJson = saJson.trim();
            if ((cleanJson.startsWith("'") && cleanJson.endsWith("'")) || (cleanJson.startsWith('"') && cleanJson.endsWith('"') && !cleanJson.startsWith('{"'))) {
                cleanJson = cleanJson.slice(1, -1);
            }
            if (!cleanJson.startsWith('{') && cleanJson.length > 20) {
                try {
                    const decoded = Buffer.from(cleanJson, 'base64').toString('utf8');
                    if (decoded.trim().startsWith('{')) {
                        cleanJson = decoded.trim();
                    }
                } catch (_) {}
            }
            const parsed = JSON.parse(cleanJson);
            parsedSaProject = parsed.project_id || '';
            if (parsed.private_key && typeof parsed.private_key === 'string') {
                parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
            }
            googleAuthOptions = { credentials: parsed };
        } catch {
            throw new Error("GOOGLE_APPLICATION_CREDENTIALS_JSON is not valid JSON. Please provide the valid service account JSON contents.");
        }
    }

    const hasExplicitVertexCreds = Boolean(
        vertexApiKey ||
        googleAuthOptions ||
        process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        vertexProjectId
    );

    const useVertex = isVertexExplicitlyRequested || (Boolean(vertexProjectId || vertexApiKey) && !apiKey);
    const effectiveProject = vertexProjectId || parsedSaProject || (useVertex && !saJson && !vertexApiKey ? gcpProject : '');

    if (useVertex) {
        if (!hasExplicitVertexCreds) {
            throw new Error(
                "Google Vertex AI (Postpay) is enabled, but no Google Cloud credentials or Project ID were provided. " +
                "To bill directly to your Google Cloud Billing account, please provide your Google Cloud Project ID (VERTEX_PROJECT_ID) " +
                "and either a Service Account JSON (GOOGLE_APPLICATION_CREDENTIALS_JSON) or Vertex Express API Key (VERTEX_API_KEY) in Admin Settings > AI."
            );
        }
    } else if (!apiKey) {
        console.error("Missing Gemini API Key in environment variables!");
        throw new Error("Missing GEMINI_API_KEY / GeminiAPI. Please configure your API key in Settings > Secrets or enable Vertex AI Postpay in Admin Settings > AI.");
    }

    const cacheKey = useVertex ? `vertex:${effectiveProject}:${location}:${vertexApiKey || (saJson ? 'sa' : 'adc')}` : `studio:${apiKey}`;

    if (!genAIInstance || currentApiKey !== cacheKey) {
        currentApiKey = cacheKey;
        if (useVertex) {
            // In @google/genai, apiKey and project/location are mutually exclusive.
            // Prioritize Service Account credentials (googleAuthOptions) for true enterprise postpay billing
            if (googleAuthOptions || effectiveProject) {
                genAIInstance = new GoogleGenAI({
                    vertexai: true,
                    ...(effectiveProject ? { project: effectiveProject } : {}),
                    location: location || 'us-central1',
                    ...(googleAuthOptions ? { googleAuthOptions } : {}),
                });
            } else if (vertexApiKey && !vertexApiKey.startsWith('AQ.')) {
                genAIInstance = new GoogleGenAI({
                    vertexai: true,
                    apiKey: vertexApiKey,
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

                const hasImageConfig = Boolean(config?.imageConfig);

                // Map model aliases to current supported canonical models per gemini-api skill
                let realModelName = modelName;
                if (modelName === 'gemini-3.1-flash-lite' || modelName === 'gemini-flash-lite' || modelName === 'flash-lite') {
                    realModelName = hasImageConfig ? 'gemini-nano-banana-2.1' : 'gemini-3.1-flash-lite';
                }
                if (modelName === 'gemini-3-flash-preview' || modelName === 'gemini-flash-latest' || modelName === 'gemini-2.5-flash' || modelName === 'gemini-2.0-flash' || modelName === 'gemini-1.5-flash') {
                    realModelName = hasImageConfig ? 'gemini-nano-banana-2.1' : 'gemini-3.8-flash';
                }
                if (modelName === 'gemini-3.1-pro-preview' || modelName === 'gemini-3-pro-preview' || modelName === 'gemini-pro-latest' || modelName === 'gemini-pro' || modelName === 'gemini-2.5-pro' || modelName === 'gemini-2.0-pro' || modelName === 'gemini-1.5-pro') {
                    realModelName = hasImageConfig ? 'gemini-3-pro-image' : 'gemini-3.1-pro-preview';
                }
                if (modelName === 'gemini-2.5-flash-preview-tts' || modelName === 'gemini-3.1-flash-tts-preview') {
                    realModelName = 'gemini-3.8-flash-lite-tts';
                }
                // Image Models - Nano Banana Family
                if (modelName === 'nano-banana-2-lite' || modelName === 'nano-banana-lite' || modelName === 'gemini-2.5-flash-image' || modelName === 'gemini-3.1-flash-lite-image') {
                    realModelName = 'gemini-3.1-flash-lite-image';
                }
                if (modelName === 'nano-banana-2' || modelName === 'nano-banana' || modelName === 'gemini-3.1-flash-image' || modelName === 'gemini-nano-banana-2.1') {
                    realModelName = 'gemini-nano-banana-2.1';
                }
                if (modelName === 'nano-banana-pro' || modelName === 'gemini-pro-image' || modelName === 'gemini-3-pro-image') {
                    realModelName = 'gemini-3-pro-image';
                }
                // Discontinued Imagen aliases fallback cleanly to Nano Banana models
                if (modelName && (modelName.includes('imagen') || modelName.includes('dall-e'))) {
                    realModelName = 'gemini-3.1-flash-lite-image';
                }

                // Invariant: Never allow an image generation request (with imageConfig) to invoke a pure text model
                if (hasImageConfig && (realModelName === 'gemini-3.8-flash' || realModelName === 'gemini-3.1-pro-preview' || !realModelName)) {
                    realModelName = 'gemini-nano-banana-2.1';
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
                    model: realModelName || (hasImageConfig ? 'gemini-nano-banana-2.1' : 'gemini-3.8-flash'),
                    contents: normalizedContents,
                    config: finalConfig 
                });
            }
        }
    };
};
