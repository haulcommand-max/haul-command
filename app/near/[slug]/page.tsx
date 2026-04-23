import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Phone, Shield, Star, Truck, ArrowRight, Users, Navigation } from 'lucide-react';
import { createServerComponentClient } from '@/lib/supabase/server-auth';
import { cookies } from 'next/headers';
import { JsonLd } from '@/components/seo/JsonLd';
import { BreadcrumbRail } from '@/components/ui/breadcrumb-rail';

// ══════════════════════════════════════════════════════════════
// NEAR-ME CITY LANDING PAGES
// Per Master Prompt §21: City × role programmatic pages for
// maximum long-tail local SEO capture.
// Route: /near/[slug] (e.g., /near/houston-tx, /near/dallas-tx)
// ══════════════════════════════════════════════════════════════

interface NearPageProps {
  params: Promise<{ slug: string }>;
}

// ── Slug parser ──────────────────────────────────────────────
function parseSlug(slug: string): { city: string; stateCode: string; displayCity: string; displayState: string } | null {
  // Format: houston-tx, dallas-tx, los-angeles-ca, london-uk
  const parts = slug.split('-');
  if (parts.length < 2) return null;

  const stateCode = parts[parts.length - 1].toUpperCase();
  const cityParts = parts.slice(0, -1);
  const city = cityParts.join(' ');
  const displayCity = city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return { city, stateCode, displayCity, displayState: stateCode };
}

export async function generateMetadata({ params }: NearPageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseSlug(slug);
  if (!parsed) return { title: 'Pilot Cars Near Me | Haul Command' };

  const title = `Pilot Cars & Escort Vehicles Near ${parsed.displayCity}, ${parsed.displayState} | Haul Command`;
  const description = `Find verified pilot car operators and escort vehicle providers near ${parsed.displayCity}, ${parsed.displayState}. Real-time availability, trust scores, and instant contact. Free directory.`;

  return {
    title,
    description,
    alternates: { canonical: `https://www.haulcommand.com/near/${slug}` },
    openGraph: { title, description, url: `https://www.haulcommand.com/near/${slug}` },
  };
}

export default async function NearCityPage({ params }: NearPageProps) {
  const { slug } = await params;
  const parsed = parseSlug(slug);
  if (!parsed) notFound();

  const { displayCity, displayState, stateCode } = parsed;

  const supabase = createServerComponentClient({ cookies });

  // Fetch nearby operators — city-exact first, state-wide fallback
  const { data: cityOperators } = await supabase
    .from('hc_global_operators')
    .select('id, name, city, admin1_code, country_code, entity_type, confidence_score, is_verified, is_claimed, phone_normalized, website_url')
    .ilike('city', `%${parsed.city}%`)
    .order('confidence_score', { ascending: false })
    .limit(12);

  // State-wide fill if city match is thin
  const { data: stateOperators } = await supabase
    .from('hc_global_operators')
    .select('id, name, city, admin1_code, country_code, entity_type, confidence_score, is_verified, is_claimed, phone_normalized, website_url')
    .eq('admin1_code', stateCode)
    .order('confidence_score', { ascending: false })
    .limit(24);

  // Merge: city-exact on top, deduplicated
  const cityIds = new Set((cityOperators ?? []).map((o: any) => o.id));
  const operators = [
    ...(cityOperators ?? []),
    ...(stateOperators ?? []).filter((o: any) => !cityIds.has(o.id)),
  ].slice(0, 24);

  // Fetch local corridor data
  const { data: corridors } = await supabase
    .from('hc_corridors')
    .select('id, corridor_key, name, start_city, end_city, start_state, end_state')
    .or(`start_city.ilike.%${parsed.city}%,end_city.ilike.%${parsed.city}%`)
    .limit(6);

  const safeOperators = operators ?? [];
  const safeCorridors = corridors ?? [];

  // Structured data
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Pilot Cars Near ${displayCity}, ${displayState}`,
    description: `Verified pilot car and escort vehicle operators near ${displayCity}, ${displayState}.`,
    url: `https://www.haulcommand.com/near/${slug}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: safeOperators.length,
      itemListElement: safeOperators.slice(0, 10).map((op, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'LocalBusiness',
          name: op.name,
          address: {
            '@type': 'PostalAddress',
            addressLocality: op.city,
            addressRegion: op.admin1_code,
            addressCountry: op.country_code || 'US',
          },
        },
      })),
    },
  };

  return (
    <>
      <JsonLd data={schema} />
      <div className="bg-hc-bg text-hc-text min-h-screen">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-4">
          <BreadcrumbRail
            items={[
              { label: 'Near Me', href: '/near' },
              { label: `${displayCity}, ${displayState}` },
            ]}
          />
        </div>

        {/* Hero */}
        <section className="relative py-16 md:py-24 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(198,146,58,0.12)_0%,transparent_60%)] pointer-events-none" />
          <div className="relative max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 mb-6 text-hc-gold-500 uppercase tracking-[0.2em] font-bold text-sm bg-hc-gold-500/10 px-5 py-2 rounded-full border border-hc-gold-500/20">
              <MapPin className="h-4 w-4" />
              {safeOperators.length} Operators Found
            </div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black font-display tracking-tight text-hc-text mb-6">
              Pilot Cars Near <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-hc-gold-300 via-hc-gold-500 to-hc-gold-700">
                {displayCity}
              </span>
            </h1>
            <p className="text-lg md:text-xl text-hc-muted leading-relaxed max-w-2xl mx-auto mb-10">
              {safeOperators.length > 0
                ? `Browse ${safeOperators.length} verified escort vehicle operators and pilot car services in the ${displayCity}, ${displayState} area. Real-time availability and trust-scored profiles.`
                : `We're expanding our network in ${displayCity}, ${displayState}. Claim your territory and be the first verified operator in this market.`
              }
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href={`/directory?q=${encodeURIComponent(`${displayCity} ${displayState}`)}`}
                className="inline-flex items-center gap-2 bg-hc-gold-500 hover:bg-hc-gold-400 text-black font-bold px-8 py-4 rounded-2xl transition-all shadow-gold-md hover:shadow-gold-lg"
              >
                <Navigation className="h-5 w-5" />
                Search Full Directory
              </Link>
              <Link
                href="/onboarding/operator"
                className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-hc-text font-bold px-8 py-4 rounded-2xl transition-all"
              >
                Claim Your Territory
              </Link>
            </div>
          </div>
        </section>

        {/* Operator Grid */}
        <section className="py-12 px-4">
          <div className="max-w-7xl mx-auto">
            {safeOperators.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {safeOperators.map(op => (
                  <Link
                    key={op.id}
                    href={`/directory/${op.id}`}
                    className="group p-6 rounded-2xl bg-hc-surface border border-hc-border hover:border-hc-gold-500/30 hover:bg-hc-elevated transition-all duration-200"
                  >
                    <div className="flex items-start gap-4">
                      {/* Avatar */}
                      <div className="shrink-0 h-14 w-14 rounded-2xl bg-hc-elevated flex items-center justify-center overflow-hidden border border-white/5">
                        {op.avatar_url ? (
                          <img src={op.avatar_url} alt={op.name} className="h-full w-full object-cover" />
                        ) : (
                          <Users className="h-6 w-6 text-hc-subtle" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        {/* Name + Verification */}
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-hc-text group-hover:text-hc-gold-400 transition-colors truncate">
                            {op.name}
                          </span>
                          {op.is_verified && (
                            <Shield className="h-4 w-4 text-hc-gold-400 shrink-0" />
                          )}
                        </div>

                        {/* Location */}
                        <div className="flex items-center gap-1 text-xs text-hc-subtle mb-2">
                          <MapPin className="h-3 w-3" />
                          {op.city && `${op.city}, `}{op.admin1_code}
                        </div>

                        {/* Trust + Experience */}
                        <div className="flex items-center gap-3">
                          {op.confidence_score != null && op.confidence_score > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 text-hc-gold-400" />
                              <span className="text-xs font-bold text-hc-gold-400 font-mono">
                                {op.confidence_score}
                              </span>
                            </div>
                          )}
                          {op.years_experience != null && op.years_experience > 0 && (
                            <span className="text-[10px] text-hc-subtle font-mono">
                              {op.years_experience}yr exp
                            </span>
                          )}
                          {isRecentlyActive(op.last_active_at) && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Online
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Service types */}
                    {op.service_types && op.service_types.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {op.service_types.slice(0, 3).map((svc: string) => (
                          <span key={svc} className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/5 text-hc-muted border border-white/5">
                            {svc}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              /* Empty State — No Dead Ends */
              <div className="text-center py-20 px-4">
                <Truck className="h-16 w-16 mx-auto mb-6 text-hc-subtle opacity-30" />
                <h2 className="text-2xl font-black text-hc-text mb-3">
                  No operators listed in {displayCity} yet
                </h2>
                <p className="text-hc-muted max-w-md mx-auto mb-8">
                  Be the first verified operator in this market. Claim your territory and start receiving load alerts.
                </p>
                <Link
                  href="/onboarding/operator"
                  className="inline-flex items-center gap-2 bg-hc-gold-500 hover:bg-hc-gold-400 text-black font-bold px-8 py-4 rounded-2xl transition-all"
                >
                  Claim {displayCity} <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Local Corridors */}
        {safeCorridors.length > 0 && (
          <section className="py-12 px-4 border-t border-white/[0.04]">
            <div className="max-w-7xl mx-auto">
              <h2 className="text-2xl font-black text-hc-text mb-6 flex items-center gap-2">
                <Navigation className="h-6 w-6 text-hc-gold-500" />
                Corridors Through {displayCity}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {safeCorridors.map(corridor => (
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
                        {corridor.start_city} → {corridor.end_city}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-hc-subtle group-hover:text-hc-gold-400 transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Bottom CTA */}
        <section className="py-16 px-4 border-t border-white/[0.04]">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-black text-hc-text mb-4">
              Need an escort in {displayCity}?
            </h2>
            <p className="text-hc-muted text-lg mb-8">
              Post your route and get matched with verified operators instantly.
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

function isRecentlyActive(lastActive: string | null): boolean {
  if (!lastActive) return false;
  const hours = (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60);
  return hours < 4;
}
