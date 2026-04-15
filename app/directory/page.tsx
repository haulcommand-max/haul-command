import React from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { LiveActivityFeed } from '@/components/feed/LiveActivityFeed';
import { HCAskStrip } from '@/components/hc-ask/HCAskStrip';
import { DirectoryGrid } from '@/components/directory/DirectoryGrid';

import { HCContentPageShell, HCContentSection } from "@/components/content-system/shell/HCContentPageShell";
import { HCEditorialHero } from "@/components/content-system/heroes/HCEditorialHero";
import { getPageFamilyOgImage } from "@/components/ui/PageFamilyBackground";
import { Metadata } from 'next';

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

export default async function GlobalDirectory({ searchParams }: { searchParams: Promise<{ country?: string }> }) {
    const resolvedParams = await searchParams;
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const targetCountry = resolvedParams.country || 'US';

    // Fetch operators — defensive try/catch
    let providers: any[] = [];
    try {
        const { data } = await supabase
            .from('v_directory_publishable')
            .select('*')
            .order('confidence_score', { ascending: false })
            .limit(50);
        providers = data ?? [];
    } catch (e) {
        console.warn('[directory] Query failed:', e);
    }

    return (
        <HCContentPageShell>
            <HCEditorialHero
                eyebrow="Operator Intelligence"
                title="Operator Directory"
                imageUrl="/images/directory_hero.png"
                overlayOpacity="medium"
                metaRow={
                    <div className="flex flex-wrap items-center gap-4 lg:gap-6 mt-4 text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">
                        <Link href="/directory?country=US" className={targetCountry === 'US' ? "text-[#E0B05C]" : "hover:text-[#F3F4F6] transition-colors"}>United States</Link>
                        <span className="inline-block w-1 h-1 rounded-full bg-[rgba(255,255,255,0.2)]"></span>
                        <Link href="/directory?country=CA" className={targetCountry === 'CA' ? "text-[#E0B05C]" : "hover:text-[#F3F4F6] transition-colors"}>Canada</Link>
                        <span className="inline-block w-1 h-1 rounded-full bg-[rgba(255,255,255,0.2)]"></span>
                        <Link href="/directory?country=AU" className={targetCountry === 'AU' ? "text-[#E0B05C]" : "hover:text-[#F3F4F6] transition-colors"}>Australia</Link>
                    </div>
                }
            />

            <HCContentSection pad="section_balanced_pad">
                <div className="max-w-7xl mx-auto">
                    {/* HC Ask — intelligence strip */}
                    <HCAskStrip context="directory" />

                    {/* Searchable operator grid */}
                    <DirectoryGrid providers={providers} targetCountry={targetCountry} />
                </div>
            </HCContentSection>

            {/* AdGrid Sponsor Zone & Activity Feed — directory landing */}
            <HCContentSection pad="section_balanced_pad">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2">
                    <h2 className="text-xl font-bold text-white mb-6">Directory Sponsors</h2>
                    <AdGridSlot zone="directory_sponsor" />
                  </div>
                  <div className="lg:col-span-1">
                    <h2 className="text-xl font-bold text-white mb-6">Live Network Pulse</h2>
                    <LiveActivityFeed />
                  </div>
                </div>
            </HCContentSection>
        </HCContentPageShell>
    )
}