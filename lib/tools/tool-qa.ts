export type ToolQaRouteStatus = number | string | null | undefined;

export type ToolQaRow = {
  page_url?: string | null;
  route_status?: ToolQaRouteStatus;
  qa_status?: string | null;
  content_status?: string | null;
  indexing_status?: string | null;
  canonical_tool_slug?: string | null;
  source_confidence?: string | null;
  last_verified_at?: string | null;
  last_crawled_at?: string | null;
  coverage_verified?: boolean | null;
};

export const TOOL_INDEXING_STATUS = {
  indexableFlagship: "indexable_flagship",
  canonicalChild: "canonical_child",
  noindexInteractive: "noindex_interactive",
  comingSoon: "coming_soon",
  retired: "retired",
} as const;

export function isRouteStatusOk(routeStatus: ToolQaRouteStatus): boolean {
  return routeStatus === 200 || routeStatus === "200";
}

export function isToolVerifiedOpen(row: ToolQaRow): boolean {
  return Boolean(
    row.page_url &&
      isRouteStatusOk(row.route_status) &&
      row.qa_status === "pass" &&
      row.content_status === "valid"
  );
}

export function isToolSchemaEligible(row: ToolQaRow): boolean {
  if (!isToolVerifiedOpen(row)) return false;

  return (
    row.indexing_status === TOOL_INDEXING_STATUS.indexableFlagship ||
    row.indexing_status === TOOL_INDEXING_STATUS.canonicalChild
  );
}

export function isToolIndexable(row: ToolQaRow): boolean {
  if (!isToolVerifiedOpen(row)) return false;

  return (
    row.indexing_status === TOOL_INDEXING_STATUS.indexableFlagship ||
    row.indexing_status === TOOL_INDEXING_STATUS.canonicalChild
  );
}

export function toolCtaLabel(row: ToolQaRow): "Open Tool" | "In Development" {
  return isToolVerifiedOpen(row) ? "Open Tool" : "In Development";
}
