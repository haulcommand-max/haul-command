import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { supabaseServer } from "@/lib/supabase-server";
import { countryName, categoryLabel, categoryIcon } from "@/lib/directory-helpers";

export const revalidate = 3600;

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

    const geo =
        place.lat != null && place.lng != null
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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const sb = supabaseServer();
    const { data } = await sb
        .from("hc_places")
        .select("name, surface_category_key, locality, admin1_code, country_code")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

    if (!data) return { title: "Place Not Found" };

    const location = [data.locality, data.admin1_code, countryName(data.country_code)]
        .filter(Boolean)
        .join(", ");

    return {
        title: `${data.name} — ${categoryLabel(data.surface_category_key)} in ${location}`,
        description: `${data.name} is a ${categoryLabel(data.surface_category_key).toLowerCase()} located in ${location}. View details, contact information, and claim this listing on Haul Command.`,
    };
}

export default async function PlacePage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const sb = supabaseServer();

    const { data: place, error } = await sb
        .from("hc_places")
        .select(
            "id, slug, name, description, surface_category_key, country_code, admin1_code, admin2_name, locality, postal_code, address_line1, address_line2, lat, lng, phone, website, claim_status, status, updated_at"
        )
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!place) return notFound();

    const p = place as Place;
    const jsonLd = buildJsonLd(p);
    const cc = p.country_code?.toLowerCase() ?? "";
    const cat = p.surface_category_key ?? "";
    const location = [p.locality, p.admin1_code, countryName(p.country_code)].filter(Boolean).join(", ");
    const fullAddress = [p.address_line1, p.address_line2, p.locality, p.admin1_code, p.postal_code]
        .filter(Boolean)
        .join(", ");

    return (
        <>
            <Navbar />
            <main className="flex-grow">
                {/* JSON-LD */}
                <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

                {/* Header */}
                <section className="py-16 px-4 border-b border-white/5">
                    <div className="max-w-5xl mx-auto">
                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
                            <Link href="/directory" className="hover:text-accent transition-colors">Directory</Link>
                            <span>/</span>
                            <Link href={`/directory/${cc}`} className="hover:text-accent transition-colors">
                                {countryName(p.country_code)}
                            </Link>
                            <span>/</span>
                            <Link
                                href={`/directory/${cc}/${encodeURIComponent(cat)}`}
                                className="hover:text-accent transition-colors"
                            >
                                {categoryLabel(cat)}
                            </Link>
                            <span>/</span>
                            <span className="text-white truncate max-w-[200px]">{p.name}</span>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-3xl flex-shrink-0">
                                {categoryIcon(cat)}
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter leading-tight">
                                    {p.name}
                                </h1>
                                <p className="text-gray-400 mt-2 text-lg">
                                    {categoryLabel(cat)} · {location}
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Content */}
                <div className="max-w-5xl mx-auto px-4 py-12 lg:flex gap-12">
                    {/* Main */}
                    <div className="flex-grow min-w-0">
                        {p.description && (
                            <section className="mb-8">
                                <h2 className="text-lg font-bold text-white mb-3">About</h2>
                                <p className="text-gray-400 leading-relaxed">{p.description}</p>
                            </section>
                        )}

                        {/* Details Grid */}
                        <section className="mb-8">
                            <h2 className="text-lg font-bold text-white mb-4">Details</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {fullAddress && (
                                    <DetailCard icon="📍" label="Address" value={fullAddress} />
                                )}
                                {p.phone && (
                                    <DetailCard
                                        icon="📞"
                                        label="Phone"
                                        value={p.phone}
                                        href={`tel:${p.phone.replace(/\s/g, "")}`}
                                    />
                                )}
                                {p.website && (
                                    <DetailCard
                                        icon="🌐"
                                        label="Website"
                                        value={new URL(p.website).hostname}
                                        href={p.website}
                                        external
                                    />
                                )}
                                <DetailCard icon="🏷️" label="Category" value={categoryLabel(cat)} />
                                <DetailCard icon="🌍" label="Country" value={countryName(p.country_code)} />
                                {p.lat != null && p.lng != null && (
                                    <DetailCard
                                        icon="🗺️"
                                        label="Coordinates"
                                        value={`${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`}
                                        href={`https://www.google.com/maps?q=${p.lat},${p.lng}`}
                                        external
                                    />
                                )}
                            </div>
                        </section>

                        {/* Map embed */}
                        {p.lat != null && p.lng != null && (
                            <section className="mb-8">
                                <h2 className="text-lg font-bold text-white mb-4">Location</h2>
                                <div className="rounded-2xl overflow-hidden border border-white/10 aspect-[16/9]">
                                    <iframe
                                        title={`Map of ${p.name}`}
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GMAPS_KEY ?? ""}&q=${p.lat},${p.lng}&zoom=13`}
                                    />
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside className="lg:w-80 flex-shrink-0 space-y-6">
                        {/* Claim CTA */}
                        <div className="bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 rounded-2xl p-6">
                            <h3 className="text-lg font-bold text-white mb-2">
                                {p.claim_status === "claimed" ? "✅ Claimed Listing" : "📋 Claim This Listing"}
                            </h3>
                            <p className="text-sm text-gray-400 mb-4">
                                {p.claim_status === "claimed"
                                    ? "This listing has been claimed and is maintained by a verified operator."
                                    : "Are you the operator? Claim this listing to update details, add photos, and unlock premium features."}
                            </p>
                            {p.claim_status !== "claimed" && (
                                <button className="w-full bg-accent text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors shadow-[0_0_20px_rgba(245,159,10,0.2)]">
                                    Request Claim
                                </button>
                            )}
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-3">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Quick Actions</h3>
                            {p.phone && (
                                <a
                                    href={`tel:${p.phone.replace(/\s/g, "")}`}
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-accent/10 hover:border-accent/20 border border-white/[0.06] transition-all text-sm text-gray-300 hover:text-accent"
                                >
                                    <span>📞</span> Call Now
                                </a>
                            )}
                            {p.website && (
                                <a
                                    href={p.website}
                                    target="_blank"
                                    rel="noopener noreferrer nofollow"
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-accent/10 hover:border-accent/20 border border-white/[0.06] transition-all text-sm text-gray-300 hover:text-accent"
                                >
                                    <span>🌐</span> Visit Website
                                </a>
                            )}
                            {p.lat != null && p.lng != null && (
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] hover:bg-accent/10 hover:border-accent/20 border border-white/[0.06] transition-all text-sm text-gray-300 hover:text-accent"
                                >
                                    <span>🗺️</span> Get Directions
                                </a>
                            )}
                        </div>

                        {/* Related links */}
                        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">More in this area</h3>
                            <div className="space-y-2">
                                <Link
                                    href={`/directory/${cc}/${encodeURIComponent(cat)}`}
                                    className="block text-sm text-gray-400 hover:text-accent transition-colors"
                                >
                                    → All {categoryLabel(cat).toLowerCase()} in {countryName(p.country_code)}
                                </Link>
                                <Link
                                    href={`/directory/${cc}`}
                                    className="block text-sm text-gray-400 hover:text-accent transition-colors"
                                >
                                    → All listings in {countryName(p.country_code)}
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>
            </main>
        </>
    );
}

function DetailCard({
    icon,
    label,
    value,
    href,
    external,
}: {
    icon: string;
    label: string;
    value: string;
    href?: string;
    external?: boolean;
}) {
    const content = (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:border-white/10 transition-colors">
            <div className="text-xs text-gray-600 uppercase tracking-wider mb-1">{icon} {label}</div>
            <div className="text-sm text-gray-300 truncate">{value}</div>
        </div>
    );

    if (href) {
        return (
            <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer nofollow" : undefined}>
                {content}
            </a>
        );
    }
    return content;
}
