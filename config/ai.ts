import { GoogleGenAI } from "@google/genai";

/**
 * Creates and returns a configured GoogleGenAI instance.
 * Uses process.env.GEMINI_API_KEY directly to ensure compatibility with AI Studio's environment.
 */
export const getAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.warn("API Key is missing. Please ensure it is configured in your environment to use AI features.");
    }
    return new GoogleGenAI({ apiKey: apiKey || '' });
};
