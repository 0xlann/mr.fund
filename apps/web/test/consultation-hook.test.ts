// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { createDemoSource } from "../src/play/source/demoSource";
import { useConsultation } from "../src/play/useConsultation";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it("clears an in-progress turn without stale reply or thinking state", async () => {
  vi.useFakeTimers();
  const source = createDemoSource();
  const { result } = renderHook(() => useConsultation(source));
  act(() => result.current.sendMessage("Explain my position"));
  expect(result.current.thinking).toBe(true);
  act(() => result.current.clearConversation());
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2500);
  });
  expect(result.current.thinking).toBe(false);
  expect(result.current.messages).toHaveLength(1);
  expect(result.current.streamingId).toBeNull();
});
it("replaces a pending turn instead of accepting an obsolete reply", async () => {
  vi.useFakeTimers();
  const source = createDemoSource();
  const { result } = renderHook(() => useConsultation(source));
  act(() => result.current.sendMessage("Explain my position"));
  act(() => result.current.sendMessage("What if NEAR drops 20%?"));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(2500);
  });
  const replies = result.current.messages.filter((message) => message.role === "assistant");
  expect(replies).toHaveLength(2);
  expect(replies[1]?.kind).toBe("scenario");
  expect(replies[1]?.text).not.toContain("Your demo position has");
});
