import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

const AUTONOMOUS_COMPANIES = [
  { slug: 'aurora-innovation', name: 'Aurora Innovation', hq: 'Austin, TX', type: 'Autonomous Trucking', corridors: ['I-45 Dallas-Houston', 'I-10 Houston-El Paso', 'I-35 Dallas-San Antonio'], description: 'Developing the Aurora Driver self-driving system for long-haul trucking. Requires oversize escort services for sensor pods and test vehicle operations.' },
  { slug: 'kodiak-robotics', name: 'Kodiak Robotics', hq: 'Dallas, TX', type: 'Autonomous Trucking', corridors: ['I-45 Dallas-Houston', 'I-20 Dallas-Atlanta', 'I-10 LA-Phoenix'], description: 'Building autonomous long-haul trucks with the Kodiak Driver. Operations require escort vehicles for safety vehicle deployment.' },
  { slug: 'einride', name: 'Einride', hq: 'Gothenburg, Sweden', type: 'Electric Autonomous Transport', corridors: ['EU Trans-European Routes', 'Sweden E4/E6', 'Germany A7/A1'], description: 'Pod-based electric autonomous freight. European operations need pilot vehicles for route proving and initial deployment.' },
  { slug: 'volvo-autonomous-solutions', name: 'Volvo Autonomous Solutions', hq: 'Gothenburg, Sweden', type: 'Autonomous Mining & Transport', corridors: ['Mining corridors', 'Port routes', 'Nordic highways'], description: 'Autonomous transport solutions for mining, ports, and logistics hubs. Equipment moves require oversize escort services.' },
  { slug: 'vestas-wind', name: 'Vestas Wind Systems', hq: 'Aarhus, Denmark', type: 'Wind Turbine Transport', corridors: ['I-35 TX Wind Corridor', 'I-80 Wind Belt', 'Iowa-Kansas Wind Routes'], description: 'World\'s largest wind turbine manufacturer. Blade and nacelle transports are some of the most complex oversize loads, requiring multiple escorts per move.' },
  { slug: 'waymo-via', name: 'Waymo Via', hq: 'Mountain View, CA', type: 'Autonomous Trucking', corridors: ['I-10 Phoenix-LA', 'I-45 Dallas-Houston', 'I-5 LA-San Francisco'], description: 'Google\'s autonomous driving technology applied to trucking.' },
  { slug: 'torc-robotics', name: 'Torc Robotics', hq: 'Blacksburg, VA', type: 'Autonomous Trucking (Daimler)', corridors: ['I-35 Dallas Corridor', 'I-10 Southwest', 'I-81 East Coast'], description: 'Daimler Truck subsidiary developing autonomous trucking technology.' },
  { slug: 'plus-ai', name: 'Plus', hq: 'Cupertino, CA', type: 'Driver-In Autonomous', corridors: ['I-5 West Coast', 'I-80 Midwest', 'I-10 Southern'], description: 'Driver-in autonomous trucking with PlusDrive.' },
  { slug: 'tusimple', name: 'TuSimple', hq: 'San Diego, CA', type: 'Autonomous Trucking', corridors: ['I-10 Tucson-Phoenix', 'I-10 Phoenix-LA', 'I-20 Texas'], description: 'L4 autonomous trucking technology.' },
  { slug: 'gatik', name: 'Gatik', hq: 'Mountain View, CA', type: 'Middle Mile Autonomous', corridors: ['Texas Hub Routes', 'Arkansas Distribution', 'Ontario-Quebec'], description: 'Middle-mile autonomous delivery for B2B logistics.' },
  { slug: 'ge-vernova', name: 'GE Vernova', hq: 'Cambridge, MA', type: 'Wind/Energy Equipment', corridors: ['Texas Wind Belt', 'Great Plains', 'Midwest Manufacturing'], description: 'Major wind turbine and energy equipment manufacturer.' },
  { slug: 'siemens-gamesa', name: 'Siemens Gamesa', hq: 'Zamudio, Spain', type: 'Wind Turbine Manufacturing', corridors: ['EU Network', 'US Wind Corridors', 'Offshore Port Routes'], description: 'Global wind turbine manufacturer. Blade lengths exceeding 80m require extensive multi-state escort coordination.' },
  { slug: 'mammoet', name: 'Mammoet', hq: 'Schiedam, Netherlands', type: 'Heavy Lift & Transport', corridors: ['Global Refinery Routes', 'Port-to-Site', 'Mining Corridors'], description: 'World\'s largest heavy lift and transport company.' },
  { slug: 'goldhofer', name: 'Goldhofer', hq: 'Memmingen, Germany', type: 'Heavy Transport Trailers', corridors: ['EU Core Network', 'US Interstate', 'Global Projects'], description: 'Leading manufacturer of heavy transport trailers and modular vehicles.' },
  { slug: 'sarens', name: 'Sarens', hq: 'Wolvertem, Belgium', type: 'Heavy Lift & Engineered Transport', corridors: ['EU Refinery Routes', 'Middle East Projects', 'US Gulf Coast'], description: 'Global leader in crane rental, heavy lifting, and engineered transport.' },
];

export async function generateStaticParams() {
  return AUTONOMOUS_COMPANIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const company = AUTONOMOUS_COMPANIES.find((c) => c.slug === slug);
  const name = company?.name || slug;
  return {
    title: `${name} — Escort & Heavy Haul Services | HAUL COMMAND`,
    description: `Find escort vehicles and pilot car services for ${name} operations. Verified operators with ELD tracking covering key corridors.`,
  };
}

export default async function EnterprisePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = AUTONOMOUS_COMPANIES.find((c) => c.slug === slug);
  if (!company) {
    return (
      <>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 py-16 min-h-screen">
          <h1 className="text-3xl font-black text-white">Company not found</h1>
          <Link href="/enterprise" className="text-accent hover:underline mt-4 block">Browse all enterprise companies →</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-12 min-h-screen">
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <Link href="/enterprise" className="hover:text-accent">Enterprise</Link>
          <span className="mx-2">›</span>
          <span className="text-white">{company.name}</span>
        </nav>

        {/* Unclaimed Banner */}
        <div className="bg-accent/5 border border-accent/20 rounded-xl px-5 py-3 mb-8 flex items-center justify-between flex-wrap gap-3">
          <p className="text-accent text-sm font-bold">🔓 This page is unclaimed. Are you from {company.name}?</p>
          <Link href={`/claim?company=${slug}`} className="bg-accent text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-yellow-500 transition-colors">
            Claim This Page
          </Link>
        </div>

        <header className="mb-10">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-3xl flex-shrink-0">🏢</div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter">{company.name}</h1>
              <div className="flex flex-wrap gap-3 mt-2 text-xs">
                <span className="bg-white/5 text-gray-400 px-3 py-1 rounded-lg">{company.hq}</span>
                <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg">{company.type}</span>
              </div>
            </div>
          </div>
          <p className="text-gray-400 text-sm max-w-3xl mt-4">{company.description}</p>
        </header>

        {/* Key Corridors */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-4">Key Corridors</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {company.corridors.map((c) => (
              <div key={c} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4">
                <p className="text-white font-bold text-sm">🛣️ {c}</p>
                <Link href="/corridors" className="text-accent text-xs hover:underline mt-2 block">View corridor data →</Link>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 text-center">
            <h3 className="text-white font-bold text-xl mb-3">Need Escort Coverage?</h3>
            <p className="text-gray-400 text-sm mb-5">Find verified escort operators on your key corridors.</p>
            <Link href="/directory" className="bg-accent text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors inline-block">Find Operators →</Link>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 text-center">
            <h3 className="text-white font-bold text-xl mb-3">Enterprise API — 90-Day Free Pilot</h3>
            <p className="text-gray-400 text-sm mb-5">Integrate HC data into your dispatch system. Free trial for enterprise accounts.</p>
            <Link href="/developers" className="border border-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/5 transition-colors inline-block">View API Docs →</Link>
          </div>
        </div>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org', '@type': 'Organization',
          name: company.name, description: company.description,
          address: { '@type': 'PostalAddress', addressLocality: company.hq },
        }) }} />
      </main>
    </>
  );
}
