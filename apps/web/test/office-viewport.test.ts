import { describe, expect, it } from "vitest";
import { officeFraming } from "../src/play/officeViewport";

describe("responsive office framing", () => {
  it.each([
    [768, 1024],
    [820, 1180],
    [1024, 768],
    [1180, 820],
    [844, 390],
    [568, 320],
  ])("fits the station alongside its tool panel at %i × %i", (width, height) => {
    const reserved = Math.min(460, width * 0.44) + 40;
    const stageFraction = (width - reserved) / width;
    for (const [station, span, viewHeight] of [
      ["office", 3.2, 6.5],
      ["chat", 2.2, 3.2],
      ["guardian", 4.6, 4.7],
    ] as const) {
      const frame = officeFraming(width, height, true, station, viewHeight);
      expect(((viewHeight * frame.pull * width) / height) * stageFraction).toBeGreaterThanOrEqual(
        span - 0.001,
      );
      const actorScreenCenter = 0.5 - frame.shift;
      expect(actorScreenCenter).toBeCloseTo(stageFraction / 2);
      expect(frame.pull).toBeGreaterThanOrEqual(1);
    }
  });
  it("uses the centre of the viewport when no tool is open", () => {
    expect(officeFraming(1280, 800, false, "office", 6.5).shift).toBe(0);
  });
});
