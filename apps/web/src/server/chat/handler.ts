import { timingSafeEqual } from "node:crypto";
import { isIP } from "node:net";
import {
  type ChatEvent,
  type ChatProvider,
  type ConversationMessage,
  runChatTurn,
  type ToolContext,
  type TurnSummary,
} from "@mrfund/agent";
import { isValidAccountId } from "@mrfund/shared";
import { readBoundedBody, record } from "./transport";

/** The account is a public-read selector, never an authenticated/signed-in identity. */
export interface ChatRequest {
  message: string;
  accountId: string;
  locale?: "en" | "id" | "es";
  history?: ConversationMessage[];
  guardianId?: string;
}
export interface ChatHandlerDependencies {
  provider?: ChatProvider;
  loadContext: (input: ChatRequest, signal: AbortSignal) => Promise<ToolContext>;
  rateLimit?: { requests: number; windowMs: number; maxEntries: number };
  proxy?: { secret: string; secretHeader: string; ipHeader: string };
}
function parseRequest(value: unknown): ChatRequest {
  if (
    !record(value) ||
    Object.keys(value).some(
      (key) => !["message", "accountId", "locale", "history", "guardianId"].includes(key),
    ) ||
    typeof value.message !== "string" ||
    !value.message.trim() ||
    value.message.length > 4000 ||
    typeof value.accountId !== "string" ||
    !isValidAccountId(value.accountId) ||
    (value.guardianId !== undefined &&
      (typeof value.guardianId !== "string" || !isValidAccountId(value.guardianId))) ||
    (value.locale !== undefined && !["en", "id", "es"].includes(String(value.locale)))
  )
    throw new Error("Invalid request");
  const history: ConversationMessage[] = [];
  if (value.history !== undefined) {
    if (!Array.isArray(value.history) || value.history.length > 20)
      throw new Error("Invalid history");
    let length = 0;
    for (const message of value.history) {
      if (
        !record(message) ||
        Object.keys(message).some((key) => !["role", "content"].includes(key)) ||
        (message.role !== "user" && message.role !== "assistant") ||
        typeof message.content !== "string" ||
        message.content.length > 4000
      )
        throw new Error("Invalid history");
      length += message.content.length;
      if (length > 16_000) throw new Error("Invalid history");
      history.push({ role: message.role, content: message.content });
    }
  }
  return {
    message: value.message,
    accountId: value.accountId,
    ...(value.locale === undefined ? {} : { locale: value.locale as "en" | "id" | "es" }),
    ...(value.guardianId === undefined ? {} : { guardianId: value.guardianId as string }),
    ...(value.history === undefined ? {} : { history }),
  };
}
function edgeIp(request: Request, proxy: ChatHandlerDependencies["proxy"]): string {
  if (proxy?.secret) {
    const supplied = new TextEncoder().encode(request.headers.get(proxy.secretHeader) ?? "");
    const expected = new TextEncoder().encode(proxy.secret);
    const ip = request.headers.get(proxy.ipHeader) ?? "";
    if (
      supplied.byteLength === expected.byteLength &&
      timingSafeEqual(supplied, expected) &&
      isIP(ip)
    )
      return ip;
  }
  // Next's Web Request has no authoritative peer address. Never trust x-forwarded-for by default.
  return "direct-client";
}
function abortable<T>(pending: Promise<T>, signal: AbortSignal): Promise<T> {
  signal.throwIfAborted();
  // This workspace targets ES2022, before Promise.withResolvers is available.
  let abort!: () => void;
  const stopped = new Promise<never>((_resolve, reject) => {
    abort = () => reject(new Error("Turn interrupted"));
    signal.addEventListener("abort", abort, { once: true });
  });
  return Promise.race([pending, stopped]).finally(() => signal.removeEventListener("abort", abort));
}

export type ChatHandler = (request: Request) => Promise<Response>;

export function createChatHandler(dependencies: ChatHandlerDependencies): ChatHandler {
  const limit = dependencies.rateLimit ?? { requests: 10, windowMs: 60_000, maxEntries: 4096 };
  const buckets = new Map<string, { used: number; expires: number }>();
  if (
    !Number.isSafeInteger(limit.requests) ||
    limit.requests < 1 ||
    !Number.isSafeInteger(limit.windowMs) ||
    limit.windowMs < 1 ||
    !Number.isSafeInteger(limit.maxEntries) ||
    limit.maxEntries < 2
  )
    throw new Error("Invalid rate configuration");
  const allow = (keys: string[]): boolean => {
    const now = Date.now();
    for (const [key, bucket] of buckets) if (bucket.expires <= now) buckets.delete(key);
    const missing = keys.filter((key) => !buckets.has(key)).length;
    if (
      buckets.size + missing > limit.maxEntries ||
      keys.some((key) => (buckets.get(key)?.used ?? 0) >= limit.requests)
    )
      return false;
    for (const key of keys) {
      const bucket = buckets.get(key) ?? { used: 0, expires: now + limit.windowMs };
      bucket.used++;
      buckets.set(key, bucket);
    }
    return true;
  };
  return async (request) => {
    const started = Date.now();
    const controller = new AbortController();
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 30_000);
    const disconnect = () => controller.abort();
    request.signal.addEventListener("abort", disconnect, { once: true });
    if (request.signal.aborted) disconnect();
    const cleanup = () => {
      clearTimeout(timer);
      request.signal.removeEventListener("abort", disconnect);
    };
    const httpError = (status: number, code: string) => {
      cleanup();
      return Response.json({ error: code }, { status, headers: { "cache-control": "no-store" } });
    };
    // Charge the authoritative transport bucket before parsing: malformed or slow bodies cost quota.
    if (!allow([`ip:${edgeIp(request, dependencies.proxy)}`]))
      return httpError(429, "rate_limited");
    let input: ChatRequest;
    try {
      if (request.method !== "POST") return httpError(405, "method_not_allowed");
      if (
        request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() !==
        "application/json"
      )
        return httpError(415, "invalid_content_type");
      const raw = await readBoundedBody(request.body, 32_768, controller.signal);
      input = parseRequest(JSON.parse(raw) as unknown);
    } catch (error) {
      return httpError(
        timedOut ? 408 : request.signal.aborted ? 499 : error instanceof RangeError ? 413 : 400,
        timedOut ? "timeout" : request.signal.aborted ? "cancelled" : "invalid_request",
      );
    }
    if (!allow([`account:${input.accountId}`])) return httpError(429, "rate_limited");
    let closed = false;
    const stream = new ReadableStream<Uint8Array>({
      start(output) {
        let bytes = 0;
        const emit = (event: ChatEvent, terminal = false) => {
          if (closed || request.signal.aborted) return;
          const chunk = new TextEncoder().encode(
            `data: ${JSON.stringify(event, (_key, value: unknown) => (typeof value === "bigint" ? value.toString() : value))}\n\n`,
          );
          if (bytes + chunk.byteLength > (terminal ? 1_000_000 : 990_000))
            throw new Error("Response limit");
          bytes += chunk.byteLength;
          output.enqueue(chunk);
        };
        const execute = async () => {
          try {
            emit({ type: "progress", stage: "reading" });
            if (!dependencies.provider) throw new Error("Unavailable");
            const context = await abortable(
              dependencies.loadContext(input, controller.signal),
              controller.signal,
            );
            controller.signal.throwIfAborted();
            await abortable(
              runChatTurn({
                message: input.message,
                ...(input.history === undefined ? {} : { history: input.history }),
                ...(input.locale === undefined ? {} : { locale: input.locale }),
                context,
                provider: dependencies.provider,
                signal: controller.signal,
                emit,
              }),
              controller.signal,
            );
            controller.signal.throwIfAborted();
          } catch {
            if (!closed && !request.signal.aborted) {
              const status = timedOut
                ? "timeout"
                : controller.signal.aborted
                  ? "cancelled"
                  : "unavailable";
              const summary: TurnSummary = {
                via: "template",
                guardHits: 0,
                toolCalls: 0,
                providerCalls: 0,
                elapsedMs: Math.max(0, Date.now() - started),
                usage: {
                  inputTokens: 0,
                  outputTokens: 0,
                  cachedInputTokens: 0,
                  reasoningTokens: 0,
                },
                status,
              };
              const text =
                input.locale === "id"
                  ? "Mr.Fund belum dapat berbicara sekarang. Silakan coba lagi."
                  : input.locale === "es"
                    ? "Mr.Fund no puede hablar ahora. Inténtalo de nuevo."
                    : "Mr.Fund can't talk right now. Please try again.";
              // Fixed nonnumeric text only; never echo provider/RPC errors, credentials or transcripts.
              emit({ type: "error", code: status }, true);
              emit({ type: "text", text }, true);
              emit({ type: "done", summary }, true);
            }
          } finally {
            cleanup();
            if (!closed) {
              closed = true;
              output.close();
            }
          }
        };
        void execute();
      },
      cancel() {
        closed = true;
        controller.abort();
        cleanup();
      },
    });
    return new Response(stream, {
      headers: {
        "content-type": "text/event-stream; charset=utf-8",
        "cache-control": "no-store",
        "x-accel-buffering": "no",
      },
    });
  };
}
