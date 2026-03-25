import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase-server";
import { countryName, categoryLabel, categoryIcon } from "@/lib/directory-helpers";
import { HCProfileHeader } from "@/components/hc/ProfileHeader";
import { HCSourceFreshnessPanel } from "@/components/hc/SourceFreshnessPanel";
import { HCCapabilityMatrix } from "@/components/hc/CapabilityMatrix";
import { HCRelatedCorridorsModule } from "@/components/hc/RelatedCorridorsModule";
import { HCNearbyEntitiesModule } from "@/components/hc/NearbyEntitiesModule";
import HCRequirementsSnapshot from "@/components/hc/RequirementsSnapshot";
import HCClaimCorrectVerifyPanel from "@/components/hc/ClaimCorrectVerifyPanel";
import { HCStickyContactBar } from "@/components/hc/StickyContactBar";
import { HCAlertSignupModule } from "@/components/hc/AlertSignupModule";
import { CarrierReportCard } from "@/components/hc/social/CarrierReportCard";
import { EndorsementModule } from "@/components/hc/social/EndorsementModule";
import { InlineBillboard } from "@/components/hc/InlineBillboard";
import { SidecarSponsor } from "@/components/hc/SidecarSponsor";
import { StickyMobileChipRail } from "@/components/hc/StickyMobileChipRail";
import { getCreativesForSlot } from "@/lib/ad-engine";
import type { HCProfile, HCFreshness, HCBadge, HCAction, HCCorridorSummary, HCLink } from "@/lib/hc-types";

export const revalidate = 3600;

/* ───── Types ───── */
type Place = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  surface_category_key: string;
  country_code: string;
  admin1_code: string | null;
  admin2_name: string | null;
  locality: string | null;
  postal_code: string | null;
  address_line1: string | null;
  address_line2: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  website: string | null;
  claim_status: string | null;
  status: string;
  updated_at: string;
};

/* ───── Helpers ───── */
function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function freshnessLabel(iso: string): string {
  const d = daysSince(iso);
  if (d === 0) return "Updated today";
  if (d === 1) return "Updated yesterday";
  if (d < 7) return `Updated ${d} days ago`;
  if (d < 30) return `Updated ${Math.floor(d / 7)} week${d >= 14 ? "s" : ""} ago`;
  return `Updated ${Math.floor(d / 30)} month${d >= 60 ? "s" : ""} ago`;
}

function buildFreshness(iso: string): HCFreshness {
  return { lastUpdatedAt: iso, updateLabel: freshnessLabel(iso), sourceCount: 1 };
}

const SERVICE_CAPABILITIES: Record<string, string[]> = {
  pilot_car: ["Pilot Car / Escort Vehicle", "Wide Load Escort", "Oversize Load Escort", "Route Survey", "Height Pole"],
  escort_vehicle: ["Escort Vehicle", "Pilot Car", "Oversize Load Support"],
  towing: ["Heavy Towing", "Medium Duty Towing", "Roadside Assistance"],
  staging_yard: ["Load Staging", "Secure Parking", "Equipment Storage"],
  default: [],
};

function getCapabilities(categoryKey: string): string[] {
  return SERVICE_CAPABILITIES[categoryKey] ?? SERVICE_CAPABILITIES.default;
}

function buildJsonLd(place: Place) {
  const cc = (place.country_code ?? "").toUpperCase();
  const address: Record<string, unknown> = {
    "@type": "PostalAddress",
    ...(place.address_line1 && { streetAddress: place.address_line1 }),
    ...(place.locality && { addressLocality: place.locality }),
    ...(place.admin1_code && { addressRegion: place.admin1_code }),
    ...(place.postal_code && { postalCode: place.postal_code }),
    ...(cc && { addressCountry: cc }),
  };
  const geo = place.lat != null && place.lng != null
    ? { "@type": "GeoCoordinates", latitude: place.lat, longitude: place.lng }
    : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: place.name,
    ...(place.description && { description: place.description }),
    ...(place.website && { url: place.website }),
    ...(place.phone && { telephone: place.phone }),
    address,
    ...(geo && { geo }),
    ...(cc && { areaServed: { "@type": "Country", name: countryName(place.country_code) } }),
  };
}

/* ───── Metadata ───── */
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const sb = supabaseServer();
  const { data } = await sb.from("hc_places").select("name, surface_category_key, locality, admin1_code, country_code").eq("slug", slug).eq("status", "published").maybeSingle();
  if (!data) return { title: "Place Not Found" };
  const location = [data.locality, data.admin1_code, countryName(data.country_code)].filter(Boolean).join(", ");
  return {
    title: `${data.name} — ${categoryLabel(data.surface_category_key)} in ${location} | HAUL COMMAND`,
    description: `${data.name} provides ${categoryLabel(data.surface_category_key).toLowerCase()} services in ${location}. View contact info, capabilities, corridors, and claim this listing on Haul Command.`,
  };
}

/* ───── Page ───── */
export default async function PlacePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = supabaseServer();

  const { data: place, error } = await sb
    .from("hc_places")
    .select("id, slug, name, description, surface_category_key, country_code, admin1_code, admin2_name, locality, postal_code, address_line1, address_line2, lat, lng, phone, website, claim_status, status, updated_at")
    .eq("slug", slug).eq("status", "published").maybeSingle();

  if (error) throw new Error(error.message);
  if (!place) return notFound();

  const p = place as Place;
  const jsonLd = buildJsonLd(p);
  const cc = p.country_code?.toLowerCase() ?? "";
  const cat = p.surface_category_key ?? "";
  const location = [p.locality, p.admin1_code, countryName(p.country_code)].filter(Boolean).join(", ");
  const freshness = buildFreshness(p.updated_at);
  const isStale = daysSince(p.updated_at) > 30;
  const isClaimed = p.claim_status === "claimed";

  // Load ad creatives in parallel
  const [inlineAds, sidecarAds, chipAds] = await Promise.all([
    getCreativesForSlot({ slotFamily: 'inline_billboard', pageType: 'provider_profile', countrySlug: cc, maxCreatives: 8 }),
    getCreativesForSlot({ slotFamily: 'sidecar_sponsor', pageType: 'provider_profile', countrySlug: cc }),
    getCreativesForSlot({ slotFamily: 'sticky_mobile_chip_rail', pageType: 'provider_profile', countrySlug: cc, maxCreatives: 10 }),
  ]);
  const capabilities = getCapabilities(cat);

  /* ── Build HC Profile object ── */
  const badges: HCBadge[] = [];
  if (isClaimed) badges.push({ label: "Claimed", tone: "success", icon: "✅" });
  // TODO: Add fast-responder / availability badges when data available

  const profile: HCProfile = {
    id: p.id,
    slug: p.slug,
    entityType: "operator",
    displayName: p.name,
    tagline: `${categoryLabel(cat)} · ${location}`,
    description: p.description ?? undefined,
    verificationState: isClaimed ? "claimed" : "unverified",
    contact: {
      phoneE164: p.phone?.replace(/\s/g, "") ?? undefined,
      phoneDisplay: p.phone ?? undefined,
      websiteUrl: p.website ?? undefined,
    },
    serviceAreaLabels: [p.locality, p.admin1_code, countryName(p.country_code)].filter(Boolean) as string[],
    capabilities,
    badges,
    freshness,
    claimStatus: isClaimed ? "claimed" : "unclaimed",
    primaryActions: [],
    secondaryActions: [],
  };

  /* ── Build nearby entities ── */
  let nearbyEntities: HCLink[] = [];
  if (p.country_code) {
    const { data: nearby } = await sb
      .from("hc_places")
      .select("slug, name")
      .eq("country_code", p.country_code)
      .eq("surface_category_key", cat)
      .eq("status", "published")
      .neq("slug", p.slug)
      .limit(6);
    if (nearby) {
      nearbyEntities = nearby.map((n) => ({ label: n.name, href: `/place/${n.slug}` }));
    }
  }

  /* ── Build related corridors ── */
  let relatedCorridors: HCCorridorSummary[] = [];
  try {
    const { data: corridorData } = await sb
      .from("hc_corridors")
      .select("slug, name, origin_city, origin_state, dest_city, dest_state, miles")
      .or(`origin_state.eq.${p.admin1_code},dest_state.eq.${p.admin1_code}`)
      .limit(3);
    if (corridorData) {
      relatedCorridors = corridorData.map((c) => ({
        slug: c.slug,
        name: c.name,
        regionLabels: [`${c.origin_city}, ${c.origin_state}`, `${c.dest_city}, ${c.dest_state}`],
        healthLabel: undefined,
        rateRangeLabel: c.miles ? `~${c.miles} mi` : undefined,
        topServices: [],
      }));
    }
  } catch {
    // Table may not exist yet
  }

  /* ── Claim/Correct/Verify Actions ── */
  const claimAction: HCAction | undefined = !isClaimed ? {
    id: "claim", label: "Claim This Listing", href: `/claim?place=${p.slug}`,
    type: "claim", priority: "primary", icon: "🏷️",
  } : undefined;

  const correctAction: HCAction = {
    id: "correct", label: "Correct Info", href: `/report-data-issue?place=${p.slug}`,
    type: "report", priority: "tertiary", icon: "✏️",
  };

  const verifyAction: HCAction | undefined = isClaimed ? {
    id: "verify", label: "Verify Your Profile", href: `/claim?place=${p.slug}&action=verify`,
    type: "verify", priority: "secondary", icon: "✅",
  } : undefined;

  /* ── Truth triggers ── */
  let truthPrompt: { type: string; message: string } | null = null;
  if (isStale && !isClaimed) {
    truthPrompt = { type: "stale", message: "This listing hasn't been updated in over 30 days. Is this your business?" };
  } else if (isStale && isClaimed) {
    truthPrompt = { type: "update", message: "This listing hasn't been updated recently. Keep your info current to maintain visibility." };
  } else if (capabilities.length === 0) {
    truthPrompt = { type: "sparse", message: "This profile is missing capability details. Help complete this profile." };
  }

  return (
    <>
      <main className="flex-grow pb-24 md:pb-0">
        {/* JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

        {/* Breadcrumbs */}
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <nav className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
            <Link href="/directory" className="hover:text-accent transition-colors">Directory</Link>
            <span>/</span>
            <Link href={`/directory/${cc}`} className="hover:text-accent transition-colors">{countryName(p.country_code)}</Link>
            <span>/</span>
            <Link href={`/directory/${cc}/${encodeURIComponent(cat)}`} className="hover:text-accent transition-colors">{categoryLabel(cat)}</Link>
            <span>/</span>
            <span className="text-white truncate max-w-[200px]">{p.name}</span>
          </nav>
        </div>

        {/* Profile Header */}
        <section className="max-w-5xl mx-auto px-4 pt-6 pb-8 border-b border-white/5">
          <HCProfileHeader profile={profile} />
        </section>

        {/* Truth Trigger Banner */}
        {truthPrompt && (
          <section className="max-w-5xl mx-auto px-4 pt-4">
            <div className={`rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 ${
              truthPrompt.type === "stale" ? "bg-amber-500/[0.06] border border-amber-500/15" :
              truthPrompt.type === "update" ? "bg-blue-500/[0.06] border border-blue-500/15" :
              "bg-white/[0.03] border border-white/[0.08]"
            }`}>
              <span className="text-lg">{truthPrompt.type === "stale" ? "⏰" : truthPrompt.type === "update" ? "🔄" : "📝"}</span>
              <p className="text-sm text-gray-300 flex-1">{truthPrompt.message}</p>
              <Link href={claimAction?.href ?? "/claim"} className="text-xs font-bold text-accent hover:underline flex-shrink-0">
                {truthPrompt.type === "stale" ? "Claim & Update →" : truthPrompt.type === "update" ? "Update Now →" : "Help Complete →"}
              </Link>
            </div>
          </section>
        )}

        {/* Content */}
        <div className="max-w-5xl mx-auto px-4 py-8 lg:flex gap-10">
          {/* Main Column */}
          <div className="flex-grow min-w-0 space-y-0">
            {/* About */}
            {p.description && (
              <section className="mb-8">
                <h2 className="text-lg font-bold text-white mb-3">About</h2>
                <p className="text-gray-400 leading-relaxed">{p.description}</p>
              </section>
            )}

            {/* Operational Report Card */}
            <CarrierReportCard entityType={profile.entityType} claimStatus={profile.claimStatus} />

            {/* Capability Matrix & Social Endorsements combined */}
            <EndorsementModule capabilities={capabilities} />
            <div className="hidden lg:block">
              <HCCapabilityMatrix capabilities={capabilities} title="Technical Classifications" />
            </div>

            {/* Details Grid */}
            <section className="mb-8">
              <h2 className="text-lg font-bold text-white mb-4">Details</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {p.address_line1 && <DetailCard icon="📍" label="Address" value={[p.address_line1, p.locality, p.admin1_code, p.postal_code].filter(Boolean).join(", ")} />}
                {p.phone && <DetailCard icon="📞" label="Phone" value={p.phone} href={`tel:${p.phone.replace(/\s/g, "")}`} />}
                {p.website && <DetailCard icon="🌐" label="Website" value={(() => { try { return new URL(p.website).hostname; } catch { return p.website; } })()} href={p.website} external />}
                <DetailCard icon="🏷️" label="Category" value={categoryLabel(cat)} />
                <DetailCard icon="🌍" label="Country" value={countryName(p.country_code)} />
                {p.lat != null && p.lng != null && (
                  <DetailCard icon="🗺️" label="Coordinates" value={`${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`} href={`https://www.google.com/maps?q=${p.lat},${p.lng}`} external />
                )}
              </div>
            </section>

            {/* Data Freshness */}
            <HCSourceFreshnessPanel freshness={freshness} sources={["Haul Command Directory"]} />

            {/* Related Corridors */}
            <HCRelatedCorridorsModule corridors={relatedCorridors} title="Corridors Near This Operator" />

            {/* Inline Billboard */}
            <InlineBillboard creatives={inlineAds} />

            {/* Requirements (if state known) */}
            {p.admin1_code && (
              <section className="mb-8">
                <Link href={`/requirements/${cc}`} className="inline-flex items-center gap-2 text-sm text-accent hover:underline font-bold">
                  📋 View {countryName(p.country_code)} Escort Requirements →
                </Link>
              </section>
            )}

            {/* Map */}
            {p.lat != null && p.lng != null && (
              <section className="mb-8">
                <h2 className="text-lg font-bold text-white mb-4">Location</h2>
                <div className="rounded-2xl overflow-hidden border border-white/10 aspect-[16/9]">
                  <iframe
                    title={`Map of ${p.name}`}
                    width="100%" height="100%" style={{ border: 0 }} loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GMAPS_KEY ?? ""}&q=${p.lat},${p.lng}&zoom=13`}
                  />
                </div>
              </section>
            )}

            {/* Claim/Correct/Verify — bottom of main */}
            <HCClaimCorrectVerifyPanel
              claimAction={claimAction}
              correctAction={correctAction}
              verifyAction={verifyAction}
              contextCopy={isClaimed
                ? "This listing is claimed. If you are the owner, you can verify your profile to unlock premium features."
                : `Is this your business? Claim ${p.name} to update details, respond to loads, and build your verified reputation.`
              }
            />
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80 flex-shrink-0 space-y-6 mt-8 lg:mt-0">
            {/* Quick Actions */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-3">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Contact</h3>
              {p.phone && (
                <a href={`tel:${p.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-600/10 hover:bg-green-600/20 border border-green-500/15 transition-all text-sm text-green-400 font-bold">
                  <span>📞</span> Call Now
                </a>
              )}
              {p.phone && (
                <a href={`sms:${p.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/15 transition-all text-sm text-blue-400 font-bold">
                  <span>💬</span> Text
                </a>
              )}
              {p.website && (
                <a href={p.website} target="_blank" rel="noopener noreferrer nofollow" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-accent/10 border border-white/[0.06] transition-all text-sm text-gray-300 hover:text-accent">
                  <span>🌐</span> Visit Website
                </a>
              )}
              {p.lat != null && p.lng != null && (
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-accent/10 border border-white/[0.06] transition-all text-sm text-gray-300 hover:text-accent">
                  <span>🗺️</span> Get Directions
                </a>
              )}
              {!p.phone && !p.website && (
                <p className="text-xs text-gray-600 italic">No contact info available. <Link href={`/claim?place=${p.slug}`} className="text-accent hover:underline">Claim to add →</Link></p>
              )}
            </div>

            {/* Claim CTA */}
            {!isClaimed && (
              <div className="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-2">📋 Claim This Listing</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Are you the operator? Claim to update details, respond to loads, and unlock premium features.
                </p>
                <Link href={`/claim?place=${p.slug}`} className="block w-full bg-accent text-black px-6 py-3 rounded-xl font-bold text-sm text-center hover:bg-yellow-500 transition-colors shadow-[0_0_20px_rgba(245,159,10,0.2)]">
                  Request Claim →
                </Link>
              </div>
            )}

            {/* Sidecar Sponsor */}
            <SidecarSponsor creatives={sidecarAds} />

            {/* Nearby Entities */}
            <HCNearbyEntitiesModule entities={nearbyEntities} title={`More ${categoryLabel(cat)}`} />

            {/* More in this area */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Explore</h3>
              <div className="space-y-2">
                <Link href={`/directory/${cc}/${encodeURIComponent(cat)}`} className="block text-sm text-gray-400 hover:text-accent transition-colors">
                  → All {categoryLabel(cat).toLowerCase()} in {countryName(p.country_code)}
                </Link>
                <Link href={`/directory/${cc}`} className="block text-sm text-gray-400 hover:text-accent transition-colors">
                  → All listings in {countryName(p.country_code)}
                </Link>
                <Link href={`/requirements/${cc}`} className="block text-sm text-gray-400 hover:text-accent transition-colors">
                  → {countryName(p.country_code)} escort requirements
                </Link>
                <Link href={`/rates/${cc}`} className="block text-sm text-gray-400 hover:text-accent transition-colors">
                  → {countryName(p.country_code)} rates
                </Link>
                <Link href="/corridors" className="block text-sm text-gray-400 hover:text-accent transition-colors">
                  → Browse corridors
                </Link>
              </div>
            </div>

            {/* Alert Signup */}
            <HCAlertSignupModule context={`${categoryLabel(cat)} in ${location}`} title="Get Market Alerts" alertType="market" contextKey={`market:${cat}:${cc}`} countrySlug={cc} />
          </aside>
        </div>
      </main>

      {/* Sticky Mobile Chip Rail (ads) */}
      <StickyMobileChipRail creatives={chipAds} />

      {/* Sticky Contact Bar (mobile) */}
      <HCStickyContactBar
        contact={{
          phoneE164: p.phone?.replace(/\s/g, "") ?? undefined,
          smsE164: p.phone?.replace(/\s/g, "") ?? undefined,
        }}
        claimHref={`/claim?place=${p.slug}`}
        entityName={p.name}
      />
    </>
  );
}

/* ───── Sub-components ───── */

function DetailCard({ icon, label, value, href, external }: {
  icon: string; label: string; value: string; href?: string; external?: boolean;
}) {
  const content = (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:border-white/10 transition-colors">
      <div className="text-xs text-gray-600 uppercase tracking-wider mb-1">{icon} {label}</div>
      <div className="text-sm text-gray-300 truncate">{value}</div>
    </div>
  );
  if (href) {
    return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer nofollow" : undefined}>{content}</a>;
  }
  return content;
}
