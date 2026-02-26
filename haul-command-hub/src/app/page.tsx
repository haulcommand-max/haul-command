import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-24 px-4 overflow-hidden border-b border-white/5">
          <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent"></div>
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-[0.9]">
                Specialized <span className="text-accent underline decoration-8 underline-offset-[16px]">Freight</span> Intelligence.
              </h1>
              <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-2xl mx-auto leading-relaxed">
                The central operational node for the oversized transport economy. Real-time regulatory data, 50-state compliance engines, and industry intelligence.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/state/florida" className="bg-accent text-black px-8 py-4 rounded-full font-black text-lg hover:bg-yellow-500 transition-all w-full sm:w-auto shadow-[0_0_20px_rgba(245,159,10,0.3)]">
                  Explore Registry
                </Link>
                <Link href="/blog" className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 transition-all w-full sm:w-auto">
                  Read Intelligence
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-24 px-4 bg-black/20">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="group">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6 border border-accent/20 group-hover:bg-accent group-hover:text-black transition-all">
                  <span className="text-2xl">🏛️</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Regulatory Tower</h3>
                <p className="text-gray-400 leading-relaxed">
                  50-state master database for escort triggers, permit portals, and police scheduling—verified and updated daily.
                </p>
              </div>
              <div className="group">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6 border border-accent/20 group-hover:bg-accent group-hover:text-black transition-all">
                  <span className="text-2xl">⚡</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Movement Analytics</h3>
                <p className="text-gray-400 leading-relaxed">
                  Real-time risk scoring for high-clearance loads. Calculate ticket probability and movement feasibility in seconds.
                </p>
              </div>
              <div className="group">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6 border border-accent/20 group-hover:bg-accent group-hover:text-black transition-all">
                  <span className="text-2xl">🔗</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">The Command Network</h3>
                <p className="text-gray-400 leading-relaxed">
                  Connecting carriers to top-rated escort units and verified police scheduling authorities across North America.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Operational Intelligence Tools */}
        <section className="py-24 px-4 bg-accent/5 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-12 italic tracking-tighter">OPERATIONAL <span className="text-accent underline decoration-4 underline-offset-8">INTELLIGENCE</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Link href="/tools/friday-checker" className="group bg-black/40 border border-white/5 p-8 rounded-[32px] hover:border-accent/40 transition-all backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -translate-y-12 translate-x-12 blur-2xl group-hover:bg-accent/20 transition-all"></div>
                <div className="text-3xl mb-4">📅</div>
                <h4 className="text-xl font-bold text-white mb-2">Can I Move Friday?</h4>
                <p className="text-gray-500 text-sm mb-6">Analyze weekend-adjacent curfews and metro zone movement windows instantly.</p>
                <span className="text-accent font-bold text-xs uppercase tracking-widest group-hover:underline">Launch Checker &rarr;</span>
              </Link>

              <Link href="/tools/superload-meter" className="group bg-black/40 border border-white/5 p-8 rounded-[32px] hover:border-accent/40 transition-all backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -translate-y-12 translate-x-12 blur-2xl group-hover:bg-accent/20 transition-all"></div>
                <div className="text-3xl mb-4">🌡️</div>
                <h4 className="text-xl font-bold text-white mb-2">Superload Risk Meter</h4>
                <p className="text-gray-500 text-sm mb-6">Predictive feasibility scoring for massive, high-dimension transportation projects.</p>
                <span className="text-accent font-bold text-xs uppercase tracking-widest group-hover:underline">Launch Meter &rarr;</span>
              </Link>

              <Link href="/tools/cost-estimator" className="group bg-black/40 border border-white/5 p-8 rounded-[32px] hover:border-accent/40 transition-all backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full -translate-y-12 translate-x-12 blur-2xl group-hover:bg-accent/20 transition-all"></div>
                <div className="text-3xl mb-4">🧾</div>
                <h4 className="text-xl font-bold text-white mb-2">Escort Cost Estimator</h4>
                <p className="text-gray-500 text-sm mb-6">Calculate transparent convoy overhead based on state-specific market data.</p>
                <span className="text-accent font-bold text-xs uppercase tracking-widest group-hover:underline">Launch Estimator &rarr;</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Dynamic Data Preview */}
        <section className="py-24 px-4 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-[40px] p-8 md:p-16 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="max-w-md">
                  <h2 className="text-4xl md:text-5xl font-black text-white mb-6">State Protocols</h2>
                  <p className="text-gray-400 mb-8">Access granular triggers for lead vs chase cars, height pole endorsements, and urban curfew windows.</p>
                  <div className="space-y-4">
                    <Link href="/state/florida" className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5 hover:border-accent/40 transition-all">
                      <span className="font-bold">Florida Registry</span>
                      <span className="text-accent">&rarr;</span>
                    </Link>
                    <Link href="/state/texas" className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5 hover:border-accent/40 transition-all">
                      <span className="font-bold">Texas Registry</span>
                      <span className="text-accent">&rarr;</span>
                    </Link>
                  </div>
                </div>
                <div className="w-full md:w-1/2 bg-black/60 rounded-3xl p-8 border border-white/10 font-mono text-sm group">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                    </div>
                    <span className="text-gray-600 text-[10px] uppercase">Haul-Command-OS // Risk Terminal</span>
                  </div>
                  <div className="space-y-4 text-gray-300">
                    <p className="text-accent">Calculating Movement Risk Score...</p>
                    <p className="flex justify-between"><span>[STATE]:</span> <span className="text-white">Texas</span></p>
                    <p className="flex justify-between"><span>[WIDTH]:</span> <span className="text-white">16' 00"</span></p>
                    <p className="flex justify-between"><span>[FRIDAY]:</span> <span className="text-white">TRUE</span></p>
                    <div className="h-px bg-white/10 my-4"></div>
                    <p className="flex justify-between font-bold"><span>FINAL RISK:</span> <span className="text-red-500">8 / 10 (HIGH)</span></p>
                    <p className="text-[10px] text-gray-500 italic mt-4 underline decoration-accent transition-all group-hover:text-accent cursor-pointer">View full mitigation strategy &rarr;</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-12 px-4 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-accent font-black tracking-tighter text-2xl">HAUL COMMAND</div>
          <div className="flex space-x-8 text-gray-500 text-sm">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
            <a href="https://ops.fhwa.dot.gov/freight/sw/index.htm" target="_blank" className="hover:text-white transition-colors">FHWA Baseline</a>
          </div>
        </div>
      </footer>
    </>
  );
}
