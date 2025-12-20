const TAVUS_API_URL = 'https://tavusapi.com/v2';
// Prioritize Environment Variables
const API_KEY = process.env.VITE_TAVUS_API_KEY || 'ae15b9c744264844a555049b576094d8';

export interface TavusConversationResponse {
  conversation_id: string;
  conversation_url: string;
  status: string;
}

export const createTavusConversation = async (replicaId: string, userName: string, context?: string): Promise<TavusConversationResponse> => {
  if (!API_KEY) {
    throw new Error("Configuration Error: Missing Tavus API Key");
  }

  // --- SAFETY PROTOCOL INJECTION ---
  const CRISIS_PROTOCOL = `
  CRITICAL SAFETY PROTOCOL:
  If the user expresses intent of self-harm, suicide, or harm to others:
  1. Immediately stop the roleplay.
  2. Say exactly: "I am concerned about your safety. Please call 988 or your local emergency services immediately."
  3. Do not attempt to treat a crisis situation yourself.
  `;

  const systemContext = context || `You are an empathetic, professional, and warm human specialist. You are speaking with ${userName}. Your role is to listen actively, provide emotional support, and help them process their thoughts. You are fluent in all languages. Detect the user's language instantly and respond in that same language with zero latency. ${CRISIS_PROTOCOL}`;

  const body = {
    replica_id: replicaId,
    conversation_name: `Session with ${userName} - ${new Date().toISOString()}`,
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
      
      if (response.status === 402 || errorMsg.includes('out of conversational credits') || errorMsg.includes('quota')) {
        throw new Error("Tavus Billing Error: The account is out of credits.");
      }

      if (response.status === 401) throw new Error("API Key Invalid or Unauthorized.");
      if (response.status === 403) throw new Error("Access Forbidden. Check API Key permissions.");
      
      throw new Error(errorMsg);
    }
    
    if (!data.conversation_url) {
      throw new Error("API returned success but no conversation URL was found.");
    }

    return {
      conversation_id: data.conversation_id,
      conversation_url: data.conversation_url,
      status: data.status || 'active'
    };

  } catch (error: any) {
    if (error.message.includes("Tavus Billing Error")) {
        throw error;
    }
    if (error.message.includes("Failed to fetch")) {
        throw new Error("Network Error: This may be a CORS issue. In production, this API call should run on a backend server, not the browser.");
    }
    console.error("Tavus Service Exception:", error);
    throw error;
  }
};

// OPTIMIZED: Explicit Session Termination with keepalive to prevent ghost sessions
export const endTavusConversation = async (conversationId: string): Promise<void> => {
  if (!conversationId || !API_KEY) return;

  try {
    // 'keepalive: true' ensures the request completes even if the page unloads
    await fetch(`${TAVUS_API_URL}/conversations/${conversationId}/end`, {
      method: 'POST',
      headers: {
        'x-api-key': API_KEY,
      },
      keepalive: true 
    });
    console.log(`Session ${conversationId} terminated successfully.`);
  } catch (error) {
    console.warn(`Failed to terminate session ${conversationId}:`, error);
  }
};

export const listReplicas = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${TAVUS_API_URL}/replicas`, {
      method: 'GET',
      headers: {
        'x-api-key': API_KEY,
      },
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.data || []; 
  } catch (error) {
    console.warn("Failed to fetch real Tavus thumbnails (likely CORS). Using high-fidelity fallbacks.");
    return [];
  }
};