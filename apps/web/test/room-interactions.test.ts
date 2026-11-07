import { Group, Object3D } from "three";
import { describe, expect, it } from "vitest";
import { pickRoomTarget } from "../src/play/roomInteractions";

describe("room pointer targets", () => {
  function room() {
    const roots = {
      position: new Group(),
      activity: new Group(),
      guardian: new Group(),
      chat: new Group(),
    };
    roots.position.userData.panel = "position";
    roots.activity.userData.panel = "activity";
    return roots;
  }
  it("lets pointer-transparent floating decorations pass through to Position and Activity", () => {
    const roots = room();
    const ring = new Object3D();
    ring.userData.pointerPassthrough = true;
    for (const panel of ["position", "activity"] as const) {
      const surface = new Object3D();
      roots[panel].add(surface);
      expect(pickRoomTarget([{ object: ring }, { object: surface }], roots)?.action).toBe(panel);
      expect(pickRoomTarget([{ object: surface }], roots)?.root).toBe(roots[panel]);
    }
  });
  it("keeps real walls and furniture opaque to pointer picking", () => {
    const roots = room();
    const wall = new Object3D();
    const surface = new Object3D();
    roots.activity.add(surface);
    expect(pickRoomTarget([{ object: wall }, { object: surface }], roots)).toBeNull();
  });
  it("resolves all nested prop surfaces and the animated character to their full root", () => {
    const roots = room();
    const chartBar = new Object3D();
    const inner = new Group();
    inner.add(chartBar);
    roots.position.add(inner);
    expect(pickRoomTarget([{ object: chartBar }], roots)?.root).toBe(roots.position);
    const character = new Group();
    const face = new Object3D();
    character.add(face);
    expect(pickRoomTarget([{ object: face }], roots, character)).toEqual({
      root: character,
      action: "wave",
    });
  });
});
