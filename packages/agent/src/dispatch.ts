import type { SourceNumber } from "./numbers";
import { RUNNERS, type ToolContext, type ToolResult } from "./tools";

export interface ToolCall {
  name: string;
  /** Untrusted: whatever the model produced. */
  arguments: unknown;
}

/** Run one tool call. Never throws; every failure is a typed refusal the model can read. */
export function dispatch(call: ToolCall, ctx: ToolContext): ToolResult {
  const run = Object.hasOwn(RUNNERS, call.name) ? RUNNERS[call.name] : undefined;
  if (!run) {
    return {
      ok: false,
      tool: call.name,
      refusal: { code: "unknown_tool", message: `There is no tool named ${call.name}.` },
    };
  }
  try {
    return run(call.arguments as Record<string, unknown>, ctx);
  } catch {
    return {
      ok: false,
      tool: call.name,
      refusal: {
        code: "internal_error",
        message: "The tool failed unexpectedly; no result was produced.",
      },
    };
  }
}

/** The tool message the LLM receives. All numbers are exact decimal strings. */
export function toToolMessage(r: ToolResult): string {
  return JSON.stringify(r);
}

/** Numbers a reply may quote after this call, for the number checker. */
export function sourcesOf(r: ToolResult): SourceNumber[] {
  return r.ok ? r.facts.map(({ value, unit }) => ({ value, unit })) : [];
}
