import React from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';

import { HCContentPageShell, HCContentSection } from "@/components/content-system/shell/HCContentPageShell";
import { HCEditorialHero } from "@/components/content-system/heroes/HCEditorialHero";

export const dynamic = 'force-dynamic';

export default async function GlobalDirectory({ searchParams }: { searchParams: { country?: string } }) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );
    const targetCountry = searchParams.country || 'US';

    // Global 120-Country Sync: Sorting active providers by TRUST SCORE first automatically.
    const { data: providers } = await supabase
        .from('profiles')
        .select('*, hc_training_profiles(*)')
        .eq('role', 'pilot_car') // Assuming role is operator
        .order('trust_score', { ascending: false })
        .limit(50);

    return (
        <HCContentPageShell>
            <HCEditorialHero
                eyebrow="Intelligence Hub"
                title="Global Force Directory"
                imageUrl="/images/directory_hero_bg_1775877297445.png"
                overlayOpacity="medium"
                metaRow={
                    <div className="flex flex-wrap items-center gap-6 mt-4 text-xs font-bold uppercase tracking-widest text-[#9CA3AF]">
                        <Link href="/directory?country=US" className={targetCountry === 'US' ? "text-[#E0B05C]" : "hover:text-[#F3F4F6] transition-colors"}>ISO: USA</Link>
                        <span className="w-1 h-1 rounded-full bg-[rgba(255,255,255,0.1)]"></span>
                        <Link href="/directory?country=CA" className={targetCountry === 'CA' ? "text-[#E0B05C]" : "hover:text-[#F3F4F6] transition-colors"}>ISO: CAN</Link>
                        <span className="w-1 h-1 rounded-full bg-[rgba(255,255,255,0.1)]"></span>
                        <Link href="/directory?country=AU" className={targetCountry === 'AU' ? "text-[#E0B05C]" : "hover:text-[#F3F4F6] transition-colors"}>ISO: AUS</Link>
                    </div>
                }
            />

            <HCContentSection pad="section_balanced_pad">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {providers && providers.length > 0 ? providers.map((p: any) => (
                        <div key={p.id} className="bg-[#111214] border border-[rgba(255,255,255,0.06)] rounded-[16px] p-6 flex flex-col justify-between hover:border-[rgba(255,255,255,0.16)] transition-all hover:-translate-y-1 relative overflow-hidden group">
                            {p.trust_score > 9 && <div className="absolute top-0 right-0 w-24 h-24 bg-[#E0B05C] opacity-10 rounded-full blur-2xl pointer-events-none"></div>}
                            
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-[17px] font-bold uppercase tracking-tight text-[#F9FAFB] truncate">{p.display_name || 'Verified Operator'}</h3>
                                    <span className="bg-[#0A0B0D] border border-[rgba(198,146,58,0.3)] px-2.5 py-1 rounded-[6px] text-[11px] font-bold tracking-widest text-[#E0B05C]">
                                        R: {p.trust_score || 'N/A'}
                                    </span>
                                </div>
                                <div className="text-sm text-[#9CA3AF] space-y-2 mb-8 font-medium">
                                    <p><strong className="text-[#B0B8C4]">ISO Domain:</strong> {targetCountry}</p>
                                    <p><strong className="text-[#B0B8C4]">Readiness:</strong> {p.hc_training_profiles?.[0]?.active_market_codes ? 'Multi-State' : 'Standard'}</p>
                                </div>
                            </div>

                            <Link href={`/directory/${p.id}`} className="bg-[#1A1C20] hover:bg-[#23262B] text-[#F3F4F6] font-bold uppercase tracking-widest text-[11px] py-3.5 rounded-[12px] text-center transition-all w-full border border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)] shadow-sm">
                                View Dossier
                            </Link>
                        </div>
                    )) : (
                        <div className="col-span-full p-16 border border-[rgba(255,255,255,0.08)] rounded-[24px] text-center bg-[#111214]">
                            <p className="text-[#9CA3AF] font-bold tracking-widest text-[13px] uppercase">No Operators Found in this Operations Sector.</p>
                        </div>
                    )}
                </div>
            </HCContentSection>
        </HCContentPageShell>
    )
}
