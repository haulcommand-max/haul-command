export function QuickAnswerBlock({
  title,
  answer,
  explanation,
}: {
  title?: string;
  answer?: string | null;
  explanation?: string | null;
}) {
  if (!answer && !explanation) return null;

  return (
    <section className="rounded-2xl border p-4 space-y-2">
      <h2 className="text-lg font-semibold">{title || "Quick answer"}</h2>
      {answer ? <p className="text-base">{answer}</p> : null}
      {explanation ? <p className="text-sm text-muted-foreground">{explanation}</p> : null}
    </section>
  );
}
