# Kinova Gen3 Lite Web Control Platform

**Technical Design & Phased Implementation Guide**  
Version: 1.1 · Status: Planning · Target: Vercel-hosted UI, extensible simulation and hardware adapters

## 1. Project objective

Build a browser-accessible 3D control interface for a **Kinova Gen3 Lite six-degree-of-freedom arm**, using its official robot description and visual meshes. The architecture must support three deliberately separated releases:

- **V1 — Frontend-only MVP (first acceptance milestone):** 3D robot visualization and **only six-DOF joint-position control**. No Python backend, no physical simulation, no Cartesian control, and no gripper actuation. Deployable directly to Vercel.
- **V2 — Functional simulation platform:** Python/MuJoCo physical simulation; backend-synchronized state; joint control with physical execution; Cartesian pose control and numerical IK; gripper control; motion modes; trajectory display; state, safety and data features; preparation for a future real-robot adapter.
- **V3 — Research-grade fidelity:** Investigate calibrated high-fidelity torque control, motor/actuator response, and deformable-body/contact behavior. These are **research targets, not guaranteed capabilities** of a stock URDF or MuJoCo setup.

**Principle:** A successful V1 is a correct kinematic visualization and joint-position UI, **not** a physically simulated robot. Preserve this distinction in UI labels, documentation, and tests.

## 2. Scope and acceptance matrix

| Capability | V1 | V2 | V3 |
|---|---|---|---|
| Official Gen3 Lite geometry and six joint axes | Required | Retain | Retain |
| Orbit, pan, zoom, grid, coordinate axes | Required | Retain | Retain |
| Six joint sliders + numeric fields (degrees) | Required | Retain | Retain |
| Model-specific joint limits | Required | Enforced in backend | Retain |
| Home/reset six joints | Required | Retain | Retain |
| Responsive UI and light/dark theme | Required | Retain | Retain |
| FK/TCP readout | Optional internal validation; not a V1 UI gate | Required | Retain |
| Cartesian XYZ/RPY and IK | Excluded | Required | Improve |
| Gripper actuation | Excluded | Required | Improve contact behavior |
| Joint trajectory interpolation and mode switching | Excluded; direct pose updates only | Required | Improve |
| MuJoCo gravity, rigid contact, actuator/controller | Excluded | Required | Calibrate |
| Planned/executed TCP trails | Excluded | Required | Retain |
| Save/load poses; JSON/CSV export | Excluded | Required | Retain |
| WebSocket state and command transport | Excluded | Required | Retain |
| Real hardware control | Excluded | Adapter interface only; hardware disabled | Separate safety-gated deployment, if pursued |
| High-fidelity torque/motor/deformable simulation | Excluded | Excluded | Research and validation |

**Release gates:** Do not expand V1 acceptance criteria with V2 features. Complete and deploy V1 before introducing the simulation backend.

## 3. Architecture by version

### V1: Static web application

```text
Browser (Next.js + TypeScript)
  ├─ React Three Fiber / Three.js scene
  ├─ Official URDF + visual meshes
  ├─ Joint-angle store (six q values)
  ├─ Joint sliders, numeric inputs, home/reset
  └─ Light/dark theme
          ↓
     Vercel static web hosting
```

All state is client-side. Updating a slider changes the corresponding URDF joint transform and the rendered robot pose. No simulated forces, velocities, torques, collision response, or networked robot state are claimed.

### V2: Web UI + simulation service

```text
Vercel-hosted Next.js UI
   ├─ 3D robot viewer
   ├─ Joint / Cartesian / Gripper controls
   ├─ State panels and trajectory display
   └─ WebSocket client
              ⇅
Python FastAPI + WebSocket server (separate persistent host)
   ├─ Command validation and safety checks
   ├─ FK / numerical IK / trajectory planning
   ├─ MuJoCo simulation and control loop
   ├─ State publication and recording
   └─ RobotAdapter interface
        ├─ MuJoCoAdapter (active)
        └─ KortexAdapter (future stub, disabled)
```

**Vercel does not host the persistent MuJoCo physics loop.** For local development, run the backend on localhost. For a public site, deploy the backend separately and use secure WSS, access control, and explicit origin policies. A public Vercel page cannot assume that every visitor can access a backend on the developer's localhost.

### V3: Research extensions

Add calibrated actuator and transmission models, force/torque control experiments, parameter identification, deformable material modeling, and validation against measured data. Keep fidelity claims tied to experimental evidence.

## 4. Technology decisions

| Area | V1 | V2 / V3 |
|---|---|---|
| Web | Next.js, React, TypeScript | Same |
| 3D | Three.js, `@react-three/fiber`, `@react-three/drei` | Same; driven by authoritative backend state |
| Robot visualization | `urdf-loader`, official visual meshes | Same |
| Styling | Tailwind CSS, shadcn/ui, next-themes | Same |
| Client state | Zustand | Same, separating commanded and measured state |
| API | None | FastAPI, WebSocket, Pydantic |
| Kinematics | URDF-based joint transforms | MuJoCo FK/Jacobian, NumPy/SciPy IK |
| Physics | None | MuJoCo Python |
| Persistence | In-memory UI state only | Browser pose storage and JSON/CSV export |
| Hosting | Vercel | Vercel frontend + persistent backend host |
| Hardware | None | Kortex adapter contract; actual hardware integration later |

Pin compatible dependency versions when implementing; do not assume latest packages interoperate without a smoke test. Prefer using official source packages and recording model licenses and revision hashes.

## 5. Robot model and coordinate conventions

1. Obtain the **Gen3 Lite** official robot description from Kinova's `ros2_kortex/kortex_description` assets. Confirm the exact arm-plus-gripper variant before choosing files; retain source and license attribution.
2. Resolve Xacro to URDF if necessary using an appropriate ROS/Xacro environment, then copy required visual meshes into web-served assets. Resolve `package://` URIs to working public paths. Do not assume the browser can parse Xacro directly.
3. Verify all six actuated arm joint names, hierarchy, origins, axes, initial configuration and limits from the chosen model. **Do not hard-code universal ±180° limits.**
4. Keep a canonical ordered list of six joint names in `robot-config.ts`; map UI indices to URDF joint names explicitly. Avoid depending on arbitrary file traversal order.
5. Internal joint values: radians. UI joint values: degrees. Convert at the UI/model boundary.
6. Document the world/base frames, coordinate-axis convention, joint sign, tool flange and eventual TCP definition. In V1, a TCP UI is not required.
7. For V2, separately validate mass/inertia, collision geometry, actuators, damping, gravity and gripper couplings in MuJoCo. URDF visual correctness alone does not validate physical behavior.

**Reference:** https://github.com/Kinovarobotics/ros2_kortex/tree/main/kortex_description

## 6. Repository layout

```text
kinova-web-control/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── robot/
│   │   │   │   ├── RobotViewer.tsx
│   │   │   │   └── RobotModel.tsx
│   │   │   ├── controls/
│   │   │   │   └── JointControl.tsx        # V1
│   │   │   ├── controls-v2/               # V2 only
│   │   │   │   ├── CartesianControl.tsx
│   │   │   │   └── GripperControl.tsx
│   │   │   └── dashboard/
│   │   │       └── Toolbar.tsx
│   │   ├── stores/
│   │   │   └── robotStore.ts
│   │   ├── lib/
│   │   │   ├── robot-config.ts
│   │   │   └── units.ts
│   │   └── public/robots/gen3-lite/
│   │       ├── robot.urdf
│   │       └── meshes/
│   └── sim-server/                       # Add in V2
│       ├── main.py
│       ├── api/websocket.py
│       ├── simulation/{engine,robot,controller}.py
│       ├── kinematics/{fk,ik}.py
│       ├── planning/trajectory.py
│       ├── adapters/{base,mujoco_adapter,kortex_adapter}.py
│       └── models/gen3_lite.xml
├── packages/
│   ├── robot-description/                # Model source/provenance
│   └── protocol/                         # Add in V2
├── tests/
├── docs/
│   ├── MODEL_VALIDATION.md
│   ├── COORDINATE_FRAMES.md
│   └── RELEASE_CHECKLIST.md
├── scripts/
└── README.md
```

Start with `apps/web` and minimal shared files. Do not scaffold the Python backend or speculative abstractions until V2 unless a small interface genuinely simplifies V1.

## 7. V1 — detailed implementation plan (first acceptance)

### V1.1 Bootstrap

- Initialize Next.js App Router with TypeScript.
- Install React Three Fiber, Drei, Three.js, URDF loader, Zustand, Tailwind CSS, shadcn/ui and theme support.
- Configure a client-only 3D viewer component where necessary; avoid server-side access to browser-only WebGL APIs.
- Add lint, TypeScript checking, basic test tooling and a Vercel deployment configuration.

**Done when:** a deployed page loads the empty interactive 3D scene without errors.

### V1.2 Official model ingestion

- Identify and record the exact official model revision and robot variant.
- Generate/load the URDF and copy all visual meshes into `public/robots/gen3-lite`.
- Implement mesh-path resolution and robust loading/error states.
- Inspect scale, handedness, orientation, root transform and visual hierarchy.
- Render grid, world axes and orbit/pan/zoom camera controls.

**Done when:** the recognizable Gen3 Lite model renders correctly and the camera can orbit, pan and zoom.

### V1.3 Six-DOF joint control

- Define exactly six controlled arm joints by name.
- Create six sliders and six synchronized numeric inputs, labeled J1–J6.
- Read limits from the chosen model/configuration; clamp or reject invalid values with clear UI feedback.
- Store canonical values in radians; show degrees to users.
- Apply each changed joint angle to the matching URDF joint transform.
- Provide **Home** (a documented valid reference pose) and **Reset** (restore the starting pose). These may coincide if configured identically.
- Make UI updates immediate. V1 does **not** implement trajectory interpolation or a motion controller.

**Done when:** each control moves only its intended joint, respecting its valid range, and home/reset works reliably.

### V1.4 UI and usability

- Desktop layout: large 3D viewport with a side panel containing six joint controls.
- Add a compact header with robot/model name, **Kinematic Preview** status and theme toggle.
- Support light and dark mode, responsive resizing, keyboard-accessible numeric inputs, loading and model-error states.
- Do not display simulated force, collision status, velocity, motor response or an active hardware connection in V1.

**Done when:** the UI is clear, responsive and does not misrepresent kinematic pose changes as physical robot motion.

### V1.5 Testing and deployment

- Verify zero/home configuration and visually check each of six joint axes against the URDF definition.
- Test min/max limits and invalid numeric input.
- Test slider-input synchronization, browser refresh behavior, model loading and camera interactions.
- Check browser console for missing mesh assets, hydration errors and rendering exceptions.
- Run production build and deploy to Vercel.

**V1 formal acceptance checklist**

- [ ] Public Vercel URL loads successfully without a Python server.
- [ ] Official Gen3 Lite URDF and visual meshes render with correct scale and hierarchy.
- [ ] Orbit, pan, zoom, grid and axes work.
- [ ] Exactly six J1–J6 sliders and numeric inputs control the correct arm joints.
- [ ] Model-specific limits are enforced and units are clear.
- [ ] Home/reset restores a documented valid configuration.
- [ ] Light/dark theme works.
- [ ] No runtime errors or missing model assets in the supported desktop browser.
- [ ] UI clearly says **Kinematic Preview / No Physics / No Hardware**.

**V1 deliverable:** deployed URL, source repository, setup instructions, model attribution, short demo video or screenshots, and completed acceptance checklist.

## 8. V2 — functional simulation and controls

**Prerequisite:** V1 accepted and tagged (for example `v1.0.0`).

### V2.1 Physics backend

- Add FastAPI service and persistent WebSocket endpoint.
- Convert/prepare a MuJoCo-compatible robot model, including the gripper; validate joint order and coordinate frames against V1.
- Add gravity, collision geometries, contact/friction settings and appropriate actuators.
- Implement a stable position-tracking controller for the six arm joints and gripper.
- Make MuJoCo the authoritative source of **actual** robot state; keep target commands separate.
- Define fixed simulation time step and decoupled control/publish/render rates. Initial tuning targets: physics ~500 Hz, control ~100 Hz, state publishing ~30 Hz, UI up to ~60 FPS; benchmark rather than assume these rates.

### V2.2 Transport and safety

- Define versioned Pydantic schemas and TypeScript equivalents for commands, acknowledgments, state, errors and timestamps.
- Implement command IDs, stale-command handling, reconnect/disconnect states, rate limiting and explicit stop semantics.
- Enforce joint limits and command validation **in the backend**, not just the UI.
- Expose a simulation-mode indicator; hardware mode remains disabled.
- Add origin restrictions, authentication and WSS before publicly exposing a writable simulator.

Example command:

```json
{
  "type": "command.joint_target",
  "command_id": "cmd-001",
  "mode": "smooth",
  "positions_rad": [0, 0.2, -0.5, 0, 0.4, 0],
  "duration_s": 2.0
}
```

Example state (illustrative, not measured):

```json
{
  "type": "state",
  "timestamp_s": 12.45,
  "mode": "simulation",
  "joint_positions_rad": [0, 0.1, -0.3, 0, 0.2, 0],
  "tcp_position_m": [0.3, 0.1, 0.4],
  "gripper_opening": 0.75,
  "motion_status": "executing"
}
```

### V2.3 Motion modes

- **Instant Preview:** directly set configuration for inspection, explicitly nonphysical; do not present it as executed motion.
- **Smooth Physical Execution:** generate joint-space motion subject to configured velocity/acceleration constraints and track through MuJoCo actuators.
- Provide pause, stop and reset with documented behavior. Do not equate a browser stop button with a hardware emergency stop.

### V2.4 Cartesian control and IK

- Expose TCP position `(x, y, z)` and orientation `(roll, pitch, yaw)` with defined frame and units.
- Implement FK and Jacobian-based damped-least-squares IK with joint-limit handling.
- Provide clear feedback for unreachable goals, singular/poorly conditioned configurations and collision-invalid paths.
- Check the trajectory separately: **IK success is not collision-free execution**.

### V2.5 Gripper and state visualization

- Add open/close/percentage control using the selected official gripper model and validated coupling.
- Display actual vs target joint positions, joint velocities, TCP pose, gripper state, connection status and command status.
- Render planned and executed TCP trajectory trails distinctly.

### V2.6 Data features

- Save/load named joint poses in browser storage.
- Export pose/trajectory records as JSON and CSV with timestamps, joint names, units, commanded/actual values, TCP pose and simulation metadata.
- Record model revision and coordinate-frame conventions for reproducibility.

### V2.7 Future hardware interface

Define a `RobotAdapter` contract (e.g., `connect`, `disconnect`, `get_state`, `set_joint_target`, `set_gripper_target`, `stop`). Implement `MuJoCoAdapter` first; keep `KortexAdapter` as a nonfunctional stub. Real robot enablement requires a separate safety review, authentication, hardware limits, watchdog and independent physical E-stop.

**V2 acceptance checklist**

- [ ] MuJoCo runs as a separate persistent backend and publishes coherent robot state.
- [ ] Web UI connects via WebSocket and distinguishes target from actual state.
- [ ] Joint targets execute through a stable position controller under gravity.
- [ ] Instant Preview and Smooth Physical Execution have distinct, correct semantics.
- [ ] Cartesian reachable targets work through FK/IK; unreachable targets produce errors.
- [ ] Gripper controls and state feedback work.
- [ ] Joint limits and basic rigid-body collisions are checked.
- [ ] TCP pose, trajectory trails, save/load and JSON/CSV export work.
- [ ] Public deployment uses an appropriately secured backend or is restricted to local development.
- [ ] No real hardware motion is possible through the V2 release.

## 9. V3 — high-fidelity simulation and advanced control research

V3 is a separate research and validation program, not an automatic extension of V2. Possible workstreams:

1. **Torque-level control:** implement torque/impedance control laws and verify actuator effort limits, controller stability and numerical integration behavior.
2. **Motor and transmission fidelity:** add or identify motor inertia, friction, gear ratio, backlash, actuator lag, saturation and thermal/effort limits as supported by real data.
3. **Parameter identification:** calibrate link inertias, damping, friction and contact parameters from documented hardware measurements; report uncertainty.
4. **Contact fidelity:** evaluate contact geometry, friction, compliant/rigid contact assumptions and solver sensitivity.
5. **Deformable material simulation:** choose a suitable FEM/MPM/other deformable representation if the target task requires it. Standard rigid-body MuJoCo setup is insufficient to claim realistic food deformation or cutting topology changes.
6. **Validation:** compare simulated trajectories, forces/torques and material responses against measured reference experiments; publish error metrics and failure cases.
7. **Optional real-hardware integration:** only after an independent safety review and implementation of authorization, watchdogs, command limits, hardware E-stop and supervised test procedures.

**V3 acceptance must be metric-based and defined after data and test rigs are available.** Example categories: joint tracking RMSE, torque tracking error, motor step-response error, contact-force error, deformation/geometry error, simulation stability and computational throughput. Do not invent numerical tolerances before establishing requirements.

## 10. Testing strategy

- **Model tests:** link/joint hierarchy, joint names/order, limits, axes, visual mesh loading and frame consistency.
- **UI tests:** slider-input synchronization, unit conversion, clamping, home/reset, theme, responsive layout and loading/error states.
- **V2 integration tests:** command acknowledgment, actual-vs-target feedback, disconnection, stale messages, IK failures, collisions and export schemas.
- **V2 physical tests:** gravity compensation/holding, position tracking, contact response, controller stability and time-step sensitivity.
- **V3 validation tests:** compare against independently measured hardware/material data, with uncertainty and reproducible protocols.

## 11. Delivery sequence and estimated effort

| Milestone | Estimated engineering time | Gate |
|---|---:|---|
| V1: frontend setup and official model ingestion | 1–3 days | Model renders correctly |
| V1: six-joint UI, validation, polish and Vercel deployment | 2–4 days | **V1 accepted** |
| V2: MuJoCo model and physical control | 2–5 days | Stable physics |
| V2: WebSocket, Cartesian IK, gripper, trajectories and persistence | 4–8 days | **V2 accepted** |
| V3: calibrated fidelity and advanced control | Research-dependent | Metrics and experiments defined |

Estimates are indicative, not commitments. Official model conversion and gripper contact behavior may be the critical path.

## 12. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Xacro or `package://` assets fail in browser | Preprocess to URDF; explicitly resolve/copy mesh paths |
| Wrong joint order or axis signs | Named joint map and per-joint visual validation |
| V1 appears physically accurate when it is not | Persistent “Kinematic Preview” label and explicit exclusions |
| Browser and MuJoCo poses diverge | One canonical joint order, units and frame contract; backend state authoritative in V2 |
| Unstable gripper/contacts | Validate actuator/collision model; stage contact tests |
| Public Vercel site cannot access local Python server | Separate backend hosting or documented local-only mode |
| Unsafe future hardware controls | Adapter disabled by default; independent safety controls and review |
| V3 fidelity overstated | Require measured calibration and quantified validation |

## 13. Immediate next actions

1. Create the Git repository and initialize **V1 frontend only**.
2. Retrieve the official Gen3 Lite description, confirm its exact joint names and limits, preprocess Xacro and mesh references.
3. Implement the 3D viewer and six-joint state/control panel.
4. Run V1 checklist and deploy to Vercel.
5. Freeze/tag V1 before starting the Python/MuJoCo backend.

---

## References

- Kinova ROS 2 Kortex robot descriptions: https://github.com/Kinovarobotics/ros2_kortex/tree/main/kortex_description
- Kinova ROS 2 Kortex repository: https://github.com/Kinovarobotics/ros2_kortex
- Three.js: https://threejs.org/
- React Three Fiber: https://r3f.docs.pmnd.rs/
- Next.js: https://nextjs.org/docs
- MuJoCo: https://mujoco.readthedocs.io/
- FastAPI WebSockets: https://fastapi.tiangolo.com/advanced/websockets/

**Document maintenance:** Update this guide when the selected Kinova model revision, controller design, hosting configuration, or release acceptance criteria change.
