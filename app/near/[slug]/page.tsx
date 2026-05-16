import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, MapPin, Navigation, Shield, Star, Truck, Users } from "lucide-react";
import { BreadcrumbRail } from "@/components/ui/breadcrumb-rail";
import { JsonLd } from "@/components/seo/JsonLd";
import { createClient } from "@/lib/supabase/server";
import { parseCityStateSlug } from "@/lib/directory/city-state-slug";

interface NearPageProps {
  params: Promise<{ slug: string }>;
}

function displayName(record: any) {
  return record.company_name || record.company || record.name || record.display_name || "Indexed support record";
}

function recordId(record: any) {
  return record.contact_id || record.canonical_entity_id || record.id;
}

function isProofedRecord(record: any) {
  const status = String(record.verification_status || "").toLowerCase();
  return Boolean(record.is_verified || status.includes("verified") || status.includes("confirmed"));
}

function isClaimedRecord(record: any) {
  const status = String(record.claim_status || "").toLowerCase();
  return Boolean(record.is_claimed || status === "claimed" || status === "approved");
}

export async function generateMetadata({ params }: NearPageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseCityStateSlug(slug, "US");
  if (!parsed) return { title: "Pilot Cars Near Me | Haul Command" };

  const title = `Pilot Cars & Escort Vehicles Near ${parsed.displayName} | Haul Command`;
  const description = `Find source-backed pilot car and escort vehicle records near ${parsed.displayName}. Compare proof state, claim status, and support-packet actions without fake availability claims.`;

  return {
    title,
    description,
    alternates: { canonical: `https://www.haulcommand.com/directory/us/${slug}` },
    robots: { index: false, follow: true },
    openGraph: { title, description, url: `https://www.haulcommand.com/near/${slug}` },
  };
}

export default async function NearCityPage({ params }: NearPageProps) {
  const { slug } = await params;
  const parsed = parseCityStateSlug(slug, "US");
  if (!parsed) notFound();

  const supabase = createClient();

  const { data: operators, error: operatorError } = await supabase
    .from("v_directory_operators")
    .select("*")
    .eq("country_code", "US")
    .or(`city_inferred.ilike.%${parsed.city}%,city.ilike.%${parsed.city}%`)
    .or(`state_inferred.eq.${parsed.regionCode},admin1_code.eq.${parsed.regionCode},state.eq.${parsed.regionCode}`)
    .order("rank_score", { ascending: false, nullsFirst: false })
    .limit(24);

  const { data: corridors } = await supabase
    .from("hc_corridors")
    .select("id, corridor_key, name, start_city, end_city, start_state, end_state")
    .or(`start_city.ilike.%${parsed.city}%,end_city.ilike.%${parsed.city}%`)
    .limit(6);

  const safeOperators = operatorError ? [] : (operators ?? []);
  const safeCorridors = corridors ?? [];
  const directoryHref = `/directory/us/${slug}`;
  const claimHref = `/claim?country=US&market=${encodeURIComponent(slug)}&source=near-city`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Pilot Cars Near ${parsed.displayName}`,
    description: `Source-backed pilot car and escort vehicle records near ${parsed.displayName}.`,
    url: `https://www.haulcommand.com${directoryHref}`,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: safeOperators.length,
      itemListElement: safeOperators.slice(0, 10).map((op: any, i: number) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "LocalBusiness",
          name: displayName(op),
          address: {
            "@type": "PostalAddress",
            addressLocality: op.city_inferred || op.city || parsed.city,
            addressRegion: op.state_inferred || op.admin1_code || parsed.regionCode,
            addressCountry: op.country_code || "US",
          },
        },
      })),
    },
  };

  return (
    <>
      <JsonLd data={schema} />
      <div className="bg-hc-bg text-hc-text min-h-screen">
        <div className="max-w-7xl mx-auto px-4">
          <BreadcrumbRail
            items={[
              { label: "Directory", href: "/directory" },
              { label: "United States", href: "/directory/us" },
              { label: parsed.displayName },
            ]}
          />
        </div>

        <section className="relative py-16 md:py-24 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(198,146,58,0.12)_0%,transparent_60%)] pointer-events-none" />
          <div className="relative max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 mb-6 text-hc-gold-500 uppercase tracking-[0.2em] font-bold text-sm bg-hc-gold-500/10 px-5 py-2 rounded-full border border-hc-gold-500/20">
              <MapPin className="h-4 w-4" />
              {safeOperators.length} Source-Backed Records
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black font-display tracking-tight text-hc-text mb-6">
              Pilot Cars Near <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-hc-gold-300 via-hc-gold-500 to-hc-gold-700">
                {parsed.city}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-hc-muted leading-relaxed max-w-2xl mx-auto mb-10">
              {safeOperators.length > 0
                ? `Browse ${safeOperators.length} source-backed escort vehicle and pilot car records in the ${parsed.displayName} area. Compare proof state, claim status, and contact paths before dispatch.`
                : `We are still building source-backed supply in ${parsed.displayName}. Claim or submit a record so this market can mature without fake availability claims.`}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href={directoryHref}
                className="inline-flex items-center gap-2 bg-hc-gold-500 hover:bg-hc-gold-400 text-black font-bold px-8 py-4 rounded-2xl transition-all shadow-gold-md hover:shadow-gold-lg"
              >
                <Navigation className="h-5 w-5" />
                Open Canonical Directory
              </Link>
              <Link
                href={claimHref}
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-hc-text font-bold px-8 py-4 rounded-2xl transition-all"
              >
                Claim or Correct Listing
              </Link>
            </div>
          </div>
        </section>

        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            {safeOperators.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {safeOperators.map((op: any) => (
                  <Link
                    key={recordId(op)}
                    href={`/directory/dossier/${recordId(op)}`}
                    className="group p-6 rounded-2xl bg-hc-surface border border-hc-border hover:border-hc-gold-500/30 hover:bg-hc-elevated transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 h-14 w-14 rounded-2xl bg-hc-elevated flex items-center justify-center overflow-hidden border border-white/5">
                        <Users className="h-6 w-6 text-hc-subtle" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-hc-text group-hover:text-hc-gold-400 transition-colors truncate">
                            {displayName(op)}
                          </span>
                          {isProofedRecord(op) && <Shield className="h-4 w-4 text-hc-gold-400 shrink-0" />}
                        </div>

                        <div className="flex items-center gap-1 text-xs text-hc-subtle mb-2">
                          <MapPin className="h-3 w-3" />
                          {(op.city_inferred || op.city || parsed.city)}, {op.state_inferred || op.admin1_code || parsed.regionCode}
                        </div>

                        <div className="flex items-center gap-3">
                          {Number(op.rank_score ?? op.confidence_score ?? 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 text-hc-gold-400" />
                              <span className="text-xs font-bold text-hc-gold-400 font-mono">
                                {Math.round(Number(op.rank_score ?? op.confidence_score))}
                              </span>
                            </div>
                          )}
                          {isClaimedRecord(op) && <span className="text-[10px] text-hc-subtle font-mono">Claimed</span>}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 px-4">
                <Truck className="h-16 w-16 mx-auto mb-6 text-hc-subtle opacity-30" />
                <h2 className="text-2xl font-black text-hc-text mb-3">
                  No source-backed records listed in {parsed.displayName} yet
                </h2>
                <p className="text-hc-muted max-w-md mx-auto mb-8">
                  Claim or submit a record for this market so shippers can find real support without invented supply.
                </p>
                <Link
                  href={claimHref}
                  className="inline-flex items-center gap-2 bg-hc-gold-500 hover:bg-hc-gold-400 text-black font-bold px-8 py-4 rounded-2xl transition-all"
                >
                  Claim {parsed.displayName} <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {safeCorridors.length > 0 && (
          <section className="py-12 px-4 border-t border-white/[0.04]">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-black text-hc-text mb-6 flex items-center gap-2">
                <Navigation className="h-6 w-6 text-hc-gold-500" />
                Corridors Through {parsed.city}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {safeCorridors.map((corridor: any) => (
                  <Link
                    key={corridor.id}
                    href={`/corridors/${corridor.corridor_key || corridor.id}`}
                    className="group p-5 rounded-2xl bg-hc-surface border border-hc-border hover:border-hc-gold-500/20 transition-all flex items-center gap-4"
                  >
                    <div className="shrink-0 h-10 w-10 rounded-xl bg-hc-gold-500/10 flex items-center justify-center">
                      <Navigation className="h-5 w-5 text-hc-gold-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-hc-text group-hover:text-hc-gold-400 truncate transition-colors">
                        {corridor.name}
                      </p>
                      <p className="text-[10px] text-hc-subtle font-mono">
                        {corridor.start_city} to {corridor.end_city}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-hc-subtle group-hover:text-hc-gold-400 transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="py-16 px-4 border-t border-white/[0.04]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-black text-hc-text mb-4">
              Need support in {parsed.displayName}?
            </h2>
            <p className="text-hc-muted text-lg mb-8">
              Post your route and build a support packet from real directory and corridor signals.
            </p>
            <Link
              href="/loads/create"
              className="inline-flex items-center gap-2 bg-hc-gold-500 hover:bg-hc-gold-400 text-black font-bold px-10 py-5 rounded-2xl text-lg transition-all shadow-gold-md hover:shadow-gold-lg"
            >
              Post a Load <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
