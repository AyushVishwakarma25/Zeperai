/**
 * FILE: config/ai.ts
 * PURPOSE: Secure AI initialization and client-side proxy.
 * SECURITY FIX: API calls are proxied through the server to protect the GEMINI_API_KEY.
 */

import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { supabase } from "../services/supabaseClient.js";
import { safelyParseServiceAccountJson } from "../utils/serviceAccountParser.js";

let genAIInstance: GoogleGenAI | null = null;
let currentApiKey = '';
let studioGenAIInstance: GoogleGenAI | null = null;
let studioCurrentApiKey = '';
const unavailableVertexModels = new Set<string>();

/**
 * Resets the in-memory GoogleGenAI instance so that dynamic runtime configuration
 * (e.g. from Admin Dashboard AI & Secrets manager) takes effect immediately.
 */
export const resetAIInstance = () => {
    genAIInstance = null;
    currentApiKey = '';
    studioGenAIInstance = null;
    studioCurrentApiKey = '';
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

    let parsedSaProject = '';
    let googleAuthOptions: any;
    let saJsonParseError = false;
    if (saJson && saJson !== '""' && saJson !== "''" && saJson !== '{}' && saJson !== 'undefined' && saJson !== 'null') {
        const parsed = safelyParseServiceAccountJson(saJson);
        if (parsed) {
            parsedSaProject = parsed.project_id || '';
            googleAuthOptions = { credentials: parsed };
        } else {
            saJsonParseError = true;
            console.warn("[config/ai] GOOGLE_APPLICATION_CREDENTIALS_JSON was present but could not be parsed as a valid Service Account JSON.");
        }
    }

    const hasExplicitVertexCreds = Boolean(
        (vertexApiKey && !vertexApiKey.startsWith('AQ.')) ||
        googleAuthOptions ||
        (process.env.GOOGLE_APPLICATION_CREDENTIALS && !saJsonParseError)
    );

    // If Vertex AI was requested, but no valid Vertex credentials (no parsed SA and no valid Vertex API key) exist:
    // Don't brick the app! Check if a Gemini API Key is available to fall back to Google AI Studio.
    let useVertex = process.env.USE_VERTEX_AI === 'true' || (process.env.USE_VERTEX_AI !== 'false' && hasExplicitVertexCreds);
    if (useVertex && !hasExplicitVertexCreds) {
        if (apiKey) {
            console.warn("[config/ai] Vertex AI requested but valid credentials are not provided. Automatically falling back to Google AI Studio with GEMINI_API_KEY.");
            useVertex = false;
        } else {
            throw new Error(
                saJsonParseError
                    ? "The Service Account JSON provided is not valid JSON. Please check that you copied the complete JSON file or provide a valid GEMINI_API_KEY in Admin Settings > AI."
                    : "Google Cloud Vertex AI is selected as primary, but no Google Cloud credentials were provided. Please provide your Service Account JSON or Gemini API key in Admin Settings > AI."
            );
        }
    } else if (!useVertex && !apiKey) {
        if (hasExplicitVertexCreds) {
            useVertex = true;
        } else {
            throw new Error(
                saJsonParseError
                    ? "The Service Account JSON provided is not valid JSON. Please check that you copied the complete JSON file or provide a valid GEMINI_API_KEY in Admin Settings > AI."
                    : "Missing GEMINI_API_KEY. Please configure your API key in Admin Settings > AI or upload your Google Cloud Service Account JSON."
            );
        }
    }

    const effectiveProject = vertexProjectId || parsedSaProject || '';

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
            genAIInstance = new GoogleGenAI({
                apiKey: apiKey || '',
                httpOptions: {
                    headers: {
                        'User-Agent': 'aistudio-build',
                    },
                },
            });
        }
    }

    // Always maintain a Google AI Studio client whenever GEMINI_API_KEY is available.
    // The Nano Banana image generation family (gemini-nano-banana-2.1, gemini-3-pro-image, gemini-3.1-flash-lite-image)
    // is native to Google AI Studio and must be dispatched to AI Studio even in Vertex deployments.
    let studioAI: any = null;
    if (apiKey) {
        if (!studioGenAIInstance || studioCurrentApiKey !== apiKey) {
            studioCurrentApiKey = apiKey;
            studioGenAIInstance = new GoogleGenAI({
                apiKey: apiKey,
                httpOptions: {
                    headers: {
                        'User-Agent': 'aistudio-build',
                    },
                },
            });
        }
        studioAI = studioGenAIInstance;
    }

    const ai: any = genAIInstance;

    // Return a wrapper that matches the application's existing usage patterns
    // and strictly follows the @google/genai SDK structure.
    return {
        models: {
            generateContent: async (args: any) => {
                let { model: modelName, contents, config } = args;

                const hasImageConfig = Boolean(config?.imageConfig);
                const isImageTask = Boolean(
                    hasImageConfig ||
                    (typeof modelName === 'string' && (
                        modelName.includes('banana') ||
                        modelName.includes('image') ||
                        modelName.includes('imagen')
                    ))
                );

                // Map model aliases to current supported canonical models
                // On Google Cloud Vertex AI, Flash is 'gemini-2.5-flash' and Pro is 'gemini-2.5-pro'.
                // On Google AI Studio (API Key), models are 'gemini-3.8-flash' and 'gemini-3.1-pro-preview'.
                // Image Models: Nano Banana Family (gemini-nano-banana-2.1, gemini-3-pro-image, gemini-3.1-flash-lite-image)
                let realModelName = modelName;
                if (modelName === 'gemini-3.1-flash-lite' || modelName === 'gemini-flash-lite' || modelName === 'flash-lite') {
                    realModelName = isImageTask ? 'gemini-nano-banana-2.1' : (useVertex ? 'gemini-2.5-flash' : 'gemini-3.1-flash-lite');
                }
                if (modelName === 'gemini-3-flash-preview' || modelName === 'gemini-flash-latest' || modelName === 'gemini-2.5-flash' || modelName === 'gemini-2.0-flash' || modelName === 'gemini-1.5-flash' || modelName === 'gemini-3.8-flash') {
                    realModelName = isImageTask ? 'gemini-nano-banana-2.1' : (useVertex ? 'gemini-2.5-flash' : 'gemini-3.8-flash');
                }
                if (modelName === 'gemini-3.1-pro-preview' || modelName === 'gemini-3-pro-preview' || modelName === 'gemini-pro-latest' || modelName === 'gemini-pro' || modelName === 'gemini-2.5-pro' || modelName === 'gemini-2.0-pro' || modelName === 'gemini-1.5-pro') {
                    const vertexPro = process.env.VERTEX_PRO_MODEL || (unavailableVertexModels.has('gemini-2.5-pro') ? 'gemini-2.5-flash' : 'gemini-2.5-pro');
                    realModelName = isImageTask ? 'gemini-3-pro-image' : (useVertex ? vertexPro : 'gemini-3.1-pro-preview');
                }
                if (modelName === 'gemini-2.5-flash-preview-tts' || modelName === 'gemini-3.1-flash-tts-preview') {
                    realModelName = useVertex ? 'gemini-2.5-flash' : 'gemini-3.8-flash-lite-tts';
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
                // Discontinued Imagen aliases fallback cleanly to standard Nano Banana model
                if (modelName && (modelName.includes('imagen') || modelName.includes('dall-e'))) {
                    realModelName = 'gemini-nano-banana-2.1';
                }

                // Invariant: Never allow an image generation request to invoke a pure text model
                if (isImageTask && (realModelName === 'gemini-3.8-flash' || realModelName === 'gemini-2.5-flash' || realModelName === 'gemini-3.1-pro-preview' || realModelName === 'gemini-2.5-pro' || !realModelName)) {
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

                const fallbackTextModel = useVertex ? 'gemini-2.5-flash' : 'gemini-3.8-flash';
                const targetModel = realModelName || (isImageTask ? 'gemini-nano-banana-2.1' : fallbackTextModel);

                // Nano Banana image models are Google AI Studio models; prioritize studioAI whenever available
                let activeClient = (isImageTask && studioAI) ? studioAI : ai;

                try {
                    return await activeClient.models.generateContent({ 
                        model: targetModel,
                        contents: normalizedContents,
                        config: finalConfig 
                    });
                } catch (callErr: any) {
                    const cMsg = String(callErr?.message || '');
                    const isNotFound = cMsg.includes('404') ||
                        cMsg.toLowerCase().includes('not found') ||
                        cMsg.includes('NOT_FOUND') ||
                        cMsg.toLowerCase().includes('does not have access') ||
                        cMsg.toLowerCase().includes('publisher model');

                    if (isNotFound) {
                        unavailableVertexModels.add(targetModel);
                    }

                    // 1. If an image generation was attempted on Vertex AI and failed (publisher model not found on GCP),
                    // and Google AI Studio is configured, switch to Studio immediately
                    if (isImageTask && activeClient !== studioAI && studioAI) {
                        console.warn(`[config/ai] Vertex AI did not find image model ${targetModel}. Routing through Google AI Studio...`);
                        try {
                            return await studioAI.models.generateContent({
                                model: targetModel,
                                contents: normalizedContents,
                                config: finalConfig,
                            });
                        } catch (studioErr: any) {
                            console.warn(`[config/ai] Google AI Studio attempt for ${targetModel} also failed: ${String(studioErr?.message || '').slice(0, 150)}`);
                            callErr = studioErr;
                        }
                    }

                    // 2. IMAGE MODEL FALLBACK:
                    // Only fall back within the Nano Banana image family (Pro -> Standard -> Lite).
                    // NEVER fall back to a text model (gemini-2.5-flash, gemini-1.5-flash, etc.)
                    if (isImageTask) {
                        const imgClient = studioAI || ai;
                        if (targetModel === 'gemini-3-pro-image') {
                            console.warn(`[config/ai] Pro image model failed (${cMsg.slice(0, 100)}), falling back to standard Nano Banana (gemini-nano-banana-2.1)...`);
                            try {
                                return await imgClient.models.generateContent({
                                    model: 'gemini-nano-banana-2.1',
                                    contents: normalizedContents,
                                    config: finalConfig,
                                });
                            } catch (fbErr: any) {
                                console.warn(`[config/ai] Fallback to gemini-nano-banana-2.1 failed:`, fbErr?.message || fbErr);
                            }
                        }
                        if (targetModel !== 'gemini-3.1-flash-lite-image') {
                            console.warn(`[config/ai] Standard image model failed, falling back to Nano Banana Lite (gemini-3.1-flash-lite-image)...`);
                            try {
                                return await imgClient.models.generateContent({
                                    model: 'gemini-3.1-flash-lite-image',
                                    contents: normalizedContents,
                                    config: finalConfig,
                                });
                            } catch (fbErr: any) {
                                console.warn(`[config/ai] Fallback to gemini-3.1-flash-lite-image failed:`, fbErr?.message || fbErr);
                            }
                        }
                        // All image model attempts failed; throw the real error directly without masking it
                        throw callErr;
                    }

                    // 3. TEXT MODEL: If thinkingConfig caused rejection, retry without thinkingConfig
                    if (finalConfig.thinkingConfig && !isNotFound) {
                        console.warn(`[config/ai] generateContent call failed for ${targetModel} (${cMsg.slice(0, 150)}), retrying without thinkingConfig...`);
                        const { thinkingConfig, ...noThinkingConfig } = finalConfig;
                        try {
                            return await ai.models.generateContent({
                                model: targetModel,
                                contents: normalizedContents,
                                config: noThinkingConfig,
                            });
                        } catch (noThinkingErr: any) {
                            console.warn(`[config/ai] Retry without thinkingConfig for ${targetModel} also failed: ${String(noThinkingErr?.message || '').slice(0, 150)}`);
                            callErr = noThinkingErr;
                        }
                    }

                    const { thinkingConfig, ...safeConfig } = finalConfig;

                    // Fall back from Pro text model to reliable Flash text model
                    const isProOrNonFallback = targetModel !== fallbackTextModel;
                    if (isProOrNonFallback) {
                        console.warn(`[config/ai] Text model ${targetModel} failed (${cMsg.slice(0, 150)}), falling back to ${fallbackTextModel}...`);
                        try {
                            return await ai.models.generateContent({
                                model: fallbackTextModel,
                                contents: normalizedContents,
                                config: safeConfig,
                            });
                        } catch (fallbackErr: any) {
                            console.warn(`[config/ai] Fallback to ${fallbackTextModel} failed: ${String(fallbackErr?.message || '').slice(0, 150)}`);
                        }
                    }

                    // Ultimate stable text fallback: gemini-flash-latest or gemini-2.5-flash (NEVER deprecated gemini-1.5-flash or gemini-2.0-flash)
                    const stableTextFallback = useVertex ? 'gemini-2.5-flash' : 'gemini-flash-latest';
                    if (targetModel !== stableTextFallback && fallbackTextModel !== stableTextFallback) {
                        try {
                            return await ai.models.generateContent({
                                model: stableTextFallback,
                                contents: normalizedContents,
                                config: safeConfig
                            });
                        } catch (_) {}
                    }

                    throw callErr;
                }
            }
        }
    };
};
