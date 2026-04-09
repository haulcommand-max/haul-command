import Link from "next/link";
import type { GlossaryTopicPayload } from "@/lib/glossary/types";
import { sortTopicTerms } from "@/lib/glossary/mappers";
import { GlossaryCommercialStrip } from "./glossary-commercial-strip";

export function GlossaryTopicPage({ payload }: { payload: GlossaryTopicPayload }) {
  const terms = sortTopicTerms(payload);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <nav className="text-sm text-muted-foreground">
          <Link href="/glossary">Glossary</Link> / <span>{payload.topic.name}</span>
        </nav>
        <h1 className="text-3xl font-semibold">{payload.topic.name}</h1>
        <p className="text-muted-foreground">{payload.topic.description}</p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Terms in this topic</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {terms.map((term) => (
            <Link
              key={term.slug}
              href={`/glossary/\${term.slug}`}
              className="rounded-2xl border p-4 hover:bg-muted/40"
            >
              <div className="font-medium">{term.canonical_term}</div>
              <p className="text-sm text-muted-foreground mt-2">{term.short_definition}</p>
            </Link>
          ))}
        </div>
      </section>

      <GlossaryCommercialStrip links={payload.related_links.filter((x) => x.link_type === "next_action")} />
    </div>
  );
}
