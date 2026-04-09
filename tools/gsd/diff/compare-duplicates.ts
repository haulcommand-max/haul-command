export function compareDuplicates(baseRisks: any[], headRisks: any[]) {
  const key = (risk: any) => `${risk.type || "risk"}::${risk.label || "unknown"}::${risk.reason || ""}`;

  const baseMap = new Map(baseRisks.map((r) => [key(r), r]));
  const headMap = new Map(headRisks.map((r) => [key(r), r]));

  const introduced = [...headMap.entries()]
    .filter(([k]) => !baseMap.has(k))
    .map(([, v]) => v);

  const resolved = [...baseMap.entries()]
    .filter(([k]) => !headMap.has(k))
    .map(([, v]) => v);

  const unchanged = [...headMap.entries()]
    .filter(([k]) => baseMap.has(k))
    .map(([, v]) => v);

  return {
    introduced,
    resolved,
    unchanged,
  };
}
