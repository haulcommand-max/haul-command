import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';



// 7 Highest Value SEO Tools
const TARGET_TOOLS = [
  { id: 'bridge-formula', name: 'Bridge Formula Calculator', icon: '🌉' },
  { id: 'permit-cost', name: 'Permit Cost Estimator', icon: '💵' },
  { id: 'curfew-calculator', name: 'Travel Curfew Calculator', icon: '⏰' },
  { id: 'axle-weight', name: 'Axle Weight Distribution', icon: '⚖️' },
  { id: 'wind-turbine-planner', name: 'Wind Turbine Planner', icon: '🌬️' },
  { id: 'av-readiness', name: 'AV Readiness Checker', icon: '🤖' },
  { id: 'route-planner', name: 'Multi-State Route Planner', icon: '🗺️' }
];

// 50 US States + 57 Global Countries
const STATES = [
  ...[
    { id: 'al', name: 'Alabama', label: 'State' }, { id: 'ak', name: 'Alaska', label: 'State' }, { id: 'az', name: 'Arizona', label: 'State' },
    { id: 'ar', name: 'Arkansas', label: 'State' }, { id: 'ca', name: 'California', label: 'State' }, { id: 'co', name: 'Colorado', label: 'State' },
    { id: 'ct', name: 'Connecticut', label: 'State' }, { id: 'de', name: 'Delaware', label: 'State' }, { id: 'fl', name: 'Florida', label: 'State' },
    { id: 'ga', name: 'Georgia', label: 'State' }, { id: 'hi', name: 'Hawaii', label: 'State' }, { id: 'id', name: 'Idaho', label: 'State' },
    { id: 'il', name: 'Illinois', label: 'State' }, { id: 'in', name: 'Indiana', label: 'State' }, { id: 'ia', name: 'Iowa', label: 'State' },
    { id: 'ks', name: 'Kansas', label: 'State' }, { id: 'ky', name: 'Kentucky', label: 'State' }, { id: 'la', name: 'Louisiana', label: 'State' },
    { id: 'me', name: 'Maine', label: 'State' }, { id: 'md', name: 'Maryland', label: 'State' }, { id: 'ma', name: 'Massachusetts', label: 'State' },
    { id: 'mi', name: 'Michigan', label: 'State' }, { id: 'mn', name: 'Minnesota', label: 'State' }, { id: 'ms', name: 'Mississippi', label: 'State' },
    { id: 'mo', name: 'Missouri', label: 'State' }, { id: 'mt', name: 'Montana', label: 'State' }, { id: 'ne', name: 'Nebraska', label: 'State' },
    { id: 'nv', name: 'Nevada', label: 'State' }, { id: 'nh', name: 'New Hampshire', label: 'State' }, { id: 'nj', name: 'New Jersey', label: 'State' },
    { id: 'nm', name: 'New Mexico', label: 'State' }, { id: 'ny', name: 'New York', label: 'State' }, { id: 'nc', name: 'North Carolina', label: 'State' },
    { id: 'nd', name: 'North Dakota', label: 'State' }, { id: 'oh', name: 'Ohio', label: 'State' }, { id: 'ok', name: 'Oklahoma', label: 'State' },
    { id: 'or', name: 'Oregon', label: 'State' }, { id: 'pa', name: 'Pennsylvania', label: 'State' }, { id: 'ri', name: 'Rhode Island', label: 'State' },
    { id: 'sc', name: 'South Carolina', label: 'State' }, { id: 'sd', name: 'South Dakota', label: 'State' }, { id: 'tn', name: 'Tennessee', label: 'State' },
    { id: 'tx', name: 'Texas', label: 'State' }, { id: 'ut', name: 'Utah', label: 'State' }, { id: 'vt', name: 'Vermont', label: 'State' },
    { id: 'va', name: 'Virginia', label: 'State' }, { id: 'wa', name: 'Washington', label: 'State' }, { id: 'wv', name: 'West Virginia', label: 'State' },
    { id: 'wi', name: 'Wisconsin', label: 'State' }, { id: 'wy', name: 'Wyoming', label: 'State' }
  ],
  // Tier A — Gold (10)
  ...[
    { id: 'us', name: 'United States', label: 'Country - Tier A' }, { id: 'ca', name: 'Canada', label: 'Country - Tier A' },
    { id: 'au', name: 'Australia', label: 'Country - Tier A' }, { id: 'gb', name: 'United Kingdom', label: 'Country - Tier A' },
    { id: 'nz', name: 'New Zealand', label: 'Country - Tier A' }, { id: 'za', name: 'South Africa', label: 'Country - Tier A' },
    { id: 'de', name: 'Germany', label: 'Country - Tier A' }, { id: 'nl', name: 'Netherlands', label: 'Country - Tier A' },
    { id: 'ae', name: 'UAE', label: 'Country - Tier A' }, { id: 'br', name: 'Brazil', label: 'Country - Tier A' }
  ],
  // Tier B — Blue (18)
  ...[
    { id: 'ie', name: 'Ireland', label: 'Country - Tier B' }, { id: 'se', name: 'Sweden', label: 'Country - Tier B' },
    { id: 'no', name: 'Norway', label: 'Country - Tier B' }, { id: 'dk', name: 'Denmark', label: 'Country - Tier B' },
    { id: 'fi', name: 'Finland', label: 'Country - Tier B' }, { id: 'be', name: 'Belgium', label: 'Country - Tier B' },
    { id: 'at', name: 'Austria', label: 'Country - Tier B' }, { id: 'ch', name: 'Switzerland', label: 'Country - Tier B' },
    { id: 'es', name: 'Spain', label: 'Country - Tier B' }, { id: 'fr', name: 'France', label: 'Country - Tier B' },
    { id: 'it', name: 'Italy', label: 'Country - Tier B' }, { id: 'pt', name: 'Portugal', label: 'Country - Tier B' },
    { id: 'sa', name: 'Saudi Arabia', label: 'Country - Tier B' }, { id: 'qa', name: 'Qatar', label: 'Country - Tier B' },
    { id: 'mx', name: 'Mexico', label: 'Country - Tier B' }, { id: 'in', name: 'India', label: 'Country - Tier B' },
    { id: 'id', name: 'Indonesia', label: 'Country - Tier B' }, { id: 'th', name: 'Thailand', label: 'Country - Tier B' }
  ],
  // Tier C — Silver (26)
  ...[
    { id: 'pl', name: 'Poland', label: 'Country - Tier C' }, { id: 'cz', name: 'Czechia', label: 'Country - Tier C' },
    { id: 'sk', name: 'Slovakia', label: 'Country - Tier C' }, { id: 'hu', name: 'Hungary', label: 'Country - Tier C' },
    { id: 'si', name: 'Slovenia', label: 'Country - Tier C' }, { id: 'ee', name: 'Estonia', label: 'Country - Tier C' },
    { id: 'lv', name: 'Latvia', label: 'Country - Tier C' }, { id: 'lt', name: 'Lithuania', label: 'Country - Tier C' },
    { id: 'hr', name: 'Croatia', label: 'Country - Tier C' }, { id: 'ro', name: 'Romania', label: 'Country - Tier C' },
    { id: 'bg', name: 'Bulgaria', label: 'Country - Tier C' }, { id: 'gr', name: 'Greece', label: 'Country - Tier C' },
    { id: 'tr', name: 'Turkey', label: 'Country - Tier C' }, { id: 'kw', name: 'Kuwait', label: 'Country - Tier C' },
    { id: 'om', name: 'Oman', label: 'Country - Tier C' }, { id: 'bh', name: 'Bahrain', label: 'Country - Tier C' },
    { id: 'sg', name: 'Singapore', label: 'Country - Tier C' }, { id: 'my', name: 'Malaysia', label: 'Country - Tier C' },
    { id: 'jp', name: 'Japan', label: 'Country - Tier C' }, { id: 'kr', name: 'South Korea', label: 'Country - Tier C' },
    { id: 'cl', name: 'Chile', label: 'Country - Tier C' }, { id: 'ar', name: 'Argentina', label: 'Country - Tier C' },
    { id: 'co', name: 'Colombia', label: 'Country - Tier C' }, { id: 'pe', name: 'Peru', label: 'Country - Tier C' },
    { id: 'vn', name: 'Vietnam', label: 'Country - Tier C' }, { id: 'ph', name: 'Philippines', label: 'Country - Tier C' }
  ],
  // Tier D — Slate (3)
  ...[
    { id: 'uy', name: 'Uruguay', label: 'Country - Tier D' }, { id: 'pa', name: 'Panama', label: 'Country - Tier D' },
    { id: 'cr', name: 'Costa Rica', label: 'Country - Tier D' }
  ]
];

type Props = {
  params: Promise<{
    toolId: string;
    regionId: string;
  }>;
};

// Generate static routes for the edge network
// CAPPED: 7 tools × 50 US states = 350 pages (down from 700+)
// Country-level tool pages still work via ISR on first visit.
export function generateStaticParams() {
  const params: { toolId: string; regionId: string }[] = [];
  // Only pre-render US states — the highest SEO value regions
  const usStates = STATES.filter(s => s.label === 'State');
  for (const tool of TARGET_TOOLS) {
    for (const state of usStates) {
      params.push({ toolId: tool.id, regionId: state.id });
    }
  }
  return params;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const params = await props.params;
  const tool = TARGET_TOOLS.find(t => t.id === params.toolId);
  const state = STATES.find(s => s.id === params.regionId);

  if (!tool || !state) {
    return { title: 'Not Found | Haul Command' };
  }

  return {
    title: `${state.name} ${tool.name} | Heavy Haul Rules & Requirements - Haul Command`,
    description: `Use our free ${state.name} ${tool.name}. Get instant heavy haul compliance logic, permit estimates, escort requirements, and routing intelligence for oversize loads in ${state.name}.`,
    alternates: {
      canonical: `https://haulcommand.com/tools/${tool.id}/${state.id}`,
    }
  };
}

export default async function HyperlocalToolPage(props: Props) {
  const params = await props.params;
  const tool = TARGET_TOOLS.find(t => t.id === params.toolId);
  const state = STATES.find(s => s.id === params.regionId);

  if (!tool || !state) {
    notFound();
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/tools" className="hover:text-accent">Tools</Link>
          <span className="mx-2">›</span>
          <Link href={`/tools/${tool.id}`} className="hover:text-accent">{tool.name}</Link>
          <span className="mx-2">›</span>
          <span className="text-white">{state.name}</span>
        </nav>

        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1 mb-4">
            <span className="text-accent text-xs font-bold">STATE-SPECIFIC INTELLIGENCE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter mb-4">
            {state.name} <span className="text-accent">{tool.name}</span>
          </h1>
          <p className="text-gray-400 text-sm max-w-2xl mx-auto">
            You are viewing the {state.name}-optimized version of our {tool.name}. 
            Because heavy haul transport regulations are governed at the state level by the DOT, 
            using location-contextualized tools ensures you are operating within strict state compliance standards for oversize loads.
          </p>
        </header>

        <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 text-center mb-8 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 text-[150px] opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                {tool.icon}
            </div>
            <h2 className="text-2xl font-bold text-white mb-4 relative z-10">Access the {tool.name}</h2>
            <p className="text-gray-400 mb-8 relative z-10 max-w-xl mx-auto">
                Launch the universal tool parameterized for {state.name} regulations. 
                Our underlying data engine will automatically normalize inputs against {state.name} thresholds.
            </p>
            <Link 
                href={`/tools/${tool.id}?preset_region=${state.id}`}
                className="inline-block bg-accent text-black font-black text-lg px-10 py-4 rounded-xl hover:bg-yellow-500 transition-transform hover:scale-105 shadow-[0_0_20px_rgba(250,204,21,0.3)] relative z-10"
            >
                Launch Tool Now →
            </Link>
        </div>

        <section className="bg-black/40 border border-white/5 rounded-2xl p-8 mb-8">
            <h3 className="text-lg font-bold text-white mb-4">Why {state.name} Oversize Regulations Matter</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h4 className="text-accent font-bold text-sm mb-2">Strict Enforcement</h4>
                    <p className="text-gray-400 text-sm">
                        Without correct calculations, loads traversing {state.name} are subject to 
                        sizeable infractions, immediate grounding, and possible impounding of the rig.
                    </p>
                </div>
                <div>
                    <h4 className="text-accent font-bold text-sm mb-2">Escort Requirements</h4>
                    <p className="text-gray-400 text-sm">
                        {state.name} has specific widths, lengths, and heights that trigger 
                        civilian pilot cars and/or highway patrol escorts. Our engine monitors this.
                    </p>
                </div>
                <div>
                    <h4 className="text-accent font-bold text-sm mb-2">Bridge Weights</h4>
                    <p className="text-gray-400 text-sm">
                        Adhering strictly to federal and state bridge formula variations ensures 
                        your axles won't cause critical infrastructure damage or trigger weigh station alarms.
                    </p>
                </div>
                <div>
                    <h4 className="text-accent font-bold text-sm mb-2">Night / Curfew Moves</h4>
                    <p className="text-gray-400 text-sm">
                        Curfew windows, holiday lockdowns, and weekend blackout rules in {state.name} 
                        change rapidly. Keep your convoys moving by anticipating local clock restrictions.
                    </p>
                </div>
            </div>
        </section>
      </main>
    </>
  );
}
