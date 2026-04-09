import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

const SERVICES: Record<string, {
  title: string;
  description: string;
  longDescription: string;
  features: string[];
  icon: string;
  image?: string;
  relatedCorridors: string[];
}> = {
  'pilot-car': {
    title: 'Pilot Car Services',
    description: 'Certified pilot car operators for oversize and overweight loads across 120 countries.',
    longDescription: 'Pilot car (also called escort car, lead vehicle, or chase car) services are the backbone of heavy haul transport. Every jurisdiction requires escort vehicles for loads exceeding specific dimension thresholds. Our network of 1.5M+ verified pilot car operators provides lead and follow escort services across every major corridor in all 120 countries we serve.\n\nWhether you need a single pilot car for a standard overwidth load or a multi-vehicle escort team for a superload, Haul Command connects you with pre-vetted operators who know the local regulations, road conditions, and permit requirements for your specific route.',
    features: ['Lead vehicle escort', 'Follow vehicle escort', 'Route surveying', 'Height pole operation', 'Communication relay', 'AM/FM radio equipped', 'Oversize signage (PILOT CAR / OVERSIZE LOAD)', 'First aid and safety equipment', 'GPS tracking and reporting', 'Multi-language capability'],
    icon: '🚗',
    image: '/directory/equipment/lead-car.webp',
    relatedCorridors: ['I-10 Corridor', 'I-40 Corridor', 'Trans-Canada Highway', 'M1 Motorway', 'Pacific Highway'],
  },
  'wide-load-escort': {
    title: 'Wide Load Escort Services',
    description: 'Professional wide load escort operators for permitted oversize cargo transport.',
    longDescription: 'Wide load escort services ensure safe passage for oversized cargo through highways, urban areas, and restricted zones. Loads exceeding 8\u20196\u201d (2.6m) in width typically require at minimum one escort vehicle, with additional escorts required for wider loads or complex routes.\n\nOur wide load escort operators are trained in local regulations, proper signage requirements, traffic control procedures, and emergency protocols for all 120 countries in the Haul Command network.',
    features: ['Oversize banners and flags', 'Traffic control and intersection clearing', 'Bridge height and width verification', 'Night escort with amber lighting', 'Construction zone navigation', 'Two-way radio communication', 'Emergency response coordination', 'Real-time route updates', 'Digital trip logs and reporting'],
    icon: '🚨',
    image: '/directory/equipment/chase-car.webp',
    relatedCorridors: ['I-95 Corridor', 'I-75 Corridor', 'A1 Motorway (DE)', 'Bruce Highway (AU)'],
  },
  'heavy-haul-escort': {
    title: 'Heavy Haul Transport Escort',
    description: 'End-to-end heavy haul logistics escort services for industrial equipment, transformers, and machinery.',
    longDescription: 'Heavy haul transport escort services are essential for moving the most challenging loads on our roads \u2014 transformers, reactor vessels, mining equipment, bridge beams, and other superloads that may exceed 200,000 lbs.\n\nOur heavy haul escort operators understand bridge weight limits, route restrictions, utility clearances, and the complex permit requirements that vary by jurisdiction. They coordinate with police escorts, utility companies, and transportation departments to ensure safe passage.',
    features: ['Multi-axle load escorts', 'Bridge weight verification', 'Utility coordination and lifts', 'Police escort coordination', 'Route engineering support', 'Night moves and curfew compliance', 'Multi-state/province coordination', 'Emergency pull-off identification', 'Communication with transport driver'],
    icon: '⛰️',
    image: '/directory/equipment/superload.webp',
    relatedCorridors: ['I-20 Heavy Haul Corridor', 'Alberta Oil Sands Corridor', 'Pilbara Mining Corridor (AU)'],
  },
  'wind-energy': {
    title: 'Wind Energy Transport Escort',
    description: 'Specialized escort services for wind turbine blade, tower, and nacelle transportation.',
    longDescription: 'Wind energy component transport represents some of the most challenging oversize hauls in the industry. Modern wind turbine blades can exceed 260 feet (80+ meters), requiring highly specialized escort operators with extensive experience in complex turning movements, rural road navigation, and multi-vehicle escort coordination.\n\nHaul Command\u2019s wind energy escort network includes operators certified in blade transport protocols across all major wind energy corridors worldwide.',
    features: ['Blade transport escorts (200+ ft)', 'Tower section escorts', 'Nacelle and hub escorts', 'Rural road and county road navigation', 'Multi-escort coordination (3-5 vehicles)', 'Turning movement assistance', 'Night and early morning operations', 'Landowner coordination', 'Environmental compliance'],
    icon: '🌬️',
    image: '/directory/hero-bg.webp',
    relatedCorridors: ['Texas Wind Corridor', 'Midwest Wind Belt', 'North Sea Coast (GB/DE/NL)'],
  },
  'route-survey': {
    title: 'Route Survey Services',
    description: 'Pre-haul route surveys to verify clearances, hazards, and permit compliance.',
    longDescription: 'Route surveys are the critical first step before any oversize or overweight transport. Professional route surveyors drive the planned route, measuring bridge clearances, utility heights, road widths, turning radii, and identifying construction zones, detours, and other hazards.\n\nThe resulting survey report provides the documentation required for permit applications and gives the transport team critical intelligence for a safe and successful move.',
    features: ['Bridge height verification', 'Road width measurement', 'Turning radius assessment', 'Utility clearance check', 'Construction zone identification', 'Digital survey reports with photos', 'GPS route documentation', 'Alternate route identification', 'Permit application support'],
    icon: '📍',
    image: '/directory/equipment/route-survey.webp',
    relatedCorridors: ['All corridors'],
  },
  'autonomous-escort': {
    title: 'Autonomous Vehicle Escort',
    description: 'Certified escort services for autonomous and self-driving vehicle testing convoys.',
    longDescription: 'As autonomous vehicle testing expands globally, qualified escort operators are in increasingly high demand. AV testing typically requires certified escort vehicles to provide a safety perimeter, monitor public road conditions, and maintain emergency override capability.\n\nHaul Command\u2019s AV escort operators are trained in SAE Level 4/5 testing protocols, equipped with professional two-way communication systems, and experienced in multi-vehicle convoy management on public roads.',
    features: ['SAE-certified operators', 'Real-time telemetry monitoring', 'Multi-vehicle convoy management', 'Safety perimeter vehicles', 'Incident documentation and reporting', 'Emergency intervention capability', 'Public road test support', 'Closed course support', 'Regulatory compliance documentation'],
    icon: '\ud83e\udd16',
    relatedCorridors: ['Silicon Valley Test Routes', 'Phoenix AV Corridor', 'Munich Test Zone (DE)'],
  },
  'escort-vehicle': {
    title: 'Escort Vehicle Services',
    description: 'Professional escort vehicle operators for commercial, heavy haul, and specialized transport needs.',
    longDescription: 'Escort vehicles play a critical safety role in the transport of non-standard freight. Whether managing traffic at complex intersections, providing early warning for oncoming vehicles, or ensuring correct route adherence, skilled escort operators keep the convoy and general public safe.\n\nOur extensive international network ensures you can find fully-equipped and insured escort vehicles wherever your route begins or ends.',
    features: ['Amber warning lights', 'Traffic control procedures', 'Convoy communication relay', 'Safety perimeter establishment', 'VHF / CB radio deployment', 'Pre-trip safety briefings', 'GPS live tracking'],
    icon: '🚨',
    image: '/directory/equipment/chase-car.webp',
    relatedCorridors: ['I-35 Corridor', 'I-65 Corridor', 'Florida Toll Roads'],
  },
  'oversize-escort': {
    title: 'Oversize Load Escort',
    description: 'Specialized escort services precisely engineered for oversized, overdimensional, and unconventional load structures.',
    longDescription: 'Transporting oversized dimensions (beyond 8\'6" width, 13\'6" height, or 80k lbs) introduces unique logistical constraints across every municipal line, county border, and state boundary. \n\nOversize load escort operators in our network carry necessary endorsements and liability coverage. They pre-emptively identify overhead obstructions, narrow bridges, and weight-limited structures well before the transport arrives.',
    features: ['Turn-by-turn guidance', 'Clearance monitoring', 'Height pole operations', 'Municipal coordination', 'Pedestrian control', 'Incident management'],
    icon: '⚠️',
    image: '/directory/equipment/lead-car.webp',
    relatedCorridors: ['I-10 Corridor', 'I-70 Corridor', 'Trans-Canada Highway'],
  },
  'super-load-escort': {
    title: 'Super-Load Escort Operations',
    description: 'Expert, multi-vehicle escort teams for mega-projects, transformers, space equipment, and super-loads.',
    longDescription: 'A super-load is the apex of heavy haul logistics — loads that are so massive they dictate their own rules of the road. Super-load escorts require highly coordinated teams, often involving 3 to 10 pilot cars, police escorts, and bucket trucks for wire-lifting.\n\nHaul Command’s network includes the industry\'s most experienced super-load teams capable of managing highway closures, bridge structural crossings, and civilian traffic diversion protocols.',
    features: ['Multi-jurisdiction continuity', 'Full road closure management', 'Police escort liaising', 'Utility wire lifting coordination', 'Axle-weight distribution spacing', 'Counter-flow traffic control'],
    icon: '🏗️',
    image: '/directory/equipment/superload.webp',
    relatedCorridors: ['Texas Heavy Haul Network', 'Alberta Mega-Corridors'],
  },
  'high-pole': {
    title: 'High Pole Car Services',
    description: 'Height-aware pilot cars equipped with calibrated high poles for bridge and utility wire clearance verification.',
    longDescription: 'When a load is exceptionally tall, it runs the constant risk of striking bridges, overpasses, traffic lights, and utility cables. High pole car services precede the transport with a rigidly mounted, calibrated fiberglass pole set precisely 3 to 6 inches higher than the load itself.\n\nHigh pole operators provide the critical "first strike" warning, giving the driver vital seconds to stop before a catastrophic bridge or wire strike occurs.',
    features: ['Calibrated fiberglass pole operation', 'Overhead obstruction detection', 'VHF communication of strikes', 'Lane-shift guidance', 'Emergency stop signaling', 'Clearance documentation'],
    icon: '📏',
    image: '/directory/equipment/height-pole.webp',
    relatedCorridors: ['I-95 Northeast Corridor', 'Urban Ring Roads'],
  },
  'mobile-home-escort': {
    title: 'Mobile Home & Modular Escorts',
    description: 'Certified escorts for the safe transport of manufactured housing, tiny homes, and modular structures.',
    longDescription: 'The manufactured housing industry relies heavily on escort vehicles to safely move 14-wide, 16-wide, and 18-wide structures through narrow residential streets, winding county roads, and multi-lane highways.\n\nOur network provides operators specifically experienced with the unique aerodynamics, turning radius, and sway characteristics of manufactured homes and modular buildings.',
    features: ['Toter-truck communication', 'Wind sway monitoring', 'Wide-turn traffic blocking', 'Residential street navigation', 'Multi-section coordination', 'Setup-site guidance'],
    icon: '🏠',
    relatedCorridors: ['Southeast US Housing Corridor', 'I-40 Sunbelt Corridor', 'Pacific Northwest'],
  },
};

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = SERVICES[slug];
  if (!service) return { title: 'Service | Haul Command' };
  return {
    title: `${service.title} \u2014 120 Countries | Haul Command`,
    description: service.description,
  };
}

export const dynamic = 'force-dynamic';

export default async function ServiceDetailPage({ params }: Props) {
  const { slug } = await params;
  const service = SERVICES[slug];
  if (!service) notFound();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          {service.image ? (
              <div className="w-full relative rounded-2xl overflow-hidden mb-8" style={{ aspectRatio: service.image.includes('hero-bg') ? '3.2/1' : '16/9' }}>
                  <Image 
                      src={service.image} 
                      alt={`${service.title} equipment`} 
                      fill 
                      className="object-cover" 
                      priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent pointer-events-none" />
                  <span className="absolute bottom-4 left-6 text-5xl drop-shadow-lg">{service.icon}</span>
              </div>
          ) : (
              <span className="text-5xl block mb-4">{service.icon}</span>
          )}
          
          <h1 className="text-3xl md:text-5xl tracking-tight font-extrabold mb-4">{service.title}</h1>
          <p className="text-gray-300 md:text-lg whitespace-pre-line mb-10 leading-relaxed font-medium max-w-3xl">{service.longDescription}</p>

          <div className="mb-12">
            <h2 className="text-xl font-bold mb-4">What\u2019s Included</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {service.features.map((f) => (
                <div key={f} className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                  <span className="text-amber-400">\u2713</span>
                  <span className="text-sm">{f}</span>
                </div>
              ))}
            </div>
          </div>

          {service.relatedCorridors.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-bold mb-4">Popular Corridors</h2>
              <div className="flex flex-wrap gap-2">
                {service.relatedCorridors.map((c) => (
                  <span key={c} className="px-3 py-1.5 bg-amber-500/10 text-amber-400 text-sm rounded-lg">
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <Link aria-label="Navigation Link" href="/loads" className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl transition-colors">
              Post a Load
            </Link>
            <Link aria-label="Navigation Link" href="/directory" className="px-8 py-3 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors">
              Find Operators
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
