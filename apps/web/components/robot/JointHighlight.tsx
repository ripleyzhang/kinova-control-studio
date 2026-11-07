import { createPortal } from "@react-three/fiber";
import { Quaternion, Vector3 } from "three";
import type { URDFRobot } from "urdf-loader";
import { useStudioStore } from "@/stores/studioStore";

export default function JointHighlight({ robot }: { robot: URDFRobot }) {
  const selected = useStudioStore((state) => state.selectedJoint);
  const joint = robot.joints[selected];
  if (!joint) return null;

  // The ring lies in XY by default. Its normal should point along the local URDF axis.
  const orientation = new Quaternion().setFromUnitVectors(
    new Vector3(0, 0, 1),
    joint.axis.clone().normalize(),
  );

  return createPortal(
    <group quaternion={orientation}>
      <mesh renderOrder={10}>
        <torusGeometry args={[0.048, 0.0022, 8, 48]} />
        <meshBasicMaterial color="#38bdf8" toneMapped={false} depthTest={false} depthWrite={false} />
      </mesh>
      <mesh renderOrder={10}>
        <sphereGeometry args={[0.004, 12, 8]} />
        <meshBasicMaterial color="#38bdf8" toneMapped={false} depthTest={false} depthWrite={false} />
      </mesh>
    </group>,
    joint,
    undefined,
  );
}
