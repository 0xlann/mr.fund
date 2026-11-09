import type { ChatProvider } from "@mrfund/agent";
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
    const secret = process.env.CHAT_PROXY_SECRET;
    const secretHeader = process.env.CHAT_PROXY_SECRET_HEADER;
    const ipHeader = process.env.CHAT_PROXY_IP_HEADER;
    const headerName = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
    const proxy =
      secret &&
      secretHeader &&
      ipHeader &&
      headerName.test(secretHeader) &&
      headerName.test(ipHeader) &&
      secretHeader.toLowerCase() !== ipHeader.toLowerCase()
        ? { secret, secretHeader, ipHeader }
        : undefined;
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
