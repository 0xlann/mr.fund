import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createPositionLoader } from "../src/server/position/loader";

// Historical recordings replayed by an injected local transport; not live evidence.
export const recording = JSON.parse(
  readFileSync(new URL("../../../fixtures/rhea/testnet-reads.json", import.meta.url), "utf8"),
);
export const config = {
  network: "testnet" as const,
  rpcUrl: "https://rpc.example",
  lendingId: recording._provenance.lendingId as string,
};
export const accountId: string = recording._provenance.accountId;
export function rpc(overrides: Record<string, unknown> = {}) {
  const calls: { method: string; block?: string }[] = [];
  const fetchImpl: typeof fetch = async (_target, init) => {
    const body = JSON.parse(String(init?.body));
    if (body.method === "status")
      return Response.json({ result: { chain_id: overrides.chain ?? "testnet" } });
    const p = body.params;
    calls.push({ method: p.method_name, block: p.block_id });
    const args = JSON.parse(atob(p.args_base64));
    const found = recording.calls.find(
      (c: { contractId: string; method: string; args: unknown }) =>
        c.contractId === p.account_id &&
        c.method === p.method_name &&
        JSON.stringify(c.args) === JSON.stringify(args),
    );
    const data = Object.hasOwn(overrides, p.method_name)
      ? overrides[p.method_name]
      : p.method_name === "get_version"
        ? "0.11.0"
        : found?.data;
    if (data === undefined) throw new Error("Unrecorded view");
    return Response.json({
      result: {
        block_hash: overrides.mixed === p.method_name ? "foreign" : recording._provenance.blockHash,
        block_height: recording._provenance.blockHeight,
        result: [...new TextEncoder().encode(JSON.stringify(data))],
      },
    });
  };
  return { fetchImpl, calls };
}
const signal = () => new AbortController().signal;
describe("shared public snapshot loader", () => {
  it.each(["0.11.0", "0.16.2"])(
    "retains and verifies version %s at the config anchor without fee/model configuration",
    async (version) => {
      const { fetchImpl, calls } = rpc({ get_version: version });
      const result = await createPositionLoader(config, fetchImpl, true)(accountId, signal());
      expect(result.snapshot.borrowed[0]?.internal).toBe(121098520756n);
      expect(result.source).toEqual({
        protocol: "rhea",
        lendingId: config.lendingId,
        lendingVersion: version,
        blockHash: recording._provenance.blockHash,
        blockHeight: recording._provenance.blockHeight,
      });
      expect(calls.filter((c) => c.method === "get_version")).toEqual([
        { method: "get_version", block: recording._provenance.blockHash },
      ]);
      expect(calls.filter((c) => c.method === "get_config")).toHaveLength(1);
    },
  );
  it.each([
    ["9.0.0", "unsupported_protocol_version"],
    [null, "untrusted_data"],
    [{ version: "0.11.0" }, "untrusted_data"],
  ])("refuses version %j without schema retries", async (version, code) => {
    const { fetchImpl, calls } = rpc({ get_version: version });
    await expect(
      createPositionLoader(config, fetchImpl, true)(accountId, signal()),
    ).rejects.toMatchObject({ code });
    expect(calls.map((c) => c.method)).toEqual(["get_config", "get_version"]);
  });
  it.each(["get_version", "get_account"])("refuses mixed-block %s", async (mixed) => {
    await expect(
      createPositionLoader(config, rpc({ mixed }).fetchImpl, true)(accountId, signal()),
    ).rejects.toMatchObject({ code: "untrusted_data" });
  });
  it("retains empty account semantics for the HTTP presenter", async () => {
    const result = await createPositionLoader(
      config,
      rpc({ get_account: null }).fetchImpl,
      true,
    )(accountId, signal());
    expect(result.snapshot.borrowed).toEqual([]);
    expect(result.snapshot.supplied).toEqual([]);
  });
  it("rejects chain and account mismatches before snapshot views", async () => {
    const remote = rpc({ chain: "mainnet" });
    await expect(
      createPositionLoader(config, remote.fetchImpl, true)(accountId, signal()),
    ).rejects.toMatchObject({ code: "network_mismatch" });
    expect(remote.calls).toEqual([]);
    await expect(
      createPositionLoader(config, remote.fetchImpl, true)("alice.near", signal()),
    ).rejects.toMatchObject({ code: "network_mismatch" });
    expect(remote.calls).toEqual([]);
  });
  it("preserves chat's optional-version semantics", async () => {
    const { fetchImpl, calls } = rpc({ get_version: "9.0.0" });
    expect(
      (await createPositionLoader(config, fetchImpl, false)(accountId, signal())).snapshot
        .accountId,
    ).toBe(accountId);
    expect(calls.some((c) => c.method === "get_version")).toBe(false);
  });
  it("classifies transport failure without falling back to a recording", async () => {
    const fetchImpl: typeof fetch = async () => {
      throw new Error("SENTINEL_SECRET");
    };
    await expect(
      createPositionLoader(config, fetchImpl, true)(accountId, signal()),
    ).rejects.toMatchObject({ code: "rpc_unavailable" });
  });
});
