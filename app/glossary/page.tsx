import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Heavy Haul Glossary — Pilot Car, Escort, OSOW Terms | Haul Command',
  description: 'Complete glossary of pilot car, escort vehicle, oversize/overweight (OSOW), and heavy haul industry terminology across 120 countries.',
  alternates: { canonical: 'https://www.haulcommand.com/glossary' },
};

const TERMS = [
  { term: 'Pilot Car', abbr: 'PC', def: 'A vehicle that precedes or follows an oversize load to warn other drivers and clear the path. Also called escort vehicle or PEVO (Pilot Escort Vehicle Operator).' },
  { term: 'PEVO', abbr: null, def: 'Pilot Escort Vehicle Operator — the certified professional who operates a pilot car during an oversize load movement.' },
  { term: 'OSOW', abbr: null, def: 'Oversize/Overweight — loads that exceed standard legal dimensions (height, width, length) or weight limits and require special permits and escorts.' },
  { term: 'Lead Car', abbr: null, def: 'A pilot car positioned ahead of the oversize load. Warns oncoming traffic and clears the route ahead.' },
  { term: 'Chase Car', abbr: null, def: 'A pilot car positioned behind the oversize load. Protects the rear of the convoy and warns following traffic.' },
  { term: 'Height Pole', abbr: null, def: 'A pole mounted on a pilot car equal to the height of the load being transported. Used to test clearance under bridges, overpasses, and utility lines.' },
  { term: 'Route Survey', abbr: null, def: 'A pre-move inspection of the intended route to identify and document clearances, bridge ratings, turn radii, and potential obstacles.' },
  { term: 'Superload', abbr: null, def: 'An oversize load that exceeds the dimensions requiring standard oversize permits, typically requiring engineering review and special routing.' },
  { term: 'Permit', abbr: null, def: 'State or provincial authorization required to move an oversize/overweight load on public roads. Requirements vary by jurisdiction.' },
  { term: 'Deadhead', abbr: null, def: 'Travel by an escort vehicle to or from a load without escorting. Usually compensated at 50-100% of loaded rate per mile.' },
  { term: 'Bucket Truck', abbr: null, def: 'A utility truck with an extendable aerial work platform used to temporarily lift power lines, cables, or branches to allow overheight loads to pass.' },
  { term: 'Detention', abbr: null, def: 'Wait time caused by delays outside the escort operator\'s control (weather, load issues, permit problems). Typically billed at hourly rate after a grace period.' },
  { term: 'Corridor', abbr: null, def: 'A frequently traveled oversize load route, often with established relationships between brokers, operators, and permit offices.' },
  { term: 'Load Board', abbr: null, def: 'A marketplace where freight brokers post loads needing escort and pilot car operators search for available work.' },
  { term: 'Claim / Claimed Profile', abbr: null, def: 'A verified operator listing where the business owner has authenticated ownership and taken control of their Haul Command directory entry.' },
  { term: 'HC Certification', abbr: null, def: 'Haul Command\'s industry certification for pilot car operators, escort companies, and route survey specialists. Globally recognized across 120 countries.' },
  { term: 'Standing Order', abbr: null, def: 'A pre-funded escrow arrangement between a shipper and escort provider for recurring or high-volume moves. Reduces payment friction.' },
  { term: 'Night Move', abbr: null, def: 'An oversize load movement conducted during nighttime hours. Typically requires additional permits and carries 20-50% rate premium.' },
  { term: 'Reciprocity', abbr: null, def: 'State or country agreements recognizing each other\'s pilot car certifications, reducing the need for multiple licenses.' },
];

const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const byLetter = TERMS.reduce((acc: Record<string, typeof TERMS>, t) => {
  const l = t.term[0].toUpperCase();
  if (!acc[l]) acc[l] = [];
  acc[l].push(t);
  return acc;
}, {});

export default function GlossaryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#0B0F14] text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-xs text-[#F1A91B] font-bold uppercase tracking-widest mb-3">Reference</div>
          <h1 className="text-4xl font-black mb-3">Heavy Haul Glossary</h1>
          <p className="text-gray-400 max-w-xl">Industry terminology for pilot car operations, oversize load escorting, and heavy haul logistics across 120 countries.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Alpha nav */}
        <div className="flex flex-wrap gap-1.5 mb-10">
          {Object.keys(byLetter).map(l => (
            <a key={l} href={`#letter-${l}`}
              className="w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg bg-white border border-gray-200 hover:bg-[#F1A91B] hover:text-black hover:border-[#F1A91B] transition-all">
              {l}
            </a>
          ))}
        </div>

        {/* Terms */}
        <div className="space-y-10">
          {Object.entries(byLetter).sort().map(([letter, terms]) => (
            <div key={letter} id={`letter-${letter}`}>
              <div className="text-2xl font-black text-[#C6923A] mb-4 pb-2 border-b border-gray-200">{letter}</div>
              <div className="space-y-4">
                {terms.map(t => (
                  <div key={t.term} className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <h2 className="font-black text-gray-900">{t.term}</h2>
                      {t.abbr && <span className="text-xs font-bold text-[#C6923A] bg-[#F1A91B]/10 px-2 py-0.5 rounded-full">{t.abbr}</span>}
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed">{t.def}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center p-6 bg-[#0B0F14] rounded-2xl text-white">
          <h3 className="font-black text-lg mb-2">Put These Terms to Work</h3>
          <p className="text-gray-400 text-sm mb-4">Find verified operators, check escort requirements, and get rate benchmarks.</p>
          <div className="flex justify-center gap-3">
            <Link href="/directory" className="px-5 py-2 bg-[#F1A91B] text-black font-bold rounded-lg text-sm">Find Escorts</Link>
            <Link href="/escort-requirements" className="px-5 py-2 bg-white/10 text-white font-semibold rounded-lg text-sm border border-white/20">Check Requirements</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
