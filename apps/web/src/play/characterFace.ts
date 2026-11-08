import {
  BackSide,
  Float32BufferAttribute,
  Mesh,
  MeshStandardMaterial,
  type Object3D,
  SphereGeometry,
} from "three";
import { mouthLine, splitMouthSeam } from "./mouthGeometry";

export type Expression = "listening" | "thinking" | "speaking" | "concerned" | "pleased";
export const EXPRESSION_FRAMES: Record<Expression, { mouth: number; brow: number; smile: number }> =
  {
    listening: { mouth: 0, brow: 0, smile: 0 },
    thinking: { mouth: 0, brow: 0.2, smile: 0 },
    speaking: { mouth: 1, brow: 0, smile: 0.1 },
    concerned: { mouth: 0, brow: 1, smile: 0 },
    pleased: { mouth: 0, brow: 0, smile: 1 },
  };
const falloff = (value: number, centre: number, radius: number) =>
  Math.max(0, 1 - Math.abs(value - centre) / radius);

/** Small additive expressions calibrated to the downloaded Jungle Jim head's bind-space.
 * This asset has no face bones/blendshapes. These are visual speech cues, not phoneme lip-sync.
 * Only the face mesh is changed; the original body, skin weights and texture stay intact.
 */
export function createCharacterFace(root: Object3D) {
  const face = root.getObjectByName("stage2_mesh_id");
  if (!(face instanceof Mesh) || !face.geometry.attributes.position) return null;
  const geometry = face.geometry;
  const mouthSeams = splitMouthSeam(geometry);
  const lowerEdge = new Set(mouthSeams.map((edge) => edge.lower));
  const upperEdge = new Set(mouthSeams.map((edge) => edge.upper));
  const positions = geometry.attributes.position;
  if (!positions) return null;
  const targets = [0, 1, 2].map(() => new Float32Array(positions.count * 3));
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      y = positions.getY(i),
      z = positions.getZ(i);
    const front = Math.max(0, Math.min(1, (z - 0.035) / 0.035));
    const jaw = falloff(x, 0, 0.037) * falloff(y, 1.535, 0.065) * front;
    const lower = lowerEdge.has(i) || (!upperEdge.has(i) && y < mouthLine(x));
    const brow = falloff(Math.abs(x), 0.03, 0.027) * falloff(y, 1.628, 0.018) * front;
    const corner = falloff(Math.abs(x), 0.027, 0.018) * falloff(y, 1.548, 0.018) * front;
    const mouth = targets[0],
      concern = targets[1],
      smile = targets[2];
    if (mouth) {
      mouth[i * 3 + 1] = lower ? -jaw * 0.022 : jaw * 0.0012;
      mouth[i * 3 + 2] = lower ? -jaw * 0.003 : 0;
    }
    if (concern) concern[i * 3 + 1] = brow * (Math.abs(x) < 0.03 ? -0.003 : 0.002);
    if (smile) smile[i * 3 + 1] = corner * 0.003;
  }
  geometry.morphAttributes.position = targets.map(
    (target) => new Float32BufferAttribute(target, 3),
  );
  geometry.morphTargetsRelative = true;
  face.updateMorphTargets();
  // The new opening needs depth behind it. Attach an inward-facing mouth cavity to Head.
  const head = root.getObjectByName("Head");
  if (head) {
    root.updateMatrixWorld(true);
    const cavityGeometry = new SphereGeometry(1, 24, 16);
    cavityGeometry.scale(0.041, 0.035, 0.03);
    cavityGeometry.translate(0, 1.533, 0.052);
    const cavity = new Mesh(
      cavityGeometry,
      new MeshStandardMaterial({
        color: "#200d12",
        roughness: 1,
        side: BackSide,
        envMapIntensity: 0.05,
      }),
    );
    cavity.name = "MrFundMouthInterior";
    face.add(cavity);
    head.attach(cavity);
  }
  // The source contains unskinned duplicate upper teeth; use its skinned jaw meshes instead.
  root.traverse((object) => {
    if (["Teeth_Upper001", "Teeth_Upper002"].includes(object.name.replaceAll(".", "")))
      object.visible = false;
  });
  let lowerTeeth: Mesh | null = null;
  root.traverse((object) => {
    if (object instanceof Mesh && object.name.replaceAll(".", "") === "jawU001")
      lowerTeeth = object;
  });
  const teeth = lowerTeeth as Mesh | null;
  if (teeth) {
    const attribute = teeth.geometry.getAttribute("position");
    const offsets = new Float32Array(attribute.count * 3);
    for (let i = 0; i < attribute.count; i++) offsets[i * 3 + 1] = -0.019;
    teeth.geometry.morphAttributes.position = [new Float32BufferAttribute(offsets, 3)];
    teeth.geometry.morphTargetsRelative = true;
    teeth.updateMorphTargets();
  }
  let speechTime = 0,
    wasSpeaking = false,
    envelope = 0;
  return {
    mouthSeams,
    update(delta: number, expression: Expression, reduced: boolean) {
      const frame = EXPRESSION_FRAMES[expression];
      const speaking = expression === "speaking" && !reduced;
      if (speaking && !wasSpeaking) speechTime = 0;
      if (speaking) speechTime += delta;
      wasSpeaking = speaking;
      envelope += ((speaking ? 1 : 0) - envelope) * (reduced ? 1 : 1 - Math.exp(-delta * 10));
      const syllable = 0.5 + 0.5 * Math.sin(speechTime * 2 * Math.PI * 3.8 - Math.PI / 2);
      const mouth = reduced ? 0 : envelope * (0.12 + 0.88 * syllable * syllable);
      const desired = [mouth, frame.brow, frame.smile];
      desired.forEach((value, index) => {
        const weights = face.morphTargetInfluences;
        if (weights)
          weights[index] =
            (weights[index] ?? 0) +
            (value - (weights[index] ?? 0)) * (reduced ? 1 : 1 - Math.exp(-delta * 18));
      });
      if (teeth?.morphTargetInfluences)
        teeth.morphTargetInfluences[0] = face.morphTargetInfluences?.[0] ?? 0;
    },
  };
}
