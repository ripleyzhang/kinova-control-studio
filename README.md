# Kinova Control Studio

SIX AXIS RUSH — Level 6: CONTROL ROOM.

Frontend-only V1 control studio for the official Kinova Gen3 Lite model. The workspace pairs direct six-axis kinematic control with a joint-origin marker.

## Structure

- `apps/web/app`: Next.js App Router pages and global Tailwind styles.
- `apps/web/components`: client-side theme provider.
- `apps/web/components/robot/RobotViewer.tsx`: workspace container and client-only scene loading.
- `apps/web/components/robot/WorkspaceScene.tsx`: R3F camera, lighting, grid, axes and OrbitControls.
- `apps/web/components/robot/RobotModel.tsx`: loads the official URDF and STL visuals.
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

Three.js, React Three Fiber and Drei power the workspace; urdf-loader builds the model hierarchy. Zustand stores the arm positions in radians and tracks the selected joint separately. The Light/Dark switch persists the theme preference through next-themes.

## Workspace verification

- Select J1–J6 or focus a joint input to see its cyan axis ring. The marker attaches to the named URDF joint and follows its ancestors as they rotate.
- Drag a slider or type an angle in degrees and press Enter. Values outside the official range are limited and invalid input preserves the prior value.
- Home and Reset both apply the documented V1 startup pose, all six arm joints at 0 rad. Both clear angle edits and feedback. Home retains the selected joint and Reset returns selection to J1.

- Drag to orbit, right-drag to pan, scroll to zoom. Focus the canvas and press arrow keys for keyboard panning.
- World coordinates are right-handed with **Z up**, X red, Y green, Z blue. The grid lies in XY with 0.1 m spacing. Camera up is explicitly `(0, 0, 1)` to use the same robotics-oriented convention.
- The official model retains its world-to-base identity transform and meter scale. Its loaded visual bounds are approximately 1.02 m tall in this pose.
- The viewport shows loading and asset errors. Joint controls become available after the 11 visual meshes load. See [model provenance and validation](docs/MODEL_VALIDATION.md).
- Resize the browser: Canvas observes its container and updates renderer size and perspective aspect ratio.
- Browser checks: orbit and zoom visually verified; panning verified with arrow keys; the right-drag mapping is configured by OrbitControls but not separately exercised by automation. Desktop, tablet and mobile widths from 320 to 1280 CSS pixels verified without horizontal overflow.
- Browser logs contained no WebGL or hydration errors. The installed R3F/Three combination emits a `THREE.Clock` deprecation warning; rendering and interaction still work.

For a future Vercel deployment, choose `apps/web` as the project root and the Next.js framework preset. Deployment is not part of this level's local acceptance criteria.
