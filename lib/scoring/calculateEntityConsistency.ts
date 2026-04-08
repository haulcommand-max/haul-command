/**
 * Entity Consistency Score Calculator
 * 
 * Detects mismatches between what a profile claims, what its pages show,
 * what reviews say, and what attributes assert. Inconsistency kills
 * AI-search trust and ranking confidence.
 * 
 * Weights from canonical spec:
 *   profile_vs_services: 0.18
 *   services_vs_pages: 0.18
 *   pages_vs_reviews: 0.12
 *   reviews_vs_attributes: 0.12
 *   attributes_vs_queries: 0.12
 *   glossary_vs_usage: 0.08
 *   country_render_vs_language: 0.10
 *   currency_render_vs_region: 0.10
 */

export interface EntityConsistencyInput {
  /** 0-1 ratio: how many declared services have matching pages */
  profileVsServicesMatch: number;
  /** 0-1 ratio: how many service pages link back to entity */
  servicesVsPagesMatch: number;
  /** 0-1 ratio: how many review attributes align with page content */
  pagesVsReviewsMatch: number;
  /** 0-1 ratio: how many review-extracted attrs match declared attrs */
  reviewsVsAttributesMatch: number;
  /** 0-1 ratio: query coverage vs declared attributes */
  attributesVsQueriesMatch: number;
  /** 0-1 ratio: glossary terms used correctly in content */
  glossaryVsUsageMatch: number;
  /** 0-1 ratio: pages rendered in correct country language */
  countryRenderMatch: number;
  /** 0-1 ratio: currency rendered for correct region */
  currencyRenderMatch: number;
}

export interface EntityConsistencyOutput {
  score: number;
  band: string;
  conflicts: string[];
}

export function calculateEntityConsistency(input: EntityConsistencyInput): EntityConsistencyOutput {
  const conflicts: string[] = [];

  const score = Math.round(
    (input.profileVsServicesMatch * 0.18 +
      input.servicesVsPagesMatch * 0.18 +
      input.pagesVsReviewsMatch * 0.12 +
      input.reviewsVsAttributesMatch * 0.12 +
      input.attributesVsQueriesMatch * 0.12 +
      input.glossaryVsUsageMatch * 0.08 +
      input.countryRenderMatch * 0.10 +
      input.currencyRenderMatch * 0.10) *
      100 *
      100
  ) / 100;

  if (input.profileVsServicesMatch < 0.5) conflicts.push("Profile declares services not reflected in service pages.");
  if (input.servicesVsPagesMatch < 0.5) conflicts.push("Service pages exist that profile doesn't reference.");
  if (input.pagesVsReviewsMatch < 0.5) conflicts.push("Reviews mention capabilities not present on pages.");
  if (input.reviewsVsAttributesMatch < 0.5) conflicts.push("Review-extracted attributes don't match declared attributes.");
  if (input.attributesVsQueriesMatch < 0.3) conflicts.push("Declared attributes don't cover actual user queries.");
  if (input.countryRenderMatch < 0.8) conflicts.push("Country rendering leaks wrong language or terminology.");
  if (input.currencyRenderMatch < 0.8) conflicts.push("Currency rendering incorrect for region.");

  let band = "thin";
  if (score >= 90) band = "dominant";
  else if (score >= 75) band = "strong";
  else if (score >= 60) band = "improvable";
  else if (score >= 40) band = "weak";

  return { score, band, conflicts };
}
