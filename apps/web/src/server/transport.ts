const encoder = new TextEncoder();

/** Count actual streamed bytes, not Content-Length; cancellation also interrupts body reads. */
export async function readBoundedBody(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number,
  signal: AbortSignal,
): Promise<string> {
  signal.throwIfAborted();
  if (!body) throw new Error("Missing body");
  const reader = body.getReader();
  const cancel = () => {
    void reader.cancel().catch(() => {});
  };
  signal.addEventListener("abort", cancel, { once: true });
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      signal.throwIfAborted();
      const part = await reader.read();
      signal.throwIfAborted();
      if (part.done) break;
      length += part.value.byteLength;
      if (length > maxBytes) {
        await reader.cancel();
        throw new RangeError("Body too large");
      }
      chunks.push(part.value);
    }
    const bytes = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } finally {
    signal.removeEventListener("abort", cancel);
    reader.releaseLock();
  }
}

/** Physical fetch AND its body share the turn signal and each adapter's shorter timeout. */
export function bindTurnFetch(fetchImpl: typeof fetch, signal: AbortSignal): typeof fetch {
  return async (target, init) => {
    const combined = init?.signal ? AbortSignal.any([signal, init.signal]) : signal;
    combined.throwIfAborted();
    const response = await fetchImpl(target, { ...init, signal: combined, redirect: "error" });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error("RPC unavailable");
    }
    const text = await readBoundedBody(response.body, 4_194_304, combined);
    return new Response(encoder.encode(text), {
      status: response.status,
      headers: { "content-type": "application/json" },
    });
  };
}

export function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
