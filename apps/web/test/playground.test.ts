// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { atomic, draft, metrics, snapshot } from "../src/play/demo";
import { Playground } from "../src/play/Playground";

vi.mock("next/dynamic", () => ({ default: () => () => null }));

beforeEach(() => {
  vi.useFakeTimers();
  HTMLElement.prototype.scrollTo = vi.fn();
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
const advance = async (ms = 1200) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};
function click(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}
function connect() {
  click("Connect wallet");
  click("Demo wallet1,000 test USDC · instant connection");
}

// These tests exercise local state, not wallet signing or on-chain enforcement.
describe("/play demo", () => {
  it("uses the finance engine, rejects invalid input, and refuses stale recommendations", () => {
    const now = Date.now();
    expect(metrics(snapshot(1_800_000_000n, now), now).health).toBe(15833);
    expect(atomic("1.000001")).toBe(1_000_001n);
    expect(atomic("-1")).toBeNull();
    expect(atomic("1e4")).toBeNull();
    const stale = draft(snapshot(1_800_000_000n, now, "stale"), "100", 1_000_000_000n, now);
    expect(stale?.ok).toBe(false);
  });
  it("keeps balances on wallet rejection and updates the engine result after approval", async () => {
    render(createElement(Playground));
    connect();
    click("Find my smartest move");
    await advance();
    click("Execute now");
    fireEvent.change(screen.getByLabelText("Demo transaction outcome"), {
      target: { value: "cancel" },
    });
    click("Approve demo action");
    await advance();
    expect(screen.getByText("$1,800.00")).toBeTruthy();
    click("Execute now");
    click("Approve demo action");
    await advance();
    expect(screen.getByText("$1,700.00")).toBeTruthy();
    expect(screen.getByText("167.64%")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Activity/ }));
    expect(screen.getByText("Repaid 100.00 USDC")).toBeTruthy();
  });
  it("validates Guardian rules and preserves reserve on an over-limit rejection", async () => {
    render(createElement(Playground));
    connect();
    click("Meet your Guardian");
    const trigger = screen.getByLabelText(/Trigger below health/);
    fireEvent.change(trigger, { target: { value: "100" } });
    expect(
      (screen.getByRole("button", { name: "Review my rules" }) as HTMLButtonElement).disabled,
    ).toBe(true);
    fireEvent.change(trigger, { target: { value: "120" } });
    click("Review my rules");
    click("Approve in mock wallet");
    const approval = screen.getByRole("button", { name: "Approve demo action" });
    fireEvent.click(approval);
    await advance();
    click("Guardian");
    click("Test over-limit rejection");
    expect(screen.getByText(/Reserve 500.00 USDC/)).toBeTruthy();
    click("Run simulated trigger");
    expect(screen.getByText(/Reserve 400.00 USDC/)).toBeTruthy();
    click("Pause");
    click("Approve demo action");
    await advance();
    expect(screen.getByRole("button", { name: "Resume" })).toBeTruthy();
    click("Deactivate Guardian");
    click("Approve demo action");
    await advance();
    expect(screen.queryByRole("button", { name: "Resume" })).toBeNull();
    click("Withdraw");
    click("Approve demo action");
    await advance();
    expect(screen.getByText(/Reserve 0.00 USDC/)).toBeTruthy();
  });
  it("blocks stale cards and recovers the position with Refresh", async () => {
    render(createElement(Playground));
    click("Find my smartest move");
    await advance();
    click("Demo settings");
    fireEvent.change(screen.getByLabelText("Position data state"), { target: { value: "stale" } });
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Close dialog" }));
    expect(screen.queryByRole("button", { name: "Execute now" })).toBeNull();
    click("Refresh position");
    await advance();
    expect(screen.getByRole("button", { name: "Execute now" })).toBeTruthy();
  });
});
