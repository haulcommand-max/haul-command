import Link from "next/link";
import type { GlossaryHubPayload } from "@/lib/glossary/types";

export function GlossaryHub({ payload }: { payload: GlossaryHubPayload }) {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold">Heavy Haul & Pilot Car Glossary</h1>
        <p className="text-muted-foreground">
          Browse heavy haul, oversize, and pilot car terms across global topic clusters and country overlays.
        </p>
        <div className="grid gap-3 md:grid-cols-4">
          <div className="rounded-2xl border p-4">Terms: {payload.counts.total_terms}</div>
          <div className="rounded-2xl border p-4">Countries: {payload.counts.total_countries}</div>
          <div className="rounded-2xl border p-4">Topics: {payload.counts.total_topics}</div>
          <div className="rounded-2xl border p-4">Letters: {payload.counts.total_letters}</div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Browse by letter</h2>
        <div className="flex flex-wrap gap-2">
          {payload.letter_index.map((letter) => (
            <a key={letter} href={`#letter-${letter}`} className="rounded-lg border px-3 py-2">
              {letter}
            </a>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Featured terms</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {payload.featured_terms.map((term) => (
            <Link
              key={term.slug}
              href={`/glossary/${term.slug}`}
              className="rounded-2xl border p-4 hover:bg-muted/40"
            >
              <div className="font-medium">{term.canonical_term}</div>
              <p className="text-sm text-muted-foreground mt-2">{term.short_definition}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Browse by topic</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {payload.topic_clusters.map((topic) => (
            <Link
              key={topic.slug}
              href={`/glossary/topics/${topic.slug}`}
              className="rounded-2xl border p-4 hover:bg-muted/40"
            >
              <div className="font-medium">{topic.name}</div>
              <p className="text-sm text-muted-foreground mt-2">{topic.description}</p>
              <div className="text-xs mt-3">Terms: {topic.active_term_count}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Browse by country</h2>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {payload.country_clusters.map((country) => (
            <Link
              key={country.country_code}
              href={`/glossary/${country.country_code.toLowerCase()}`}
              className="rounded-2xl border p-4 hover:bg-muted/40"
            >
              <div className="font-medium">{country.country_code}</div>
              <div className="text-sm text-muted-foreground mt-2">
                Terms: {country.overlay_term_count}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
