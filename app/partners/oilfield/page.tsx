import { Metadata } from 'next';
import { PartnerInquiryForm } from '@/components/partners/PartnerInquiryForm';

export const metadata: Metadata = {
  title: 'Oilfield Escort Operators — Permian Basin, Eagle Ford, Bakken | Haul Command',
  description: 'Verified escort operators for oilfield equipment moves in the Permian Basin, Eagle Ford, Bakken, and oil patch regions across 120 countries. Post a rig move in 90 seconds.',
};

export default function OilfieldPartnerPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="inline-block px-3 py-1 bg-amber-500/20 text-amber-400 text-sm rounded-full mb-6">
            For Oilfield Operations
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Escort operators who know<br />
            <span className="text-amber-400">FM roads and oilfield protocols.</span>
          </h1>
          <p className="text-xl text-gray-400 mb-10 max-w-2xl">
            The Permian Basin generates 500+ new drilling permits every month.
            Each rig move needs multiple escorts across FM roads that Google Maps doesn\u2019t know exist.
            Haul Command has the operators in Midland, Odessa, Andrews, and Pecos \u2014 ready now.
          </p>
          <a href="#inquiry" className="inline-block px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white font-bold rounded-xl transition-colors">
            Find Oilfield Escorts
          </a>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-4xl font-bold text-amber-400">500+</p>
            <p className="text-gray-400">Permian Basin drilling permits per month</p>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-4xl font-bold text-amber-400">8-12</p>
            <p className="text-gray-400">Escort jobs per rig move</p>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-2xl">
            <p className="text-4xl font-bold text-amber-400">47 min</p>
            <p className="text-gray-400">Median fill time on platform</p>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6">Oilfield regions with Haul Command coverage</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            'Permian Basin, TX',
            'Eagle Ford Shale, TX',
            'Bakken Formation, ND',
            'Denver-Julesburg Basin, CO',
            'Powder River Basin, WY',
            'Midcontinent, OK',
            'Appalachian Basin, PA/WV',
            'Haynesville Shale, LA',
            'Anadarko Basin, OK',
          ].map((r) => (
            <div key={r} className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-sm text-amber-300">{r}</div>
          ))}
        </div>
      </section>

      <section id="inquiry" className="max-w-2xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold mb-2 text-center">Tell us about your oilfield operations</h2>
        <p className="text-gray-400 text-center mb-8">No pitch. Tell us your basins and we\u2019ll confirm coverage.</p>
        <PartnerInquiryForm defaultInterest="Oilfield moves" />
      </section>
    </div>
  );
}
