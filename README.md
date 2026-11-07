# Kinova Control Studio

SIX AXIS RUSH — Level 2: THE EMPTY UNIVERSE.

Frontend-only V1 foundation for the Kinova Gen3 Lite. The landing page includes an interactive empty 3D workspace. No robot model, joint controls, physics, backend, or hardware control is implemented.

## Structure

- `apps/web/app`: Next.js App Router pages and global Tailwind styles.
- `apps/web/components`: client-side theme provider.
- `apps/web/components/robot/RobotViewer.tsx`: workspace container and client-only scene loading.
- `apps/web/components/robot/WorkspaceScene.tsx`: R3F camera, lighting, grid, axes, reference cube and OrbitControls.
- `apps/web/package.json`: application dependencies and scripts.
- `Kinova_Gen3_Lite_Web_Control_Roadmap.md`: project specification.

## Run locally

Requires Node.js 20.9 or newer and npm. Verified environment: Node.js 20.19.6 / npm 11.16.0.

```sh
nvm use
cd apps/web
npm ci
npm run dev
```

If using nvm, run `nvm use` from the repository root first to select `.nvmrc`; older system Node.js versions cannot run this application.

Open http://localhost:3000. The page shows “Kinova Control Studio”, “KINEMATIC PREVIEW”, and “No Physics / No Hardware”.

## Checks

Run from `apps/web`:

```sh
npm run lint
npm run typecheck
npm run build
```

Use `npm start` after a successful build to serve the production app locally.

Three.js, React Three Fiber and Drei power the workspace; urdf-loader and Zustand remain unused. Theme support follows the system preference; no theme toggle is implemented in this level.

## Workspace verification

- Drag to orbit, right-drag to pan, scroll to zoom. Focus the canvas and press arrow keys for keyboard panning.
- World coordinates are right-handed with **Z up**, X red, Y green, Z blue. The grid lies in XY with 1 m spacing. Camera up is explicitly `(0, 0, 1)` to use the same robotics-oriented convention.
- The temporary 0.4 m cube is centered at the world origin and intersects the ground plane intentionally. It is not a robot substitute.
- Resize the browser: Canvas observes its container and updates renderer size and perspective aspect ratio.
- Browser checks: orbit and zoom visually verified; panning verified with arrow keys; the right-drag mapping is configured by OrbitControls but not separately exercised by automation. Desktop and 600 × 800 viewport rendering verified; narrow canvas measured 550 × 440 CSS pixels, matching its container.
- Browser logs contained no WebGL or hydration errors. The installed R3F/Three combination emits a `THREE.Clock` deprecation warning; rendering and interaction still work.

For a future Vercel deployment, choose `apps/web` as the project root and the Next.js framework preset. Deployment is not part of this level's local acceptance criteria.
