// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readGuardianConfig } from "../src/guardian/config";
import { LiveGuardianPanel } from "../src/play/LiveGuardianPanel";
import type { LiveAccountView } from "../src/play/source/liveSession";
import { createdViews, factory, views } from "./guardian-fixture";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const CONFIG = readGuardianConfig({
  network: "testnet",
  rpcUrl: "https://rpc.testnet.example",
  factoryId: factory.factoryId,
  actionFee: "1",
});
const auth: LiveAccountView = {
  method: "near-auth",
  network: "testnet",
  accountId: "alice.testnet",
  accounts: ["alice.testnet"],
};

/** A JSON-RPC fake over factory, Guardian and token views. */
function rpc(chain: {
  guardian: string | null;
  data?: ReturnType<typeof views>;
  registered?: string[];
}) {
  const data = chain.data ?? views();
  const answer: Record<string, Record<string, unknown>> = {
    [factory.factoryId]: {
      get_template: {
        debt_token_id: factory.debtTokenId,
        collateral_token_id: factory.collateralTokenId,
        lending_id: factory.lendingId,
        fee_recipient_id: factory.feeRecipientId,
        activation_fee: "1000000",
      },
      get_limits: {
        min_funding: factory.minFunding.toString(),
        max_funding: factory.maxFunding.toString(),
      },
      get_guardian: chain.guardian,
      is_pending: false,
      get_unclaimed: "0",
      get_next_guardian_id: "guardian.testnet",
    },
    "guardian.testnet": data as Record<string, unknown>,
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: RequestInit) => {
      const { account_id: id, method_name: method } = JSON.parse(String(init.body)).params;
      let value: unknown = answer[id]?.[method];
      if (method === "ft_metadata") value = { symbol: "USDC", decimals: 6 };
      if (method === "storage_balance_bounds") value = { min: "1250000000000000000000" };
      if (method === "storage_balance_of") value = chain.registered?.includes(id) ? {} : null;
      const bytes = [...new TextEncoder().encode(JSON.stringify(value ?? null))];
      return Response.json({ result: { block_height: 1, block_hash: "block", result: bytes } });
    }),
  );
}

const panel = (account: LiveAccountView = auth, config = CONFIG) =>
  render(createElement(LiveGuardianPanel, { account, config }));
const BANNED = ["never get liquidated", "guaranteed yield", "risk-free", "free borrowing"];
function honest(text: string) {
  const lower = text.toLowerCase();
  for (const b of BANNED) expect(lower).not.toContain(b);
  expect(lower).not.toMatch(/\bsafe\b/);
  // No loan-building control until the lead decides (task 5.1).
  expect(lower).not.toMatch(/\b(borrow|sweep|deposit collateral)\b/);
}

describe("live Guardian panel", () => {
  it("states missing configuration instead of defaulting", () => {
    panel(
      auth,
      readGuardianConfig({ network: "testnet", rpcUrl: "https://rpc.example", actionFee: "1" }),
    );
    expect(screen.getByText(/NEXT_PUBLIC_GUARDIAN_FACTORY_ID/)).toBeTruthy();
  });

  it("Auth session: the form is usable, review is exact, signing is disabled with the reason", async () => {
    rpc({ guardian: null });
    const { container } = panel();
    await screen.findByText(/Step 1 of 3/);
    const input = (label: RegExp) => screen.getByLabelText(label) as HTMLInputElement;
    fireEvent.change(input(/Max per action/), { target: { value: "100" } });
    fireEvent.change(input(/Reserve floor/), { target: { value: "20" } });
    fireEvent.change(input(/Reserve deposit/), { target: { value: "500" } });
    fireEvent.change(input(/Act below health/), { target: { value: "104.99" } });
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    expect(screen.getByText("Trigger must be at least 105%.")).toBeTruthy();
    fireEvent.change(input(/Act below health/), { target: { value: "105" } });
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    expect(screen.getByText(/You send 501 USDC: 500 USDC to the reserve/)).toBeTruthy();
    expect(screen.getByText(/2.75325 NEAR/)).toBeTruthy();
    const create = screen.getByRole("button", { name: "Create Guardian in wallet" });
    expect((create as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/NEAR Auth accounts can view the Guardian/)).toBeTruthy();
    honest(container.textContent ?? "");
  });

  it("resumes at registration after a reload", async () => {
    const data = views();
    createdViews(data);
    rpc({ guardian: "guardian.testnet", data, registered: [factory.lendingId] });
    panel();
    await screen.findByText(/Step 2 of 3/);
    expect(screen.getByText(/register it with the debt token/)).toBeTruthy();
  });

  it("deactivated: automation controls off, withdraw on, NEAR not recoverable", async () => {
    const data = views();
    data.get_status.status = "deactivated";
    // The shared fixture's history lies after the real clock; a read would refuse it.
    (data.get_history as unknown[]) = [];
    rpc({ guardian: "guardian.testnet", data });
    const { container } = panel({ ...auth, method: "near-connect" });
    await screen.findByText(/Guardian deactivated/);
    const disabled = (name: string) =>
      (screen.getByRole("button", { name }) as HTMLButtonElement).disabled;
    // No Connect signing surface is registered in this test, so everything is view-only;
    // availability is visible through the reasons instead.
    expect(disabled("Pause") && disabled("Resume") && disabled("Deactivate")).toBe(true);
    expect(screen.getByRole("button", { name: "Pause" }).title).toMatch(/Only an active/);
    expect(screen.getByRole("button", { name: "Withdraw reserve" }).title).toBe("");
    expect(screen.getByText(/NEAR cannot be withdrawn/)).toBeTruthy();
    expect(screen.getByText("Heartbeat unavailable")).toBeTruthy();
    honest(container.textContent ?? "");
  });

  it("an in-flight lock shows an unknown outcome and blocks withdraw with the reason", async () => {
    const data = views();
    (data.get_status as Record<string, unknown>).in_flight = {
      op_id: "3",
      amount: "50",
      fee: "1",
      started_ns: String(BigInt(Date.now() - 5000) * 1_000_000n),
      repay_phase: "unresolved",
    };
    (data.get_history as unknown[]) = [];
    rpc({ guardian: "guardian.testnet", data });
    panel();
    await screen.findByText(/outcome is unknown/);
    expect(screen.getByText(/Withdraw: An operation is in flight/)).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByText(/Showing the attempts the contract still retains/)).toBeTruthy(),
    );
  });
});

describe("readGuardianConfig", () => {
  const good = {
    network: "testnet",
    rpcUrl: "https://rpc.testnet.example",
    factoryId: "factory.testnet",
    actionFee: "0",
  };
  it("accepts a zero action fee as an explicit value", () => {
    expect(readGuardianConfig(good)).toMatchObject({ ok: true, value: { actionFee: 0n } });
  });
  it.each([
    [{ ...good, actionFee: "" }, /ACTION_FEE/],
    [{ ...good, actionFee: "1.5" }, /ACTION_FEE/],
    [{ ...good, factoryId: "factory.near" }, /not a testnet account/],
    [{ ...good, rpcUrl: "http://rpc.example" }, /HTTPS/],
    [{ ...good, network: "devnet" }, /NEAR_NETWORK_ID/],
  ])("blocks %j", (input, reason) => {
    const r = readGuardianConfig(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(reason);
  });
});
