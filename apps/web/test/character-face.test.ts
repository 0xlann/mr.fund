import { readFileSync } from "node:fs";
import { Bone, BufferGeometry, Float32BufferAttribute, Mesh, Object3D } from "three";
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
  const indexAccessor = data.accessors[mesh.primitives[0].indices];
  const indexView = data.bufferViews[indexAccessor.bufferView];
  const indexStart = 28 + length + (indexView.byteOffset ?? 0) + (indexAccessor.byteOffset ?? 0);
  const indices = Array.from({ length: indexAccessor.count }, (_, index) =>
    indexAccessor.componentType === 5123
      ? file.readUInt16LE(indexStart + index * 2)
      : file.readUInt32LE(indexStart + index * 4),
  );
  geometry.setIndex(indices);
  const face = new Mesh(geometry);
  face.name = "stage2_mesh_id";
  const root = new Object3D();
  root.add(face);
  const head = new Bone();
  head.name = "Head";
  root.add(head);
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
      expect(Math.max(...changed.map(Math.abs))).toBeLessThan(0.025);
    }
    expect(face.geometry.attributes.position?.array.slice(0, original?.length)).toEqual(original);
    controller?.update(1, "speaking", false);
    expect(face.morphTargetInfluences?.[0]).toBeGreaterThan(0);
    controller?.update(1, "concerned", false);
    expect(face.morphTargetInfluences?.[1]).toBeGreaterThan(0.9);
    controller?.update(1, "speaking", true);
    expect(face.morphTargetInfluences?.[0]).toBe(0);
    controller?.update(1, "listening", true);
    expect(face.morphTargetInfluences).toEqual([0, 0, 0]);
  });
  it("creates a real lip seam that separates when speaking and closes on returning to listening", () => {
    const { face, root } = downloadedFace();
    const controller = createCharacterFace(root);
    if (!controller) throw new Error("Missing face controller");
    const positions = face.geometry.getAttribute("position");
    const mouth = face.geometry.morphAttributes.position?.[0];
    if (!mouth) throw new Error("Missing mouth target");
    const central = controller.mouthSeams.filter(
      (edge) => Math.abs(positions.getX(edge.upper)) < 0.015,
    );
    expect(central.length).toBeGreaterThan(2);
    let largestGap = 0;
    for (let frame = 0; frame < 90; frame++) {
      controller.update(1 / 60, "speaking", false);
      const weight = face.morphTargetInfluences?.[0] ?? 0;
      for (const edge of central) {
        expect(positions.getY(edge.upper)).toBeCloseTo(positions.getY(edge.lower), 6);
        const gap = (mouth.getY(edge.upper) - mouth.getY(edge.lower)) * weight;
        largestGap = Math.max(largestGap, gap);
      }
    }
    expect(largestGap).toBeGreaterThan(0.01);
    expect(root.getObjectByName("MrFundMouthInterior")).toBeInstanceOf(Mesh);
    controller.update(1, "listening", true);
    expect(face.morphTargetInfluences?.[0]).toBe(0);
  });
  it("does not apply these model-specific coordinates to unrelated assets", () => {
    expect(createCharacterFace(new Object3D())).toBeNull();
  });
});
