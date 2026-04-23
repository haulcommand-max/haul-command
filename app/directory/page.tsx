import React from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { LiveActivityFeed } from '@/components/feed/LiveActivityFeed';
import { HCAskStrip } from '@/components/hc-ask/HCAskStrip';
import { DirectoryGrid } from '@/components/directory/DirectoryGrid';

import { HCContentPageShell, HCContentSection } from "@/components/content-system/shell/HCContentPageShell";
import { getPageFamilyOgImage } from "@/components/ui/PageFamilyBackground";
import { Metadata } from 'next';
import { getTypesenseSearch, OPERATORS_COLLECTION } from '@/lib/typesense/client';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Operator Directory | Haul Command",
        description: "Find verified pilot car operators and escort vehicle services. Search by name, state, or city. Real-time availability and trust scores.",
        openGraph: {
            title: "Operator Directory | Haul Command",
            description: "Find verified pilot car operators and escort vehicle services. Real-time availability and trust scores.",
            images: [getPageFamilyOgImage('directory')],
        },
        twitter: {
            card: "summary_large_image",
            images: [getPageFamilyOgImage('directory')],
        }
    };
}

export default async function GlobalDirectory({ searchParams }: { searchParams: Promise<{ country?: string, q?: string, category?: string }> }) {
    const resolvedParams = await searchParams;
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const targetCountry = resolvedParams.country || 'US';
    const queryLocation = resolvedParams.q || '';
    const queryCategory = resolvedParams.category || '';

    // Fetch operators
    let providers: any[] = [];
    
    // 1. Try Typesense if a search query exists
    let usedTypesense = false;
    const searchQuery = [queryLocation, queryCategory].filter(Boolean).join(' ').trim();
    
    if (searchQuery) {
        try {
            const tsClient = getTypesenseSearch();
            const filterBy = targetCountry ? `country_code:=${targetCountry}` : undefined;
            
            const searchRes = await tsClient.collections(OPERATORS_COLLECTION).documents().search({
                q: searchQuery,
                query_by: 'company_name,city,state,role_subtypes,service_categories',
                filter_by: filterBy,
                per_page: 50,
                // Simple typo tolerance for city names
                num_typos: 1
            });
            
            if (searchRes && searchRes.hits) {
                providers = searchRes.hits.map(h => Object.assign({}, h.document, {
                   contact_id: (h.document as any).id,
                   company: (h.document as any).company_name
                }));
                usedTypesense = true;
            }
        } catch (e) {
            console.warn('[directory] Typesense search failed, falling back to Supabase', e);
        }
    }

    // 2. Fallback to Supabase
    if (!usedTypesense) {
        try {
            const { data } = await supabase
                .from('v_directory_publishable')
                .select('*')
                .order('confidence_score', { ascending: false })
                .limit(50);
            providers = data ?? [];
        } catch (e) {
            console.warn('[directory] Supabase query failed:', e);
        }
    }

    return (
        <HCContentPageShell>
            {/* ── COMMAND SURFACE HERO (Doc 7 Mode B) ── */}
            <div className="w-full bg-[#0B0F14] border-b border-[#F1A91B]/10 py-12 px-4"
                style={{ background: 'linear-gradient(135deg, #0B0F14 0%, #111827 40%, #0f1a24 100%)' }}>
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        <div className="text-xs font-bold text-[#F1A91B] uppercase tracking-widest">Operator Intelligence · 120 Countries</div>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight">
                        Pilot Car &amp; Escort Directory
                    </h1>
                    <p className="text-gray-400 text-base mb-5 max-w-xl">
                        7,711+ verified operators. Real-time availability, trust scores, and instant claim paths.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 text-sm font-bold uppercase tracking-wider">
                        <Link href="/directory?country=US" className={`px-3 py-1.5 rounded-lg transition-all ${targetCountry === 'US' ? 'bg-[#F1A91B] text-black' : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'}`}>🇺🇸 United States</Link>
                        <Link href="/directory?country=CA" className={`px-3 py-1.5 rounded-lg transition-all ${targetCountry === 'CA' ? 'bg-[#F1A91B] text-black' : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'}`}>🇨🇦 Canada</Link>
                        <Link href="/directory?country=AU" className={`px-3 py-1.5 rounded-lg transition-all ${targetCountry === 'AU' ? 'bg-[#F1A91B] text-black' : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'}`}>🇦🇺 Australia</Link>
                        <Link href="/directory?country=GB" className={`px-3 py-1.5 rounded-lg transition-all ${targetCountry === 'GB' ? 'bg-[#F1A91B] text-black' : 'text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'}`}>🇬🇧 UK</Link>
                        <Link href="/directory" className="px-3 py-1.5 rounded-lg text-[#F1A91B] hover:text-white bg-[#F1A91B]/10 hover:bg-[#F1A91B]/20 border border-[#F1A91B]/20 transition-all">
                            All 120 Countries →
                        </Link>
                    </div>
                </div>
            </div>

            <HCContentSection pad="section_balanced_pad">
                <div className="max-w-7xl mx-auto">
                    {/* HC Ask — intelligence strip */}
                    <div className="mb-6"><HCAskStrip context="directory" /></div>

                    {/* Searchable operator grid */}
                    <DirectoryGrid providers={providers} targetCountry={targetCountry} />
                </div>
            </HCContentSection>

            {/* AdGrid Sponsor Zone & Activity Feed — directory landing */}
            <HCContentSection pad="section_balanced_pad">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
                  <div className="lg:col-span-2">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">Directory Sponsors</h2>
                    <AdGridSlot zone="directory_sponsor" />
                  </div>
                  <div className="lg:col-span-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">Live Network Pulse</h2>
                    <LiveActivityFeed />
                  </div>
                </div>
            </HCContentSection>
        </HCContentPageShell>
    )
}