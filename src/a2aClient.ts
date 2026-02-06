import type { Client } from "@a2a-js/sdk/client";
import {
  ClientFactory,
  ClientFactoryOptions,
  DefaultAgentCardResolver,
  JsonRpcTransportFactory,
} from "@a2a-js/sdk/client";
import { createAuthenticatedFetch, getAgentCardPath } from "agentstack-sdk";
import { createContext, createContextToken } from "./api";
import { config } from "./config";
import { rewriteDevProxyRequest } from "./utils";

export type AgentClient = Client;

export async function createAgentClient() {
  const context = await createContext();
  const contextToken = await createContextToken(context.id);

  const baseFetch: typeof fetch = (input, init) => fetch(rewriteDevProxyRequest(input), init);
  const fetchImpl = createAuthenticatedFetch(contextToken.token, baseFetch);

  const baseUrl = config.baseUrl;
  const agentCardPath = getAgentCardPath(config.providerId);

  const factory = new ClientFactory(
    ClientFactoryOptions.createFrom(ClientFactoryOptions.default, {
      transports: [new JsonRpcTransportFactory({ fetchImpl })],
      cardResolver: new DefaultAgentCardResolver({ fetchImpl }),
    }),
  );
  const client = await factory.createFromUrl(baseUrl, agentCardPath);

  return { context, client };
}
