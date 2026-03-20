/**
 * Haul Command — Nickname Generator
 * 
 * Generates rank-based nicknames with geographic context.
 * Used by the leaderboard system to create identity + competition.
 * 
 * Rules:
 * - Low rank → funny/disrespectful (social pressure)
 * - Mid rank → neutral/competent
 * - High rank → respected
 * - Elite → prestigious with corridor specificity
 */

const LOW_NAMES = [
  'Loose Chain Larry', 'Missed Turn Specialist', 'No Permit Pete',
  'Backhaul Bandit', 'Parking Lot Philosopher', 'Scale Dodger Jr.',
  'Late Again Logistics', "Should've Measured Mike", 'CB Radio Comedian',
  'Load Looker', 'Wrong Exit Willie', 'Expired Tag Eddie',
];

const MID_NAMES = [
  'Lane Grinder', 'Route Runner', 'Steel Mover', 'Night Shift Hauler',
  'Weekend Hauler', 'Flatbed Regular', 'Corridor Operator', 'Permit Player',
  'Scale House Survivor', 'Steady Eddie', 'Mile Marker Mike',
];

const HIGH_NAMES = [
  'Steel Runner', 'Oversize Operator', 'Lane Commander', 'Freight Mover',
  'Iron Carrier', 'Heavy Lane Commander', 'Multi-State Mover',
  'Night Hauler', 'Mountain Route Specialist', 'Corridor Ace',
];

const ELITE_NAMES = [
  'Corridor King', 'Route Dominator', 'Load Commander', 'Freight Authority',
  'Steel Authority', 'The Oversize Architect', 'National Load Commander',
];

const LEGEND_NAMES = [
  'The Backbone', 'Freight Myth', 'The Last Dispatcher You Call',
  'Global Lane Owner', 'The One Who Covers It',
];

const STYLE_TAGS = [
  'Night Shift', 'Backroads', 'Oversize Only', 'High Roller',
  'Last Minute Saver', 'All Weather', 'Highway King', 'Bridge Spotter',
];

interface NicknameInput {
  score: number;
  region?: string | null;
  corridor?: string | null;
  category?: string;
}

export function generateNickname({ score, region, corridor }: NicknameInput): string {
  let pool: string[];

  if (score >= 95) pool = LEGEND_NAMES;
  else if (score >= 85) pool = ELITE_NAMES;
  else if (score >= 65) pool = HIGH_NAMES;
  else if (score >= 40) pool = MID_NAMES;
  else pool = LOW_NAMES;

  const base = pool[Math.floor(Math.random() * pool.length)];
  const locationTag = corridor || region || 'Unknown Territory';

  return `${base} — ${locationTag}`;
}

export function getTierFromScore(score: number): string {
  if (score >= 95) return 'Legend';
  if (score >= 85) return 'Elite';
  if (score >= 70) return 'Respected';
  if (score >= 50) return 'Competent';
  if (score >= 30) return 'Rookie';
  return 'Greenhorn';
}

export function getTierColor(tier: string): string {
  const colors: Record<string, string> = {
    Legend: '#ff6b6b',
    Elite: '#a855f7',
    Respected: '#f5a623',
    Competent: '#3b82f6',
    Rookie: '#64748b',
    Greenhorn: '#475569',
  };
  return colors[tier] || '#64748b';
}

export function getStyleTag(): string {
  return STYLE_TAGS[Math.floor(Math.random() * STYLE_TAGS.length)];
}
