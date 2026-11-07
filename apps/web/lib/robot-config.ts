// Positional limits (rad) from the pinned Gen3 Lite URDF. See docs/MODEL_VALIDATION.md.
export const ARM_JOINTS = [
  { label: "J1", name: "joint_1", min: -2.68, max: 2.68 },
  { label: "J2", name: "joint_2", min: -2.61, max: 2.61 },
  { label: "J3", name: "joint_3", min: -2.61, max: 2.61 },
  { label: "J4", name: "joint_4", min: -2.60, max: 2.60 },
  { label: "J5", name: "joint_5", min: -2.53, max: 2.53 },
  { label: "J6", name: "joint_6", min: -2.60, max: 2.60 },
] as const;

export type ArmJoint = (typeof ARM_JOINTS)[number];
export type ArmJointName = ArmJoint["name"];
