export interface GapComparisonResult {
  introduced: any[];
  resolved: any[];
  unchanged: any[];
}

function keyForGap(gap: any): string {
  return `${gap.surfaceKey || gap.label || gap.sourcePath || "unknown"}::${gap.reason || ""}`;
}

export function compareGapLists(baseList: any[], headList: any[]): GapComparisonResult {
  const baseMap = new Map(baseList.map((item) => [keyForGap(item), item]));
  const headMap = new Map(headList.map((item) => [keyForGap(item), item]));

  const introduced = [...headMap.entries()]
    .filter(([key]) => !baseMap.has(key))
    .map(([, item]) => item);

  const resolved = [...baseMap.entries()]
    .filter(([key]) => !headMap.has(key))
    .map(([, item]) => item);

  const unchanged = [...headMap.entries()]
    .filter(([key]) => baseMap.has(key))
    .map(([, item]) => item);

  return {
    introduced,
    resolved,
    unchanged,
  };
}
