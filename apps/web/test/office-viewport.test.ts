import { describe, expect, it } from "vitest";
import { hudReserve, officeFraming } from "../src/play/officeViewport";

describe("responsive office framing", () => {
  it.each([
    [1024, 768, false],
    [1180, 820, false],
    [1280, 800, true],
    [1920, 1080, true],
  ])("fits the seated actor beside the HUD columns at %i × %i", (width, height, column) => {
    const hud = { panelOpen: true, positionColumn: column, stacked: false };
    const reserve = hudReserve(width, height, hud);
    const stageFraction = (width - reserve.side) / width;
    for (const [station, span, viewHeight] of [
      ["office", 3.2, 6.5],
      ["chat", 2.2, 3.2],
    ] as const) {
      const frame = officeFraming(width, height, reserve, station, viewHeight);
      expect(((viewHeight * frame.pull * width) / height) * stageFraction).toBeGreaterThanOrEqual(
        span - 0.001,
      );
      expect(0.5 - frame.shift).toBeCloseTo(stageFraction / 2);
      expect(frame.shiftY).toBe(0);
    }
  });
  it("reserves enlarged desktop panels while preserving room for the actor", () => {
    const laptop = hudReserve(1280, 800, { panelOpen: true, positionColumn: true, stacked: false });
    expect(laptop.side).toBe(440 + 380 + 56);
    expect(1280 - laptop.side).toBeGreaterThanOrEqual(400);
    const desktop = hudReserve(1920, 1080, {
      panelOpen: true,
      positionColumn: true,
      stacked: false,
    });
    expect(desktop.side).toBeCloseTo(614.4 + 500 + 56);
    expect(1920 - desktop.side).toBeGreaterThan(700);
  });
  it.each([
    [360, 640],
    [390, 844],
    [768, 1024],
  ])("lifts the actor above the bottom sheet in portrait at %i × %i", (width, height) => {
    const reserve = hudReserve(width, height, {
      panelOpen: true,
      positionColumn: false,
      stacked: true,
    });
    expect(reserve.side).toBe(0);
    expect(reserve.bottom).toBeGreaterThan(height / 2);
    const viewHeight = 3.2;
    const frame = officeFraming(width, height, reserve, "chat", viewHeight);
    const stageFraction = (height - reserve.bottom) / height;
    expect(viewHeight * frame.pull * stageFraction).toBeGreaterThanOrEqual(2.2 - 0.001);
    expect(0.5 - frame.shiftY).toBeCloseTo(stageFraction / 2);
    expect(frame.shift).toBe(0);
  });
  it("uses the centre of the viewport when no tool is open on a wide screen", () => {
    const reserve = hudReserve(1280, 800, {
      panelOpen: false,
      positionColumn: false,
      stacked: false,
    });
    expect(officeFraming(1280, 800, reserve, "office", 6.5).shift).toBe(0);
  });
});
