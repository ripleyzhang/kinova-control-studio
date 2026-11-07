"use client";

import JointControls from "@/components/controls/JointControls";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { ModelStatus } from "./RobotModel";

const WorkspaceScene = dynamic(() => import("./WorkspaceScene"), {
  ssr: false,
  loading: () => null,
});

export default function RobotViewer() {
  const [status, setStatus] = useState<ModelStatus>({ kind: "loading" });

  return (
    <div className="workspace-layout">
      <section className="viewport" aria-labelledby="workspace-title">
        <div className="viewport-canvas">
          <WorkspaceScene onStatus={setStatus} />
        </div>
        <div className="viewport-top">
          <h2 id="workspace-title" className="technical overlay-tag">3D Workspace</h2>
          <p className="technical overlay-tag">XYZ · Z up · 0.1 m grid</p>
        </div>
        {status.kind === "error" && (
          <p role="alert" className="viewport-message model-error">
            Could not load Gen3 Lite. {status.message}
          </p>
        )}
        {status.kind === "loading" && (
          <p role="status" className="viewport-message">Loading official Gen3 Lite model…</p>
        )}
        <div className="viewport-bottom">
          <span className="technical overlay-tag">Kinematic preview</span>
          <span className="technical overlay-tag" title="Drag to orbit, right-drag or arrow keys to pan, scroll to zoom">
            Orbit · Pan · Zoom
          </span>
        </div>
      </section>
      <JointControls disabled={status.kind !== "ready"} />
    </div>
  );
}
