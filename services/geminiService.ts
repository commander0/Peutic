
import { supabase } from './supabaseClient';

// --- LOCAL FALLBACK DATA (For Offline/Error Modes) ---
const LOCAL_AFFIRMATIONS = {
    anxiety: [ "I am safe right now.", "This feeling is temporary.", "I breathe in peace.", "I am grounded.", "I trust myself." ],
    stress: [ "One step at a time.", "I release control.", "Rest is productive.", "I am doing my best.", "I prioritize my peace." ],
    sadness: [ "It is okay to feel this.", "I treat myself with kindness.", "This too shall pass.", "I am worthy of love." ],
    general: [ "I am enough.", "Today is a fresh start.", "I choose peace.", "My potential is limitless." ]
};

const getLocalFallback = (type: string, name: string) => {
    if (type === 'insight') return `Welcome back, ${name}. Peace begins with a single breath.`;
    return "Peace comes from within.";
};

// --- SECURE API CALLS ---

export const generateDailyInsight = async (userName: string): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('api-gateway', {
        body: { 
            action: 'gemini-generate', 
            payload: { prompt: `Write a warm, human-like 1-sentence mental wellness greeting for ${userName}. Do not be robotic.` } 
        }
    });

    if (error || !data?.text) throw error;
    return data.text;
  } catch (e) {
    console.warn("AI Insight Fallback (Secure):", e);
    return getLocalFallback('insight', userName);
  }
};

export const generateAffirmation = async (struggle: string = "general"): Promise<string> => {
    try {
        const { data, error } = await supabase.functions.invoke('api-gateway', {
            body: { 
                action: 'gemini-generate', 
                payload: { prompt: `The user feels: "${struggle}". Write 1 powerful, metaphorical affirmation (max 10 words). No quotes.` } 
            }
        });

        if (error || !data?.text) throw error;
        return data.text.trim();
    } catch (e) {
        // Fallback Logic
        const lower = struggle.toLowerCase();
        let category = 'general';
        if (lower.match(/(anxi|fear|panic|scared)/)) category = 'anxiety';
        else if (lower.match(/(stress|busy|tired|overwhelm)/)) category = 'stress';
        else if (lower.match(/(sad|cry|hurt|pain)/)) category = 'sadness';
        
        const list = LOCAL_AFFIRMATIONS[category as keyof typeof LOCAL_AFFIRMATIONS] || LOCAL_AFFIRMATIONS['general'];
        return list[Math.floor(Math.random() * list.length)];
    }
};

export const generateSpeech = async (text: string): Promise<Uint8Array | null> => {
  try {
      const { data, error } = await supabase.functions.invoke('api-gateway', {
          body: {
              action: 'gemini-speak',
              payload: { text }
          }
      });

      if (error || !data?.audioData) throw error;

      // Decode Base64 to Uint8Array (PCM)
      const binaryString = atob(data.audioData);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
      }
      return bytes;

  } catch (e) {
      console.warn("Secure TTS Failed (Falling back to Browser):", e);
      return null;
  }
};

export const generateWellnessImage = async (prompt: string): Promise<string | null> => {
    return null; 
};
