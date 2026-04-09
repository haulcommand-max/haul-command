import Link from "next/link";
import type { GlossaryTermPayload } from "@/lib/glossary/types";
import { mapLinkBuckets, mapRelationshipBuckets } from "@/lib/glossary/mappers";
import { QuickAnswerBlock } from "./quick-answer-block";
import { GlossaryFaq } from "./glossary-faq";
import { GlossaryLinks } from "./glossary-links";
import { GlossaryTrustBlock } from "./glossary-trust-block";
import { GlossaryCommercialStrip } from "./glossary-commercial-strip";

export function GlossaryTermPage({ payload }: { payload: GlossaryTermPayload }) {
  const links = mapLinkBuckets(payload);
  const relationships = mapRelationshipBuckets(payload);
  const term = payload.term;

  return (
    <div className="space-y-8">
      <nav className="text-sm text-muted-foreground">
        <Link href="/glossary">Glossary</Link>
        {term.topic_primary_slug ? (
          <>
            {" / "}
            <Link href={`/glossary/topics/${term.topic_primary_slug}`}>
              {term.topic_primary_name || term.topic_primary_slug}
            </Link>
          </>
        ) : null}
        {" / "}
        <span>{term.canonical_term}</span>
      </nav>

      <section className="space-y-3">
        <h1 className="text-3xl font-semibold">
          {term.overlay?.local_title_override || term.canonical_term}
        </h1>
        <QuickAnswerBlock
          answer={term.short_definition}
          explanation={term.plain_english || term.ai_answer_variant}
        />
      </section>

      {term.expanded_definition ? (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Expanded explanation</h2>
          <p className="text-base">{term.expanded_definition}</p>
        </section>
      ) : null}

      {term.why_it_matters ? (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Why this matters</h2>
          <p>{term.why_it_matters}</p>
        </section>
      ) : null}

      {payload.use_cases.length ? (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Real-world use cases</h2>
          <ul className="list-disc pl-5 space-y-2">
            {payload.use_cases.map((u) => (
              <li key={u.use_case}>{u.use_case}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {term.overlay?.local_regulatory_note ? (
        <section className="space-y-2 rounded-2xl border p-4">
          <h2 className="text-xl font-semibold">Country / region note</h2>
          <p>{term.overlay.local_regulatory_note}</p>
        </section>
      ) : null}

      <GlossaryLinks title="Related regulations" items={links.regulations} />
      <GlossaryLinks title="Related tools" items={links.tools} />

      {relationships.related.length ? (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Related terms</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {relationships.related.map((item) => (
              <Link
                key={`\${item.to_term_slug}-\${item.relationship_type}`}
                href={`/glossary/\${item.to_term_slug}`}
                className="rounded-xl border p-3 hover:bg-muted/40"
              >
                {item.to_term_name}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <GlossaryLinks title="Related locations" items={links.locations} />
      <GlossaryLinks title="Related corridors" items={links.corridors} />

      <GlossaryFaq items={payload.faqs} />

      <GlossaryTrustBlock
        confidenceState={term.confidence_state}
        freshnessState={term.freshness_state}
        reviewedAt={term.reviewed_at}
        nextReviewDue={term.next_review_due}
        sourceCount={term.source_count}
      />

      <GlossaryCommercialStrip
        links={[
          ...links.nextActions,
          ...links.claimPaths,
          ...links.sponsorPaths,
          ...links.marketplacePaths,
          ...links.services,
          ...links.categories,
        ]}
      />
    </div>
  );
}
