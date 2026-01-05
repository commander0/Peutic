
import { supabase } from './supabaseClient';

export interface TavusConversationResponse {
  conversation_id: string;
  conversation_url: string;
  status: string;
}

export const createTavusConversation = async (replicaId: string, userName: string, context?: string): Promise<TavusConversationResponse> => {
  // Call the Edge Function 'tavus-proxy'
  const { data, error } = await supabase.functions.invoke('tavus-proxy', {
    body: { 
        action: 'create', 
        replicaId, 
        userName, 
        context 
    }
  });

  if (error) {
      console.error("Secure Connection Failed:", error);
      throw new Error("Unable to establish secure link. Please check your internet connection.");
  }

  if (data?.error) {
      throw new Error(data.error);
  }
  
  if (!data?.conversation_url) {
      throw new Error("Invalid response from secure video node.");
  }

  return {
      conversation_id: data.conversation_id,
      conversation_url: data.conversation_url,
      status: data.status || 'active'
  };
};

export const endTavusConversation = async (conversationId: string): Promise<void> => {
  if (!conversationId) return;

  // Fire and forget termination signal
  supabase.functions.invoke('tavus-proxy', {
    body: { action: 'end', conversationId }
  }).catch(err => console.warn("Termination signal warning:", err));
};

export const listReplicas = async (): Promise<any[]> => {
  // This feature is currently unused in the frontend, handled by static config
  return [];
};
