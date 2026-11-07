import type { Object3D } from "three";

type Panel = "chat" | "position" | "activity" | "guardian";
type RoomHit = { root: Object3D; action: Panel | "wave" };

export function pickRoomTarget(
  hits: readonly { object: Object3D }[],
  roots: Record<Panel, Object3D>,
  character?: Object3D,
): RoomHit | null {
  for (const hit of hits) {
    let object: Object3D | null = hit.object;
    let target: RoomHit | null = null;
    let passthrough = false;
    while (object) {
      if (object.userData.pointerPassthrough) passthrough = true;
      if (character && object === character) target = { root: character, action: "wave" };
      const panel = object.userData.panel as Panel | undefined;
      if (panel && Object.hasOwn(roots, panel)) target = { root: roots[panel], action: panel };
      object = object.parent;
    }
    if (passthrough) continue;
    return target;
  }
  return null;
}
