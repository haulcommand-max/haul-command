import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, AlertTriangle } from 'lucide-react';

export const metadata: Metadata = {
  title: '2026 Pilot Car & Oversize Load Support Rate Guide | Haul Command',
  description: 'The definitive 2026 pricing guide for Pilot Cars (PEVO), Route Surveys, Bucket Trucks, and Police Escorts. Regional per-mile rates and day rates.',
  alternates: {
    canonical: 'https://haulcommand.com/rates/guide',
  },
};

export default function RateGuidePage() {
  return (
    <div className=" bg-[#0a0a0b] text-white">
      {/* HEADER ENTRY */}
      <section className="py-16 pt-24 px-4 bg-gradient-to-b from-[#1a1306] to-[#0a0a0b] border-b border-white/[0.05]">
        <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#C6923A]/30 bg-[#C6923A]/10 text-xs font-bold text-[#C6923A] mb-8 tracking-widest uppercase">
                2026 Intelligence
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-6 font-display tracking-tight text-white">
                Pilot Car & Oversize Load <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#C6923A] to-[#F1A91B]">Rate Guide</span>
            </h1>
            <p className="text-[#8fa3b8] text-lg max-w-2xl mx-auto mb-8">
                Rates vary by region, demand, and load complexity. Use ranges, not fixed numbers. Price the job, not just the miles.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-bold text-white tracking-widest uppercase">
                <Link href="#pilot-car" className="px-6 py-3 border border-[#C6923A]/30 rounded-xl hover:bg-[#C6923A]/10 transition-colors">Pilot Cars (PEVO)</Link>
                <Link href="#route-survey" className="px-6 py-3 border border-[#C6923A]/30 rounded-xl hover:bg-[#C6923A]/10 transition-colors">Route Surveys</Link>
                <Link href="#bucket-truck" className="px-6 py-3 border border-[#C6923A]/30 rounded-xl hover:bg-[#C6923A]/10 transition-colors">Bucket Trucks</Link>
                <Link href="#police-escort" className="px-6 py-3 border border-[#C6923A]/30 rounded-xl hover:bg-[#C6923A]/10 transition-colors">Police Escorts</Link>
            </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-16 space-y-24">
        
        {/* SECTION 1: PILOT CARS */}
        <section id="pilot-car" className="scroll-mt-32">
            <div className="border-l-4 border-[#F1A91B] pl-6 mb-8">
                <h2 className="text-3xl font-black font-display tracking-tight mb-2">Base Escort Service</h2>
                <h3 className="text-[#8fa3b8] uppercase tracking-widest text-sm font-semibold">Lead / Chase (PEVO)</h3>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 sm:p-8">
                    <h4 className="text-[#F1A91B] font-bold mb-6 text-sm uppercase tracking-widest">Typical Per-Mile Ranges by Region</h4>
                    <ul className="space-y-4">
                        <li className="flex justify-between items-center"><span className="text-[#8fa3b8]">Southeast</span> <strong className="text-white">$1.65 - $1.85 / mile</strong></li>
                        <li className="flex justify-between items-center"><span className="text-[#8fa3b8]">Midwest</span> <strong className="text-white">$1.75 - $1.95 / mile</strong></li>
                        <li className="flex justify-between items-center"><span className="text-[#8fa3b8]">Northeast</span> <strong className="text-white">$1.80 - $2.00 / mile</strong></li>
                        <li className="flex justify-between items-center"><span className="text-[#8fa3b8]">Southwest</span> <strong className="text-white">$1.85 - $2.00 / mile</strong></li>
                        <li className="flex justify-between items-center"><span className="text-[#8fa3b8]">West Coast</span> <strong className="text-white">$2.00 - $2.25+ / mile</strong></li>
                    </ul>
                </div>

                <div className="space-y-4">
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 flex flex-col justify-center h-full">
                        <div className="mb-2 uppercase tracking-wide text-xs font-bold text-[#8fa3b8]">Base Day Rate</div>
                        <div className="text-4xl font-black text-white">$450 - $650 <span className="text-base text-[#8fa3b8] font-semibold">per day</span></div>
                    </div>
                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 flex flex-col justify-center h-full">
                        <div className="mb-2 uppercase tracking-wide text-xs font-bold text-[#8fa3b8]">Mini / Short Move</div>
                        <div className="text-4xl font-black text-white">$350 - $500 <span className="text-base text-[#8fa3b8] font-semibold">minimum</span></div>
                        <p className="text-xs text-[#8fa3b8] mt-3">Short runs cost more per mile because setup, staging, and downtime are the same.</p>
                    </div>
                </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 mt-8">
                {/* HEIGHT POLE */}
                <div className="bg-[#1a1306]/50 border border-[#C6923A]/20 rounded-2xl p-6 sm:p-8">
                    <div className="flex items-center gap-2 mb-6">
                        <AlertTriangle className="text-[#F1A91B] w-5 h-5"/>
                        <h4 className="text-[#F1A91B] font-bold text-sm uppercase tracking-widest">Height Pole & Specialized Escort</h4>
                    </div>
                    <ul className="space-y-4 mb-6">
                        <li className="flex justify-between items-center"><span className="text-white">Southeast</span> <strong className="text-white">$1.90 - $2.20</strong></li>
                        <li className="flex justify-between items-center"><span className="text-white">Midwest / Northeast</span> <strong className="text-white">$2.00 - $2.50</strong></li>
                        <li className="flex justify-between items-center"><span className="text-white">West Coast</span> <strong className="text-white">$2.25 - $2.75</strong></li>
                    </ul>
                    <div className="pt-6 border-t border-white/10">
                        <div className="text-xs text-[#C6923A] uppercase tracking-wider mb-1">Day Rate</div>
                        <div className="text-xl font-bold">$550 - $800 per day</div>
                        <p className="text-xs text-[#8fa3b8] mt-2">Applies to height pole, complex routing, and utility-heavy corridors.</p>
                    </div>
                </div>

                {/* PREMIUMS */}
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 sm:p-8 space-y-8">
                    <div>
                        <h4 className="text-[#F1A91B] font-bold text-sm uppercase tracking-widest mb-4">Time-Based Premiums</h4>
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center"><span className="text-[#8fa3b8]">Wait Time / Detention</span> <strong className="text-white">$50 - $75 / hr</strong></div>
                            <div className="flex justify-between items-start">
                                <span className="text-[#8fa3b8]">Night Moves</span> 
                                <div className="text-right">
                                    <strong className="text-white block">+$0.25 - $0.50 / mile</strong>
                                    <span className="text-xs text-[#8fa3b8]">or +$100 - $150 / day</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="pt-6 border-t border-white/10">
                        <h4 className="text-[#F1A91B] font-bold text-sm uppercase tracking-widest mb-4">Multi-Day & Cancellation</h4>
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center"><span className="text-[#8fa3b8]">Layover Day</span> <strong className="text-white">$300 - $500 / day</strong></div>
                            <div className="flex justify-between items-center"><span className="text-[#8fa3b8]">Deadhead Pay</span> <strong className="text-white">$0.75 - $1.25 / mile</strong></div>
                            <div className="flex justify-between items-center"><span className="text-[#8fa3b8]">Cancelled After Dispatch</span> <strong className="text-white text-right">$250 - $400<br/><span className="text-xs text-[#8fa3b8]">(+ hotel if staged)</span></strong></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>


        {/* ROUTE SURVEY BREAKDOWN */}
        <section id="route-survey" className="scroll-mt-32">
            <div className="border-l-4 border-[#3b82f6] pl-6 mb-8">
                <h2 className="text-3xl font-black font-display tracking-tight mb-2">Route Survey Breakdown</h2>
                <h3 className="text-[#8fa3b8] uppercase tracking-widest text-sm font-semibold">Engineering & Clearance</h3>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/[0.05]">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#3b82f6]/10 border-b border-white/[0.05]">
                            <th className="p-4 sm:p-6 text-[#3b82f6] font-bold text-xs uppercase tracking-widest">Distance Tier</th>
                            <th className="p-4 sm:p-6 text-white font-bold text-xs uppercase tracking-widest">Southeast</th>
                            <th className="p-4 sm:p-6 text-white font-bold text-xs uppercase tracking-widest">Midwest/Northeast</th>
                            <th className="p-4 sm:p-6 text-white font-bold text-xs uppercase tracking-widest">West Coast/Canada</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/[0.05] bg-white/[0.02]">
                        <tr className="hover:bg-white/[0.05] transition-colors hover:cursor-pointer">
                            <td className="p-4 sm:p-6 font-bold text-[#8fa3b8]">0-100 miles</td>
                            <td className="p-4 sm:p-6 font-semibold">$550 \u2013 $850</td>
                            <td className="p-4 sm:p-6 font-semibold">$600 \u2013 $950</td>
                            <td className="p-4 sm:p-6 font-semibold">$700 \u2013 $1,200</td>
                        </tr>
                        <tr className="hover:bg-white/[0.05] transition-colors hover:cursor-pointer">
                            <td className="p-4 sm:p-6 font-bold text-[#8fa3b8]">101-300 miles</td>
                            <td className="p-4 sm:p-6 font-semibold">$550 \u2013 $850</td>
                            <td className="p-4 sm:p-6 font-semibold">$600 \u2013 $950</td>
                            <td className="p-4 sm:p-6 font-semibold">$700 \u2013 $1,200</td>
                        </tr>
                        <tr className="hover:bg-white/[0.05] transition-colors hover:cursor-pointer">
                            <td className="p-4 sm:p-6 font-bold text-[#8fa3b8]">301-500 miles</td>
                            <td className="p-4 sm:p-6 font-semibold">$550 \u2013 $850</td>
                            <td className="p-4 sm:p-6 font-semibold">$600 \u2013 $950</td>
                            <td className="p-4 sm:p-6 font-semibold">$700 \u2013 $1,200</td>
                        </tr>
                        <tr className="hover:bg-white/[0.05] transition-colors hover:cursor-pointer">
                            <td className="p-4 sm:p-6 font-bold text-[#8fa3b8]">500+ miles</td>
                            <td className="p-4 sm:p-6 font-semibold">$550 \u2013 $850</td>
                            <td className="p-4 sm:p-6 font-semibold">$600 \u2013 $950</td>
                            <td className="p-4 sm:p-6 font-semibold">$700 \u2013 $1,200</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <p className="mt-4 text-xs text-[#8fa3b8] max-w-2xl px-4">
                <strong>Note:</strong> Pricing is per survey/day and includes height/bridge clearance, route mapping. Complexity factors by region: Urban Areas/High Traffic, Bridge Structures (Vertical/Weight), Multi-State Coordination.
            </p>
        </section>


        {/* UTILITY LINE LIFTS & POLICE ESCORTS */}
        <div className="grid md:grid-cols-2 gap-8">
            <section id="bucket-truck" className="scroll-mt-32">
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 sm:p-8 h-full">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#ef4444]/10 text-[#ef4444] flex items-center justify-center font-black">1</div>
                        Bucket Truck Escorts
                        <span className="text-[#8fa3b8] text-xs uppercase tracking-widest block sm:inline-block sm:ml-2 mt-1 sm:mt-0">(Utility/Line Lift)</span>
                    </h3>
                    
                    <div className="space-y-6">
                        <div>
                            <span className="text-xs font-bold text-[#ef4444] uppercase tracking-widest mb-2 block">Per-Mile Ranges</span>
                            <ul className="space-y-3">
                                <li className="flex justify-between items-center"><span className="text-white">Southeast</span> <strong className="text-white">$2.25 \u2013 $3.50/mi</strong></li>
                                <li className="flex justify-between items-center"><span className="text-white">Midwest / Northeast</span> <strong className="text-white">$2.25 \u2013 $3.50/mi</strong></li>
                                <li className="flex justify-between items-center"><span className="text-white">West Coast / Canada</span> <strong className="text-white">$2.25 \u2013 $3.50/mi</strong></li>
                            </ul>
                        </div>

                        <div className="pt-6 border-t border-white/10">
                            <span className="text-xs font-bold text-[#ef4444] uppercase tracking-widest mb-2 block">Hourly Rates</span>
                            <ul className="space-y-3">
                                <li className="flex justify-between items-center"><span className="text-white">Southeast</span> <strong className="text-white">$150 \u2013 $225/hr</strong></li>
                                <li className="flex justify-between items-center"><span className="text-white">Midwest / Northeast</span> <strong className="text-white">$175 \u2013 $250/hr</strong></li>
                                <li className="flex justify-between items-center"><span className="text-white">West Coast / Canada</span> <strong className="text-white">$200 \u2013 $275/hr</strong></li>
                            </ul>
                        </div>
                        
                        <div className="p-4 bg-[#ef4444]/5 border border-[#ef4444]/20 rounded-xl mt-6">
                            <strong className="text-white block mb-1">Day Rates: $1,200 \u2013 $1,800 daily.</strong>
                            <span className="text-xs text-[#8fa3b8]">Mobilization fees generally apply.</span>
                        </div>
                    </div>
                </div>
            </section>

            <section id="police-escort" className="scroll-mt-32 flex flex-col gap-8">
                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 sm:p-8">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center font-black">
                            <Shield className="w-5 h-5"/>
                        </div>
                        Police Escorts
                        <span className="text-[#8fa3b8] text-xs uppercase tracking-widest block sm:inline-block sm:ml-2 mt-1 sm:mt-0">(State & Local)</span>
                    </h3>
                    
                    <ul className="space-y-4 mb-4">
                        <li className="flex justify-between items-center"><span className="text-white">State Police</span> <strong className="text-white">$31/hr + $0.044/mi</strong></li>
                        <li className="flex justify-between items-center"><span className="text-white">Local / Municipal</span> <strong className="text-white">$50 \u2013 $100/hr</strong></li>
                    </ul>
                    <p className="text-xs text-[#8fa3b8]">* Typically required for &gt;17&apos; width, depending on jurisdiction.</p>
                </div>

                <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-6 sm:p-8 flex-grow">
                    <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-[#F1A91B]" /> Optional Cost Factors
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-white/[0.02] rounded-lg">
                            <div className="text-[10px] text-[#8fa3b8] uppercase tracking-wider mb-1">After-hours</div>
                            <div className="text-sm font-bold">1.25x Modifier</div>
                        </div>
                        <div className="p-3 bg-white/[0.02] rounded-lg">
                            <div className="text-[10px] text-[#8fa3b8] uppercase tracking-wider mb-1">Standby</div>
                            <div className="text-sm font-bold">$75 - $125/hr</div>
                        </div>
                        <div className="p-3 bg-white/[0.02] rounded-lg">
                            <div className="text-[10px] text-[#8fa3b8] uppercase tracking-wider mb-1">Urban Coordination</div>
                            <div className="text-sm font-bold">$100 - $300</div>
                        </div>
                        <div className="p-3 bg-white/[0.02] rounded-lg">
                            <div className="text-[10px] text-[#8fa3b8] uppercase tracking-wider mb-1">Multi-agency</div>
                            <div className="text-sm font-bold">$500 - $1,500</div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
        
        <div className="text-center p-8 bg-white/[0.02] border border-white/[0.05] rounded-2xl">
           <h4 className="text-lg font-bold mb-2">If your pricing only covers gas, you&apos;re not profitable \u2014 you&apos;re just busy.</h4>
           <p className="text-sm text-[#8fa3b8] max-w-2xl mx-auto mb-6">
                Costs new escorts often forget to price in: Tire & Suspension Wear, Insurance Increases, Downtime Between Jobs, and Equipment Maintenance.
           </p>
           <p className="text-[10px] text-[#666] uppercase tracking-widest">
            DISCLAIMER: Rates are estimates and subject to change based on specific load dimensions, route conditions, and regulatory requirements. Final pricing requires detailed project assessment. This guide is for informational purposes only and not a binding contract.
           </p>
        </div>

      </div>
    </div>
  );
}