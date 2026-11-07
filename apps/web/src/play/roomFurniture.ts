import { Box3, Group, type Object3D, Vector3 } from "three";

/** Normalize imported meters/centimeters and off-centre pivots without stretching geometry. */
export function fitRoomFurniture(
  model: Object3D,
  height: number,
  rotationY = 0,
  referenceName?: string,
) {
  const orientation = new Group();
  orientation.add(model);
  orientation.rotation.y = rotationY;
  orientation.updateMatrixWorld(true);
  const reference = referenceName ? model.getObjectByName(referenceName) : orientation;
  if (!reference) throw new Error(`Missing furniture reference: ${referenceName}`);
  const bounds = new Box3().setFromObject(reference);
  const size = bounds.getSize(new Vector3());
  if (!Number.isFinite(size.y) || size.y <= 0 || height <= 0)
    throw new Error("Invalid furniture bounds");
  const factor = height / size.y;
  orientation.position.set(
    -(bounds.min.x + bounds.max.x) / 2,
    -bounds.min.y,
    -(bounds.min.z + bounds.max.z) / 2,
  );
  const group = new Group();
  group.add(orientation);
  group.scale.setScalar(factor);
  group.updateMatrixWorld(true);
  return { group, width: size.x * factor, height, depth: size.z * factor };
}
