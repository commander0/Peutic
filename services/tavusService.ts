
import { Api } from './api';
import { Database } from './database';

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
  const currentUser = Database.getUser();

  try {
    // Calls the secure endpoint in server/index.js
    const data = await Api.initVideo({
        replicaId,
        context: systemContext,
        conversationName,
        userId: currentUser?.id
    });

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
  // Call server to terminate session securely
  try {
      await Api.request('/video/terminate', 'POST', { conversationId });
  } catch (e) {
      console.warn("Failed to terminate video session explicitly:", e);
  }
};

export const listReplicas = async (): Promise<any[]> => {
  return [];
};
