"use client";

/**
 * components/hc-ask/HCAskChips.tsx
 *
 * Quick-query chips for HC Ask. Contextual presets for the current page.
 * Directory chips should route into the Haul Command directory/search data, not
 * force Google Places calls. Corridor chips remain place-discovery oriented.
 */

import React from "react";

interface Chip {
  label: string;
  icon: string;
}

const DIRECTORY_CHIPS: Chip[] = [
  { label: "Pilot Car Operators", icon: "🚨" },
  { label: "Escort Vehicles", icon: "🚙" },
  { label: "High-Pole Escorts", icon: "📏" },
  { label: "Permit Support", icon: "📋" },
  { label: "Route Survey", icon: "🗺️" },
  { label: "Traffic Control", icon: "🚧" },
  { label: "Staging Yards", icon: "🏗️" },
  { label: "Truck Stops", icon: "🚛" },
  { label: "Oversize Parking", icon: "🅿️" },
  { label: "Mobile Mechanics", icon: "🔧" },
  { label: "Port Support", icon: "⚓" },
  { label: "Weigh Stations", icon: "⚖️" },
];

const CORRIDOR_CHIPS: Chip[] = [
  { label: "Fuel Stops",        icon: "⛽" },
  { label: "Rest Areas",        icon: "🛑" },
  { label: "Hotels w/ Parking", icon: "🏨" },
  { label: "Weigh Stations",    icon: "⚖️" },
];

interface HCAskChipsProps {
  context?: "directory" | "corridor";
  onChipSelect: (label: string) => void;
  disabled?: boolean;
}

export function HCAskChips({ context = "directory", onChipSelect, disabled }: HCAskChipsProps) {
  const chips = context === "corridor" ? CORRIDOR_CHIPS : DIRECTORY_CHIPS;

  return (
    <div className="hc-ask-chips" role="group" aria-label="Quick search shortcuts">
      {chips.map(({ label, icon }) => (
        <button
          key={label}
          type="button"
          id={`hc-ask-chip-${label.toLowerCase().replace(/\s+/g, "-")}`}
          onClick={() => onChipSelect(label)}
          disabled={disabled}
          className="hc-ask-chip"
          aria-label={`Search for ${label}`}
        >
          <span className="hc-ask-chip-icon" aria-hidden="true">{icon}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
