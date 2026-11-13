import type { ChatProvider } from "@mrfund/agent";
import { readProxyConfig } from "../../../server/admission";
import { createContextLoader, readChatConfig } from "../../../server/chat/context";
import { type ChatHandler, createChatHandler } from "../../../server/chat/handler";
import { createNearAIProvider } from "../../../server/chat/provider";

export const runtime = "nodejs";

let handler: ChatHandler | undefined;

/** Public read context and unsigned proposals only; accountId is not wallet authentication. */
export function POST(request: Request): Promise<Response> {
  if (!handler) {
    const config = readChatConfig(process.env);
    let provider: ChatProvider | undefined;
    try {
      if (process.env.NEARAI_API_KEY && process.env.NEARAI_MODEL)
        provider = createNearAIProvider({
          apiKey: process.env.NEARAI_API_KEY,
          model: process.env.NEARAI_MODEL,
          ...(process.env.NEARAI_BASE_URL ? { baseUrl: process.env.NEARAI_BASE_URL } : {}),
        });
    } catch {
      // A bad credential destination is unavailable, never a request to an alternative host.
    }
    const proxy = readProxyConfig(process.env);
    handler = createChatHandler({
      ...(provider ? { provider } : {}),
      loadContext: config
        ? createContextLoader(config)
        : async () => {
            throw new Error("Chat context unavailable");
          },
      ...(proxy ? { proxy } : {}),
    });
  }
  return handler(request);
}
