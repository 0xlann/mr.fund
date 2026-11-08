// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConversationPreview } from "../src/landing/ConversationPreview";
import { conversation } from "../src/landing/conversation";
import { landingFigures } from "../src/landing/figures";
import { LandingMotion, MotionToggle } from "../src/landing/LandingMotion";
import { PhonePreview } from "../src/landing/PhonePreview";

const fixture = vi.hoisted(() => ({
  mount: vi.fn(),
  dispose: vi.fn(),
  standing: false,
  active: false,
}));
vi.mock("../src/landing/motionScene", () => ({
  mountLandingMotion: (...args: unknown[]) => {
    fixture.mount(...args);
    return fixture.dispose;
  },
}));
vi.mock("next/dynamic", () => ({
  default: () => (props: { standing?: boolean; active: boolean }) => {
    fixture.standing = props.standing ?? false;
    fixture.active = props.active;
    return createElement("div", { "data-testid": "live-character" });
  },
}));
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
async function advance(time: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(time);
  });
}

describe("landing motion controls", () => {
  it("reveals replies progressively and preserves progress across a pause", async () => {
    const f = landingFigures();
    render(createElement(ConversationPreview, { figures: f }));
    await advance(500);
    const answer = screen.getByTestId("hero-answer");
    const partial = answer.textContent ?? "";
    expect(partial.length).toBeGreaterThan(5);
    expect(partial.length).toBeLessThan(conversation(f)[0].answer.length);
    fireEvent.click(screen.getByRole("button", { name: "Pause conversation demo" }));
    await advance(1500);
    expect(answer.textContent).toBe(partial);
    fireEvent.click(screen.getByRole("button", { name: "Resume conversation demo" }));
    await advance(400);
    expect(answer.textContent?.startsWith(partial)).toBe(true);
    expect(answer.textContent?.length).toBeGreaterThan(partial.length);
  });
  it("keeps a standing 3D character in the phone with chat only", async () => {
    render(createElement(PhonePreview, { figures: landingFigures() }));
    expect(screen.getByTestId("live-character")).toBeTruthy();
    expect(fixture.standing).toBe(true);
    expect(fixture.active).toBe(true);
    expect(screen.queryByRole("navigation", { name: "Office actions" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Position" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Pause mobile chat preview" }));
    expect(fixture.active).toBe(false);
  });
  it("releases scroll animation resources when paused or unmounted", () => {
    const view = render(createElement(LandingMotion, null, createElement(MotionToggle)));
    expect(fixture.mount).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Pause page animations" }));
    expect(fixture.dispose).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Resume page animations" }));
    expect(fixture.mount).toHaveBeenCalledTimes(2);
    view.unmount();
    expect(fixture.dispose).toHaveBeenCalledTimes(2);
  });
  it("shows a complete static answer and avoids scroll effects with reduced motion", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
    const f = landingFigures();
    render(
      createElement(
        LandingMotion,
        null,
        createElement(MotionToggle),
        createElement(ConversationPreview, { figures: f }),
      ),
    );
    expect(fixture.mount).not.toHaveBeenCalled();
    expect(screen.getByTestId("hero-answer").textContent).toBe(conversation(f)[0].answer);
    expect(
      screen.getByRole("button", { name: "Reduced motion is enabled" }).hasAttribute("disabled"),
    ).toBe(true);
  });
});
