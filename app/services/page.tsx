import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

const SERVICES = [
  {
    slug: 'pilot-car',
    title: 'Pilot Car Services',
    description: 'Certified pilot car operators for oversize and overweight loads across 120 countries.',
    longDescription: 'Pilot car (also called escort car or lead vehicle) services are essential for any oversize, overweight, or wide load transport. Our network of verified pilot car operators provides professional lead and follow escort services across every major corridor in all 120 countries we serve.',
    features: ['Lead vehicle escort', 'Follow vehicle escort', 'Route surveying', 'Height pole operation', 'Communication relay'],
    icon: '\ud83d\ude97',
  },
  {
    slug: 'wide-load-escort',
    title: 'Wide Load Escort',
    description: 'Professional wide load escort operators for permitted oversize cargo transport.',
    longDescription: 'Wide load escort services ensure safe passage for oversized cargo through highways, urban areas, and restricted zones. Our escorts are trained in local regulations, signage requirements, and traffic control procedures for all 120 operating countries.',
    features: ['Oversize banners & flags', 'Traffic control', 'Intersection clearing', 'Bridge height verification', 'Night escort capability'],
    icon: '\ud83d\udea8',
  },
  {
    slug: 'heavy-haul',
    title: 'Heavy Haul Transport',
    description: 'End-to-end heavy haul logistics for industrial equipment, transformers, and machinery.',
    longDescription: 'Heavy haul transport requires specialized knowledge of bridge weight limits, route restrictions, and permit requirements. Our platform connects brokers with experienced heavy haul escort operators who understand the unique challenges of moving extreme loads.',
    features: ['Multi-axle load escorts', 'Bridge weight verification', 'Utility coordination', 'Police escorts', 'Route engineering'],
    icon: '\ud83d\uddfb',
  },
  {
    slug: 'wind-energy',
    title: 'Wind Energy Transport',
    description: 'Specialized escort services for wind turbine blade, tower, and nacelle transportation.',
    longDescription: 'Wind energy component transport represents some of the most challenging oversize hauls in the industry. Blades exceeding 200 feet require highly specialized escort operators with experience in turning movements, rural road navigation, and multi-escort coordination.',
    features: ['Blade transport escorts', 'Tower section escorts', 'Nacelle escorts', 'Rural road navigation', 'Multi-state coordination'],
    icon: '\ud83c\udf2c\ufe0f',
  },
  {
    slug: 'route-survey',
    title: 'Route Survey Services',
    description: 'Pre-haul route surveys to verify clearances, hazards, and permit compliance.',
    longDescription: 'Route surveys are the critical first step before any oversize transport. Our qualified route surveyors verify bridge clearances, utility heights, road widths, turning radii, and construction zones along the planned route. Survey reports include documentation required for permit applications.',
    features: ['Bridge height verification', 'Road width measurement', 'Turning radius assessment', 'Utility clearance check', 'Digital survey reports'],
    icon: '\ud83d\udccd',
  },
  {
    slug: 'autonomous-escort',
    title: 'Autonomous Vehicle Escort',
    description: 'Certified escort services for autonomous and self-driving vehicle testing convoys.',
    longDescription: 'As autonomous vehicle testing expands globally, qualified escort operators are in high demand. Our certified AV escort operators are trained in SAE protocols, equipped with two-way communication systems, and experienced in multi-vehicle convoy management.',
    features: ['SAE-certified operators', 'Real-time telemetry', 'Convoy management', 'Safety perimeter vehicles', 'Incident reporting'],
    icon: '\ud83e\udd16',
  },
];

export const metadata: Metadata = {
  title: 'Heavy Haul Escort Services \u2014 120 countries | Haul Command',
  description: 'Professional pilot car, wide load, heavy haul, wind energy, and route survey escort services across 120 countries. Find verified operators now.',
};

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <section className="py-16 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent">
          Professional Escort Services \u2014 120 countries
        </h1>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          From pilot cars to autonomous vehicle escorts, find the right operator for every load type.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map((service) => (
            <Link aria-label="Navigation Link"
              key={service.slug}
              href={`/services/${service.slug}`}
              className="group p-6 bg-white/5 border border-white/10 rounded-2xl hover:border-amber-500/30 transition-all"
            >
              <span className="text-4xl block mb-4">{service.icon}</span>
              <h2 className="text-xl font-bold mb-2 group-hover:text-amber-400 transition-colors">
                {service.title}
              </h2>
              <p className="text-sm text-gray-400 mb-4">{service.description}</p>
              <ul className="space-y-1">
                {service.features.slice(0, 3).map((f) => (
                  <li key={f} className="text-xs text-gray-500 flex items-center gap-1">
                    <span className="text-amber-500">\u2022</span> {f}
                  </li>
                ))}
              </ul>
              <span className="inline-block mt-4 text-amber-400 text-sm font-medium group-hover:translate-x-1 transition-transform">
                Find operators \u2192
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Need an Escort Operator?</h2>
        <p className="text-gray-400 mb-6">
          Post your load on the Haul Command load board and receive responses from verified operators in minutes.
        </p>
        <div className="flex justify-center gap-4">
          <Link aria-label="Navigation Link"
            href="/loads"
            className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-xl transition-colors"
          >
            Post a Load
          </Link>
          <Link aria-label="Navigation Link"
            href="/directory"
            className="px-8 py-3 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors"
          >
            Browse Directory
          </Link>
        </div>
      </section>
    </div>
  );
}
