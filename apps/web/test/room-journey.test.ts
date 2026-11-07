import { describe, expect, it } from "vitest";
import { createRoomJourney } from "../src/play/roomJourney";

const createGuardianJourney = () => {
  const journey = createRoomJourney();
  return {
    frame: journey.frame,
    update: (delta: number, id: number | null, reduced: boolean) =>
      journey.update(delta, id === null ? null : { id, panel: "guardian" }, reduced),
  };
};

describe("Guardian approach choreography", () => {
  it("finishes only after walking, reaching and opening; repeated requests finish once", () => {
    const journey = createGuardianJourney();
    let walking = false,
      reaching = false,
      opening = false;
    const completions: number[] = [];
    for (let i = 0; i < 160; i++) {
      const done = journey.update(0.05, 7, false);
      const f = journey.frame;
      walking ||= f.walk > 0;
      reaching ||= f.reach > 0.8;
      opening ||= f.door > 0 && f.door < 1;
      if (f.phase !== "ready") expect(done).toBeNull();
      if (done !== null) {
        expect(walking && reaching && opening).toBe(true);
        expect(f.door).toBe(1);
        completions.push(done);
      }
    }
    expect(completions).toEqual([7]);
    expect(journey.frame.phase).toBe("ready");
  });
  it("cancels an approach, returns home and ignores completion of the cancelled request", () => {
    const journey = createGuardianJourney();
    for (let i = 0; i < 25; i++) journey.update(0.05, 1, false);
    expect(journey.frame.x).toBeLessThan(-1);
    for (let i = 0; i < 100; i++) expect(journey.update(0.05, null, false)).toBeNull();
    expect(journey.frame.phase).toBe("idle");
    expect(journey.frame.x).toBeCloseTo(0);
    expect(journey.frame.z).toBeCloseTo(1.6);
    expect(journey.frame.door).toBe(0);
    let completions = 0;
    for (let i = 0; i < 100; i++) if (journey.update(0.05, 2, false) === 2) completions++;
    expect(completions).toBe(1);
  });
  it("skips choreography immediately for reduced motion, including a mid-walk change", () => {
    const journey = createGuardianJourney();
    journey.update(0.3, 1, false);
    expect(journey.update(0, 1, true)).toBe(1);
    expect(journey.frame.phase).toBe("ready");
    expect(journey.frame.walk).toBe(0);
    expect(journey.frame.reach).toBe(0);
    expect(journey.update(0, 1, true)).toBeNull();
    journey.update(0, null, true);
    expect(journey.frame.phase).toBe("idle");
    expect(journey.frame.x).toBe(0);
  });
});

describe("Chat seating choreography", () => {
  it("walks around the desk, faces forward and completes only after sitting", () => {
    const journey = createRoomJourney();
    let walked = false,
      seating = false;
    let completed = 0;
    for (let i = 0; i < 250; i++) {
      const done = journey.update(0.05, { id: 1, panel: "chat" }, false);
      const f = journey.frame;
      walked ||= f.walk > 0;
      seating ||= f.sit > 0 && f.sit < 1;
      expect(f.x > 1.1 && f.z > -1.9 && f.z < -0.1).toBe(false);
      if (done !== null) {
        expect(walked && seating).toBe(true);
        expect(f.sit).toBe(1);
        expect(f.yaw).toBeCloseTo(0.04);
        expect(f.x).toBeCloseTo(3.45);
        completed++;
      }
    }
    expect(completed).toBe(1);
  });
  it("stands before leaving the chair for Guardian and never completes a cancelled chat visit", () => {
    const journey = createRoomJourney();
    journey.update(0, { id: 1, panel: "chat" }, true);
    const startX = journey.frame.x;
    for (let i = 0; i < 10; i++) {
      expect(journey.update(0.05, { id: 2, panel: "guardian" }, false)).toBeNull();
      expect(journey.frame.x).toBe(startX);
      expect(journey.frame.phase).toBe("standing");
    }
    expect(journey.frame.sit).toBeLessThan(1);
    let completed = 0;
    for (let i = 0; i < 250; i++) {
      if (journey.update(0.05, { id: 2, panel: "guardian" }, false) === 2) completed++;
      const f = journey.frame;
      expect(f.x > 1.1 && f.z > -1.9 && f.z < -0.1).toBe(false);
    }
    expect(completed).toBe(1);
    expect(journey.frame.sit).toBe(0);
  });
  it("uses the seated pose immediately with reduced motion and restores home on close", () => {
    const journey = createRoomJourney();
    expect(journey.update(0, { id: 1, panel: "chat" }, true)).toBe(1);
    expect(journey.frame.sit).toBe(1);
    journey.update(0, null, true);
    expect(journey.frame.sit).toBe(0);
    expect(journey.frame.x).toBe(0);
  });
});
