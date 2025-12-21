import { GoogleGenAI } from "@google/genai";

// Lazy initialization to prevent crash on module load if env vars are missing
let aiInstance: GoogleGenAI | null = null;

const getAi = () => {
    if (!aiInstance) {
        const key = process.env.API_KEY;
        if (key && key !== 'test_key' && !key.includes('placeholder')) {
            aiInstance = new GoogleGenAI({ apiKey: key });
        }
    }
    return aiInstance;
};

// --- EXPANDED LOCAL FALLBACK DATA (WISDOM ENGINE) ---
const LOCAL_AFFIRMATIONS = {
    anxiety: [
        "This feeling is temporary. I am safe right now.",
        "I breathe in peace, I breathe out tension.",
        "I am stronger than my anxious thoughts.",
        "I control my breathing, I control my calm.",
        "Peace is the result of retraining your mind to process life as it is.",
        "You don't have to control your thoughts. You just have to stop letting them control you.",
        "Breathe. You’re going to be okay.",
        "Present moment, wonderful moment.",
        "My anxiety does not define me. It is just a cloud passing through.",
        "I am anchored in the present.",
        "Worrying does not empty tomorrow of its sorrow, it empties today of its strength.",
        "I release the need to know every answer right now.",
        "I am grounded. I am stable. I am here.",
        "This too shall pass.",
        "I trust myself to handle whatever comes.",
        "Fear is a reaction. Courage is a decision.",
        "I detach from the chaos around me and find the stillness within.",
        "My mind is a tool I use, not a master I obey.",
        "I am not my thoughts; I am the observer of my thoughts.",
        "Exhale the future. Inhale the now."
    ],
    stress: [
        "I can do anything, but not everything.",
        "Rest is productive. I give myself permission to pause.",
        "One step at a time. One breath at a time.",
        "I release the need to control the outcome.",
        "Tension is who you think you should be. Relaxation is who you are.",
        "Nothing is worth your health.",
        "Slow down and everything you are chasing will come around and catch you.",
        "I simply do not have to do it all today.",
        "I am doing my best, and that is enough.",
        "The world will not fall apart if I take a break.",
        "I prioritize my peace over this pressure.",
        "Stress is not a badge of honor.",
        "I un-clench my jaw, drop my shoulders, and breathe.",
        "There is more to life than increasing its speed.",
        "I focus on the next right thing, not the whole mountain.",
        "I disconnect to reconnect with myself.",
        "My worth is not measured by my productivity.",
        "It is not the load that breaks you down, it's the way you carry it.",
        "Calmness is a superpower.",
        "I choose to respond with clarity, not react with haste."
    ],
    sadness: [
        "It is okay to feel this way. Feelings are visitors.",
        "I treat myself with the kindness I give to others.",
        "This darkness is not my home, just a tunnel.",
        "I am worthy of love and happiness.",
        "The sun will rise and we will try again.",
        "Tears are words that need to be written.",
        "Healing comes in waves, and today is just one wave.",
        "I embrace my vulnerability as a strength.",
        "I am not broken; I am healing.",
        "It is okay to not be okay right now.",
        "I give myself the compassion I deserve.",
        "Even the darkest night will end and the sun will rise.",
        "I am allowed to take up space with my feelings.",
        "My heart is resilient and capable of joy again.",
        "I am surrounded by unseen support.",
        "Grief is the price we pay for love.",
        "I honor my feelings without letting them consume me.",
        "Tomorrow is a fresh canvas.",
        "I am gentle with my heart today.",
        "Light always returns."
    ],
    general: [
        "I am exactly where I need to be.",
        "My potential is limitless.",
        "I choose serenity over chaos.",
        "Today is a fresh start.",
        "The only way out is through.",
        "What you seek is seeking you.",
        "Happiness depends upon ourselves.",
        "Turn your wounds into wisdom.",
        "The journey of a thousand miles begins with one step.",
        "Believe you can and you're halfway there.",
        "Your life is your art.",
        "Be the change you wish to see in the world.",
        "Everything you can imagine is real.",
        "Simplicity is the ultimate sophistication.",
        "Do not let the behavior of others destroy your inner peace.",
        "Your vibe attracts your tribe.",
        "Life is 10% what happens to us and 90% how we react to it.",
        "The best way to predict the future is to create it.",
        "You are enough just as you are.",
        "Gratitude turns what we have into enough.",
        "Growth is a spiral process, doubling back on itself."
    ]
};

const getLocalFallback = (type: string, name: string) => {
    if (type === 'insight') {
        const backups = [
            `Welcome back, ${name}. Peace begins with a single breath.`,
            `Hello, ${name}. You are capable of amazing things today.`,
            `Hi ${name}. Remember to be kind to yourself today.`,
            `Welcome back, ${name}. Your calm presence is your power.`,
            `Good to see you, ${name}. Trust the timing of your life.`
        ];
        return backups[Math.floor(Math.random() * backups.length)];
    }
    return "Peace comes from within.";
};

export const generateDailyInsight = async (userName: string): Promise<string> => {
  const ai = getAi();
  if (!ai) return getLocalFallback('insight', userName);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Write a short, warm, human-like daily greeting and mental wellness tip for a user named ${userName}. Do not sound like a robot. Keep it under 30 words. Make it unique every time.`,
    });
    return response.text || "Welcome back. Remember to take a deep breath today.";
  } catch (error: any) {
    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
        console.warn("Gemini Quota Exceeded (Insight). Using fallback.");
        return getLocalFallback('insight', userName);
    }
    console.error("Gemini Insight Error:", error);
    return getLocalFallback('insight', userName);
  }
};

export const generateAffirmation = async (struggle: string = "general"): Promise<string> => {
    const ai = getAi();
    if (ai) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `The user is feeling: "${struggle}". Write a unique, powerful, metaphorical, and soothing affirmation (max 12 words) to help them reframe this thought. Do not use quotes. Avoid generic clichés.`
            });
            return response.text?.trim() || "Peace comes from within.";
        } catch (e: any) {
            // Silently fail to local logic on quota error
            if (e.status !== 429 && !e.message?.includes('429')) {
                console.warn("Gemini Affirmation Error:", e);
            }
        }
    }

    const lower = struggle.toLowerCase();
    let category = 'general';
    
    if (lower.match(/(anxi|fear|scared|panic|nervous|worry|dread)/)) category = 'anxiety';
    else if (lower.match(/(work|stress|busy|overwhelm|pressure|tired|exhaust|burnout)/)) category = 'stress';
    else if (lower.match(/(sad|lonely|depress|hurt|cry|grief|loss|pain|breakup)/)) category = 'sadness';

    const list = LOCAL_AFFIRMATIONS[category as keyof typeof LOCAL_AFFIRMATIONS];
    const randomIndex = Math.floor(Math.random() * list.length);
    return list[randomIndex];
};

export const generateSpeech = async (text: string): Promise<Uint8Array | null> => {
  const ai = getAi();
  if (!ai) return null;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"], 
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Zephyr' }, 
          },
        },
      },
    });
    
    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64) {
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    }
    return null;
  } catch (e: any) {
    if (e.status === 429 || e.message?.includes('429') || e.message?.includes('quota')) {
        console.warn("Gemini TTS Quota Exceeded. Falling back to browser speech.");
        return null; // Triggers fallbackSpeak in component
    }
    console.error("TTS Error", e);
    return null;
  }
};

export const generateWellnessImage = async (prompt: string): Promise<string | null> => {
    return null; 
};