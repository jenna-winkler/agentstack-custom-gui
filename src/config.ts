// Import token from gitignored file
import { authToken } from './config.local';

export const config = {
  baseUrl: "http://localhost:8333",
  providerId: "c6846b45-3388-b104-520b-a3bf7716df9c",
  authToken: authToken,
};