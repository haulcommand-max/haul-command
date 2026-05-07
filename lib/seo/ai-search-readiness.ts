export type AiSearchReadinessBooleanKey =
  | 'hasShortAnswerBlock'
  | 'hasSourceTrail'
  | 'hasLastReviewedDate'
  | 'hasRelatedTerms'
  | 'hasRelatedTraining'
  | 'hasSchemaJsonLd'
  | 'hasScopeWarning'
  | 'hasCommercialCta'
  | 'hasCanonicalUrl'
  | 'hasInternalLinks';

export type AiSearchReadinessNumericKey =
  | 'fanoutCoverageScore'
  | 'freshnessScore'
  | 'consensusScore'
  | 'authoritySourceScore';

export interface AiSearchReadinessInput {
  pageUrl: string;
  pageType: string;
  countryCode?: string | null;
  regionCode?: string | null;
  parentPrompt?: string | null;
  expectedFanoutSubtopics?: string[];
  coveredFanoutSubtopics?: string[];
  checks: Record<AiSearchReadinessBooleanKey, boolean>;
  scores?: Partial<Record<AiSearchReadinessNumericKey, number>>;
}

export interface AiSearchReadinessResult {
  pageUrl: string;
  pageType: string;
  totalScore: number;
  status: 'elite' | 'pass' | 'needs_work' | 'incomplete';
  missingRequired: AiSearchReadinessBooleanKey[];
  missingFanoutSubtopics: string[];
  recommendations: string[];
}

const BOOLEAN_WEIGHTS: Record<AiSearchReadinessBooleanKey, number> = {
  hasShortAnswerBlock: 12,
  hasSourceTrail: 12,
  hasLastReviewedDate: 8,
  hasRelatedTerms: 7,
  hasRelatedTraining: 7,
  hasSchemaJsonLd: 10,
  hasScopeWarning: 7,
  hasCommercialCta: 7,
  hasCanonicalUrl: 8,
  hasInternalLinks: 7,
};

const NUMERIC_WEIGHTS: Record<AiSearchReadinessNumericKey, number> = {
  fanoutCoverageScore: 8,
  freshnessScore: 4,
  consensusScore: 5,
  authoritySourceScore: 5,
};

const REQUIRED_CHECKS: AiSearchReadinessBooleanKey[] = [
  'hasShortAnswerBlock',
  'hasSourceTrail',
  'hasLastReviewedDate',
  'hasSchemaJsonLd',
  'hasScopeWarning',
  'hasCommercialCta',
  'hasCanonicalUrl',
];

function clampScore(score: number) {
  if (Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, score));
}

function normalizeScore(score: number | undefined) {
  return clampScore(score ?? 0) / 100;
}

function fanoutCoverage(expected: string[] = [], covered: string[] = []) {
  if (expected.length === 0) return 0;
  const coveredSet = new Set(covered.map((item) => item.toLowerCase().trim()));
  const matched = expected.filter((item) => coveredSet.has(item.toLowerCase().trim())).length;
  return Math.round((matched / expected.length) * 100);
}

export function scoreAiSearchReadiness(input: AiSearchReadinessInput): AiSearchReadinessResult {
  const missingRequired = REQUIRED_CHECKS.filter((key) => !input.checks[key]);
  const computedFanoutScore = fanoutCoverage(input.expectedFanoutSubtopics, input.coveredFanoutSubtopics);
  const numericScores: Partial<Record<AiSearchReadinessNumericKey, number>> = {
    ...input.scores,
    fanoutCoverageScore: input.scores?.fanoutCoverageScore ?? computedFanoutScore,
  };

  let totalScore = 0;

  for (const [key, weight] of Object.entries(BOOLEAN_WEIGHTS) as [AiSearchReadinessBooleanKey, number][]) {
    if (input.checks[key]) totalScore += weight;
  }

  for (const [key, weight] of Object.entries(NUMERIC_WEIGHTS) as [AiSearchReadinessNumericKey, number][]) {
    totalScore += normalizeScore(numericScores[key]) * weight;
  }

  const expected = input.expectedFanoutSubtopics ?? [];
  const coveredSet = new Set((input.coveredFanoutSubtopics ?? []).map((item) => item.toLowerCase().trim()));
  const missingFanoutSubtopics = expected.filter((item) => !coveredSet.has(item.toLowerCase().trim()));

  const recommendations: string[] = [];
  if (!input.checks.hasShortAnswerBlock) recommendations.push('Add an AI-citable short answer block in the first screen of the page.');
  if (!input.checks.hasSourceTrail) recommendations.push('Add visible official/source-backed references and avoid unsupported compliance claims.');
  if (!input.checks.hasLastReviewedDate) recommendations.push('Add a visible last-reviewed date and wire it to source freshness.');
  if (!input.checks.hasSchemaJsonLd) recommendations.push('Emit JSON-LD that matches page type: Article, FAQPage, DefinedTerm, Course, BreadcrumbList, or LocalBusiness.');
  if (!input.checks.hasScopeWarning) recommendations.push('Add country/state scope warning so U.S., Florida, and global claims do not blur together.');
  if (!input.checks.hasCommercialCta) recommendations.push('Add a matching commercial CTA: claim listing, browse directory, start training, post load, sponsor, or data product.');
  if (!input.checks.hasInternalLinks) recommendations.push('Add internal links to glossary, training, tools, directory, regulations, and corridor pages.');
  if (missingFanoutSubtopics.length > 0) recommendations.push(`Cover missing fanout subtopics: ${missingFanoutSubtopics.slice(0, 8).join(', ')}${missingFanoutSubtopics.length > 8 ? '…' : ''}.`);

  let status: AiSearchReadinessResult['status'] = 'incomplete';
  if (totalScore >= 95 && missingRequired.length === 0) status = 'elite';
  else if (totalScore >= 85 && missingRequired.length === 0) status = 'pass';
  else if (totalScore >= 65) status = 'needs_work';

  return {
    pageUrl: input.pageUrl,
    pageType: input.pageType,
    totalScore: Math.round(totalScore),
    status,
    missingRequired,
    missingFanoutSubtopics,
    recommendations,
  };
}

export function assertAiSearchReady(input: AiSearchReadinessInput, threshold = 85) {
  const result = scoreAiSearchReadiness(input);
  if (result.totalScore < threshold || result.missingRequired.length > 0) {
    throw new Error(
      `AI search readiness failed for ${input.pageUrl}: score=${result.totalScore}, missing=${result.missingRequired.join(', ') || 'none'}, recommendations=${result.recommendations.join(' | ')}`,
    );
  }
  return result;
}
