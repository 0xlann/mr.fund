import { MathUtils, type Object3D } from "three";

/** The downloaded door mesh is baked sideways: its closed hinge angle is -90°, not zero. */
export function createSafeDoorMotion(root: Object3D) {
  const door = root.getObjectByName("Safe1_Door");
  const handle = root.getObjectByName("Door_Handle");
  if (!door) throw new Error("Missing safe door hinge");
  const handleRest = handle?.rotation.y ?? 0;
  const motion = {
    setOpen(amount: number) {
      const open = MathUtils.clamp(amount, 0, 1);
      door.rotation.z = -Math.PI / 2 + (open * Math.PI) / 2;
      if (handle) handle.rotation.y = handleRest + Math.sin(open * Math.PI) * 0.4;
    },
  };
  motion.setOpen(0);
  return motion;
}
