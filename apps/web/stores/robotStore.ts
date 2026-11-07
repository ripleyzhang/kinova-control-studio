import { create } from "zustand";
import { ARM_JOINTS, type ArmJointName } from "@/lib/robot-config";

// The validated startup pose is also the V1 Home pose.
const INITIAL_POSITIONS = {
  joint_1: 0, joint_2: 0, joint_3: 0, joint_4: 0, joint_5: 0, joint_6: 0,
} satisfies Record<ArmJointName, number>;

type RobotState = {
  positions: Record<ArmJointName, number>;
  restoreInitialPose: () => void;
  setPosition: (name: ArmJointName, radians: number) => number | undefined;
};

export const useRobotStore = create<RobotState>((set) => ({
  positions: INITIAL_POSITIONS,
  restoreInitialPose: () => set({ positions: INITIAL_POSITIONS }),
  setPosition(name, radians) {
    const joint = ARM_JOINTS.find((entry) => entry.name === name);
    if (!joint || !Number.isFinite(radians)) return;
    const applied = Math.max(joint.min, Math.min(joint.max, radians));
    set((state) => state.positions[name] === applied ? state : {
      positions: { ...state.positions, [name]: applied },
    });
    return applied;
  },
}));
