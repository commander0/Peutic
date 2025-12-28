
import { supabase } from './supabaseClient';

export interface TavusConversationResponse {
  conversation_id: string;
  conversation_url: string;
  status: string;
}

export const createTavusConversation = async (replicaId: string, userName: string, context?: string): Promise<TavusConversationResponse> => {
  // --- SAFETY PROTOCOL INJECTION ---
  const CRISIS_PROTOCOL = `
  CRITICAL SAFETY PROTOCOL:
  If the user expresses intent of self-harm, suicide, or harm to others:
  1. Immediately stop the roleplay.
  2. Say exactly: "I am concerned about your safety. Please call 988 or your local emergency services immediately."
  3. Do not attempt to treat a crisis situation yourself.
  `;

  const systemContext = context || `You are an empathetic, professional, and warm human specialist. You are speaking with ${userName}. Your role is to listen actively, provide emotional support, and help them process their thoughts. You are fluent in all languages. Detect the user's language instantly and respond in that same language with zero latency. ${CRISIS_PROTOCOL}`;
  const conversationName = `Session with ${userName} - ${new Date().toISOString()}`;

  try {
    // Call the Edge Function instead of the API directly
    const { data, error } = await supabase.functions.invoke('create-conversation', {
      body: {
        replicaId,
        context: systemContext,
        conversationName
      }
    });

    if (error) {
      // Handle Supabase Function invocation errors
      throw new Error(error.message || "Failed to connect to secure server.");
    }

    // Handle application-level errors returned by the function
    if (data.error) {
        if (data.error.includes("Server is busy")) {
            throw new Error("High Traffic: All specialists are currently busy. Please try again in 1 minute.");
        }
        throw new Error(data.error);
    }

    if (!data.conversation_url) {
      throw new Error("Secure server returned success but no conversation URL was found.");
    }

    return {
      conversation_id: data.conversation_id,
      conversation_url: data.conversation_url,
      status: data.status || 'active'
    };

  } catch (error: any) {
    console.error("Tavus Service Exception:", error);
    throw error;
  }
};

export const endTavusConversation = async (conversationId: string): Promise<void> => {
  // Note: Since we have removed client-side API keys, we cannot terminate sessions directly from the client 
  // without another Edge Function endpoint. For now, we log the termination locally.
  console.log(`Ending session ${conversationId} locally.`);
};

export const listReplicas = async (): Promise<any[]> => {
  // Placeholder to prevent errors since we removed the key
  return [];
};
