import Link from "next/link";

export function GlossaryLinks({
  title,
  items,
}: {
  title: string;
  items: Array<{
    target_id: string;
    anchor_text?: string | null;
  }>;
}) {
  if (!items.length) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="grid gap-2">
        {items.map((item) => (
          <Link
            key={`\${item.target_id}-\${item.anchor_text ?? ""}`}
            href={item.target_id}
            className="rounded-xl border p-3 hover:bg-muted/40"
          >
            {item.anchor_text || item.target_id}
          </Link>
        ))}
      </div>
    </section>
  );
}
