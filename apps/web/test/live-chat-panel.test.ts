// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { chatBubbleClass } from "../src/play/chatAppearance";
import { LiveChatPanel } from "../src/play/LivePanels";
import { isSlow } from "../src/play/live/liveSlow";
import type { LivePositionState } from "../src/play/source/livePosition";

afterEach(cleanup);

type Message = { id: number; role: "user" | "assistant"; content: string };
function fakeLive(over: Record<string, unknown> = {}) {
  return {
    state: { status: "empty" } as LivePositionState,
    messages: [] as Message[],
    input: "",
    setInput: vi.fn(),
    partial: "",
    card: null,
    error: "",
    busy: false,
    progress: "",
    send: vi.fn(async () => {}),
    clear: vi.fn(),
    refresh: vi.fn(),
    ...over,
  };
}
function panel(live: ReturnType<typeof fakeLive>) {
  HTMLElement.prototype.scrollTo = vi.fn();
  return render(
    createElement(LiveChatPanel, {
      live: live as never,
      repay: { store: null, view: { phase: "idle" } } as never,
      phone: false,
      setComposerFocused: () => {},
      setKeyboardHeight: () => {},
      openPanel: () => {},
    }),
  );
}

describe("isSlow", () => {
  it("is false when the hook has no slow field yet", () => {
    expect(isSlow({ busy: true })).toBe(false);
  });
  it("follows the slow field once it exists", () => {
    expect(isSlow({ slow: true })).toBe(true);
    expect(isSlow({ slow: false })).toBe(false);
    expect(isSlow({ slow: "yes" })).toBe(false);
  });
});

describe("live chat looks like the demo chat", () => {
  it("opens with a Mr.Fund bubble and avatar instead of a bare prompt line", () => {
    const { container } = panel(fakeLive());
    expect(screen.queryByText("Ask about your Rhea position.")).toBeNull();
    expect(screen.getByText(/I don't see a Rhea lending position/)).toBeTruthy();
    const row = container.querySelector(".chat-message");
    expect(row?.textContent).toContain("m.");
    expect(row?.querySelector("[aria-hidden='true']")?.textContent).toBe("m.");
  });

  it("uses the demo bubble classes for both roles", () => {
    const { container } = panel(
      fakeLive({
        messages: [
          { id: 1, role: "user", content: "Explain my position" },
          { id: 2, role: "assistant", content: "Fine." },
        ],
      }),
    );
    const bubbles = Array.from(container.querySelectorAll(".chat-message > div:last-child"));
    expect(bubbles.map((b) => b.className)).toEqual([
      chatBubbleClass("assistant"),
      chatBubbleClass("user"),
      chatBubbleClass("assistant"),
    ]);
  });

  it("renders bold and bullets from an assistant reply without asterisks", () => {
    const { container } = panel(
      fakeLive({
        messages: [
          { id: 1, role: "user", content: "Explain" },
          { id: 2, role: "assistant", content: "**Debt:** none\n\n- one\n- two\n- three" },
        ],
      }),
    );
    expect(container.querySelector("strong")?.textContent).toBe("Debt:");
    expect(container.querySelectorAll("ul > li")).toHaveLength(3);
    expect(container.textContent).not.toContain("**");
  });

  it("shows a user message literally, including markup characters", () => {
    const { container } = panel(
      fakeLive({ messages: [{ id: 1, role: "user", content: "**hi** <b>x</b>" }] }),
    );
    expect(container.querySelector("b, strong")).toBeNull();
    expect(screen.getByText("**hi** <b>x</b>")).toBeTruthy();
  });

  it("shows the stage text while thinking and a still-thinking message when slow", () => {
    const first = panel(fakeLive({ busy: true, progress: "Reading your position…" }));
    expect(within(first.container).getByRole("status").textContent).toContain(
      "Reading your position…",
    );
    cleanup();
    panel(fakeLive({ busy: true, progress: "Reading your position…", slow: true }));
    expect(screen.getByRole("status").textContent).toContain("Still thinking…");
    expect(screen.getByRole("status").textContent).not.toContain("Reading your position…");
  });

  it("keeps the composer usable while a turn runs so a new message can replace it", () => {
    panel(fakeLive({ busy: true, slow: true, input: "next question" }));
    const box = screen.getByRole("textbox", { name: "Message Mr.Fund" }) as HTMLTextAreaElement;
    expect(box.disabled).toBe(false);
  });

  it("shows an error with Retry that sends the restored text", () => {
    const live = fakeLive({
      error: "The assistant is unavailable. Please try again.",
      input: "Explain",
    });
    panel(live);
    expect(screen.getByRole("alert").textContent).toContain("The assistant is unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(live.send).toHaveBeenCalledWith("Explain");
  });

  it("offers no Retry when there is no text to resend", () => {
    panel(fakeLive({ error: "The assistant is unavailable. Please try again.", input: "" }));
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });
});
