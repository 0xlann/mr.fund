import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createContextLoader, readChatConfig } from "../src/server/chat/context";

// Historical recorded RPC data, Simulated transport; never live product facts.
const recording = JSON.parse(
  readFileSync(new URL("../../../fixtures/rhea/testnet-reads.json", import.meta.url), "utf8"),
);
const accountId: string = recording._provenance.accountId;
const environment = {
  NEAR_NETWORK_ID: "testnet",
  NEAR_RPC_URL: "https://rpc.example",
  RHEA_LENDING_ID: recording._provenance.lendingId,
  GUARDIAN_FACTORY_ID: "factory.testnet",
};
const fees = {
  FEE_TOKEN_ID: "usdc.fakes.testnet",
  FEE_RECIPIENT_ID: "fees.testnet",
  FEE_ACTIVATION_ATOMIC: "0",
  FEE_ACTION_ATOMIC: "0",
  FEE_EXECUTION_ATOMIC: "17",
};
function requiredConfig(env: Readonly<Record<string, string | undefined>> = environment) {
  const config = readChatConfig(env);
  if (!config) throw new Error("Invalid test configuration");
  return config;
}
function transport(overrides: Record<string, unknown> = {}) {
  const calls: {
    method: string;
    target: string;
    signal: AbortSignal | null | undefined;
    args: Record<string, unknown>;
  }[] = [];
  const fetchImpl: typeof fetch = async (_url, init) => {
    const body = JSON.parse(String(init?.body));
    if (body.method === "status") return Response.json({ result: { chain_id: "testnet" } });
    const p = body.params;
    const args = JSON.parse(Buffer.from(p.args_base64, "base64").toString("utf8"));
    calls.push({ method: p.method_name, target: p.account_id, signal: init?.signal, args });
    const found = recording.calls.find(
      (call: { contractId: string; method: string; args: unknown }) =>
        call.contractId === p.account_id &&
        call.method === p.method_name &&
        JSON.stringify(call.args) === JSON.stringify(args),
    );
    const extra: Record<string, unknown> = {
      get_version: "0.11.0",
      ft_balance_of: "900719925474099300000",
      storage_balance_of: { total: "100", available: "0" },
      get_guardian: null,
      ...overrides,
    };
    const data = Object.hasOwn(extra, p.method_name) ? extra[p.method_name] : found?.data;
    if (data === undefined) throw new Error("Unrecorded RPC view");
    return Response.json({
      result: {
        block_height: recording._provenance.blockHeight,
        block_hash: recording._provenance.blockHash,
        result: [...Buffer.from(JSON.stringify(data))],
      },
    });
  };
  return { fetchImpl, calls };
}

describe("trusted RPC chat context", () => {
  it("accepts existing server env names and keeps incomplete fees unavailable", async () => {
    const { fetchImpl, calls } = transport();
    const config = readChatConfig(environment);
    expect(config).not.toBeNull();
    if (!config) throw new Error("Expected valid server configuration");
    const context = await createContextLoader(config, fetchImpl)(
      { message: "Hi", accountId },
      new AbortController().signal,
    );
    expect(context.snapshot.accountId).toBe(accountId);
    expect(context.snapshot.borrowed[0]?.internal).toBe(121098520756n);
    expect(context.proposal).toBeUndefined();
    expect(calls.some((call) => call.method === "ft_balance_of")).toBe(false);
  });
  it("reads wallet atomic balances, observed version and recipient registration only with explicit complete fees", async () => {
    const { fetchImpl, calls } = transport();
    const context = await createContextLoader(
      requiredConfig({ ...environment, ...fees }),
      fetchImpl,
    )({ message: "Hi", accountId }, new AbortController().signal);
    expect(context.proposal?.walletBalances["usdc.fakes.testnet"]).toBe(900719925474099300000n);
    expect(context.proposal?.lendingVersion).toBe("0.11.0");
    expect(context.proposal?.fees.executionFee).toBe(17n);
    expect(context.proposal?.feeRecipientRegistered).toBe(true);
    expect(calls.find((call) => call.method === "storage_balance_of")?.args).toEqual({
      account_id: "fees.testnet",
    });
  });
  it("does not invent storage deposits when recipient is unregistered", async () => {
    const { fetchImpl } = transport({
      storage_balance_of: null,
      storage_balance_bounds: { min: "1250000000000000000000", max: null },
    });
    const context = await createContextLoader(
      requiredConfig({ ...environment, ...fees }),
      fetchImpl,
    )({ message: "Hi", accountId }, new AbortController().signal);
    expect(context.proposal?.feeRecipientRegistered).toBe(false);
    expect(context.proposal?.storageDepositYocto).toBe(1250000000000000000000n);
  });
  it("resolves Guardian from the actual get_guardian factory ABI and refuses a client target mismatch", async () => {
    const { fetchImpl, calls } = transport({ get_guardian: "verified.factory.testnet" });
    const loader = createContextLoader(requiredConfig(), fetchImpl);
    const context = await loader({ message: "Hi", accountId }, new AbortController().signal);
    expect(context.guardian?.target.guardianId).toBe("verified.factory.testnet");
    expect(calls.find((call) => call.method === "get_guardian")).toMatchObject({
      target: "factory.testnet",
      args: { owner_id: accountId },
    });
    await expect(
      loader(
        { message: "Hi", accountId, guardianId: "evil.testnet" },
        new AbortController().signal,
      ),
    ).rejects.toThrow(/unavailable/i);
    expect(calls.some((call) => call.target === "evil.testnet")).toBe(false);
  });
  it("propagates the request signal into every RPC read including later Guardian tools", async () => {
    const controller = new AbortController();
    const { fetchImpl, calls } = transport({ get_guardian: "verified.factory.testnet" });
    const context = await createContextLoader(requiredConfig(), fetchImpl)(
      { message: "Hi", accountId },
      controller.signal,
    );
    controller.abort();
    expect(calls.every((call) => call.signal?.aborted)).toBe(true);
    const count = calls.length;
    await context.guardian?.client.view("verified.factory.testnet", "get_config", {});
    expect(calls).toHaveLength(count);
  });
  it("rejects missing and cross-network server configuration rather than fabricating context", () => {
    expect(readChatConfig({})).toBeNull();
    expect(readChatConfig({ ...environment, NEAR_NETWORK_ID: "localhost" })).toBeNull();
    expect(
      readChatConfig({ ...environment, RHEA_LENDING_ID: "contract.main.burrow.near" }),
    ).toBeNull();
    expect(readChatConfig({ ...environment, ...fees, FEE_EXECUTION_ATOMIC: "1.5" })).toBeNull();
  });
  it("rejects RPC chain mismatch before position reads", async () => {
    const rpc: typeof fetch = async () => Response.json({ result: { chain_id: "mainnet" } });
    await expect(
      createContextLoader(requiredConfig(), rpc)(
        { message: "Hi", accountId },
        new AbortController().signal,
      ),
    ).rejects.toThrow(/unavailable/i);
  });
});
