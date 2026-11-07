# Kinova Control Studio

SIX AXIS RUSH — Level 1: SPAWN POINT.

Frontend-only V1 foundation for the Kinova Gen3 Lite. This level contains a landing page; no robot model, 3D scene, physics, backend, or hardware control is implemented.

## Structure

- `apps/web/app`: Next.js App Router pages and global Tailwind styles.
- `apps/web/components`: client-side theme provider.
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

Three.js, React Three Fiber, Drei, urdf-loader, and Zustand are installed for subsequent authorized levels and are not used by this landing page. Theme support follows the system preference; no theme toggle is implemented in this level.

For a future Vercel deployment, choose `apps/web` as the project root and the Next.js framework preset. Deployment is not part of this level's local acceptance criteria.
