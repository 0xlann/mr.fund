const ease = (value: number) => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};
const HOME = { x: 0, z: 0.7 };
const VAULT = { x: -3.05, z: 0.35 };
const CHAIR = { x: 3.45, z: -2.15 };
type Point = { x: number; z: number };
export type RoomVisit = { id: number; panel: "guardian" | "chat" };
export type JourneyPhase =
  | "idle"
  | "walking"
  | "opening"
  | "seating"
  | "standing"
  | "ready"
  | "returning";

/** One actor, one scene timeline. Panels wait for the actual destination gesture to finish. */
export function createRoomJourney() {
  const frame = {
    x: HOME.x,
    z: HOME.z,
    yaw: 0.04,
    walk: 0,
    stride: 0,
    reach: 0,
    door: 0,
    sit: 0,
    phase: "idle" as JourneyPhase,
  };
  let request: RoomVisit | null = null;
  let completed: number | null = null;
  let age = 0,
    startYaw = frame.yaw,
    startSit = 0;
  let route: Point[] = [],
    lengths: number[] = [],
    distance = 0,
    duration = 1;
  function beginWalk() {
    age = 0;
    const target = request?.panel === "chat" ? CHAIR : request ? VAULT : HOME;
    route = [{ x: frame.x, z: frame.z }];
    // The executive desk spans x=1.2..6.0: use the left aisle rather than crossing its mesh.
    if (frame.x > 1.1 && frame.z < -0.1) route.push({ x: 0.55, z: -2.65 });
    if (request?.panel === "chat") {
      if (frame.z > -1.9) route.push({ x: 0.55, z: 0.45 }, { x: 0.55, z: -2.65 });
    }
    route.push(target);
    lengths = [];
    distance = 0;
    for (let i = 1; i < route.length; i++) {
      const a = route[i - 1],
        b = route[i];
      if (!a || !b) continue;
      const length = Math.hypot(b.x - a.x, b.z - a.z);
      lengths.push(length);
      distance += length;
    }
    duration = Math.max(0.3, distance / 2.2);
    frame.phase = request ? "walking" : "returning";
  }
  function turn(target: number, weight: number) {
    frame.yaw += Math.atan2(Math.sin(target - frame.yaw), Math.cos(target - frame.yaw)) * weight;
  }
  function finish() {
    frame.phase = "ready";
    if (request && completed !== request.id) {
      completed = request.id;
      return request.id;
    }
    return null;
  }
  return {
    frame,
    update(delta: number, visit: RoomVisit | null, reducedMotion: boolean): number | null {
      if (visit?.id !== request?.id) {
        request = visit;
        if (frame.sit > 0) {
          age = 0;
          startSit = frame.sit;
          frame.phase = "standing";
        } else beginWalk();
      }
      if (reducedMotion) {
        const target = visit?.panel === "chat" ? CHAIR : visit ? VAULT : HOME;
        frame.x = target.x;
        frame.z = target.z;
        frame.yaw = 0.04;
        frame.walk = 0;
        frame.reach = 0;
        frame.door = visit?.panel === "guardian" ? 1 : 0;
        frame.sit = visit?.panel === "chat" ? 1 : 0;
        if (!visit) {
          frame.phase = "idle";
          return null;
        }
        return finish();
      }
      age += delta;
      if (frame.phase === "standing") {
        frame.sit = startSit * (1 - ease(age / 0.65));
        if (age >= 0.65) {
          frame.sit = 0;
          beginWalk();
        }
      } else if (frame.phase === "walking" || frame.phase === "returning") {
        const returning = frame.phase === "returning";
        const t = Math.min(1, age / duration);
        let travelled = ease(t) * distance;
        const oldX = frame.x,
          oldZ = frame.z;
        for (let i = 0; i < lengths.length; i++) {
          const length = lengths[i] ?? 0;
          const a = route[i],
            b = route[i + 1];
          if (!a || !b) continue;
          if (travelled > length && i < lengths.length - 1) {
            travelled -= length;
            continue;
          }
          const part = length > 0 ? Math.min(1, travelled / length) : 1;
          frame.x = a.x + (b.x - a.x) * part;
          frame.z = a.z + (b.z - a.z) * part;
          turn(Math.atan2(b.x - a.x, b.z - a.z), 1 - Math.exp(-delta * 10));
          break;
        }
        frame.stride += (Math.hypot(frame.x - oldX, frame.z - oldZ) / 1.3) * Math.PI * 2;
        frame.walk = ease(t / 0.1) * (1 - ease((t - 0.9) / 0.1));
        frame.reach *= Math.exp(-delta * 8);
        frame.door *= Math.exp(-delta * 5);
        if (t === 1) {
          frame.walk = 0;
          age = 0;
          startYaw = frame.yaw;
          if (returning) {
            frame.phase = "idle";
            frame.door = 0;
          } else frame.phase = request?.panel === "chat" ? "seating" : "opening";
        }
      } else if (frame.phase === "seating") {
        turn(0.04, 1 - Math.exp(-delta * 8));
        frame.sit = ease((age - 0.25) / 0.85);
        if (age >= 1.15) {
          frame.sit = 1;
          frame.yaw = 0.04;
          return finish();
        }
      } else if (frame.phase === "opening") {
        frame.reach = ease(age / 0.4) * (1 - ease((age - 0.95) / 0.5));
        frame.door = ease((age - 0.45) / 0.75);
        const faceVault = Math.atan2(-4.3 - VAULT.x, -0.9 - VAULT.z);
        frame.yaw =
          startYaw +
          Math.atan2(Math.sin(faceVault - startYaw), Math.cos(faceVault - startYaw)) *
            ease(age / 0.3);
        frame.yaw +=
          Math.atan2(Math.sin(0.04 - frame.yaw), Math.cos(0.04 - frame.yaw)) *
          ease((age - 0.95) / 0.55);
        if (age >= 1.5) {
          frame.reach = 0;
          frame.door = 1;
          return finish();
        }
      } else turn(0.04, 1 - Math.exp(-delta * 8));
      return null;
    },
  };
}
