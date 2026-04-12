import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Haul Command Enterprise & Fleet Training | Bulk Certification',
  description: 'Deploy the global standard in heavy haul escort training to your entire fleet. Bulk licensing, team dashboards, and unified compliance tracking.',
};

export default function EnterpriseTrainingHub() {
  return (
    <main className=" bg-transparent text-white selection:bg-[#FF3333] selection:text-white">
      {/* 1. HERO SECTION */}
      <section className="relative px-6 pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden border-b border-white/10">
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full mb-8">
            <span className="w-2 h-2 rounded-full bg-[#FF3333] animate-pulse"></span>
            <span className="text-xs uppercase tracking-widest text-white/70 font-medium">B2B Fleet Operations</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
            Standardize your fleet's <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-300 to-neutral-600">
              Escort Compliance.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-neutral-400 max-w-3xl mx-auto mb-12 font-light">
            Stop guessing if your contracted pilot cars are legally compliant. Invite, train, and structurally verify your entire heavy haul escort network from one dashboard.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="#pricing"
              className="px-8 py-4 bg-[#FF3333] hover:bg-[#E60000] text-white font-semibold rounded-lg transition-all shadow-[0_0_40px_-10px_rgba(255,51,51,0.5)] transform hover:scale-105"
            >
              Get Fleet Access
            </Link>
            <Link 
              href="/training"
              className="px-8 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium rounded-lg transition-all"
            >
              View Individual Courses
            </Link>
          </div>
        </div>
      </section>

      {/* 2. THE MOAT - VALUE PROPS */}
      <section className="py-24 px-6 md:px-12 bg-neutral-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Prop 1 */}
            <div className="p-8 rounded-2xl bg-neutral-900 border border-white/5 hover:border-white/20 transition-all group">
              <div className="w-12 h-12 rounded-lg bg-[#FF3333]/10 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#FF3333]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Bulletproof Liability</h3>
              <p className="text-neutral-400">Force every contracted escort to pass standardized FHWA/FMCSA protocol exams before they hook to your loads. Reduce insurance overhead.</p>
            </div>
            
            {/* Prop 2 */}
            <div className="p-8 rounded-2xl bg-neutral-900 border border-white/5 hover:border-white/20 transition-all group">
              <div className="w-12 h-12 rounded-lg bg-[#FF3333]/10 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#FF3333]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Bulk Invite & Track</h3>
              <p className="text-neutral-400">Buy seats in 10, 50, or 250 blocks. Send email invites directly to operators and track their module completion and final exam scores in real-time.</p>
            </div>

            {/* Prop 3 */}
            <div className="p-8 rounded-2xl bg-neutral-900 border border-white/5 hover:border-white/20 transition-all group">
              <div className="w-12 h-12 rounded-lg bg-[#FF3333]/10 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-[#FF3333]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">120-Country Ready</h3>
              <p className="text-neutral-400">Whether you are running multi-state U.S. corridors or cross-border into Canada and Mexico, the curriculum maps to global reciprocity standards.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PRICING / PURCHASE ENGINE */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Enterprise Fleet Tiers</h2>
            <p className="text-xl text-neutral-400">Wholesale pricing for the Master Pilot Car Certification</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Tier 1 */}
            <div className="p-8 rounded-3xl bg-neutral-900/50 border border-white/10 flex flex-col">
              <h3 className="text-lg font-medium text-neutral-400 mb-2">Startup Broker</h3>
              <div className="text-4xl font-bold mb-6">$1,250<span className="text-lg text-neutral-500 font-normal">/yr</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-neutral-300">
                  <span className="text-[#FF3333]">âœ“</span> 10 Operator Seats
                </li>
                <li className="flex items-center gap-3 text-neutral-300">
                  <span className="text-[#FF3333]">âœ“</span> Unified Progress Dashboard
                </li>
                <li className="flex items-center gap-3 text-neutral-300">
                  <span className="text-[#FF3333]">âœ“</span> Digital Badge Verification
                </li>
              </ul>
              <button className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-medium text-white">
                Buy 10 Seats
              </button>
            </div>

            {/* Tier 2 (Highlighted) */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-[#1a1a1a] to-neutral-900 border border-[#FF3333]/30 shadow-[0_0_50px_-15px_rgba(255,51,51,0.2)] flex flex-col relative transform md:-translate-y-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-[#FF3333] text-white text-xs font-bold uppercase tracking-wider rounded-full">
                Most Popular
              </div>
              <h3 className="text-lg font-medium text-[#FF3333] mb-2">Growth Fleet</h3>
              <div className="text-4xl font-bold mb-6">$5,000<span className="text-lg text-neutral-500 font-normal">/yr</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-white">
                  <span className="text-[#FF3333]">âœ“</span> 50 Operator Seats
                </li>
                <li className="flex items-center gap-3 text-white">
                  <span className="text-[#FF3333]">âœ“</span> Unified Progress Dashboard
                </li>
                <li className="flex items-center gap-3 text-white">
                  <span className="text-[#FF3333]">âœ“</span> Digital Badge Verification
                </li>
                <li className="flex items-center gap-3 text-white">
                  <span className="text-[#FF3333]">âœ“</span> API Insurance Integrations
                </li>
              </ul>
              <button className="w-full py-4 rounded-xl bg-[#FF3333] hover:bg-[#E60000] transition-all font-bold text-white shadow-lg">
                Buy 50 Seats
              </button>
            </div>

            {/* Tier 3 */}
            <div className="p-8 rounded-3xl bg-neutral-900/50 border border-white/10 flex flex-col">
              <h3 className="text-lg font-medium text-neutral-400 mb-2">Enterprise Operator</h3>
              <div className="text-4xl font-bold mb-6">$18,000<span className="text-lg text-neutral-500 font-normal">/yr</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-neutral-300">
                  <span className="text-[#FF3333]">âœ“</span> 250 Operator Seats
                </li>
                <li className="flex items-center gap-3 text-neutral-300">
                  <span className="text-[#FF3333]">âœ“</span> Custom White-Labeling
                </li>
                <li className="flex items-center gap-3 text-neutral-300">
                  <span className="text-[#FF3333]">âœ“</span> Dedicated Operations Engineer
                </li>
              </ul>
              <button className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all font-medium text-white">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* 4. API STUB INFO - DATA MODEL HOOK */}
      <section className="py-24 border-t border-white/10 bg-black text-center">
        <div className="max-w-2xl mx-auto px-6">
          <p className="text-sm font-mono text-neutral-500">
            Powered by HC Content OS Â· Data Architecture: 
            <span className="text-[#FF3333]"> training_team_accounts</span> â†’ 
            <span className="text-[#FF3333]"> training_team_enrollments</span>.
            {/* The hooks for these buttons will trigger the Stripe /checkout/sessions endpoints we built */}
          </p>
        </div>
      </section>
    </main>
  );
}