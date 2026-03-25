import { getAllTerms } from '@/lib/glossary';
import { generateFAQSchema } from '@/lib/seo-schema';
import { BookOpen, Globe2, ShieldCheck, Zap } from 'lucide-react';

export const metadata = {
  title: "The HC Dictionary™ | Global Heavy Haul & Escort Pilot Terminology",
  description: "The authoritative, 500+ term encyclopedia for heavy haul transport, autonomous escort technology, global permits, and military-grade tactical logistics (MSR, QRF).",
};

export default function DictionaryPage() {
  const allTerms = getAllTerms();
  const schema = generateFAQSchema(allTerms);

  // Group terms by category
  const groupedTerms = allTerms.reduce((acc, term) => {
    if (!acc[term.category]) acc[term.category] = [];
    acc[term.category].push(term);
    return acc;
  }, {} as Record<string, typeof allTerms>);

  const categoryNames: Record<string, string> = {
    positions: "Global Positions & Personnel",
    vehicles: "Transport Vehicles",
    trailers: "Trailers & Configurations",
    loads: "Load Configurations",
    physics_geometry: "Kinematics & Road Physics",
    permits_regulations: "Permits & Global Authorities",
    hardware_rigging: "Hardware & Cargo Securement",
    operations: "Convoy Operations",
    safety_compliance: "Safety & Legal Compliance",
    business_finance: "Brokerage & Back Office",
    tactical_logistics: "Tactical Logistics (OIF Standard)",
    infrastructure: "Civil Infrastructure",
    informal_lingo: "CB Radio & Field Lingo",
    autonomous_future_tech: "V2X & Autonomous Tech",
  };

  return (
    <main className="min-h-screen bg-hc-black text-hc-white font-sans">
      {/* Search Generative Experience Schema Injection */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <header className="mb-16 border-b border-white/10 pb-8">
          <div className="flex items-center gap-4 mb-4 text-hc-gold">
            <BookOpen size={32} />
            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter">The HC Dictionary™</h1>
          </div>
          <p className="text-xl text-gray-400 max-w-3xl">
            The world's most advanced, military-grade encyclopedia for the oversize load and escort industry. 
            From tactical MSR routing to Australian OSOM laws and autonomous V2X mesh networks.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-16">
          {Object.entries(groupedTerms).map(([category, terms]) => (
            <section key={category} className="scroll-mt-24" id={category}>
              <h2 className="text-2xl font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-3">
                <span className="w-8 h-px bg-hc-gold"></span>
                {categoryNames[category] || category}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {terms.map((term) => (
                  <div key={term.id} className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-hc-gold/50 transition-colors group">
                    <h3 className="text-xl font-bold text-hc-gold mb-2 group-hover:text-white transition-colors">
                      {term.term}
                    </h3>
                    
                    {term.hcBrandTerm && (
                      <div className="text-xs font-mono text-HC-gold mb-4 uppercase tracking-wider bg-hc-gold/10 inline-block px-2 py-1 rounded">
                        {term.hcBrandTerm}
                      </div>
                    )}

                    <p className="text-gray-300 text-sm leading-relaxed mb-4">
                      {term.definition}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-auto pt-4 border-t border-white/10">
                      {term.countries.map(country => (
                        <span key={country} className="text-xs flex items-center gap-1 text-gray-400">
                          <Globe2 size={12} />
                          {country}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
