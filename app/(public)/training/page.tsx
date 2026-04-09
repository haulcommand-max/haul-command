import { getTrainingHubPayload } from "@/lib/training/queries";
import { trainingHubMetadata } from "@/lib/training/seo";
import Link from "next/link";

export async function generateMetadata() {
  return trainingHubMetadata();
}

export default async function TrainingHubPage() {
  const payload = await getTrainingHubPayload();

  return (
    <main className="p-6 space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-semibold">
          Heavy Haul Training & Certification
        </h1>
        <p className="text-muted-foreground">
          Professional pilot car, escort vehicle, and heavy haul training
          programs. Earn credentials, improve your directory ranking, and meet
          jurisdiction requirements across {payload.geo_coverage.length}{" "}
          countries.
        </p>
      </section>

      {/* Certification Levels */}
      {payload.levels.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Choose Your Level</h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {payload.levels.map((level) => (
              <div
                key={level.level_slug}
                className="rounded-2xl border p-4 space-y-2"
              >
                <div className="font-medium">{level.level_name}</div>
                <p className="text-sm text-muted-foreground">
                  {level.description}
                </p>
                <div className="text-xs">
                  Rank weight: +{level.rank_weight}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Training Catalog */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">All Training Programs</h2>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {payload.catalog.map((program) => (
            <Link
              key={program.slug}
              href={`/training/${program.slug}`}
              className="rounded-2xl border p-4 hover:bg-muted/40 space-y-2"
            >
              <div className="font-medium">{program.title}</div>
              <p className="text-sm text-muted-foreground">
                {program.summary}
              </p>
              <div className="flex gap-3 text-xs">
                <span>{program.module_count} modules</span>
                <span>{program.hours_total} hours</span>
                <span className="capitalize">{program.pricing_mode}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Country Coverage */}
      {payload.geo_coverage.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">Available By Country</h2>
          <div className="flex flex-wrap gap-2">
            {payload.geo_coverage.map((cc) => (
              <Link
                key={cc}
                href={`/training/countries/${cc.toLowerCase()}`}
                className="rounded-lg border px-3 py-2 hover:bg-muted/40"
              >
                {cc}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
