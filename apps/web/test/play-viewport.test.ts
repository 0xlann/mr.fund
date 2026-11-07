// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement, useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PHONE_PORTRAIT_QUERY, PlayViewport } from "../src/play/PlayViewport";

vi.mock("next/dynamic", () => ({
  default: () => () => {
    const [count, setCount] = useState(0);
    return createElement(
      "button",
      { type: "button", onClick: () => setCount(count + 1) },
      `Demo session ${count}`,
    );
  },
}));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
function orientation(portrait: boolean) {
  const listeners = new Set<() => void>();
  const query = {
    matches: portrait,
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
  };
  const matchMedia = vi.fn(() => query);
  vi.stubGlobal("matchMedia", matchMedia);
  return {
    matchMedia,
    rotate: (blocked: boolean) =>
      act(() => {
        query.matches = blocked;
        for (const notify of listeners) notify();
      }),
    listeners,
  };
}
describe("mobile orientation gate", () => {
  it("does not mount the playground on phone portrait, enters on landscape, and preserves the session on rotation", () => {
    const media = orientation(true);
    render(createElement(PlayViewport));
    expect(media.matchMedia).toHaveBeenCalledWith(PHONE_PORTRAIT_QUERY);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Demo session 0" })).toBeNull();
    media.rotate(false);
    fireEvent.click(screen.getByRole("button", { name: "Demo session 0" }));
    media.rotate(true);
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Demo session 1" })).toBeNull();
    media.rotate(false);
    expect(screen.getByRole("button", { name: "Demo session 1" })).toBeTruthy();
    cleanup();
    expect(media.listeners.size).toBe(0);
  });
  it("opens immediately when the phone-portrait media query does not match", () => {
    orientation(false);
    render(createElement(PlayViewport));
    expect(screen.getByRole("button", { name: "Demo session 0" })).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
