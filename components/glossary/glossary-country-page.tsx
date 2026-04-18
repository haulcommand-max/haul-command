import Link from "next/link";
import type { GlossaryCountryPayload } from "@/lib/glossary/types";
import { sortCountryTerms } from "@/lib/glossary/mappers";

export function GlossaryCountryPage({ payload }: { payload: GlossaryCountryPayload }) {
  const terms = sortCountryTerms(payload);

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <nav className="text-sm text-muted-foreground">
          <Link href="/glossary">Glossary</Link> / <span>{payload.country_code}</span>
        </nav>
        <h1 className="text-3xl font-semibold">
          {payload.country_code} Heavy Haul Glossary
        </h1>
        <p className="text-muted-foreground">
          Country-specific heavy haul terms, overlays, aliases, and related links.
        </p>
      </section>

      {payload.aliases.length ? (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Common aliases</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {payload.aliases.map((alias) => (
              <article
                key={`\${alias.term_slug}-\${alias.alias}`}
                className="rounded-2xl border p-4"
              >
                <div className="font-medium">{alias.alias}</div>
                <div className="text-sm text-muted-foreground mt-2">
                  Maps to{" "}
                  <Link href={`/glossary/\${alias.term_slug}`} className="underline">
                    {alias.term_name}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Relevant terms</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {terms.map((term) => (
            <Link
              key={term.slug}
              href={`/glossary/\${term.slug}`}
              className="rounded-2xl border p-4 hover:bg-muted/40"
            >
              <div className="font-medium">{term.canonical_term}</div>
              <p className="text-sm text-muted-foreground mt-2">{term.short_definition}</p>
              {term.local_regulatory_note ? (
                <p className="text-xs mt-3">{term.local_regulatory_note}</p>
              ) : null}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
