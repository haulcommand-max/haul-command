import { notFound } from "next/navigation";
import { getTrainingCountryPayload } from "@/lib/training/queries";
import { trainingCountryMetadata } from "@/lib/training/seo";
import Link from "next/link";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  const payload = await getTrainingCountryPayload(country.toUpperCase());
  if (!payload)
    return { title: "Training country not found | Haul Command" };
  return trainingCountryMetadata(payload);
}

export default async function TrainingCountryPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  const payload = await getTrainingCountryPayload(country.toUpperCase());
  if (!payload) notFound();

  return (
    <main className="p-6 space-y-8">
      <nav className="text-sm text-muted-foreground">
        <Link href="/training">Training</Link> /{" "}
        <span>{payload.country_code}</span>
      </nav>

      <section className="space-y-3">
        <h1 className="text-3xl font-semibold">
          {payload.country_code} Training Programs
        </h1>
        <p className="text-muted-foreground">
          Training programs applicable to heavy haul and pilot car operations in{" "}
          {payload.country_code}.
        </p>
      </section>

      <section className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {(payload.trainings || []).map((t) => (
            <Link
              key={t.slug}
              href={`/training/${t.slug}`}
              className="rounded-2xl border p-4 hover:bg-muted/40 space-y-2"
            >
              <div className="font-medium">{t.title}</div>
              <p className="text-sm text-muted-foreground">{t.summary}</p>
              <div className="flex gap-3 text-xs">
                <span className="capitalize">{t.fit_type}</span>
                <span className="capitalize">{t.pricing_mode}</span>
              </div>
              <div className="text-xs">
                Confidence: {t.confidence_state}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
