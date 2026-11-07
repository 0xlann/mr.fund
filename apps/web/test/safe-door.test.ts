import { readFileSync } from "node:fs";
import { Box3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { afterAll, describe, expect, it, vi } from "vitest";
import { createSafeDoorMotion } from "../src/play/safeDoor";

vi.stubGlobal(
  "ProgressEvent",
  class extends Event {
    constructor(type: string, init: ProgressEventInit) {
      super(type);
      Object.assign(this, init);
    }
  },
);
afterAll(() => vi.unstubAllGlobals());
async function safeGeometry() {
  const binary = readFileSync("apps/web/public/brankas/simple_safe.glb");
  const length = binary.readUInt32LE(12);
  const data = JSON.parse(binary.subarray(20, 20 + length).toString());
  // Keep actual vertex data and pivots; textures need a browser and are irrelevant to hinge alignment.
  delete data.images;
  delete data.textures;
  delete data.materials;
  for (const mesh of data.meshes)
    for (const primitive of mesh.primitives) delete primitive.material;
  data.buffers[0].uri = `data:application/octet-stream;base64,${binary.subarray(28 + length).toString("base64")}`;
  return (await new GLTFLoader().parseAsync(JSON.stringify(data), "")).scene;
}

describe("downloaded safe hinge", () => {
  it("starts closed against the cabinet front, opens outward, and closes again", async () => {
    const root = await safeGeometry();
    const motion = createSafeDoorMotion(root);
    const door = root.getObjectByName("Object_8");
    const body = root.getObjectByName("Object_5");
    if (!door || !body) throw new Error("Missing safe geometry");
    root.updateMatrixWorld(true);
    const cabinet = new Box3().setFromObject(body);
    const closed = new Box3().setFromObject(door);
    expect(closed.max.z).toBeLessThan(cabinet.max.z + 1);
    expect(closed.min.x).toBeGreaterThan(cabinet.min.x);
    expect(closed.max.x).toBeLessThan(cabinet.max.x);
    expect(closed.max.x - closed.min.x).toBeGreaterThan(4 * (closed.max.z - closed.min.z));
    motion.setOpen(1);
    root.updateMatrixWorld(true);
    const opened = new Box3().setFromObject(door);
    expect(opened.max.z).toBeGreaterThan(cabinet.max.z + 30);
    expect(opened.max.z - opened.min.z).toBeGreaterThan(4 * (opened.max.x - opened.min.x));
    motion.setOpen(0);
    root.updateMatrixWorld(true);
    expect(new Box3().setFromObject(door).equals(closed)).toBe(true);
  });
});
