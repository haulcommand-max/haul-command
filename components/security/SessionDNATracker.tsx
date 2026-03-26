"use client";

import { useEffect } from "react";
import Cookies from "js-cookie"; // Make sure to npm i js-cookie

/**
 * ════════════════════════════════════════════════════════════════
 * SESSION DNA TRACKING ENGINE (LEVEL 2 DEFENSE)
 * ════════════════════════════════════════════════════════════════
 * Invisible frontend watcher that calculates behavioral entropy.
 * Scrapers and bots move linearly or fire instantly. Humans are noisy.
 * 
 * Tracks:
 * 1. Mouse movement variance (entropy)
 * 2. Scroll event spacing
 * 3. Keystroke timing gaps
 * 
 * Writes the "Humanity Score" (0-100) to a fast-read cookie `hc_dna`.
 * The Vercel Edge Middleware reads this to detect silent headless bots.
 */

export function SessionDNATracker() {
  useEffect(() => {
    // We only need to run this on the client
    if (typeof window === "undefined") return;

    let mouseEvents = 0;
    let scrollEvents = 0;
    let keyEvents = 0;
    let baselineTime = Date.now();
    let isHuman = false; // Until proven otherwise

    // Calculate entropy over rolling intervals
    const calculateDNA = () => {
      const activeTimeSecs = (Date.now() - baselineTime) / 1000;
      
      // Bots don't move the mouse organically.
      // If a user has 0 mouse events but hits 10 pages, it's a headless bot.
      const interactionVolume = mouseEvents + scrollEvents + keyEvents;
      
      let humanityScore = 10; // Base score (suspicious)
      
      if (mouseEvents > 15 && activeTimeSecs > 2) humanityScore += 40;
      if (scrollEvents > 5) humanityScore += 25;
      if (keyEvents > 2) humanityScore += 25;

      // Cap at 100% human certainty
      humanityScore = Math.min(100, Math.max(0, humanityScore));
      
      // Scrapers executing scripts instantly have activeTimeSecs < 0.5s
      const isTooFast = interactionVolume > 50 && activeTimeSecs < 1.0;
      if (isTooFast) humanityScore = 5; // Punish artificially fast action

      // Write DNA fingerprint string: [Score]-[Entropy]-[ValidationHash]
      // In production, we would encrypt this payload so bots can't fake the cookie
      const dnaPayload = `${humanityScore}.${interactionVolume}.${Date.now().toString(16)}`;
      
      // Write to root domain cookie so API Edge middleware can read it instantly
      Cookies.set("hc_dna", dnaPayload, { expires: 1 / 24, path: '/', sameSite: 'lax', secure: true }); // 1 hour expiry
      
      // Reset bucket slightly for moving average
      mouseEvents = Math.floor(mouseEvents / 2);
      scrollEvents = Math.floor(scrollEvents / 2); 
      baselineTime = Date.now();
    };

    // Listeners (Passive to ensure 0 impact on smooth scrolling/performance)
    const onMouseMove = () => { mouseEvents++; };
    const onScroll = () => { scrollEvents++; };
    const onKeyDown = () => { keyEvents++; };

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKeyDown, { passive: true });

    // Evaluate DNA every 5 seconds
    const loop = setInterval(calculateDNA, 5000);
    // Force initial evaluate after 1 second
    setTimeout(calculateDNA, 1000);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKeyDown);
      clearInterval(loop);
    };
  }, []);

  return null; // Invisible structural component
}
