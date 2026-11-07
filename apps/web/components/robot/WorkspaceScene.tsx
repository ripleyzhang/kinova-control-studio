"use client";

import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useState } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

function CameraControls() {
  const [controls, setControls] = useState<OrbitControlsImpl | null>(null);
  const canvas = useThree((state) => state.gl.domElement);

  useEffect(() => {
    controls?.listenToKeyEvents(canvas);
    return () => controls?.stopListenToKeyEvents();
  }, [canvas, controls]);

  return <OrbitControls ref={setControls} makeDefault enableRotate enablePan enableZoom minDistance={0.6} maxDistance={30} />;
}

export default function WorkspaceScene() {
  return (
    <Canvas
      camera={{ position: [4, -6, 4], up: [0, 0, 1], fov: 45, near: 0.01, far: 100 }}
      dpr={[1, 2]}
      frameloop="demand"
      onCreated={({ gl }) => { gl.domElement.tabIndex = 0; }}
      fallback={<p className="p-6 text-white">WebGL is unavailable. Please use a WebGL-capable browser.</p>}
      aria-label="Interactive 3D workspace with a reference cube, ground grid and XYZ axes"
    >
      <color attach="background" args={["#111c22"]} />
      <ambientLight intensity={0.8} />
      <directionalLight position={[3, -4, 6]} intensity={2} />
      {/* GridHelper starts in XZ; rotate it into the Z-up world's XY plane. */}
      <gridHelper args={[10, 10, "#627985", "#304550"]} position={[0, 0, -0.002]} rotation={[Math.PI / 2, 0, 0]} />
      <axesHelper args={[2]} />
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial color="#f5b85b" roughness={0.45} />
      </mesh>
      <CameraControls />
    </Canvas>
  );
}
