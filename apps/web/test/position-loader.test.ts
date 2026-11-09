import { describe, expect, it } from "vitest";
import { createPositionLoader } from "../src/server/position/loader";
import { accountId, config, recording, rpc } from "./position-rpc";

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
