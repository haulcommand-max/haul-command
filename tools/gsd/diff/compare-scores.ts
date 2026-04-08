export interface ScoreDelta {
  surfaceKey: string;
  beforeOverall: number | null;
  afterOverall: number | null;
  overallDelta: number | null;
  beforeSeo: number | null;
  afterSeo: number | null;
  seoDelta: number | null;
  beforeMoney: number | null;
  afterMoney: number | null;
  moneyDelta: number | null;
  beforeUx: number | null;
  afterUx: number | null;
  uxDelta: number | null;
  regression: boolean;
  introduced: boolean;
}

export function compareScores(baseScores: any[], headScores: any[]): ScoreDelta[] {
  const baseMap = new Map(baseScores.map((s) => [s.surfaceKey, s]));
  const headMap = new Map(headScores.map((s) => [s.surfaceKey, s]));
  const keys = new Set([...baseMap.keys(), ...headMap.keys()]);

  const deltas: ScoreDelta[] = [];

  for (const key of keys) {
    const before = baseMap.get(key) || null;
    const after = headMap.get(key) || null;

    const beforeOverall = before?.overallScore ?? null;
    const afterOverall = after?.overallScore ?? null;
    const beforeSeo = before?.seoScore ?? null;
    const afterSeo = after?.seoScore ?? null;
    const beforeMoney = before?.moneyScore ?? null;
    const afterMoney = after?.moneyScore ?? null;
    const beforeUx = before?.uxScore ?? null;
    const afterUx = after?.uxScore ?? null;

    deltas.push({
      surfaceKey: key,
      beforeOverall,
      afterOverall,
      overallDelta: beforeOverall !== null && afterOverall !== null ? afterOverall - beforeOverall : null,
      beforeSeo,
      afterSeo,
      seoDelta: beforeSeo !== null && afterSeo !== null ? afterSeo - beforeSeo : null,
      beforeMoney,
      afterMoney,
      moneyDelta: beforeMoney !== null && afterMoney !== null ? afterMoney - beforeMoney : null,
      beforeUx,
      afterUx,
      uxDelta: beforeUx !== null && afterUx !== null ? afterUx - beforeUx : null,
      regression: (
        (beforeOverall !== null && afterOverall !== null && afterOverall < beforeOverall) ||
        (beforeSeo !== null && afterSeo !== null && afterSeo < beforeSeo) ||
        (beforeMoney !== null && afterMoney !== null && afterMoney < beforeMoney) ||
        (beforeUx !== null && afterUx !== null && afterUx < beforeUx)
      ),
      introduced: before === null && after !== null,
    });
  }

  return deltas;
}
