import { GoogleGenAI } from "@google/genai";
import { env } from '../utils/env';

/**
 * Creates and returns a configured GoogleGenAI instance.
 * Throws a clear error if the API key is not available at the time of creation,
 * which helps services fail gracefully with an informative message.
 */
export const getAI = () => {
    const apiKey = env.API_KEY;
    if (!apiKey) {
        throw new Error("API Key is missing. Please ensure it is configured in your environment to use AI features.");
    }
    return new GoogleGenAI({ apiKey });
};
