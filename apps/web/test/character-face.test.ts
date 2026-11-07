import { readFileSync } from "node:fs";
import { BufferGeometry, Float32BufferAttribute, Mesh, Object3D } from "three";
import { describe, expect, it } from "vitest";
import { createCharacterFace } from "../src/play/characterFace";

function downloadedFace() {
  const file = readFileSync("apps/web/public/play/jungle-jim/businessman.glb");
  const length = file.readUInt32LE(12);
  const data = JSON.parse(file.subarray(20, 20 + length).toString());
  const mesh = data.meshes.find((item: { name: string }) => item.name === "stage2_mesh_id");
  const accessor = data.accessors[mesh.primitives[0].attributes.POSITION];
  const view = data.bufferViews[accessor.bufferView];
  const start = 28 + length + (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const values = new Float32Array(accessor.count * 3);
  for (let index = 0; index < values.length; index++)
    values[index] = file.readFloatLE(start + index * 4);
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(values, 3));
  const face = new Mesh(geometry);
  face.name = "stage2_mesh_id";
  const root = new Object3D();
  root.add(face);
  return { face, root };
}

describe("expression frames on the downloaded face", () => {
  it("adds localized additive mouth and expression targets without altering the source positions", () => {
    const { face, root } = downloadedFace();
    const original = face.geometry.attributes.position?.array.slice();
    const controller = createCharacterFace(root);
    expect(controller).not.toBeNull();
    const targets = face.geometry.morphAttributes.position;
    expect(targets).toHaveLength(3);
    for (const target of targets ?? []) {
      const changed = Array.from(target.array).filter((value) => value !== 0);
      expect(changed.length).toBeGreaterThan(0);
      expect(Math.max(...changed.map(Math.abs))).toBeLessThan(0.01);
    }
    expect(face.geometry.attributes.position?.array).toEqual(original);
    controller?.update(1, "speaking", false);
    expect(face.morphTargetInfluences?.[0]).toBeGreaterThan(0);
    controller?.update(1, "concerned", false);
    expect(face.morphTargetInfluences?.[1]).toBeGreaterThan(0.9);
    controller?.update(1, "speaking", true);
    expect(face.morphTargetInfluences?.[0]).toBe(0);
    controller?.update(1, "listening", true);
    expect(face.morphTargetInfluences).toEqual([0, 0, 0]);
  });
  it("does not apply these model-specific coordinates to unrelated assets", () => {
    expect(createCharacterFace(new Object3D())).toBeNull();
  });
});
