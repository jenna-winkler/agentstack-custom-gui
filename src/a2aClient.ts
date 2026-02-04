import { ClientFactory, ClientFactoryOptions, DefaultAgentCardResolver, JsonRpcTransportFactory } from "@a2a-js/sdk/client";
import type { Client } from "@a2a-js/sdk/client";
import { config } from "./config";

export type AgentClient = Client;

export async function createAgentClient(): Promise<AgentClient> {
  // Create a fetch wrapper that adds the Authorization header
  const fetchWithAuth: typeof fetch = async (input, init) => {
    const headers = new Headers(init?.headers);
    if (config.authToken) {
      headers.set('Authorization', `Bearer ${config.authToken}`);
    }
    
    return fetch(input, {
      ...init,
      headers,
    });
  };
  
  // Bind to window to avoid "Illegal invocation" error
  const fetchImpl = fetchWithAuth.bind(window);
  
  const baseUrl = config.baseUrl;
  const agentCardPath = `api/v1/a2a/${config.providerId}/.well-known/agent-card.json`;
  
  const factory = new ClientFactory(
    ClientFactoryOptions.createFrom(ClientFactoryOptions.default, {
      transports: [new JsonRpcTransportFactory({ fetchImpl })],
      cardResolver: new DefaultAgentCardResolver({ fetchImpl }),
    })
  );
  
  const client = await factory.createFromUrl(baseUrl, agentCardPath);
  return client;
}