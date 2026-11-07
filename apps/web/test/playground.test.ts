// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { atomic, draft, metrics, snapshot } from "../src/play/demo";
import { Playground } from "../src/play/Playground";

type SceneProps = {
  station: "office" | "chat";
  speaking: boolean;
  hud: { panelOpen: boolean; positionColumn: boolean; stacked: boolean };
};
const scene = vi.hoisted(() => ({ current: null as SceneProps | null }));
vi.mock("next/dynamic", () => ({
  default: () => (props: SceneProps) => {
    scene.current = props;
    return null;
  },
}));

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
  vi.unstubAllGlobals();
});
const advance = async (ms = 1200) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};
function click(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}
const DEMO_WALLET = "Demo wallet1,000 test USDC · instant connection";
/** Welcome, then wallet, then the chair gesture: the whole flow into a consultation. */
async function begin() {
  click("Start consultation");
  click(DEMO_WALLET);
  await advance(800);
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
    await begin();
    click("Find my smartest move");
    await advance();
    click("Execute now");
    fireEvent.change(screen.getByLabelText("Demo transaction outcome"), {
      target: { value: "cancel" },
    });
    click("Approve demo action");
    await advance();
    click("Position");
    expect(screen.getAllByText("$1,800.00").length).toBeGreaterThan(1);
    click("Chat");
    click("Execute now");
    click("Approve demo action");
    await advance();
    click("Position");
    expect(screen.getAllByText("$1,700.00").length).toBeGreaterThan(1);
    expect(screen.getAllByText("167.64%").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /Activity/ }));
    expect(screen.getByText("Repaid 100.00 USDC")).toBeTruthy();
  });
  it("opens on a welcome screen and keeps the office tools behind Start consultation", () => {
    render(createElement(Playground));
    expect(screen.getByRole("heading", { name: "The DeFi manager you can talk to." })).toBeTruthy();
    expect(scene.current?.station).toBe("office");
    expect(screen.queryByRole("navigation", { name: "Office actions" })).toBeNull();
    expect(screen.queryByRole("textbox", { name: "Message Mr.Fund" })).toBeNull();
    click("Start consultation");
    const wallet = screen.getByRole("dialog", { name: "Connect to begin." });
    expect(within(wallet).getByText("NETWORK · TESTNET · SIMULATED")).toBeTruthy();
    expect(screen.queryByRole("navigation", { name: "Office actions" })).toBeNull();
  });
  it("starts a seated consultation after connecting and changes tools without a journey", async () => {
    render(createElement(Playground));
    click("Start consultation");
    click(DEMO_WALLET);
    expect(screen.getByText("Connecting to the simulated testnet…")).toBeTruthy();
    expect(scene.current?.station).toBe("office");
    await advance(800);
    expect(scene.current?.station).toBe("chat");
    expect(screen.getByRole("textbox", { name: "Message Mr.Fund" })).toBeTruthy();
    expect(screen.getByRole("region", { name: "Position stats" })).toBeTruthy();
    click("Guardian");
    expect(screen.getByRole("button", { name: "Meet your Guardian" })).toBeTruthy();
    click("Activity");
    click("Chat");
    expect(scene.current?.station).toBe("chat");
  });
  it("keeps the welcome screen after cancelling wallet connection", () => {
    render(createElement(Playground));
    click("Start consultation");
    click("Close dialog");
    expect(screen.getByRole("button", { name: "Start consultation" })).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "Message Mr.Fund" })).toBeNull();
  });
  it("keeps chat beside a persistent position column on desktop", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
    render(createElement(Playground));
    await begin();
    expect(screen.getByRole("textbox", { name: "Message Mr.Fund" })).toBeTruthy();
    expect(screen.getByRole("complementary", { name: "Consultation details" })).toBeTruthy();
    expect(scene.current?.hud).toEqual({ panelOpen: true, positionColumn: true, stacked: false });
    expect(screen.queryByRole("button", { name: "Position" })).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Office actions" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Close overlay" })).toBeNull();
    const guardian = screen.getByRole("tab", { name: "Guardian" });
    fireEvent.click(guardian);
    expect(guardian.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("button", { name: "Meet your Guardian" })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Message Mr.Fund" })).toBeTruthy();
    fireEvent.keyDown(guardian, { key: "ArrowRight" });
    expect(screen.getByRole("tab", { name: "Activity" }).getAttribute("aria-selected")).toBe(
      "true",
    );
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "Activity" }));
    fireEvent.keyDown(document.activeElement as Element, { key: "Home" });
    expect(screen.getByRole("tab", { name: "Position" }).getAttribute("aria-selected")).toBe(
      "true",
    );
    click("Open voice input");
    expect(screen.getByRole("dialog", { name: "Speak with Mr.Fund." })).toBeTruthy();
    click("Try a demo transcript");
    click("Send my question");
    expect(screen.queryByRole("dialog", { name: "Speak with Mr.Fund." })).toBeNull();
    await advance();
    expect(screen.getByText("SIMULATED WHAT-IF")).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Message Mr.Fund" })).toBeTruthy();
  });
  it("animates a reply then returns to listening without changing the financial state", async () => {
    render(createElement(Playground));
    await begin();
    click("Find my smartest move");
    await advance();
    expect(scene.current?.speaking).toBe(true);
    await advance(9000);
    expect(scene.current?.speaking).toBe(false);
    expect(screen.getAllByText("158.33%").length).toBeGreaterThan(0);
  });
  it("validates Guardian rules and preserves reserve on an over-limit rejection", async () => {
    render(createElement(Playground));
    await begin();
    click("Guardian");
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
    await begin();
    click("Find my smartest move");
    await advance();
    click("Demo settings");
    fireEvent.change(screen.getByLabelText("Position data state"), { target: { value: "stale" } });
    const dialog = screen.getByRole("dialog", { name: "Make the demo yours." });
    fireEvent.click(within(dialog).getByRole("button", { name: "Close dialog" }));
    expect(screen.queryByRole("button", { name: "Execute now" })).toBeNull();
    click("Refresh position");
    await advance();
    expect(screen.getByRole("button", { name: "Execute now" })).toBeTruthy();
  });
  it("opens and closes tools as overlays once the consultation has started", async () => {
    render(createElement(Playground));
    await begin();
    expect(screen.getByRole("dialog", { name: "Let's talk money." })).toBeTruthy();
    click("Close overlay");
    expect(screen.queryByRole("dialog")).toBeNull();
    click("Position");
    expect(screen.getByRole("dialog", { name: "Here's where you stand." })).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(scene.current?.station).toBe("chat");
  });
  it("offers explicit voice input and reviews a labelled sample before sending", async () => {
    render(createElement(Playground));
    await begin();
    click("Voice");
    click("Start voice input");
    expect(screen.getByRole("alert").textContent).toContain("isn't available");
    click("Try a demo transcript");
    expect(
      (screen.getByLabelText("SAMPLE TRANSCRIPT · SIMULATED") as HTMLTextAreaElement).value,
    ).toBe("What if NEAR drops 20%?");
    click("Send my question");
    await advance();
    expect(screen.getByRole("dialog", { name: "Let's talk money." })).toBeTruthy();
    expect(screen.getByText("SIMULATED WHAT-IF")).toBeTruthy();
  });
});
