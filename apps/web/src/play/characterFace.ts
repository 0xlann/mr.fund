import { Float32BufferAttribute, Mesh, type Object3D } from "three";

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
  const positions = geometry.attributes.position;
  if (!positions) return null;
  const targets = [0, 1, 2].map(() => new Float32Array(positions.count * 3));
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i),
      y = positions.getY(i),
      z = positions.getZ(i);
    const front = Math.max(0, Math.min(1, (z - 0.035) / 0.035));
    const jaw = falloff(x, 0, 0.065) * falloff(y, 1.525, 0.035) * front;
    const brow = falloff(Math.abs(x), 0.03, 0.027) * falloff(y, 1.628, 0.018) * front;
    const corner = falloff(Math.abs(x), 0.027, 0.018) * falloff(y, 1.548, 0.018) * front;
    const mouth = targets[0],
      concern = targets[1],
      smile = targets[2];
    if (mouth) {
      mouth[i * 3 + 1] = -jaw * 0.009;
      mouth[i * 3 + 2] = -jaw * 0.002;
    }
    if (concern) concern[i * 3 + 1] = brow * (Math.abs(x) < 0.03 ? -0.003 : 0.002);
    if (smile) smile[i * 3 + 1] = corner * 0.003;
  }
  geometry.morphAttributes.position = targets.map(
    (target) => new Float32BufferAttribute(target, 3),
  );
  geometry.morphTargetsRelative = true;
  face.updateMorphTargets();
  let time = 0;
  return {
    update(delta: number, expression: Expression, reduced: boolean) {
      time += delta;
      const frame = EXPRESSION_FRAMES[expression];
      // A stepped syllable cycle resembles an expression sheet, with soft transitions between frames.
      const syllable = Math.floor(time * 12);
      const mouth = reduced
        ? 0
        : frame.mouth * ([0.15, 0.8, 0.4, 1, 0.25, 0.65][syllable % 6] ?? 0);
      const desired = [mouth, frame.brow, frame.smile];
      desired.forEach((value, index) => {
        const weights = face.morphTargetInfluences;
        if (weights)
          weights[index] =
            (weights[index] ?? 0) +
            (value - (weights[index] ?? 0)) * (reduced ? 1 : 1 - Math.exp(-delta * 18));
      });
    },
  };
}
