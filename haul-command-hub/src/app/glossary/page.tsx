import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Heavy Haul Glossary — 200+ Industry Terms | HAUL COMMAND',
  description: 'Complete heavy haul and oversize load glossary. Learn 200+ industry terms including pilot car, escort vehicle, superload, and more.',
};

const GLOSSARY_TERMS = [
  { term: 'Pilot Car', slug: 'pilot-car', definition: 'A vehicle that leads or follows an oversize load to warn other motorists and guide the transport through obstacles.' },
  { term: 'Escort Vehicle', slug: 'escort-vehicle', definition: 'A vehicle accompanying an oversize or overweight load to provide safety and traffic control.' },
  { term: 'Superload', slug: 'superload', definition: 'A load that exceeds standard oversize permit limits, requiring special routing, engineering studies, and multiple escorts.' },
  { term: 'Oversize Load', slug: 'oversize-load', definition: 'A load that exceeds standard legal width, height, length, or weight limits, requiring a special permit.' },
  { term: 'Overweight Load', slug: 'overweight-load', definition: 'A load that exceeds the standard gross vehicle weight limit on public roadways.' },
  { term: 'Wide Load', slug: 'wide-load', definition: 'A load exceeding the standard width limit (typically 8\'6" in the US), requiring oversize permits and often escort vehicles.' },
  { term: 'Route Survey', slug: 'route-survey', definition: 'A pre-trip inspection of the planned transport route to identify obstacles, low clearances, tight turns, and road conditions.' },
  { term: 'Height Pole', slug: 'height-pole', definition: 'A pole mounted on a pilot car set to the height of the load behind it, used to check clearances under bridges and power lines.' },
  { term: 'Amber Light', slug: 'amber-light', definition: 'Flashing yellow/amber warning lights mounted on pilot cars and escort vehicles as required by most jurisdictions.' },
  { term: 'Oversize Banner', slug: 'oversize-banner', definition: 'A fluorescent orange or yellow sign reading "OVERSIZE LOAD" or "WIDE LOAD" displayed on the transport vehicle and escort cars.' },
  { term: 'ELD', slug: 'eld', definition: 'Electronic Logging Device — a device that automatically records a driver\'s driving time and Hours of Service (HOS) compliance.' },
  { term: 'HOS', slug: 'hos', definition: 'Hours of Service — federal regulations limiting how long a commercial driver can operate a vehicle before required rest.' },
  { term: 'Dead Head', slug: 'dead-head', definition: 'Driving without a load, typically returning from a delivery. A significant cost factor in heavy haul operations.' },
  { term: 'Corridor', slug: 'corridor', definition: 'A frequently used transport route between two cities or regions, often with established escort operator coverage.' },
  { term: 'FMCSA', slug: 'fmcsa', definition: 'Federal Motor Carrier Safety Administration — the US agency that regulates the trucking industry.' },
  { term: 'DOT Number', slug: 'dot-number', definition: 'A unique identifier assigned by the FMCSA to commercial motor carriers for identification and safety monitoring.' },
  { term: 'MC Number', slug: 'mc-number', definition: 'Motor Carrier number — operating authority granted by FMCSA for interstate commerce.' },
  { term: 'Axle Weight', slug: 'axle-weight', definition: 'The total weight bearing on a single axle of a vehicle, subject to legal limits per axle configuration.' },
  { term: 'Gross Vehicle Weight (GVW)', slug: 'gross-vehicle-weight', definition: 'The total weight of a vehicle including the load, fuel, passengers, and equipment.' },
  { term: 'Bridge Formula', slug: 'bridge-formula', definition: 'Federal formula that determines the maximum weight any set of axles can carry based on the number and spacing of axles.' },
  { term: 'Permit', slug: 'permit', definition: 'Government authorization to transport an oversize or overweight load on public roads, specifying route, dimensions, and conditions.' },
  { term: 'Single Trip Permit', slug: 'single-trip-permit', definition: 'A permit valid for one specific trip, specifying exact origin, destination, route, and time frame.' },
  { term: 'Annual Permit', slug: 'annual-permit', definition: 'A permit valid for one year, allowing multiple trips within specified dimension and weight limits.' },
  { term: 'Multi-State Permit', slug: 'multi-state-permit', definition: 'A permit covering transport across multiple states, sometimes available through regional agreements.' },
  { term: 'Lowboy', slug: 'lowboy', definition: 'A semi-trailer with a very low deck height, used for hauling tall equipment like excavators and bulldozers.' },
  { term: 'Flatbed', slug: 'flatbed', definition: 'An open trailer with a flat deck and no sides, used for hauling construction materials, steel, and equipment.' },
  { term: 'RGN (Removable Gooseneck)', slug: 'rgn', definition: 'A trailer where the gooseneck detaches for ground-level loading of heavy equipment.' },
  { term: 'Step Deck', slug: 'step-deck', definition: 'A trailer with an upper and lower deck, allowing taller cargo while maintaining overall height compliance.' },
  { term: 'Perimeter Trailer', slug: 'perimeter-trailer', definition: 'A heavy-haul trailer that carries weight around the perimeter rather than on the deck surface.' },
  { term: 'Schnabel', slug: 'schnabel', definition: 'A specialized trailer that connects to the load itself, making the load part of the trailer structure. Used for transformers and heavy industrial equipment.' },
  { term: 'Beam Trailer', slug: 'beam-trailer', definition: 'An extendable trailer designed for extremely long loads like bridge beams, wind turbine blades, and industrial columns.' },
  { term: 'Dual Lane', slug: 'dual-lane', definition: 'When an oversize load occupies two lanes of traffic, requiring additional escort vehicles and traffic control.' },
  { term: 'Curfew', slug: 'curfew', definition: 'Time restrictions on oversize load movement, typically prohibiting travel during rush hours, nighttime, or holidays.' },
  { term: 'Wind Speed Restriction', slug: 'wind-speed-restriction', definition: 'Maximum wind speed at which an oversize load can safely travel, particularly relevant for tall or wide loads.' },
  { term: 'High Pole', slug: 'high-pole', definition: 'The practice of measuring heights along a route using a height pole to ensure clearance for tall loads.' },
  { term: 'Bucket Truck', slug: 'bucket-truck', definition: 'A utility vehicle with an elevated bucket used to lift power lines for oversize load passage.' },
  { term: 'Utility Clearance', slug: 'utility-clearance', definition: 'The process of coordinating with utility companies to temporarily raise or de-energize power lines along a transport route.' },
  { term: 'LEA Escort', slug: 'lea-escort', definition: 'Law Enforcement Agency escort — a police officer who accompanies an oversize load, often required for superloads.' },
  { term: 'Flag Car', slug: 'flag-car', definition: 'Another term for pilot car/escort vehicle, particularly common in Australian heavy haul terminology.' },
  { term: 'NHVR', slug: 'nhvr', definition: 'National Heavy Vehicle Regulator — the Australian agency responsible for regulating heavy vehicles.' },
  { term: 'Abnormal Load', slug: 'abnormal-load', definition: 'UK/EU terminology for a load that exceeds standard dimensions or weight limits.' },
  { term: 'STGO', slug: 'stgo', definition: 'Special Types General Order — UK regulation governing the movement of abnormal loads on public roads.' },
  { term: 'Bondable', slug: 'bondable', definition: 'An operator who can obtain a surety bond, demonstrating financial responsibility and trustworthiness.' },
  { term: 'Cargo Insurance', slug: 'cargo-insurance', definition: 'Insurance covering damage to freight during transport, separate from vehicle liability insurance.' },
  { term: 'IFTA', slug: 'ifta', definition: 'International Fuel Tax Agreement — a system for collecting and distributing fuel taxes among US states and Canadian provinces.' },
  { term: 'Bobtail', slug: 'bobtail', definition: 'Operating a truck tractor without a trailer attached.' },
  { term: 'Tandem', slug: 'tandem', definition: 'A pair of axles close together, distributing weight more evenly across the road surface.' },
  { term: 'Tri-Axle', slug: 'tri-axle', definition: 'A trailer or truck with three axles, allowing it to carry heavier loads while distributing weight.' },
  { term: 'Kingpin', slug: 'kingpin', definition: 'The coupling pin on a trailer that connects to the fifth wheel on a truck tractor.' },
  { term: 'Fifth Wheel', slug: 'fifth-wheel', definition: 'The coupling device on a tractor that connects to the trailer kingpin, allowing articulation.' },
];

export default function GlossaryPage() {
  const grouped = GLOSSARY_TERMS.reduce((acc, term) => {
    const letter = term.term[0].toUpperCase();
    if (!acc[letter]) acc[letter] = [];
    acc[letter].push(term);
    return acc;
  }, {} as Record<string, typeof GLOSSARY_TERMS>);

  const letters = Object.keys(grouped).sort();

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-12 min-h-screen">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Glossary</span>
        </nav>

        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
            Heavy Haul <span className="text-accent">Glossary</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            {GLOSSARY_TERMS.length}+ industry terms defined. The most comprehensive heavy haul and oversize load terminology reference.
          </p>
        </header>

        {/* Letter Quick Nav */}
        <div className="flex flex-wrap gap-2 mb-10 sticky top-16 bg-[#0B0F14]/95 backdrop-blur-md py-3 z-10">
          {letters.map((letter) => (
            <a key={letter} href={`#letter-${letter}`} className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-accent hover:bg-accent/10 transition-colors">
              {letter}
            </a>
          ))}
        </div>

        {/* Terms by Letter */}
        <div className="space-y-12">
          {letters.map((letter) => (
            <section key={letter} id={`letter-${letter}`}>
              <h2 className="text-3xl font-black text-accent mb-6 border-b border-white/5 pb-2">{letter}</h2>
              <div className="space-y-6">
                {grouped[letter].map((item) => (
                  <div key={item.slug} id={item.slug} className="scroll-mt-24">
                    <h3 className="text-lg font-bold text-white mb-1">{item.term}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{item.definition}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Schema markup */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'DefinedTermSet',
              name: 'Heavy Haul & Oversize Load Glossary',
              description: `${GLOSSARY_TERMS.length}+ industry terms for heavy haul transport, pilot car operations, and oversize load escort services.`,
              hasDefinedTerm: GLOSSARY_TERMS.map((t) => ({
                '@type': 'DefinedTerm',
                name: t.term,
                description: t.definition,
                url: `https://haulcommand.com/glossary#${t.slug}`,
              })),
            }),
          }}
        />
      </main>
    </>
  );
}
