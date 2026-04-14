import type { Metadata } from 'next';
import Link from 'next/link';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getTerritoryPrice, type USMarketTier, US_STATE_MARKET_TIER, US_MARKET_TIERS } from '@/lib/monetization/sponsor-pricing';

export const metadata: Metadata = {
    title: 'Territory Sponsor Availability | Haul Command',
    description: 'Check availability for exclusive territory sponsorships on Haul Command. Own a US state or country — your business appears first in all directory, near-me, and corridor searches.',
    alternates: { canonical: 'https://www.haulcommand.com/advertise/territory' },
};

// â”€â”€ Supabase types for this page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface SponsorInventoryRow {
    id: string;
    sponsor_type: string;
    geo_key: string;
    geo_label: string;
    geo_type: string;
    max_slots: number;
    filled_slots: number;
    price_monthly_cents: number;
    discovery_url: string | null;
    description: string | null;
    active: boolean;
}

type SlotStatus = 'available' | 'waitlist' | 'sold_out';

function getSlotStatus(row: SponsorInventoryRow): SlotStatus {
    if (row.filled_slots < row.max_slots) return 'available';
    if (row.max_slots > 0) return 'waitlist';
    return 'sold_out';
}

const STATUS_CONFIG: Record<SlotStatus, { label: string; dotClass: string; badgeClass: string; ctaText: string }> = {
    available: {
        label: 'Available',
        dotClass: 'bg-green-400',
        badgeClass: 'bg-green-500/10 border border-green-500/30 text-green-400',
        ctaText: 'Claim Territory â†’',
    },
    waitlist: {
        label: 'Waitlist',
        dotClass: 'bg-hc-gold-400',
        badgeClass: 'bg-hc-gold-500/10 border border-hc-gold-500/30 text-hc-gold-400',
        ctaText: 'Join Waitlist â†’',
    },
    sold_out: {
        label: 'Taken',
        dotClass: 'bg-[#1A1A1A]0',
        badgeClass: 'bg-white/5 border border-white/10 text-gray-500',
        ctaText: 'Fully Booked',
    },
};

// â”€â”€ Fallback rows if migration not yet applied â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// These use the pricing from lib/monetization/sponsor-pricing.ts
const FALLBACK_US_TERRITORIES: SponsorInventoryRow[] = [
    // MEGA ($499/mo)
    { id: '1', sponsor_type: 'territory', geo_key: 'TX', geo_label: 'Texas',            geo_type: 'state', max_slots: 1, filled_slots: 0, price_monthly_cents: 49900, discovery_url: '/directory?state=TX', description: 'The #1 heavy haul market in America.', active: true },
    { id: '2', sponsor_type: 'territory', geo_key: 'CA', geo_label: 'California',        geo_type: 'state', max_slots: 1, filled_slots: 0, price_monthly_cents: 49900, discovery_url: '/directory?state=CA', description: 'Largest US economy. Major port activity.', active: true },
    { id: '3', sponsor_type: 'territory', geo_key: 'FL', geo_label: 'Florida',           geo_type: 'state', max_slots: 1, filled_slots: 0, price_monthly_cents: 49900, discovery_url: '/directory?state=FL', description: 'High wind energy and industrial project traffic.', active: true },
    // MAJOR ($399/mo)
    { id: '4', sponsor_type: 'territory', geo_key: 'OK', geo_label: 'Oklahoma',          geo_type: 'state', max_slots: 1, filled_slots: 0, price_monthly_cents: 39900, discovery_url: '/directory?state=OK', description: 'I-35 and I-40 intersection.', active: true },
    { id: '5', sponsor_type: 'territory', geo_key: 'OH', geo_label: 'Ohio',              geo_type: 'state', max_slots: 1, filled_slots: 0, price_monthly_cents: 39900, discovery_url: '/directory?state=OH', description: 'Industrial heartland.', active: true },
    { id: '6', sponsor_type: 'territory', geo_key: 'PA', geo_label: 'Pennsylvania',      geo_type: 'state', max_slots: 1, filled_slots: 0, price_monthly_cents: 39900, discovery_url: '/directory?state=PA', description: 'Northeast corridor anchor.', active: true },
    { id: '7', sponsor_type: 'territory', geo_key: 'IL', geo_label: 'Illinois',          geo_type: 'state', max_slots: 1, filled_slots: 0, price_monthly_cents: 39900, discovery_url: '/directory?state=IL', description: 'Chicago logistics hub.', active: true },
    { id: '8', sponsor_type: 'territory', geo_key: 'GA', geo_label: 'Georgia',           geo_type: 'state', max_slots: 1, filled_slots: 0, price_monthly_cents: 39900, discovery_url: '/directory?state=GA', description: 'Port of Savannah — 4th busiest US port.', active: true },
    // MID ($299/mo)
    { id: '9', sponsor_type: 'territory', geo_key: 'NC', geo_label: 'North Carolina',    geo_type: 'state', max_slots: 1, filled_slots: 0, price_monthly_cents: 29900, discovery_url: '/directory?state=NC', description: 'Growing wind energy market.', active: true },
    { id: '10', sponsor_type: 'territory', geo_key: 'WA', geo_label: 'Washington',       geo_type: 'state', max_slots: 1, filled_slots: 0, price_monthly_cents: 29900, discovery_url: '/directory?state=WA', description: 'Port of Seattle/Tacoma + wind corridor.', active: true },
];

const FALLBACK_GLOBAL: SponsorInventoryRow[] = [
    // Gold ($399/mo)
    { id: '11', sponsor_type: 'territory', geo_key: 'AU', geo_label: 'Australia',        geo_type: 'country', max_slots: 2, filled_slots: 0, price_monthly_cents: 39900, discovery_url: '/directory?country=AU', description: 'Major resource sector haul market.', active: true },
    { id: '12', sponsor_type: 'territory', geo_key: 'CA-C', geo_label: 'Canada',         geo_type: 'country', max_slots: 2, filled_slots: 0, price_monthly_cents: 39900, discovery_url: '/directory?country=CA', description: 'Oil sands, Alberta infrastructure, BC ports.', active: true },
    { id: '13', sponsor_type: 'territory', geo_key: 'GB', geo_label: 'United Kingdom',   geo_type: 'country', max_slots: 1, filled_slots: 0, price_monthly_cents: 39900, discovery_url: '/directory?country=GB', description: 'Abnormal load under statutory order framework.', active: true },
    // Blue ($339/mo)
    { id: '14', sponsor_type: 'territory', geo_key: 'MX', geo_label: 'Mexico',           geo_type: 'country', max_slots: 2, filled_slots: 0, price_monthly_cents: 33900, discovery_url: '/directory?country=MX', description: 'Nearshoring boom, Monterrey-Laredo corridor.', active: true },
];

// â”€â”€ Page component (Server) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default async function TerritoryAvailabilityPage() {
    let usRows: SponsorInventoryRow[] = FALLBACK_US_TERRITORIES;
    let globalRows: SponsorInventoryRow[] = FALLBACK_GLOBAL;
    let fromDB = false;

    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from('sponsor_inventory')
            .select('*')
            .eq('sponsor_type', 'territory')
            .eq('active', true)
            .order('geo_label');

        if (!error && data && data.length > 0) {
            fromDB = true;
            usRows = (data as SponsorInventoryRow[]).filter(r => r.geo_type === 'state');
            globalRows = (data as SponsorInventoryRow[]).filter(r => r.geo_type === 'country');
        }
    } catch {
        // Supabase not configured or migration not applied — fallback data is fine
    }

    const availableCount = [...usRows, ...globalRows].filter(r => getSlotStatus(r) === 'available').length;
    const waitlistCount = [...usRows, ...globalRows].filter(r => getSlotStatus(r) === 'waitlist').length;

    return (
        <div className=" bg-[#0B0B0C] text-white">

            {/* â”€â”€ Hero â”€â”€ */}
            <section className="border-b border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(ellipse at 50% 0%, #D4A72440 0%, transparent 70%)' }} />
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center relative z-10">
                    <Link href="/advertise" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors mb-6 group">
                        <span className="group-hover:-translate-x-0.5 transition-transform">â†</span>
                        All advertising options
                    </Link>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4 leading-[1.1]">
                        Territory Sponsor{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-hc-gold-400 to-amber-300">
                            Availability
                        </span>
                    </h1>
                    <p className="text-lg text-gray-300 max-w-xl mx-auto mb-6 leading-relaxed">
                        Own an entire state or country. Your business appears first across every directory page,
                        near-me search, and corridor result in your territory. One sponsor per territory.
                    </p>

                    {/* Availability summary pills */}
                    <div className="flex flex-wrap gap-3 justify-center">
                        <span className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-1.5 rounded-full text-sm font-semibold">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                            {availableCount} territories available
                        </span>
                        {waitlistCount > 0 && (
                            <span className="inline-flex items-center gap-2 bg-hc-gold-500/10 border border-hc-gold-500/20 text-hc-gold-400 px-4 py-1.5 rounded-full text-sm font-semibold">
                                <span className="w-2 h-2 rounded-full bg-hc-gold-400" />
                                {waitlistCount} on waitlist
                            </span>
                        )}
                        {!fromDB && (
                            <span className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-1.5 rounded-full text-sm">
                                All territories currently open
                            </span>
                        )}
                    </div>
                </div>
            </section>

            {/* â”€â”€ What you get â”€â”€ */}
            <section className="border-b border-white/5 bg-[#0f1115]">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        {[
                            { icon: 'ðŸ†', title: 'Exclusive placement', sub: 'One sponsor per territory' },
                            { icon: 'ðŸ“', title: 'All near-me pages', sub: 'Every city in your state' },
                            { icon: 'ðŸ”', title: 'Search priority', sub: 'First in all results' },
                            { icon: 'ðŸ“Š', title: 'Monthly report', sub: 'Impressions, clicks, leads' },
                        ].map(({ icon, title, sub }) => (
                            <div key={title}>
                                <div className="text-2xl mb-2">{icon}</div>
                                <div className="text-sm font-bold text-white">{title}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{sub}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* â”€â”€ US Territory Grid â”€â”€ */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <h2 className="text-xl font-bold text-white mb-1">United States</h2>
                <p className="text-sm text-gray-400 mb-6">High-priority heavy haul states. Full US roster available — contact us if your state isn't listed.</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {usRows.map(row => {
                        const status = getSlotStatus(row);
                        const cfg = STATUS_CONFIG[status];
                        const priceDollars = Math.round(row.price_monthly_cents / 100);

                        return (
                            <div key={row.id}
                                className={`relative rounded-xl border p-5 flex flex-col gap-3 transition-all ${status === 'available'
                                    ? 'border-white/15 bg-[#121214] hover:border-white/30 hover:shadow-[0_0_20px_rgba(255,255,255,0.04)]'
                                    : status === 'waitlist'
                                        ? 'border-hc-gold-500/25 bg-[#121214]'
                                        : 'border-white/5 bg-[#0e0e10] opacity-60'
                                    }`}>

                                {/* Status + tier badge */}
                                <div className="flex items-center justify-between">
                                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badgeClass}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
                                        {cfg.label}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {(() => {
                                            const tier = US_STATE_MARKET_TIER[row.geo_key];
                                            if (!tier) return null;
                                            const tierColors: Record<USMarketTier, string> = {
                                                mega: 'text-amber-400 bg-amber-400/10',
                                                major: 'text-blue-400 bg-blue-400/10',
                                                mid: 'text-gray-300 bg-white/5',
                                                growth: 'text-green-400 bg-green-400/10',
                                                emerging: 'text-gray-500 bg-white/5',
                                            };
                                            return (
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${tierColors[tier]}`}>
                                                    {US_MARKET_TIERS[tier].label}
                                                </span>
                                            );
                                        })()}
                                        <span className="text-xs text-gray-500">{row.geo_key}</span>
                                    </div>
                                </div>

                                {/* Geo info */}
                                <div>
                                    <h3 className="font-bold text-white">{row.geo_label}</h3>
                                    {row.description && (
                                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{row.description}</p>
                                    )}
                                </div>

                                {/* Price + annual savings */}
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        <span className="font-bold text-white text-base">${priceDollars}<span className="text-gray-500 font-normal text-xs">/mo</span></span>
                                        {row.max_slots > 1 && (
                                            <span>{row.max_slots - row.filled_slots} of {row.max_slots} slots open</span>
                                        )}
                                    </div>
                                    {/* Annual savings callout */}
                                    {(() => {
                                        const pricing = getTerritoryPrice(row.geo_key);
                                        return (
                                            <span className="text-[10px] text-green-400/70">
                                                ${pricing.priceAnnualMonthly}/mo with annual billing — save {pricing.savingsPercent}%
                                            </span>
                                        );
                                    })()}
                                </div>

                                {/* CTA */}
                                {status !== 'sold_out' ? (
                                    <Link
                                        href={status === 'available'
                                            ? `/advertise/territory/checkout?id=${row.id}`
                                            : `/advertise/territory/waitlist?id=${row.id}`}
                                        className={`text-center text-sm font-semibold py-2.5 rounded-lg transition-all ${status === 'available'
                                            ? 'bg-hc-gold-500 text-white hover:bg-hc-gold-400'
                                            : 'bg-white/5 border border-hc-gold-500/30 text-hc-gold-400 hover:bg-hc-gold-500/10'
                                            }`}>
                                        {cfg.ctaText}
                                    </Link>
                                ) : (
                                    <span className="text-center text-sm text-gray-600 py-2.5">{cfg.ctaText}</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* "More states" note */}
                <p className="mt-6 text-sm text-gray-500 text-center">
                    Need a state not listed?{' '}
                    <Link href="/advertise/enterprise" className="text-hc-gold-400 hover:text-hc-gold-300 underline transition-colors">
                        Contact our team
                    </Link>{' '}
                    — all 50 US states are available.
                </p>
            </section>

            {/* â”€â”€ Global Territories â”€â”€ */}
            {globalRows.length > 0 && (
                <section className="border-t border-white/5 bg-[#0f1115]">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                        <h2 className="text-xl font-bold text-white mb-1">Global Territories</h2>
                        <p className="text-sm text-gray-400 mb-6">Country-level sponsorships for non-US markets. Tier 1 countries (AU, CA) allow 2 sponsor slots.</p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {globalRows.map(row => {
                                const status = getSlotStatus(row);
                                const cfg = STATUS_CONFIG[status];
                                const priceDollars = Math.round(row.price_monthly_cents / 100);

                                return (
                                    <div key={row.id}
                                        className={`rounded-xl border p-5 flex flex-col gap-3 transition-all ${status === 'available'
                                            ? 'border-white/15 bg-[#121214] hover:border-white/30'
                                            : 'border-white/5 bg-[#0e0e10] opacity-60'
                                            }`}>

                                        <div className="flex items-center justify-between">
                                            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${cfg.badgeClass}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotClass}`} />
                                                {cfg.label}
                                            </span>
                                            <span className="text-xs text-gray-500">{row.geo_key}</span>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-white">{row.geo_label}</h3>
                                            {row.description && (
                                                <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{row.description}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between text-xs">
                                            <span className="font-bold text-white text-base">${priceDollars}<span className="text-gray-500 font-normal text-xs">/mo</span></span>
                                            {row.max_slots > 1 && (
                                                <span className="text-gray-500">{row.max_slots - row.filled_slots} of {row.max_slots} open</span>
                                            )}
                                        </div>

                                        {status !== 'sold_out' ? (
                                            <Link
                                                href={`/advertise/territory/checkout?id=${row.id}`}
                                                className="text-center text-sm font-semibold py-2.5 rounded-lg bg-hc-gold-500 text-white hover:bg-hc-gold-400 transition-all">
                                                {cfg.ctaText}
                                            </Link>
                                        ) : (
                                            <span className="text-center text-sm text-gray-600 py-2.5">{cfg.ctaText}</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <p className="mt-6 text-sm text-gray-500 text-center">
                            120 countries in our network. More tiers launching soon.{' '}
                            <Link href="/advertise/enterprise" className="text-hc-gold-400 hover:text-hc-gold-300 underline transition-colors">
                                Inquire for your country â†’
                            </Link>
                        </p>
                    </div>
                </section>
            )}

            {/* â”€â”€ Why territory sponsors win â”€â”€ */}
            <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
                <h2 className="text-xl font-bold text-white mb-8 text-center">Why Territory Sponsors Win</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        {
                            icon: 'ðŸŽ¯',
                            title: 'Zero competition on your pages',
                            body: 'You\'re the only sponsor shown in your territory. Every broker searching for an escort in your state sees your business first — always.',
                        },
                        {
                            icon: 'ðŸ“ˆ',
                            title: 'Compounds over time',
                            body: 'Territory sponsorships appear on every new near-me page we publish for your state. As we add cities, your impressions grow automatically.',
                        },
                        {
                            icon: 'ðŸ”’',
                            title: 'Lock out competitors',
                            body: 'While your slot is active, no competing escort service can hold a territory sponsor position in your state. Renewal keeps you protected.',
                        },
                    ].map(({ icon, title, body }) => (
                        <div key={title} className="space-y-2">
                            <div className="text-2xl">{icon}</div>
                            <h3 className="font-bold text-white">{title}</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">{body}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* â”€â”€ Bottom CTA â”€â”€ */}
            <section className="border-t border-white/5 text-center py-14 px-4">
                <h2 className="text-2xl font-bold text-white mb-3">Ready to own your market?</h2>
                <p className="text-gray-400 mb-6 text-sm max-w-md mx-auto">Select any available territory above, or contact us to reserve a territory not yet listed.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/advertise/corridor"
                        className="inline-flex items-center justify-center px-6 py-3 border border-white/20 text-white font-semibold text-sm rounded-xl hover:bg-white/5 transition-all">
                        Browse Corridor Sponsorships
                    </Link>
                    <Link href="/advertise/enterprise"
                        className="inline-flex items-center justify-center px-6 py-3 border border-white/20 text-white font-semibold text-sm rounded-xl hover:bg-white/5 transition-all">
                        Enterprise / Custom â†’
                    </Link>
                </div>
            </section>

        </div>
    );
}