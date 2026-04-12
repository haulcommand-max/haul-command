import { Metadata } from 'next';
import { PartnerInquiryForm } from '@/components/partners/PartnerInquiryForm';

export const metadata: Metadata = {
  title: 'Wind Energy Transport Escorts â€” Blade, Tower & Nacelle | Haul Command',
  description: 'Specialized escort operators for wind turbine blade, tower, and nacelle transportation. Multi-state coordination, 200+ ft blade escorts, renewable energy corridors.',
};

export default function WindEnergyPartnerPage() {
  return (
    <div className=" bg-[#0a0a0a] text-white">
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full mb-6">
            For Wind Energy Projects
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Blade transport escorts<br />
            <span className="text-amber-400">for 200+ foot loads.</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl">
            Modern wind turbine blades exceed 260 feet and require 4-5 escort vehicles,
            multi-state coordination, and operators experienced in the unique demands of renewable energy transport.
          </p>
          <a href="#inquiry" className="inline-block px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-colors">
            Find Wind Energy Escorts
          </a>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Wind energy corridors covered</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            'Texas Wind Corridor',
            'Great Plains Wind Belt',
            'Midwest Wind Belt (IA/IL/MN)',
            'Pacific Northwest (WA/OR)',
            'North Sea Corridor (GB/DE/NL)',
            'South Australian Wind Zone',
            'Brazilian Trade Wind Corridor',
            'Iberian Peninsula (ES/PT)',
            'Danish Offshore Staging Routes',
          ].map((c) => (
            <div key={c} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-300">{c}</div>
          ))}
        </div>
      </section>

      <section id="inquiry" className="max-w-2xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-2 text-center">Tell us about your wind project</h2>
        <p className="text-gray-400 text-center mb-8">Project routes, load specs, timeline. We\u2019ll confirm our coverage.</p>
        <PartnerInquiryForm defaultInterest="Wind energy" />
      </section>
    </div>
  );
}