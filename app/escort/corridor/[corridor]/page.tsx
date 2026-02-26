export const dynamic = 'force-dynamic';
export const revalidate = 3600;
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { buildInternalLinks } from "@/lib/seo/internalLinks";



function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

interface PageProps {
    params: Promise<{ corridor: string }>;
}

const CORRIDOR_DISPLAY: Record<string, string> = {
    "i-75-north-south": "I-75 North–South",
    "i-10-gulf-coast": "I-10 Gulf Coast",
    "i-95-atlantic": "I-95 Atlantic",
    "i-40-transcon": "I-40 Transcontinental",
    "i-20-southeast": "I-20 Southeast",
    "i-285-atlanta-perimeter": "I-285 Atlanta Perimeter",
};

export async function generateMetadata({ params }: PageProps) {
    const { corridor } = await params;
    const name = CORRIDOR_DISPLAY[corridor] ?? corridor.replace(/-/g, " ").toUpperCase();
    return {
        title: `${name} Corridor Pilot Car & Escort Services | Haul Command`,
        description: `Find verified pilot car operators and escort services along the ${name} corridor. Instant AI-powered matching for oversize loads.`,
    };
}

export default async function CorridorSEOPage({ params }: PageProps) {
    const { corridor } = await params;
    const displayName = CORRIDOR_DISPLAY[corridor] ?? corridor.replace(/-/g, " ").toUpperCase();

    // Fetch top escorts by trust score for this corridor
    const { data: escorts } = await getSupabase()
        .from("trust_profile_corridor_view")
        .select("profile_id, trust_score, corridor_name, confidence")
        .ilike("corridor_name", `%${displayName.split(" ")[0]}%`)
        .order("trust_score", { ascending: false })
        .limit(6);

    const links = buildInternalLinks({
        country: "us",
        state: "fl", // Default state — corridor pages are national in practice
        city: displayName,
        slug: corridor,
        nearbyCities: [],
        corridors: Object.keys(CORRIDOR_DISPLAY).filter((c) => c !== corridor),
    });

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            {/* Schema */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Service",
                        name: `Escort Services — ${displayName} Corridor`,
                        description: `Verified pilot car operators along the ${displayName} corridor.`,
                    }),
                }}
            />

            <h1 className="text-4xl font-extrabold text-slate-900 mb-4">
                Escort Services on the {displayName} Corridor
            </h1>
            <p className="text-xl text-slate-600 mb-10">
                Connect with verified pilot car operators, high-pole escorts, and route surveyors
                along the {displayName} corridor. Haul Command matches you in seconds.
            </p>

            {/* Top rated escorts */}
            {escorts && escorts.length > 0 && (
                <section className="mb-12">
                    <h2 className="text-2xl font-bold text-slate-900 mb-5">
                        Top-Rated Escorts on {displayName}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {escorts.map((e: any) => (
                            <Link
                                key={e.profile_id}
                                href={`/directory/profile/${e.profile_id}`}
                                className="block rounded-xl border border-slate-200 bg-white p-4 hover:border-orange-400 hover:shadow-md transition-all"
                            >
                                <div className="text-2xl font-black text-orange-500 mb-1">
                                    {Math.round(e.trust_score)}
                                </div>
                                <div className="text-xs text-slate-500 font-semibold uppercase">Trust Score</div>
                            </Link>
                        ))}
                    </div>
                </section>
            )}

            {/* CTA */}
            <section className="mb-12 bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Need an escort on {displayName}?
                </h2>
                <p className="text-slate-600 mb-4">
                    Post your load and get matched with verified escorts in under 60 seconds.
                </p>
                <Link
                    href="/onboarding"
                    className="inline-block px-6 py-3 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors"
                >
                    Get Matched Fast
                </Link>
            </section>

            {/* Internal links */}
            <section className="border-t border-slate-200 pt-8">
                <h2 className="text-lg font-bold text-slate-900 mb-4">Related Corridors</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {links.corridors.map((l) => (
                        <Link
                            key={l.href}
                            href={l.href}
                            className="text-orange-600 hover:underline text-sm"
                        >
                            {l.label}
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
}
