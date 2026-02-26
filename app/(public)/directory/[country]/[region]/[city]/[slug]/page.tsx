import { supabaseServer } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { LocalBusinessJsonLd } from "@/components/seo/LocalBusinessJsonLd";
import { Shield, MapPin, Star, AlertTriangle, CheckCircle, Info } from "lucide-react";
import Link from "next/link";
import { ComplianceBadge } from "@/components/badges/ComplianceBadge";
import { ClaimTopBadge, StickyClaimBar } from "@/components/directory/StickyClaimBar";

export default async function EscortProfilePage({ params }: any) {
    const supabase = supabaseServer();
    const { country, region, city, slug } = params;

    // Fetch escort profile and base profile details
    // using the slug from the url
    const { data: profile } = await supabase
        .from('escort_profiles')
        .select(`
            id,
            slug,
            is_claimed,
            claim_status,
            service_state,
            service_city,
            final_score,
            rank_tier,
            compliance_score,
            profiles:id (
                display_name,
                phone_e164,
                avatar_url
            )
        `)
        .eq('slug', slug)
        .single();

    if (!profile) {
        notFound();
    }

    const { profiles: baseProfile, is_claimed, final_score, rank_tier, service_city, service_state } = profile as any;

    // Fallbacks for formatting
    const displayName = baseProfile.display_name || "Independent Pilot Car";
    const formattedCity = service_city ? service_city.charAt(0).toUpperCase() + service_city.slice(1) : "Local";

    // Obfuscate phone if unclaimed
    const displayPhone = is_claimed ? baseProfile.phone_e164 : (baseProfile.phone_e164 ? baseProfile.phone_e164.slice(0, 5) + '...' : 'N/A');

    return (
        <div className="min-h-screen bg-[#070707] text-white">
            <LocalBusinessJsonLd
                businessName={displayName}
                description={'Verified pilot car operator based in ' + formattedCity + ', ' + service_state + '.'}
                url={'https://haulcommand.com/directory/' + country + '/' + region + '/' + city + '/' + slug}
                address={{
                    addressLocality: formattedCity,
                    addressRegion: service_state,
                    addressCountry: country.toUpperCase()
                }}
            />

            <div className="max-w-4xl mx-auto px-4 py-16">

                {/* Above-fold claim badge */}
                <div className="mb-6">
                    {is_claimed ? (
                        <StickyClaimBar
                            context="listing"
                            claimedBy={displayName}
                            suggestHref={`/claim?slug=${slug}`}
                        />
                    ) : (
                        <ClaimTopBadge
                            href={`/onboarding/start?claim=true&slug=${slug}`}
                            label="Claim this listing — Free"
                        />
                    )}
                </div>

                {/* Sticky mobile claim bar (scroll-triggered) */}
                {!is_claimed && (
                    <StickyClaimBar
                        context="listing"
                        claimHref={`/onboarding/start?claim=true&slug=${slug}`}
                        suggestHref={`/claim?slug=${slug}`}
                    />
                )}

                {/* Header */}
                <div className="flex justify-between items-start mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-black capitalize tracking-tight">{displayName}</h1>
                            {is_claimed && <ComplianceBadge />}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-[#888] font-medium">
                            <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {formattedCity}, {service_state}</span>
                            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-[#ffb400]" /> Score: {final_score?.toFixed(1) || 'N/A'}</span>
                            <span className="px-2 py-0.5 bg-[#1a1a1a] rounded text-[#aaa] capitalize">{rank_tier || 'Standard'} Tier</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-8">

                        {!is_claimed && (
                            <div className="bg-[#ffb400]/10 border border-[#ffb400]/20 rounded-xl p-6 relative overflow-hidden">
                                <AlertTriangle className="absolute -right-4 -bottom-4 w-32 h-32 text-[#ffb400]/5" />
                                <h3 className="text-[#ffb400] font-black uppercase tracking-widest text-sm mb-2">Unclaimed Profile</h3>
                                <p className="text-[#aaa] text-sm leading-relaxed mb-6 max-w-md relative z-10">
                                    Is this your pilot car business? Claim your profile to display your full phone number, receive direct dispatch offers via Haul Command, and showcase your real-time availability.
                                </p>
                                <Link href="/onboarding/start?claim=true" className="relative z-10 px-6 py-3 bg-[#ffb400] text-black font-black uppercase text-sm rounded transition-all hover:bg-yellow-500 shadow-[0_0_20px_rgba(255,180,0,0.2)]">
                                    Claim This Profile Free
                                </Link>
                            </div>
                        )}

                        <div className="p-8 border border-[#1a1a1a] bg-[#0c0c0c] rounded-2xl">
                            <h2 className="text-xl font-bold uppercase tracking-widest mb-6">Service Capabilities</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-black border border-[#1a1a1a] rounded flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-bold">Standard Escort</div>
                                        <div className="text-xs text-[#666]">Front/Rear Pilot</div>
                                    </div>
                                </div>
                                <div className="p-4 bg-black border border-[#1a1a1a] rounded flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                                    <div>
                                        <div className="text-sm font-bold">Night Moves</div>
                                        <div className="text-xs text-[#666]">Overnight Curfew Compliant</div>
                                    </div>
                                </div>
                                <div className="p-4 bg-black border border-[#1a1a1a] rounded flex items-start gap-3">
                                    <AlertTriangle className="w-5 h-5 text-[#888] mt-0.5" />
                                    <div>
                                        <div className="text-sm font-bold text-[#888]">High Pole Route</div>
                                        <div className="text-xs text-[#555]">Unverified Capability</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="p-6 border border-[#1a1a1a] bg-[#0c0c0c] rounded-2xl">
                            <h3 className="text-xs font-black text-[#666] uppercase tracking-widest mb-4">Contact Information</h3>

                            <div className="space-y-4">
                                <div>
                                    <div className="text-[10px] text-[#444] uppercase font-bold mb-1">Direct Phone</div>
                                    {is_claimed ? (
                                        <div className="text-lg font-bold text-white">{displayPhone}</div>
                                    ) : (
                                        <div className="text-lg font-bold text-[#888] select-none">{displayPhone}</div>
                                    )}
                                </div>

                                {!is_claimed && (
                                    <div className="text-xs text-[#ffb400] flex items-start gap-2 bg-[#ffb400]/10 p-2 rounded border border-[#ffb400]/20">
                                        <Info className="w-4 h-4 flex-shrink-0" />
                                        Contact details are obfuscated until profile ownership is verified.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border border-[#1a1a1a] bg-[#0c0c0c] rounded-2xl">
                            <h3 className="text-xs font-black text-[#666] uppercase tracking-widest mb-4">Report Card Metrics</h3>
                            <div className="space-y-3">
                                <Metric label="Compliance" value={profile.compliance_score || 'Pending'} highlight={is_claimed} />
                                <Metric label="Trust Signal" value={is_claimed ? 'Verified' : 'Unclaimed'} highlight={is_claimed} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Metric({ label, value, highlight }: { label: string, value: string | number, highlight: boolean }) {
    return (
        <div className="flex justify-between items-center text-sm">
            <span className="text-[#888]">{label}</span>
            <span className={`font-bold ${highlight ? 'text-emerald-500' : 'text-white'}`}>{value}</span>
        </div>
    );
}
