import { buildApiClient, unwrapResult } from "agentstack-sdk";
import { config } from "./config";

// Build the API client
export const api = buildApiClient({
  baseUrl: config.baseUrl,
});

// Helper to create a context for the conversation
export async function createContext() {
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

export async function uploadFilesToContext({ contextId, files }: { contextId: string; files: File[] }) {
  const uploadedFiles = await Promise.all(
    files.map(async (file) => {
      const response = await api.createFile({
        context_id: contextId,
        file,
      });
      const uploadedFile = unwrapResult(response);

      return {
        uri: `agentstack://${uploadedFile.id}`,
        name: uploadedFile.filename,
        mime_type: uploadedFile.content_type,
      };
    }),
  );

  return uploadedFiles;
}
