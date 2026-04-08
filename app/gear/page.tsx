import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Official Gear & Identity Cards | Haul Command',
  description: 'Order your official Haul Command Operator ID Card, magnetic vehicle signs, and high-visibility apparel. Arrive on-site as a verified, high-trust escort professional.',
  alternates: {
    canonical: 'https://haulcommand.com/gear'
  }
};

const GEAR = [
  { 
    title: "Official Operator ID Card", 
    desc: "Rigid PVC ID Card with your Haul Command Verification QR Code. Essential for port, chemical, and military base clearance.", 
    price: "$25.00",
    slug: "operator-id"
  },
  { 
    title: "Magnetic Door Signs (Set of 2)", 
    desc: "Heavy-duty reflective magnetic signs co-branded with 'Haul Command Verified Operator'.", 
    price: "$65.00",
    slug: "magnetic-signs"
  },
  { 
    title: "Class 3 High-Vis Safety Vest", 
    desc: "ANSI Class 3 certified safety vest with Haul Command reflective branding on the back panel.", 
    price: "$45.00",
    slug: "safety-vest"
  }
];

export default function GearStorePage() {
  return (
    <div className="min-h-screen bg-[#07090d] text-white">
      <section className="pt-24 pb-16 px-4 bg-[#0a0f16] border-b border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1">
            <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-tight">
              Arrive As The <br /><span className="text-amber-500">Authority.</span>
            </h1>
            <p className="text-gray-400 text-xl leading-relaxed mb-8 max-w-lg">
              Outfit your operation with the official Haul Command identity package. High-trust operators skip the line at ports and weigh stations.
            </p>
            <div className="flex gap-4">
              <Link href="/dashboard" className="px-6 py-3 bg-white/10 hover:bg-white/20 font-bold rounded-xl transition-colors">
                Verify Profile First
              </Link>
            </div>
          </div>
          <div className="flex-1 relative">
            {/* Visual representation of an ID Card */}
            <div className="w-full max-w-md mx-auto aspect-[1.6] bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden transform rotate-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 blur-3xl -translate-y-10 translate-x-10" />
              <div className="flex justify-between items-start mb-8 opacity-80">
                <div className="font-black text-xl tracking-tighter">HAUL<span className="text-amber-500">COMMAND</span></div>
                <div className="px-2 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold rounded uppercase tracking-wider">Verified Identity</div>
              </div>
              <div className="flex gap-4">
                <div className="w-20 h-24 bg-white/10 rounded-lg overflow-hidden shrink-0" />
                <div>
                  <div className="h-4 w-32 bg-white/20 rounded mb-2" />
                  <div className="h-3 w-48 bg-white/10 rounded mb-4" />
                  <div className="flex gap-2 text-[10px] text-gray-500 font-mono">
                    <span>ID: {Date.now().toString().slice(-6)}</span>
                    <span>EXP: 12/26</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-bold">Official Field Gear</h2>
            <span className="text-sm text-gray-500">Fulfilled by BuildASign / Print Partners</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {GEAR.map((item, i) => (
              <div key={i} className="bg-[#0d131f] border border-white/5 p-6 rounded-2xl flex flex-col justify-between group">
                <div>
                  <div className="w-full aspect-video bg-white/5 rounded-xl mb-6 flex items-center justify-center p-4">
                     <span className="text-sm text-gray-500 uppercase tracking-widest font-bold opacity-50">{item.slug}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-400 mb-6 leading-relaxed">{item.desc}</p>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <span className="text-xl font-bold text-amber-500">{item.price}</span>
                  <Link href={`/dashboard/gear?add=${item.slug}`} className="px-4 py-2 bg-white/5 hover:bg-amber-500 hover:text-black font-semibold rounded-lg text-sm transition-colors">
                    Order
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 p-8 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
             <div className="relative z-10">
                <h3 className="text-xl font-bold text-amber-500 mb-2">Notice: Trust & Verification Rules</h3>
                <p className="text-sm text-gray-400 max-w-xl">
                  Haul Command ID cards and branded magnetic signs can only be purchased and shipped to operators who have cleared the onboarding verification check. Doing so protects the reputation of the network.
                </p>
             </div>
             <Link href="/claim" className="px-6 py-3 bg-amber-500 text-black font-bold rounded-xl shrink-0 z-10 transition-transform hover:scale-105">
               Start Verification
             </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
