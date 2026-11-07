"use client";

import { useThree } from "@react-three/fiber";
import { ARM_JOINTS } from "@/lib/robot-config";
import { useRobotStore } from "@/stores/robotStore";
import { useEffect, useState } from "react";
import { Box3, Mesh, type BufferGeometry, type Material } from "three";
import { STLLoader } from "three/addons/loaders/STLLoader.js";
import URDFLoader, { type URDFRobot } from "urdf-loader";

import JointHighlight from "./JointHighlight";

const modelUrl = "/robots/gen3-lite/robot.urdf";

export type ModelStatus =
  | { kind: "loading" }
  | { kind: "ready"; meshCount: number; height: number }
  | { kind: "error"; message: string };

async function fetchAsset(url: string, signal: AbortSignal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`${url} (HTTP ${response.status})`);
  return response;
}

export default function RobotModel({ onStatus }: { onStatus: (status: ModelStatus) => void }) {
  const invalidate = useThree((state) => state.invalidate);
  const [robot, setRobot] = useState<URDFRobot | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;
    const geometries = new Set<BufferGeometry>();
    const materials = new Set<Material>();
    const dispose = () => {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      geometries.clear();
      materials.clear();
    };

    async function load() {
      onStatus({ kind: "loading" });
      try {
        const xml = await (await fetchAsset(modelUrl, signal)).text();
        signal.throwIfAborted();
        const loader = new URDFLoader();
        const stl = new STLLoader();
        const pending: Promise<void>[] = [];
        loader.parseCollision = false;
        loader.loadMeshCb = (url, _manager, material, attach) => {
          materials.add(material);
          pending.push((async () => {
            const data = await (await fetchAsset(url, signal)).arrayBuffer();
            signal.throwIfAborted();
            let geometry: BufferGeometry;
            try {
              geometry = stl.parse(data);
            } catch {
              throw new Error(`${url} (invalid STL)`);
            }
            geometries.add(geometry);
            attach(new Mesh(geometry, material));
          })());
        };

        // These asset URLs are root-relative, so do not prepend the URDF directory.
        let model: URDFRobot;
        try {
          model = loader.parse(xml);
        } catch {
          await Promise.allSettled(pending);
          throw new Error(`${modelUrl} (invalid URDF)`);
        }
        await Promise.all(pending);
        if (pending.length === 0) throw new Error(`${modelUrl} (no visual meshes found)`);
        signal.throwIfAborted();

        // Apply the official static finger mimic offsets at zero driver angle.
        model.setJointValue("right_finger_bottom_joint", 0);
        const bounds = new Box3().setFromObject(model, true);
        setRobot(model);
        onStatus({ kind: "ready", meshCount: pending.length, height: bounds.max.z - bounds.min.z });
      } catch (error) {
        if (signal.aborted) return;
        controller.abort();
        dispose();
        onStatus({ kind: "error", message: error instanceof Error ? error.message : String(error) });
      }
    }

    void load();
    return () => {
      controller.abort();
      dispose();
    };
  }, [onStatus]);

  useEffect(() => {
    if (!robot) return;
    const apply = (positions: ReturnType<typeof useRobotStore.getState>["positions"],
      previous?: typeof positions) => {
      for (const { name } of ARM_JOINTS) {
        if (positions[name] !== previous?.[name]) robot.setJointValue(name, positions[name]);
      }
      invalidate();
    };

    apply(useRobotStore.getState().positions);
    return useRobotStore.subscribe((state, previous) => {
      if (state.positions !== previous.positions) apply(state.positions, previous.positions);
    });
  }, [robot, invalidate]);

  if (!robot) return null;
  return (
    <>
      <primitive object={robot} />
      <JointHighlight robot={robot} />
    </>
  );
}
