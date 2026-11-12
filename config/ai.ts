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
const unavailableVertexModels = new Set<string>();

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
        ? (process.env.VERTEX_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || 'zeperai')
        : 'zeperai';
    const gcpProject = typeof process !== 'undefined' && process.env
        ? (process.env.GOOGLE_CLOUD_PROJECT || 'zeperai')
        : 'zeperai';
    const location = typeof process !== 'undefined' && process.env
        ? (process.env.GOOGLE_CLOUD_LOCATION || process.env.VERTEX_LOCATION || 'us-central1')
        : 'us-central1';
    const vertexApiKey = typeof process !== 'undefined' && process.env
        ? (process.env.VERTEX_API_KEY || '')
        : '';
    const saJson = typeof process !== 'undefined' && process.env
        ? (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON || '')
        : '';

    let parsedSaProject = '';
    let googleAuthOptions: any;
    if (saJson && saJson !== '""' && saJson !== "''" && saJson !== '{}' && saJson !== 'undefined' && saJson !== 'null') {
        const parsed = safelyParseServiceAccountJson(saJson);
        if (parsed) {
            parsedSaProject = parsed.project_id || '';
            googleAuthOptions = { credentials: parsed };
        } else {
            console.warn("[config/ai] GOOGLE_APPLICATION_CREDENTIALS_JSON was present but could not be parsed as a valid Service Account JSON.");
        }
    }

    const effectiveProject = vertexProjectId || gcpProject || parsedSaProject || 'zeperai';
    const cacheKey = `vertex:${effectiveProject}:${location}:${vertexApiKey || (googleAuthOptions ? 'sa' : 'adc')}`;

    if (!genAIInstance || currentApiKey !== cacheKey) {
        currentApiKey = cacheKey;
        // In @google/genai, apiKey and project/location are mutually exclusive.
        // Prioritize Service Account credentials (googleAuthOptions) or Project for postpay cloud billing
        if (googleAuthOptions) {
            genAIInstance = new GoogleGenAI({
                vertexai: true,
                project: effectiveProject,
                location: location || 'us-central1',
                googleAuthOptions,
            });
        } else if (vertexApiKey && !vertexApiKey.startsWith('AQ.')) {
            genAIInstance = new GoogleGenAI({
                vertexai: true,
                apiKey: vertexApiKey,
            });
        } else {
            genAIInstance = new GoogleGenAI({
                vertexai: true,
                project: effectiveProject,
                location: location || 'us-central1',
            });
        }
    }

    const ai: any = genAIInstance;

    // Return a wrapper that matches the application's existing usage patterns
    // and strictly follows the @google/genai SDK structure on Google Cloud Vertex AI.
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

                // On Google Cloud Vertex AI:
                // Image Generation Workhorse: 'gemini-2.5-flash-image'
                // Text Reasoning & Copy Workhorse: 'gemini-2.5-flash'
                let targetModel: string;
                if (isImageTask) {
                    targetModel = 'gemini-2.5-flash-image';
                } else if (
                    modelName === 'gemini-2.5-pro' &&
                    !unavailableVertexModels.has('gemini-2.5-pro') &&
                    process.env.VERTEX_PRO_MODEL === 'gemini-2.5-pro'
                ) {
                    targetModel = 'gemini-2.5-pro';
                } else {
                    targetModel = 'gemini-2.5-flash';
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

                // Ensure config has safetySettings and imageConfig if needed
                const finalConfig: any = {
                    ...config,
                    safetySettings: config?.safetySettings || DEFAULT_SAFETY_SETTINGS,
                    ...(isImageTask ? {
                        imageConfig: {
                            aspectRatio: config?.imageConfig?.aspectRatio || '1:1',
                            ...(config?.imageConfig?.imageSize ? { imageSize: config.imageConfig.imageSize } : {})
                        }
                    } : {})
                };

                try {
                    return await ai.models.generateContent({ 
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

                    // 1. If thinkingConfig caused rejection, retry without thinkingConfig
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

                    // 2. Fall back from Pro text model to reliable Flash text model
                    if (targetModel !== 'gemini-2.5-flash' && !isImageTask) {
                        console.warn(`[config/ai] Text model ${targetModel} failed (${cMsg.slice(0, 150)}), falling back to gemini-2.5-flash...`);
                        const { thinkingConfig, ...safeConfig } = finalConfig;
                        try {
                            return await ai.models.generateContent({
                                model: 'gemini-2.5-flash',
                                contents: normalizedContents,
                                config: safeConfig,
                            });
                        } catch (fallbackErr: any) {
                            console.warn(`[config/ai] Fallback to gemini-2.5-flash failed: ${String(fallbackErr?.message || '').slice(0, 150)}`);
                        }
                    }

                    throw callErr;
                }
            }
        }
    };
};
