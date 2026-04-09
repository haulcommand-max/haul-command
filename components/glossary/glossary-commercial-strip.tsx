import Link from "next/link";

export function GlossaryCommercialStrip({
  links,
}: {
  links: Array<{
    target_id: string;
    anchor_text?: string | null;
  }>;
}) {
  if (!links.length) return null;

  return (
    <section className="rounded-2xl border p-4 space-y-3">
      <h2 className="text-lg font-semibold">Next step</h2>
      <div className="grid gap-2 md:grid-cols-2">
        {links.map((link) => (
          <Link
            key={`\${link.target_id}-\${link.anchor_text ?? ""}`}
            href={link.target_id}
            className="rounded-xl border p-3 hover:bg-muted/40"
          >
            {link.anchor_text || link.target_id}
          </Link>
        ))}
      </div>
    </section>
  );
}
