import type { HCTruthSignal } from './truthTypes';

const INTENT_RULES: Array<{ pattern: RegExp; tag: string }> = [
  { pattern: /insurance|coverage/i, tag: 'commercial-insurance' },
  { pattern: /deadhead|fuel/i, tag: 'fuel-card' },
  { pattern: /hotel|lodging|overnight/i, tag: 'lodging' },
  { pattern: /equipment|gear|route_ready|routeready/i, tag: 'pilot-car-equipment' },
  { pattern: /credential|training|certification|witpac/i, tag: 'training-certification' },
  { pattern: /payer|payment|escrow|deposit|fast_pay|fast-pay/i, tag: 'escrow-fast-pay' },
  { pattern: /invoice|factoring|bookkeeping|tax/i, tag: 'factoring-bookkeeping' },
];

export function getAdgridIntentTags(signals: HCTruthSignal[]): string[] {
  const tags = new Set<string>();

  for (const signal of signals) {
    const haystack = `${signal.key} ${signal.label} ${signal.publicSummary}`;
    for (const rule of INTENT_RULES) {
      if (rule.pattern.test(haystack)) tags.add(rule.tag);
    }
  }

  return [...tags];
}
