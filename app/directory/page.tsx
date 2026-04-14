import React from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { FreshnessBadge } from '@/components/ui/FreshnessBadge';
import { LiveActivityFeed } from '@/components/feed/LiveActivityFeed';
import { HCAskStrip } from '@/components/hc-ask/HCAskStrip';

import { HCContentPageShell, HCContentSection } from "@/components/content-system/shell/HCContentPageShell";
import { HCEditorialHero } from "@/components/content-system/heroes/HCEditorialHero";
import { getPageFamilyOgImage } from "@/components/ui/PageFamilyBackground";
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Global Force Directory | Haul Command",
        description: "Explore the verified, real-time directory of 120-country permitted heavy haul operators.",
        openGraph: {
            title: "Global Force Directory | Haul Command",
            description: "Explore the verified, real-time directory of 120-country permitted heavy haul operators.",
            images: [getPageFamilyOgImage('directory')],
        },
        twitter: {
            card: "summary_large_image",
            images: [getPageFamilyOgImage('directory')],
        }
    };
}

export default async function GlobalDirectory({ searchParams }: { searchParams: { country?: string } }) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const targetCountry = searchParams.country || 'US';

    // Global 120-Country Sync: Sorting active providers by CONFIDENCE SCORE first automatically.
    const { data: providers } = await supabase
        .from('v_directory_publishable')
        .select('*')
        .order('confidence_score', { ascending: false })
        .limit(50);

    return (
        <HCContentPageShell>
            <HCEditorialHero
                eyebrow="Intelligence Hub"
                title="Global Force Directory"
                imageUrl="/images/directory_hero.png"
                overlayOpacity="medium"
                metaRow={
                    <div className="flex flex-wrap items-center gap-4 lg:gap-6 mt-4 text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">
                        <Link href="/directory?country=US" className={targetCountry === 'US' ? "text-[#E0B05C]" : "hover:text-[#F3F4F6] transition-colors"}>ISO: USA</Link>
                        <span className="inline-block w-1 h-1 rounded-full bg-[rgba(255,255,255,0.2)]"></span>
                        <Link href="/directory?country=CA" className={targetCountry === 'CA' ? "text-[#E0B05C]" : "hover:text-[#F3F4F6] transition-colors"}>ISO: CAN</Link>
                        <span className="inline-block w-1 h-1 rounded-full bg-[rgba(255,255,255,0.2)]"></span>
                        <Link href="/directory?country=AU" className={targetCountry === 'AU' ? "text-[#E0B05C]" : "hover:text-[#F3F4F6] transition-colors"}>ISO: AUS</Link>
                    </div>
                }
            />

            <HCContentSection pad="section_balanced_pad">
                <div className="max-w-7xl mx-auto">
                    {/* HC Ask — place intelligence strip (additive, fires only on user query) */}
                    <HCAskStrip context="directory" />

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                    {providers && providers.length > 0 ? providers.map((p: any) => (
                        <div key={p.contact_id} className="bg-[#111214] border border-[rgba(255,255,255,0.06)] rounded-[16px] p-6 flex flex-col justify-between hover:border-[rgba(255,255,255,0.16)] transition-all hover:-translate-y-1 relative overflow-hidden group">
                            {p.confidence_score > 80 && <div className="absolute top-0 right-0 w-24 h-24 bg-[#E0B05C] opacity-10 rounded-full blur-2xl pointer-events-none"></div>}
                            
                            <div>
                                <div className="flex justify-between items-start mb-4 gap-4">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <h3 className="text-[17px] font-bold uppercase tracking-tight text-[#F9FAFB] truncate">{p.company || p.name || 'Verified Operator'}</h3>
                                        <FreshnessBadge lastSeenAt={p.last_seen_at || new Date().toISOString()} />
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                      <span className="bg-[#0A0B0D] border border-[rgba(198,146,58,0.3)] px-2.5 py-1 rounded-[6px] text-[11px] font-bold tracking-widest text-[#E0B05C] whitespace-nowrap">
                                          5.0 ★ SCORE
                                      </span>
                                      <span className="text-[9px] text-[#9CA3AF] uppercase font-bold tracking-widest flex items-center gap-1 group-hover:text-white transition-colors">
                                          <svg className="w-2.5 h-2.5 text-[#E0B05C] opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                          </svg>
                                          12-Pt Trust Locked
                                      </span>
                                    </div>
                                </div>
                                <div className="text-sm text-[#9CA3AF] space-y-2 mb-8 font-medium">
                                    <p><strong className="text-[#B0B8C4]">ISO Domain:</strong> {targetCountry}</p>
                                    <p><strong className="text-[#B0B8C4]">Region:</strong> {p.state_inferred || 'Global'}</p>
                                    <p className="flex items-center gap-2">
                                      <strong className="text-[#B0B8C4]">Live Status:</strong> 
                                      <span className="text-white italic opacity-80 decoration-[rgba(255,255,255,0.2)] underline decoration-dashed underline-offset-4">Locked—App Only</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                              <Link href={`/directory/${p.contact_id}`} className="flex-1 bg-[#1A1C20] hover:bg-[#23262B] text-[#F3F4F6] font-bold uppercase tracking-widest text-[11px] py-3.5 rounded-[12px] text-center transition-all border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] shadow-sm">
                                  View Dossier
                              </Link>
                              <Link href={`/auth/signup?intent=dispatch&target=${p.contact_id}`} className="flex-[1.2] bg-gradient-to-r from-[#C6923A] to-[#E0B05C] hover:opacity-90 text-[#000000] font-bold uppercase tracking-widest text-[11px] py-3.5 rounded-[12px] text-center transition-all shadow-sm flex items-center justify-center gap-1.5 focus:ring-2 focus:ring-[#C6923A] focus:ring-offset-2 focus:ring-offset-[#111214]">
                                  <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  Live Ping
                              </Link>
                            </div>
                        </div>
                    )) : (
                        <div className="col-span-full p-16 border border-[rgba(255,255,255,0.08)] rounded-[24px] text-center bg-[#111214]">
                            <p className="text-[#9CA3AF] font-bold tracking-widest text-[13px] uppercase">No Operators Found in this Operations Sector.</p>
                        </div>
                    )}
                    </div>{/* end grid */}
                </div>{/* end max-w-7xl */}
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