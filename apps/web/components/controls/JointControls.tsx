"use client";

import { useState } from "react";
import { ARM_JOINTS, type ArmJoint } from "@/lib/robot-config";
import { useStudioStore } from "@/stores/studioStore";
import { useRobotStore } from "@/stores/robotStore";

const toDegrees = (radians: number) => radians * (180 / Math.PI);
const toRadians = (degrees: number) => degrees * (Math.PI / 180);
const format = (radians: number) => String(Number(toDegrees(radians).toFixed(3)));

function JointControl({ joint }: { joint: ArmJoint }) {
  const radians = useRobotStore((state) => state.positions[joint.name]);
  const setPosition = useRobotStore((state) => state.setPosition);
  const selected = useStudioStore((state) => state.selectedJoint === joint.name);
  const selectJoint = useStudioStore((state) => state.selectJoint);
  const [draft, setDraft] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");

  function commit() {
    if (draft === null) return;
    const value = draft.trim();
    const degrees = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) ? Number(value) : NaN;
    const requested = toRadians(degrees);
    const applied = setPosition(joint.name, requested);
    if (applied === undefined) {
      setFeedback("Enter a valid angle in degrees. Previous angle kept.");
    } else if (applied !== requested) {
      setFeedback(`Limited to ${format(applied)}°.`);
    }
    setDraft(null);
  }

  return (
    <div className="joint-row" data-selected={selected} onFocus={() => selectJoint(joint.name)}>
      <button
        type="button"
        className="joint-select"
        aria-label={`Select ${joint.label}`}
        aria-pressed={selected}
        onClick={() => selectJoint(joint.name)}
      >
        {joint.label}
      </button>
      <input
        id={`${joint.name}-slider`}
        type="range"
        aria-label={joint.label}
        aria-describedby={`${joint.name}-limits`}
        className="joint-slider"
        min={toDegrees(joint.min)}
        max={toDegrees(joint.max)}
        step="any"
        value={toDegrees(radians)}
        aria-valuetext={`${format(radians)} degrees`}
        onChange={(event) => {
          selectJoint(joint.name);
          setPosition(joint.name, toRadians(event.currentTarget.valueAsNumber));
          setDraft(null);
          setFeedback("");
        }}
      />
      <div className="angle-field">
        <input
          type="text"
          inputMode="decimal"
          aria-label={`${joint.label} angle in degrees`}
          aria-describedby={`${joint.name}-limits ${joint.name}-feedback`}

          value={draft ?? format(radians)}
          onChange={(event) => { setDraft(event.currentTarget.value); setFeedback(""); }}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur();
            if (event.key === "Escape") { setDraft(null); setFeedback(""); }
          }}
        />
        <span aria-hidden="true">°</span>
      </div>
      <p id={`${joint.name}-limits`} className="joint-limits numerals">
        <span>{format(joint.min)}°</span>
        <span>{format(joint.max)}°</span>
      </p>
      <p id={`${joint.name}-feedback`} role="status" className="joint-feedback">{feedback}</p>
    </div>
  );
}

function SelectedJointDetails() {
  const selected = useStudioStore((state) => state.selectedJoint);
  const joint = ARM_JOINTS.find((entry) => entry.name === selected) ?? ARM_JOINTS[0];
  const angle = useRobotStore((state) => state.positions[joint.name]);

  return (
    <section className="joint-details" aria-labelledby="selected-joint-title">
      <div className="joint-details-heading">
        <h3 id="selected-joint-title" className="technical muted">Selected joint</h3>
        <span className="numerals"><strong>{joint.label}</strong> / {joint.name}</span>
      </div>
      <dl>
        <div><dt>Angle</dt><dd>{format(angle)}°</dd></div>
        <div><dt>Minimum</dt><dd>{format(joint.min)}°</dd></div>
        <div><dt>Maximum</dt><dd>{format(joint.max)}°</dd></div>
      </dl>
    </section>
  );
}

export default function JointControls({ disabled }: { disabled: boolean }) {
  const [editVersion, setEditVersion] = useState(0);
  const restoreInitialPose = useRobotStore((state) => state.restoreInitialPose);
  const selectJoint = useStudioStore((state) => state.selectJoint);

  function restore(resetSelection: boolean) {
    restoreInitialPose();
    setEditVersion((version) => version + 1);
    if (resetSelection) selectJoint("joint_1");
  }

  return (
    <section className="joint-panel" aria-labelledby="arm-joints-title">
      <header className="joint-panel-heading">
        <h2 id="arm-joints-title">Joint Control</h2>
        <p className="technical muted">6-DOF · Position Control</p>
      </header>
      <fieldset key={editVersion} disabled={disabled} className="joint-list">
        <legend className="sr-only">Arm joint angles in degrees</legend>
        {ARM_JOINTS.map((joint) => <JointControl key={joint.name} joint={joint} />)}
      </fieldset>
      <SelectedJointDetails />
      <div className="joint-actions">
        <button type="button" className="home-button" disabled={disabled} onClick={() => restore(false)}>Home</button>
        <button type="button" disabled={disabled} onClick={() => restore(true)}>Reset</button>
      </div>
    </section>
  );
}
