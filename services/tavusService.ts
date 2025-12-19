const TAVUS_API_URL = 'https://tavusapi.com/v2';

const API_KEY = process.env.TAVUS_API_KEY || '';

export interface TavusConversationResponse {
  conversation_id: string;
  conversation_url: string;
  status: string;
}

export const createTavusConversation = async (replicaId: string, userName: string, context?: string): Promise<TavusConversationResponse> => {
  if (!API_KEY) {
    throw new Error("Configuration Error: Missing Tavus API Key. Set TAVUS_API_KEY in environment variables.");
  }

  const systemContext = context || `You are an empathetic, professional, and warm human specialist. You are speaking with ${userName}. Your role is to listen actively, provide emotional support, and help them process their thoughts. Do not mention you are an AI.`;

  const body = {
    replica_id: replicaId,
    conversation_name: `Session with ${userName}`,
    conversational_context: systemContext,
    properties: {
      max_call_duration: 3600,
      enable_recording: true,
      enable_transcription: true,
      language: 'multilingual'
    }
  };

  try {
    const response = await fetch(`${TAVUS_API_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMsg = data.message || data.error || response.statusText;
      if (response.status === 402) throw new Error("Tavus Billing Error: The account is out of credits.");
      throw new Error(errorMsg);
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
  if (!conversationId || !API_KEY) return;
  try {
    await fetch(`${TAVUS_API_URL}/conversations/${conversationId}/end`, {
      method: 'POST',
      headers: { 'x-api-key': API_KEY },
      keepalive: true 
    });
  } catch (error) {
    console.warn(`Failed to terminate session ${conversationId}:`, error);
  }
};