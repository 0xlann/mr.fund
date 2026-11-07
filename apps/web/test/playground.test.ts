// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { atomic, draft, metrics, snapshot } from "../src/play/demo";
import { Playground } from "../src/play/Playground";

type SceneProps = {
  visit: { id: number; panel: "guardian" | "chat" } | null;
  onVisitReady: (id: number) => void;
  onStateChange: (state: "loading" | "ready" | "fallback") => void;
  onInteract: (panel: "chat" | "guardian" | "activity" | "position") => void;
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
});
const advance = async (ms = 1200) => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
};
function click(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
  if (name === "Chat" && scene.current?.visit?.panel === "chat")
    act(() => scene.current?.onVisitReady(scene.current.visit?.id ?? -1));
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
    click("Chat");
    click("Find my smartest move");
    await advance();
    click("Execute now");
    fireEvent.change(screen.getByLabelText("Demo transaction outcome"), {
      target: { value: "cancel" },
    });
    click("Approve demo action");
    await advance();
    click("Position");
    expect(screen.getByText("$1,800.00")).toBeTruthy();
    click("Chat");
    click("Execute now");
    click("Approve demo action");
    await advance();
    click("Position");
    expect(screen.getByText("$1,700.00")).toBeTruthy();
    expect(screen.getAllByText("167.64%").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /Activity/ }));
    expect(screen.getByText("Repaid 100.00 USDC")).toBeTruthy();
  });
  it("waits for the Guardian scene gesture and discards a cancelled completion", () => {
    render(createElement(Playground));
    click("Guardian");
    const cancelled = scene.current?.visit?.id;
    expect(cancelled).toBeTypeOf("number");
    expect(screen.queryByRole("button", { name: "Meet your Guardian" })).toBeNull();
    expect(screen.getByText("Opening Guardian…")).toBeTruthy();
    click("Guardian");
    expect(scene.current?.visit?.id).toBe(cancelled);
    click("Chat");
    act(() => scene.current?.onVisitReady(cancelled ?? -1));
    expect(screen.queryByRole("button", { name: "Meet your Guardian" })).toBeNull();
    click("Guardian");
    const current = scene.current?.visit?.id;
    expect(current).not.toBe(cancelled);
    act(() => scene.current?.onVisitReady(current ?? -1));
    expect(screen.getByRole("button", { name: "Meet your Guardian" })).toBeTruthy();
    expect(screen.queryByText("Opening Guardian…")).toBeNull();
  });
  it("cancels with Escape and opens Guardian if WebGL fails during the approach", () => {
    render(createElement(Playground));
    click("Guardian");
    fireEvent.keyDown(window, { key: "Escape" });
    expect(scene.current?.visit).toBeNull();
    expect(screen.queryByText("Opening Guardian…")).toBeNull();
    click("Guardian");
    act(() => scene.current?.onStateChange("fallback"));
    expect(screen.getByRole("button", { name: "Meet your Guardian" })).toBeTruthy();
  });
  it("keeps Chat closed until the chair gesture finishes and cancels an old seated request", () => {
    render(createElement(Playground));
    fireEvent.click(screen.getByRole("button", { name: "Chat" }));
    const old = scene.current?.visit?.id;
    expect(screen.queryByRole("textbox", { name: "Message Mr.Fund" })).toBeNull();
    expect(screen.getByText("Taking a seat…")).toBeTruthy();
    click("Position");
    act(() => scene.current?.onVisitReady(old ?? -1));
    expect(screen.queryByRole("textbox", { name: "Message Mr.Fund" })).toBeNull();
    act(() => scene.current?.onInteract("chat"));
    const current = scene.current?.visit?.id;
    expect(scene.current?.visit?.panel).toBe("chat");
    act(() => scene.current?.onVisitReady(current ?? -1));
    expect(screen.getByRole("textbox", { name: "Message Mr.Fund" })).toBeTruthy();
    expect(screen.queryByText("Taking a seat…")).toBeNull();
  });
  it("validates Guardian rules and preserves reserve on an over-limit rejection", async () => {
    render(createElement(Playground));
    connect();
    click("Guardian");
    act(() => scene.current?.onVisitReady(scene.current.visit?.id ?? -1));
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
    click("Chat");
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
  it("starts with the room visible and opens and closes tools as overlays", () => {
    render(createElement(Playground));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("textbox", { name: "Message Mr.Fund" })).toBeNull();
    click("Chat");
    expect(screen.getByRole("dialog", { name: "Let's talk money." })).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Message Mr.Fund" })).toBeTruthy();
    click("Close overlay");
    expect(screen.queryByRole("dialog")).toBeNull();
    click("Position");
    expect(screen.getByRole("dialog", { name: "Here's where you stand." })).toBeTruthy();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });
  it("offers explicit voice input and reviews a labelled sample before sending", async () => {
    render(createElement(Playground));
    click("Voice");
    click("Start voice input");
    expect(screen.getByRole("alert").textContent).toContain("isn't available");
    click("Try a demo transcript");
    expect(
      (screen.getByLabelText("SAMPLE TRANSCRIPT · SIMULATED") as HTMLTextAreaElement).value,
    ).toBe("What if NEAR drops 20%?");
    click("Send my question");
    act(() => scene.current?.onVisitReady(scene.current.visit?.id ?? -1));
    await advance();
    expect(screen.getByRole("dialog", { name: "Let's talk money." })).toBeTruthy();
    expect(screen.getByText("SIMULATED WHAT-IF")).toBeTruthy();
  });
});
