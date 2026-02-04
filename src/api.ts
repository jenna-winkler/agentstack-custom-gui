import { buildApiClient, unwrapResult } from "agentstack-sdk";
import { config } from "./config";

// Build the API client
export const api = buildApiClient({
  baseUrl: config.baseUrl,
  ...(config.authToken && {
    headers: {
      Authorization: `Bearer ${config.authToken}`,
    },
  }),
});

// Helper to create a context for the conversation
export async function createConversationContext() {
  const response = await api.createContext({
    provider_id: config.providerId,
    metadata: { created_at: new Date().toISOString() },
  });
  
  return unwrapResult(response);
}

// Helper to create a context token with required permissions
export async function createContextToken(contextId: string) {
  const response = await api.createContextToken({
    context_id: contextId,
    grant_global_permissions: {
      llm: ["*"],
      embeddings: ["*"],
      a2a_proxy: ["*"],
    },
    grant_context_permissions: {
      files: ["read", "write"],
      vector_stores: ["read", "write"],
      context_data: ["read", "write"],
    },
  });
  
  return unwrapResult(response);
}