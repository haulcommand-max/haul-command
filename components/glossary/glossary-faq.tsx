export function GlossaryFaq({
  items,
}: {
  items: Array<{ question: string; answer: string }>;
}) {
  if (!items.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">FAQ</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item.question} className="rounded-2xl border p-4">
            <h3 className="font-medium">{item.question}</h3>
            <p className="text-sm text-muted-foreground mt-2">{item.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
