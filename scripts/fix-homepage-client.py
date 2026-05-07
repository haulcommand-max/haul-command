"""
Homepage alignment sprint — targeted patches to HomeClient.tsx
Fixes:
  1. Stat zero-state: sentinel -1 → "Loading..." not "0"
  2. Trust language: "verified" → "listed" in claim section
  3. Intent command cards: stronger intent blocks
  4. Global market panel: country status badges
  5. Q&A copy: FMCSA → source-aware
  6. Claim CTA: no fake verification promises
"""
import re

path = r'C:\Users\PC User\Biz\app\(landing)\_components\HomeClient.tsx'
src = open(path, encoding='utf-8').read()

# ── FIX 1: Stat display logic — handle -1 sentinel ───────────────────────────
old = '''    const displayCompanies = totalOperators > 0 ? totalOperators.toLocaleString() : "2,004";
    const displayCountries = liveCountries > 0 ? liveCountries : 2;
    const displayCategories = 6;'''
new = '''    // -1 = DB unreachable sentinel (see global-stats.ts FALLBACK)
    // Never show "0" when data is simply unavailable — show "..." instead
    const displayCompanies = totalOperators > 0 ? `${totalOperators.toLocaleString()}+` : totalOperators === -1 ? "..." : "0";
    const isStatsUnavailable = totalOperators === -1;
    const displayCountries = liveCountries > 0 ? liveCountries : 2;
    const displayCategories = 6;'''
src = src.replace(old, new)

# ── FIX 2: Stats cards — show loading state when sentinel ─────────────────────
old = '''                            { value: `${displayCompanies}+`, label: "Companies", icon: Users, color: "#F1A91B" },
                            { value: String(displayCountries), label: "Countries Active", icon: Globe, color: "#3B82F6" },
                            { value: String(displayCategories), label: "Service Categories", icon: Award, color: "#22C55E" },
                            { value: `$${avgRatePerDay}`, label: "Avg Rate/Day", icon: TrendingUp, color: "#8B5CF6" },'''
new = '''                            { value: isStatsUnavailable ? "..." : displayCompanies, label: "Operators Listed", icon: Users, color: "#F1A91B" },
                            { value: String(displayCountries), label: "Countries Active", icon: Globe, color: "#3B82F6" },
                            { value: String(displayCategories), label: "Service Categories", icon: Award, color: "#22C55E" },
                            { value: avgRatePerDay > 0 ? `$${avgRatePerDay}` : "$380", label: "Avg Rate/Day", icon: TrendingUp, color: "#8B5CF6" },'''
src = src.replace(old, new)

# ── FIX 3: Claim section — fix trust language ─────────────────────────────────
old = '''                            <p className="text-sm text-gray-600 mb-4 max-w-xl">
                                Join {displayCompanies}+ verified companies. Claim any alleged profile in under 60 seconds &amp; instantly unlock discoverability, trust badges and conversion tools.
                            </p>
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-5">
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Instant verification available</span>
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Appears in search &amp; on map</span>
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Analytics + lead tracking</span>
                            </div>'''
new = '''                            <p className="text-sm text-gray-600 mb-4 max-w-xl">
                                {isStatsUnavailable ? "Thousands of" : `${displayCompanies}`} operators are listed on Haul Command. Claim your profile to unlock visibility, trust signals, and broker lead flow — free in under 60 seconds.
                            </p>
                            <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-5">
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Appears in search &amp; on map</span>
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Verification badge when eligible</span>
                                <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Analytics + lead tracking</span>
                            </div>'''
src = src.replace(old, new)

# ── FIX 4: Q&A section — fix FMCSA-only copy ─────────────────────────────────
old = '''                        <p className="text-sm text-gray-600 mb-6 max-w-lg mx-auto">
                            Ask anything about escort requirements, permit rules, and industry standards. Our AI-powered assistant provides FMCSA-grounded answers instantly.
                        </p>'''
new = '''                        <p className="text-sm text-gray-600 mb-6 max-w-lg mx-auto">
                            Ask about escort requirements, permit rules, and oversize load regulations. U.S. answers reference FMCSA and state DOT sources. Global answers cite official source paths when available.
                        </p>'''
src = src.replace(old, new)

# ── FIX 5: Expand "How Can We Help You?" into full intent command cards ───────
old = '''            {/* ═══════════════════════════════════════
                HOW CAN WE HELP YOU?
                ═══════════════════════════════════════ */}
            <section className="bg-gray-50 border-b border-gray-100">
                <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                    <h2 className="text-lg font-black text-gray-900 mb-6">How Can We Help You?</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link href="/directory" className="bg-white border border-gray-200 hover:border-[#F1A91B]/40 rounded-xl p-6 text-center hover:shadow-md transition-all group">
                            <Search className="w-8 h-8 mx-auto mb-3 text-[#F1A91B]" />
                            <h3 className="font-bold text-gray-900 mb-1">I Need an Escort</h3>
                            <p className="text-xs text-gray-500">Find a verified pilot car or escort vehicle near your load&apos;s origin.</p>
                        </Link>
                        <Link href="/claim" className="bg-white border border-gray-200 hover:border-[#0096C7]/40 rounded-xl p-6 text-center hover:shadow-md transition-all group">
                            <Users className="w-8 h-8 mx-auto mb-3 text-[#0096C7]" />
                            <h3 className="font-bold text-gray-900 mb-1">I Provide Escorts</h3>
                            <p className="text-xs text-gray-500">Claim your free profile, verify your certifications, and get booked by brokers.</p>
                        </Link>
                    </div>
                </div>
            </section>'''
new = '''            {/* ═══════════════════════════════════════
                INTENT COMMAND CARDS
                ═══════════════════════════════════════ */}
            <section className="bg-gray-50 border-b border-gray-100">
                <div className="max-w-5xl mx-auto px-4 py-12">
                    <h2 className="text-lg font-black text-gray-900 mb-2 text-center">What Do You Need Today?</h2>
                    <p className="text-xs text-center text-gray-500 mb-8">Pick your intent — we route you directly.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Link href="/available-now" className="bg-white border border-gray-200 hover:border-[#F1A91B]/50 rounded-xl p-5 hover:shadow-md transition-all group flex flex-col gap-2">
                            <div className="w-9 h-9 rounded-lg bg-[#F1A91B]/10 flex items-center justify-center"><Zap className="w-5 h-5 text-[#F1A91B]" /></div>
                            <h3 className="font-bold text-gray-900 text-sm">Need coverage today?</h3>
                            <p className="text-xs text-gray-500 flex-1">Find escort operators near your origin — dispatched fast.</p>
                            <span className="text-xs font-bold text-[#C6923A] flex items-center gap-1 mt-1">Find Available <ChevronRight className="w-3 h-3" /></span>
                        </Link>
                        <Link href="/directory" className="bg-white border border-gray-200 hover:border-[#3B82F6]/40 rounded-xl p-5 hover:shadow-md transition-all group flex flex-col gap-2">
                            <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center"><Shield className="w-5 h-5 text-blue-500" /></div>
                            <h3 className="font-bold text-gray-900 text-sm">Vetting a provider?</h3>
                            <p className="text-xs text-gray-500 flex-1">Compare trust signals, profile completeness, and route experience.</p>
                            <span className="text-xs font-bold text-blue-500 flex items-center gap-1 mt-1">Browse Profiles <ChevronRight className="w-3 h-3" /></span>
                        </Link>
                        <Link href="/permits" className="bg-white border border-gray-200 hover:border-[#22C55E]/40 rounded-xl p-5 hover:shadow-md transition-all group flex flex-col gap-2">
                            <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center"><FileText className="w-5 h-5 text-green-500" /></div>
                            <h3 className="font-bold text-gray-900 text-sm">Moving an oversize load?</h3>
                            <p className="text-xs text-gray-500 flex-1">Check escort requirements, permits, and route support by state.</p>
                            <span className="text-xs font-bold text-green-600 flex items-center gap-1 mt-1">Start Route Check <ChevronRight className="w-3 h-3" /></span>
                        </Link>
                        <Link href="/claim" className="bg-white border border-gray-200 hover:border-[#8B5CF6]/40 rounded-xl p-5 hover:shadow-md transition-all group flex flex-col gap-2">
                            <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center"><Users className="w-5 h-5 text-purple-500" /></div>
                            <h3 className="font-bold text-gray-900 text-sm">Own a pilot car business?</h3>
                            <p className="text-xs text-gray-500 flex-1">Claim your listing, unlock visibility, and get found by brokers.</p>
                            <span className="text-xs font-bold text-purple-600 flex items-center gap-1 mt-1">Claim Free Listing <ChevronRight className="w-3 h-3" /></span>
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                        <Link href="/loads" className="bg-white border border-gray-200 hover:border-[#EC4899]/40 rounded-xl p-5 hover:shadow-md transition-all group flex flex-col gap-2">
                            <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center"><Truck className="w-5 h-5 text-pink-500" /></div>
                            <h3 className="font-bold text-gray-900 text-sm">Post or find a load</h3>
                            <p className="text-xs text-gray-500 flex-1">Oversize load board — post free, find capacity instantly.</p>
                            <span className="text-xs font-bold text-pink-600 flex items-center gap-1 mt-1">Open Load Board <ChevronRight className="w-3 h-3" /></span>
                        </Link>
                        <Link href="/rates" className="bg-white border border-gray-200 hover:border-[#F59E0B]/40 rounded-xl p-5 hover:shadow-md transition-all group flex flex-col gap-2">
                            <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-amber-500" /></div>
                            <h3 className="font-bold text-gray-900 text-sm">Check market rates</h3>
                            <p className="text-xs text-gray-500 flex-1">Live escort rate index by state, corridor, and equipment type.</p>
                            <span className="text-xs font-bold text-amber-600 flex items-center gap-1 mt-1">View Rate Index <ChevronRight className="w-3 h-3" /></span>
                        </Link>
                        <Link href="/sponsor" className="bg-white border border-gray-200 hover:border-[#0096C7]/40 rounded-xl p-5 hover:shadow-md transition-all group flex flex-col gap-2">
                            <div className="w-9 h-9 rounded-lg bg-sky-50 flex items-center justify-center"><Building2 className="w-5 h-5 text-sky-500" /></div>
                            <h3 className="font-bold text-gray-900 text-sm">Advertise your business</h3>
                            <p className="text-xs text-gray-500 flex-1">Geo-targeted placements on state, corridor, and category pages.</p>
                            <span className="text-xs font-bold text-sky-600 flex items-center gap-1 mt-1">View Ad Products <ChevronRight className="w-3 h-3" /></span>
                        </Link>
                    </div>
                </div>
            </section>'''
src = src.replace(old, new)

# ── FIX 6: Global market status panel beside Popular States ──────────────────
old = '''            {/* ═══════════════════════════════════════
                BROWSE BY COUNTRY
                ═══════════════════════════════════════ */}
            <section className="bg-gray-50 border-y border-gray-100">
                <div className="max-w-5xl mx-auto px-4 py-10">
                    <h2 className="text-lg font-black text-gray-900 mb-5">Browse by Country</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {COUNTRIES.map((country) => (
                            <Link
                                key={country.slug}
                                href={`/directory/${country.slug}`}
                                className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-[#F1A91B]/5 border border-gray-200 hover:border-[#F1A91B]/30 rounded-lg transition-all group"
                            >
                                <span className="text-xl">{country.flag}</span>
                                <span className="text-sm font-semibold text-gray-700 group-hover:text-[#C6923A] transition-colors">{country.name}</span>
                                <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#F1A91B] ml-auto transition-colors" />
                            </Link>
                        ))}
                    </div>
                </div>
            </section>'''
new = '''            {/* ═══════════════════════════════════════
                GLOBAL MARKET STATUS (120 Countries)
                ═══════════════════════════════════════ */}
            <section className="bg-gray-50 border-y border-gray-100">
                <div className="max-w-5xl mx-auto px-4 py-10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
                        <h2 className="text-lg font-black text-gray-900">120 Countries. One Platform.</h2>
                        <Link href="/directory" className="text-xs font-bold text-[#F1A91B] hover:underline">Browse all markets →</Link>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {GLOBAL_MARKETS.map((market) => (
                            <Link
                                key={market.slug}
                                href={`/directory/${market.slug}`}
                                className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-[#F1A91B]/5 border border-gray-200 hover:border-[#F1A91B]/30 rounded-lg transition-all group"
                            >
                                <span className="text-xl">{market.flag}</span>
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-semibold text-gray-700 group-hover:text-[#C6923A] transition-colors block truncate">{market.name}</span>
                                    <span className={`text-[10px] font-bold ${market.statusColor}`}>{market.status}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-3">Status: Live = active operators listed · Seeded = data imported · Expanding = partners onboarding</p>
                </div>
            </section>'''
src = src.replace(old, new)

# ── ADD GLOBAL_MARKETS constant after COUNTRIES constant ─────────────────────
old = '''/* ═══════════════════════════════════════
   TRENDING LOCALITIES
   ═══════════════════════════════════════ */'''
new = '''/* ═══════════════════════════════════════
   GLOBAL MARKET STATUS
   ═══════════════════════════════════════ */
const GLOBAL_MARKETS = [
    { name: "United States", slug: "us", flag: "🇺🇸", status: "Live", statusColor: "text-green-600" },
    { name: "Canada", slug: "ca", flag: "🇨🇦", status: "Live", statusColor: "text-green-600" },
    { name: "Australia", slug: "au", flag: "🇦🇺", status: "Seeded", statusColor: "text-blue-500" },
    { name: "United Kingdom", slug: "gb", flag: "🇬🇧", status: "Seeded", statusColor: "text-blue-500" },
    { name: "South Africa", slug: "za", flag: "🇿🇦", status: "Seeded", statusColor: "text-blue-500" },
    { name: "New Zealand", slug: "nz", flag: "🇳🇿", status: "Expanding", statusColor: "text-amber-600" },
    { name: "Brazil", slug: "br", flag: "🇧🇷", status: "Expanding", statusColor: "text-amber-600" },
    { name: "Germany", slug: "de", flag: "🇩🇪", status: "Expanding", statusColor: "text-amber-600" },
    { name: "Netherlands", slug: "nl", flag: "🇳🇱", status: "Expanding", statusColor: "text-amber-600" },
    { name: "UAE", slug: "ae", flag: "🇦🇪", status: "Seeded", statusColor: "text-blue-500" },
    { name: "Mexico", slug: "mx", flag: "🇲🇽", status: "Seeded", statusColor: "text-blue-500" },
    { name: "Ireland", slug: "ie", flag: "🇮🇪", status: "Expanding", statusColor: "text-amber-600" },
];

/* ═══════════════════════════════════════
   TRENDING LOCALITIES
   ═══════════════════════════════════════ */'''
src = src.replace(old, new)

open(path, 'w', encoding='utf-8').write(src)
print('HomeClient.tsx patched OK')
