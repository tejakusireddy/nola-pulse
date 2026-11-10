"use client";
import { useState, useSyncExternalStore } from "react";
import Image from "next/image";

export type Franchise = "Pelicans" | "Saints";

function subscribeToStorage(notify: () => void) {
  window.addEventListener("storage", notify);
  return () => window.removeEventListener("storage", notify);
}
function savedFranchise(): Franchise {
  try {
    return localStorage.getItem("nola-franchise") === "Saints"
      ? "Saints"
      : "Pelicans";
  } catch {
    return "Pelicans";
  }
}
export function useSelectedFranchise(): [Franchise, (team: Franchise) => void] {
  const saved = useSyncExternalStore(
    subscribeToStorage,
    savedFranchise,
    () => "Pelicans" as Franchise,
  );
  const [selection, setSelection] = useState<Franchise | null>(null);
  return [
    selection ?? saved,
    (team) => {
      setSelection(team);
      try {
        localStorage.setItem("nola-franchise", team);
      } catch {
        /* Selection still works when storage is unavailable. */
      }
    },
  ];
}

export default function FranchiseSwitch({
  selected,
  preview,
  onPreview,
  onSelect,
}: {
  selected: Franchise;
  preview: Franchise | null;
  onPreview: (team: Franchise | null) => void;
  onSelect: (team: Franchise) => void;
}) {
  return (
    <div className="franchise-control">
      <div
        className="franchise-switch"
        role="group"
        aria-label="Choose franchise"
      >
        {(["Pelicans", "Saints"] as const).map((team) => (
          <button
            key={team}
            aria-pressed={selected === team}
            aria-label={`Select New Orleans ${team}`}
            className={
              (preview ?? selected) === team
                ? "team-option active"
                : "team-option"
            }
            onMouseEnter={() => onPreview(team)}
            onMouseLeave={(e) => {
              if (document.activeElement !== e.currentTarget) onPreview(null);
            }}
            onFocus={() => onPreview(team)}
            onBlur={() => onPreview(null)}
            onClick={() => onSelect(team)}
          >
            <Image
              unoptimized
              src={`/brand/${team.toLowerCase()}.svg`}
              alt=""
              width="44"
              height="44"
            />
            <span>
              <small>NEW ORLEANS</small>
              <strong>{team}</strong>
            </span>
            <span className="selection-mark" aria-hidden="true" />
          </button>
        ))}
      </div>
      <span className="switch-hint" aria-live="polite">
        {preview && preview !== selected
          ? `Previewing ${preview} · select to keep`
          : "Hover to explore · select to keep"}
      </span>
    </div>
  );
}
