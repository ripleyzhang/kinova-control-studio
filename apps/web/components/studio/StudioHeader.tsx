"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";

const subscribe = () => () => {};

export default function StudioHeader() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);

  return (
    <header className="studio-header">
      <div className="studio-brand">
        <svg className="brand-icon" width="34" height="34" viewBox="0 0 34 34" fill="none" aria-hidden="true">
          <path d="M17 5 28 11v12l-11 6-11-6V11zM6 11l11 6 11-6M17 17v12" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
          <circle cx="17" cy="17" r="2" fill="currentColor" />
        </svg>
        <div>
          <h1>Kinova Control Studio</h1>
          <p className="technical muted">Gen3 Lite / 6-DOF</p>
        </div>
      </div>
      <div className="studio-header-actions">
        <span className="preview-badge technical">Kinematic preview</span>
        <div className="theme-switch" role="group" aria-label="Color theme">
          {(["light", "dark"] as const).map((theme) => (
            <button
              key={theme}
              type="button"
              aria-pressed={mounted && resolvedTheme === theme}
              onClick={() => setTheme(theme)}
            >
              {theme === "light" ? "Light" : "Dark"}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
