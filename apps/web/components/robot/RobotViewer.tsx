"use client";

import dynamic from "next/dynamic";

const WorkspaceScene = dynamic(() => import("./WorkspaceScene"), {
  ssr: false,
  loading: () => <p className="p-6 text-sm">Loading 3D workspace…</p>,
});

export default function RobotViewer() {
  return (
    <section aria-labelledby="workspace-title" className="mb-10 overflow-hidden rounded-2xl border border-current/20">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <h2 id="workspace-title" className="font-semibold">3D Workspace</h2>
        <p className="text-xs opacity-70">X red · Y green · Z blue (up)</p>
      </div>
      <div className="h-[55vh] min-h-80 w-full bg-[#111c22] sm:min-h-96">
        <WorkspaceScene />
      </div>
      <p className="px-5 py-4 text-xs leading-relaxed opacity-70">
        Drag to orbit · Right-drag to pan · Scroll to zoom · Focus canvas + arrow keys to pan · Touch: one finger orbit, two fingers pan/zoom.
        Reference cube centered at (0, 0, 0). Grid spacing: 1 m. No robot loaded.
      </p>
    </section>
  );
}
