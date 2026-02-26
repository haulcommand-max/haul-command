/**
 * loadBoardIntel.ts
 * "The Intelligence Kernel"
 * Drop-in scoring + defaults for lane density, load quality, and fill-speed.
 *
 * NOW FEATURING: Deterministic Composite Scoring
 * Rank = (Rel * 0.35) + (Fill * 0.25) + (Dens * 0.20) + (Conf * 0.10) + (Fresh * 0.10)
 */

export type LoadRankInputs = {
  brokerReliability: number; // 0..100
  fillSpeed: number;         // 0..100
  laneDensity: number;       // 0..100
  corridorConfidence: number;// 0..100
  freshnessMin: number;      // minutes since posted
};

export type LoadRankResult = {
  score: number; // 0..1000
  reasons: string[];
  badges: string[];
};

export type Load = {
  id: string;
  origin: { city: string; metro?: string; admin1: string; country: string };
  destination: { city: string; metro?: string; admin1: string; country: string };
  serviceRequired: string;
};

// --- CORE SCORING ENGINE ---

export function calculateLoadRank(inputs: LoadRankInputs): LoadRankResult {
  const { brokerReliability, fillSpeed, laneDensity, corridorConfidence, freshnessMin } = inputs;

  // Normalize inputs to 0..1
  const rel = clamp01(brokerReliability / 100);
  const fill = clamp01(fillSpeed / 100);
  const dens = clamp01(laneDensity / 100);
  const conf = clamp01(corridorConfidence / 100);
  
  // Freshness decay (hot for 12 hours)
  // Maps 0 min -> 1.0, 720 min (12h) -> 0.0
  const freshness = clamp01(1 - (freshnessMin / (12 * 60)));

  // Deterministic Weighting
  // (Reliability * 0.35) + (FillSpeed * 0.25) + (LaneDensity * 0.20) + (Corridor * 0.10) + (Freshness * 0.10)
  const rawScore = 
    (rel * 0.35) +
    (fill * 0.25) +
    (dens * 0.20) +
    (conf * 0.10) +
    (freshness * 0.10);

  const finalScore = Math.round(rawScore * 1000); // 0..1000 scale
  const reasons: string[] = [];
  const badges: string[] = [];

  // Metadata & Badge Generation
  if (rel > 0.8) reasons.push("broker:gold");
  
  if (fill > 0.75) { 
      reasons.push("fill_speed:high"); 
      badges.push("FAST-FILL"); 
  } else if (fill < 0.3) {
      reasons.push("fill_speed:slow");
  }

  if (dens > 0.8) {
      badges.push("HOT LANE");
  } else if (dens < 0.2) {
      reasons.push("lane:cold");
  }

  if (freshness > 0.9) {
      badges.push("NEW");
  }

  // --- EMERGING FALLBACK LOGIC ---
  // If we have little data (low score) but it's brand new and not explicitly "bad",
  // we treat it as "Emerging" rather than "Garbage".
  // Rules: Score < 300 AND Freshness > 90% (new) AND Reliability > 0 (not blocked)
  if (finalScore < 300 && freshness > 0.9 && rel > 0.1) {
      reasons.push("status:emerging");
      badges.push("EMERGING"); // UI can style this neutrally/positively
  }

  return {
    score: finalScore,
    reasons,
    badges
  };
}

// --- IDENTITY HELPERS ---

export function laneKey(l: Load): string {
  const o = (l.origin.metro ?? l.origin.city).toLowerCase();
  const d = (l.destination.metro ?? l.destination.city).toLowerCase();
  return `${l.origin.country}:${l.origin.admin1}:${o}__${l.destination.country}:${l.destination.admin1}:${d}__${l.serviceRequired}`;
}

// ------- MATH HELPERS -------

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

export function round3(x: number): number {
  return Math.round(x * 1000) / 1000;
}

export function minutesSince(iso: string): number {
  const t = Date.parse(iso);
  if (isNaN(t)) return 999999;
  return Math.max(0, Math.floor((Date.now() - t) / 60000));
}
