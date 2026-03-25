"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Shield } from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   IN-CAB MODE TOGGLE
   
   Activates OLED-black dark mode with enlarged touch targets,
   boosted contrast, and optional night-shift red filter
   for glare-free in-cab operation.
   ═══════════════════════════════════════════════════════════ */

export function CabModeToggle() {
  const [cabMode, setCabMode] = useState(false);
  const [nightShift, setNightShift] = useState(false);

  useEffect(() => {
    // Persist preference
    const saved = localStorage.getItem("hc-cab-mode");
    const savedNight = localStorage.getItem("hc-night-shift");
    if (saved === "true") setCabMode(true);
    if (savedNight === "true") setNightShift(true);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-cab-mode", String(cabMode));
    html.setAttribute("data-night-shift", String(nightShift));
    localStorage.setItem("hc-cab-mode", String(cabMode));
    localStorage.setItem("hc-night-shift", String(nightShift));
  }, [cabMode, nightShift]);

  return (
    <div className="flex items-center gap-2">
      {/* Cab Mode Toggle */}
      <button
        onClick={() => setCabMode(!cabMode)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
          cabMode
            ? "bg-accent/20 border border-accent/40 text-accent shadow-[0_0_12px_rgba(245,159,10,0.2)]"
            : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/20"
        }`}
        title="Toggle In-Cab Mode"
      >
        <Shield size={14} />
        <span className="hidden sm:inline">{cabMode ? "Cab Mode ON" : "Cab Mode"}</span>
      </button>

      {/* Night Shift (only visible when cab mode is on) */}
      {cabMode && (
        <button
          onClick={() => setNightShift(!nightShift)}
          className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
            nightShift
              ? "bg-red-500/20 border border-red-500/30 text-red-400"
              : "bg-white/5 border border-white/10 text-gray-400 hover:text-white"
          }`}
          title="Toggle Night Shift (red filter)"
        >
          {nightShift ? <Moon size={14} /> : <Sun size={14} />}
          <span className="hidden sm:inline">{nightShift ? "Night" : "Day"}</span>
        </button>
      )}
    </div>
  );
}
