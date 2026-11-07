# Gen3 Lite model validation — Level 3

## Provenance and selection

- Official repository: https://github.com/Kinovarobotics/ros2_kortex
- Requested source: https://github.com/Kinovarobotics/ros2_kortex/tree/main/kortex_description
- Pinned revision: `b2aa46b29ae8fadd5b293c57e3500925c61eb8e8`. No moving-branch dependency at runtime.
- Entry: `kortex_description/robots/gen3_lite_gen3_lite_2f.xacro`.
- Configuration: `arm=gen3_lite`, `dof=6`, `gripper=gen3_lite_2f`, `vision=false`, empty prefix; official defaults, no simulation flags enabled.
- Source arm macro: https://github.com/Kinovarobotics/ros2_kortex/blob/b2aa46b29ae8fadd5b293c57e3500925c61eb8e8/kortex_description/arms/gen3_lite/6dof/urdf/gen3_lite_macro.xacro
- Exact original Xacro dependency files and package metadata are retained under `packages/robot-description/upstream/`; expanded source is `packages/robot-description/expanded.urdf`.
- `package.xml` declares BSD. The root LICENSE contains Kinova's BSD three-clause terms plus a Protocol Buffer notice. The complete unmodified LICENSE is retained both beside the source snapshot and beside the public assets. No separate license file was found in the selected Gen3 Lite arm/gripper directories; no Robotiq assets are included.

## Processing decisions

Used Python Xacro **2.1.1** with PyYAML **6.0.3** in an isolated temporary environment, without a ROS server. Resolve `$(find kortex_description)` to the staged local package directory before expansion; no numeric Xacro expressions are manually evaluated.

The official entry initially fails with `Invalid parameter "gripper"` in `load_arm`: `robots/kortex_robot.xacro` passes `gripper="${gripper}"` to a macro that does not declare or reference that parameter. The preparation script removes exactly that single unused argument in the staged copy. Original source files remain unchanged; all links, joints, origins, axes, limits, inertias and mimic definitions are preserved and compared structurally after processing.

The committed upstream `robots/gen3_lite.urdf` is NOT used: its arm limits differ from the selected revision's Xacro (J1–J3 ±2.69, J4/J6 ±2.59, J5 ±2.57 radians). The ROS control metadata also contains a different limit set. V1 uses the kinematic `<joint><limit>` entries from the current arm macro, shown below; these are model limits, not independently verified hardware limits.

Browser `robot.urdf` retains only top-level links, joints and materials; ROS control and Gazebo execution metadata are omitted. This creates no backend or hardware integration. All `package://` arm references and `file://` gripper references are rewritten to root-relative `/robots/gen3-lite/meshes/...` URLs, retaining source directory structure and case-sensitive `.STL` names. Original mesh bytes are copied unchanged and SHA-256 hashes are recorded in `provenance.json`.

## Canonical arm joint mapping

Exactly these six revolute arm joints are controlled in future V1 levels. Axis vectors are expressed in each **joint's local frame after the origin transform**, not the world frame. Positive angles follow the right-hand rule. Internal units are radians; degrees below are rounded display conversions, not replacement limits.

| UI | Official joint | Parent → child | Local axis XYZ | Lower / upper (rad) | Lower / upper (deg, approx.) | Velocity (rad/s) | Effort (N·m) |
|---|---|---|---|---|---|---|---|
| J1 | `joint_1` | `base_link` → `shoulder_link` | `0 0 1` | -2.68 / 2.68 | -153.553 / 153.553 | 1.6 | 10 |
| J2 | `joint_2` | `shoulder_link` → `arm_link` | `0 0 1` | -2.61 / 2.61 | -149.542 / 149.542 | 1.6 | 14 |
| J3 | `joint_3` | `arm_link` → `forearm_link` | `0 0 1` | -2.61 / 2.61 | -149.542 / 149.542 | 1.6 | 10 |
| J4 | `joint_4` | `forearm_link` → `lower_wrist_link` | `0 0 1` | -2.6 / 2.6 | -148.969 / 148.969 | 1.6 | 7 |
| J5 | `joint_5` | `lower_wrist_link` → `upper_wrist_link` | `0 0 1` | -2.53 / 2.53 | -144.958 / 144.958 | 1.6 | 7 |
| J6 | `joint_6` | `upper_wrist_link` → `end_effector_link` | `0 0 1` | -2.6 / 2.6 | -148.969 / 148.969 | 3.2 | 7 |

Velocity and effort are recorded for provenance only; V1 does not simulate them.

| Joint | Origin XYZ (m, in parent frame) | Origin RPY (rad) |
|---|---|---|
| `joint_1` | `0 0 0.12825` | `0 0 0` |
| `joint_2` | `0 -0.03 0.115` | `1.5708 0 0` |
| `joint_3` | `0 0.28 0` | `-3.1416 0 0` |
| `joint_4` | `0 -0.14 0.02` | `1.5708 0 0` |
| `joint_5` | `0.0285 0 0.105` | `0 1.5708 0` |
| `joint_6` | `-0.105 0 0.0285` | `0 -1.5708 0` |

## Preserved hierarchy and gripper exclusion

`world` → fixed `base_joint` → `base_link` → J1–J6 chain above → `end_effector_link` → fixed `end_effector` → `dummy_link`.

`dummy_link` branches to `tool_frame` through fixed `tool_frame_joint` and to `gripper_base_link` through fixed `gripper_base_joint`. The tool frame's official transform is XYZ `(0,0,0.130)` m, RPY `(0,0,1.57079632679)` rad. The world-to-base transform is identity. The model uses meters and radians, with the base Z direction vertical; no root rotation or mesh scale override is applied.

Four additional revolute joints belong ONLY to the gripper: `right_finger_bottom_joint`, `right_finger_tip_joint`, `left_finger_bottom_joint`, `left_finger_tip_joint`. The latter three preserve their official mimic relationships to `right_finger_bottom_joint`. None belongs to J1–J6 and none is exposed as a control in this level. A future renderer must honor mimic offsets even when the driving gripper joint is held at zero; these definitions are not flattened or discarded.

## Verification and reproduction

Read-only validation (Python standard library only):

```sh
python3 scripts/prepare_robot_assets.py
```

Regenerate from official source:

```sh
git clone https://github.com/Kinovarobotics/ros2_kortex.git /tmp/ros2_kortex
git -C /tmp/ros2_kortex checkout b2aa46b29ae8fadd5b293c57e3500925c61eb8e8
python3 -m venv /tmp/kinova-xacro
/tmp/kinova-xacro/bin/pip install xacro==2.1.1 pyyaml==6.0.3
/tmp/kinova-xacro/bin/python scripts/prepare_robot_assets.py --source /tmp/ros2_kortex
```

Verified locally:

- 15 links and 14 joints form one connected tree rooted at `world`; no duplicate names or multiple parents.
- Exactly six named arm joints, all revolute, with explicit axes and finite positional limits containing zero.
- 11 visual mesh references resolve to 11 unique official binary STL files; collision references also resolve to the same files.
- Copied meshes match source SHA-256 checksums; binary STL sizes match their triangle counts.
- All link/joint structures match expanded Xacro, allowing only mesh URI changes.
- No unresolved Xacro, package or file paths remain in browser URDF.

Not verified in Level 3: visual appearance, rendered scale, articulated motion, browser URDF-loader parsing, hardware limits or physical behavior. No viewer integration has been changed.
