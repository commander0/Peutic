import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a short daily greeting and tip using Gemini.
 */
export const generateDailyInsight = async (userName: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a short, warm daily greeting and wellness tip for ${userName}. Max 25 words.`,
    });
    return response.text || "Welcome back. Take a deep breath today.";
  } catch (error) {
    return `Hello ${userName}. Remember to prioritize your peace today.`;
  }
};

/**
 * Analyzes the sentiment of session notes.
 */
export const analyzeSessionMood = async (notes: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyze the sentiment: "${notes}". Return one word.`
        });
        return response.text?.trim() || "Stable";
    } catch {
        return "Stable";
    }
};

/**
 * Generates a reframing affirmation.
 */
export const generateAffirmation = async (struggle: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `The user says: "${struggle}". Write a powerful, empathetic affirmation (max 12 words) to help them reframe. No quotes.`
        });
        return response.text?.trim() || "You are resilient and capable of handling this.";
    } catch (e) {
        return "This feeling is temporary. You are safe right now.";
    }
};