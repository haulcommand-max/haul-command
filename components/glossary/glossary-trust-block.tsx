export function GlossaryTrustBlock({
  confidenceState,
  freshnessState,
  reviewedAt,
  nextReviewDue,
  sourceCount,
}: {
  confidenceState?: string | null;
  freshnessState?: string | null;
  reviewedAt?: string | null;
  nextReviewDue?: string | null;
  sourceCount?: number | null;
}) {
  return (
    <section className="rounded-2xl border p-4 space-y-2">
      <h2 className="text-lg font-semibold">Freshness & confidence</h2>
      <div className="text-sm">Confidence: {confidenceState || "unknown"}</div>
      <div className="text-sm">Freshness: {freshnessState || "unknown"}</div>
      <div className="text-sm">Reviewed: {reviewedAt ? new Date(reviewedAt).toLocaleDateString() : "Not yet reviewed"}</div>
      <div className="text-sm">Next review due: {nextReviewDue ? new Date(nextReviewDue).toLocaleDateString() : "Not scheduled"}</div>
      <div className="text-sm">Sources tracked: {sourceCount ?? 0}</div>
    </section>
  );
}
