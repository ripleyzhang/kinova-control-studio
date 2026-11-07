import { create } from "zustand";
import type { ArmJointName } from "@/lib/robot-config";

type StudioState = {
  selectedJoint: ArmJointName;
  selectJoint: (name: ArmJointName) => void;
};

export const useStudioStore = create<StudioState>((set) => ({
  selectedJoint: "joint_1",
  selectJoint: (selectedJoint) => set({ selectedJoint }),
}));
