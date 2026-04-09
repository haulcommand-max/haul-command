import { notFound } from "next/navigation";
import { getTrainingPagePayload } from "@/lib/training/queries";
import { trainingPageMetadata, buildTrainingPageSchema } from "@/lib/training/seo";
import { mapTrainingLinkBuckets } from "@/lib/training/mappers";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const payload = await getTrainingPagePayload(slug);
  if (!payload) return { title: "Training not found | Haul Command" };
  return trainingPageMetadata(payload);
}

export default async function TrainingSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const payload = await getTrainingPagePayload(slug);
  if (!payload) notFound();

  const links = mapTrainingLinkBuckets(payload);
  const t = payload.training;
  const schema = buildTrainingPageSchema(payload);

  return (
    <main className="p-6 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <nav className="text-sm text-muted-foreground">
        <Link href="/training">Training</Link> / <span>{t.title}</span>
      </nav>

      <section className="space-y-3">
        <h1 className="text-3xl font-semibold">{t.title}</h1>
        {t.quick_answer && (
          <div className="rounded-2xl border p-4">
            <p className="text-base">{t.quick_answer}</p>
          </div>
        )}
        {t.summary && <p className="text-muted-foreground">{t.summary}</p>}
      </section>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded-2xl border p-4">
          <div className="text-2xl font-bold">{t.module_count}</div>
          <div className="text-sm text-muted-foreground">Modules</div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-2xl font-bold">{t.hours_total}</div>
          <div className="text-sm text-muted-foreground">Hours</div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-2xl font-bold capitalize">{t.pricing_mode}</div>
          <div className="text-sm text-muted-foreground">Pricing</div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-2xl font-bold capitalize">
            {t.requirement_fit || "General"}
          </div>
          <div className="text-sm text-muted-foreground">Requirement Fit</div>
        </div>
      </div>

      {/* Modules */}
      {payload.modules.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Modules</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {payload.modules.map((m) => (
              <div key={m.slug} className="rounded-2xl border p-4 space-y-2">
                <div className="font-medium">{m.title}</div>
                <p className="text-sm text-muted-foreground">{m.summary}</p>
                <div className="text-xs">{m.hours} hours</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certification Levels */}
      {payload.levels.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Certification Levels</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {payload.levels.map((l) => (
              <div
                key={l.level_slug}
                className="rounded-2xl border p-4 space-y-2"
              >
                <div className="font-medium">{l.level_name}</div>
                <p className="text-sm text-muted-foreground">
                  {l.description}
                </p>
                <div className="flex gap-3 text-xs">
                  <span>Rank: +{l.rank_weight}</span>
                  <span>Trust: +{l.trust_weight}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Geo Fit */}
      {payload.geo_fit.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Jurisdiction Fit</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {payload.geo_fit.map((gf, i) => (
              <div key={i} className="rounded-2xl border p-4 space-y-2">
                <div className="font-medium">
                  {gf.country_code}
                  {gf.region_code && ` / ${gf.region_code}`}
                </div>
                <div className="text-sm capitalize">{gf.fit_type}</div>
                {gf.note && (
                  <p className="text-xs text-muted-foreground">{gf.note}</p>
                )}
                <div className="text-xs">
                  Confidence: {gf.confidence_state} · Freshness:{" "}
                  {gf.freshness_state}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Reciprocity */}
      {payload.reciprocity.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Reciprocity & Portability</h2>
          <div className="space-y-2">
            {payload.reciprocity.map((r, i) => (
              <div key={i} className="rounded-2xl border p-4">
                <div className="font-medium">
                  {r.from_geo} → {r.to_geo}
                </div>
                {r.note && <p className="text-sm mt-2">{r.note}</p>}
                <div className="text-xs mt-2">
                  Confidence: {r.confidence_state}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Trust Block */}
      <section className="rounded-2xl border p-4 space-y-2">
        <h2 className="text-lg font-semibold">Freshness & Confidence</h2>
        <div className="text-sm">Confidence: {t.confidence_state}</div>
        <div className="text-sm">Freshness: {t.freshness_state}</div>
        <div className="text-sm">
          Reviewed:{" "}
          {t.reviewed_at
            ? new Date(t.reviewed_at).toLocaleDateString()
            : "Not yet reviewed"}
        </div>
      </section>

      {/* Related Links */}
      {links.regulations.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Related Regulations</h2>
          <div className="grid gap-2">
            {links.regulations.map((l) => (
              <Link
                key={l.target_id}
                href={l.target_id}
                className="rounded-xl border p-3 hover:bg-muted/40"
              >
                {l.anchor_text || l.target_id}
              </Link>
            ))}
          </div>
        </section>
      )}

      {links.glossary.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">Related Glossary Terms</h2>
          <div className="grid gap-2 md:grid-cols-2">
            {links.glossary.map((l) => (
              <Link
                key={l.target_id}
                href={l.target_id}
                className="rounded-xl border p-3 hover:bg-muted/40"
              >
                {l.anchor_text || l.target_id}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="rounded-2xl border p-4 space-y-3">
        <h2 className="text-lg font-semibold">Get Started</h2>
        {t.cta_primary && (
          <Link
            href={t.cta_primary}
            className="inline-block rounded-xl bg-foreground text-background px-6 py-3 font-medium"
          >
            Start Training
          </Link>
        )}
        {t.cta_secondary && (
          <Link
            href={t.cta_secondary}
            className="inline-block rounded-xl border px-6 py-3 ml-3"
          >
            Learn More
          </Link>
        )}
      </section>
    </main>
  );
}
