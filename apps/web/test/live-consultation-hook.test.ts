// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useLiveConsultation } from "../src/play/useLiveConsultation";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
it("clears account-scoped conversation and uses server events", async () => {
  const account = {
    accountId: "alice.testnet",
    network: "testnet" as const,
    method: "near-connect" as const,
    accounts: ["alice.testnet"],
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      url === "/api/position"
        ? Response.json(
            { ok: false, networkId: "testnet", error: { code: "no_position" } },
            { status: 404 },
          )
        : new Response(
            'data: {"type":"text","text":"Server answer"}\n\ndata: {"type":"done","summary":{}}\n\n',
          ),
    ),
  );
  const { result, rerender } = renderHook(
    ({ id }) => useLiveConsultation({ ...account, accountId: id }),
    { initialProps: { id: account.accountId } },
  );
  await waitFor(() => expect(result.current.state.status).toBe("empty"));
  await act(async () => result.current.send("Question"));
  expect(result.current.messages.map((message) => message.content)).toEqual([
    "Question",
    "Server answer",
  ]);
  rerender({ id: "bob.testnet" });
  expect(result.current.messages).toEqual([]);
});
