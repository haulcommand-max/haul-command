import { Metadata } from 'next/dist/lib/metadata/types/metadata-interface';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllAutonomousSeoParams, getAutonomousSeoEntry } from '@/lib/data/autonomous-seo';

export async function generateStaticParams() {
  return getAllAutonomousSeoParams();
}

export async function generateMetadata({ params }: { params: Promise<{ country: string; slug: string }> }): Promise<Metadata> {
  const { country, slug } = await params;
  const data = getAutonomousSeoEntry(country, slug);
  if (!data) return { title: 'Not Found' };
  return {
    title: `${data.keyword.title} | Haul Command`,
    description: data.keyword.meta,
    openGraph: { title: data.keyword.title, description: data.keyword.meta },
    alternates: { canonical: `https://haulcommand.com/autonomous/${country}/${slug}` },
  };
}

export default async function AutonomousSeoPage({ params }: { params: Promise<{ country: string; slug: string }> }) {
  const { country, slug } = await params;
  const data = getAutonomousSeoEntry(country, slug);
  if (!data) notFound();

  return (
    <div className="min-h-screen text-white" style={{ background: '#060b12', fontFamily: 'var(--font-body)' }}>
      <style>{`
        .seo-card{background:rgba(14,17,24,0.95);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:24px;}
        .seo-highlight{background:linear-gradient(135deg,rgba(139,92,246,0.08),rgba(139,92,246,0.02));border:1px solid rgba(139,92,246,0.15);border-radius:16px;padding:24px;}
        .action-btn{display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:14px;font-size:14px;font-weight:800;background:linear-gradient(135deg,#C6923A,#E0B05C,#C6923A);color:#0a0a0f;border:none;cursor:pointer;box-shadow:0 4px 24px rgba(198,146,58,0.3);}
      `}</style>

      <nav className="border-b border-white/[0.06]" style={{ background: 'rgba(11,11,12,0.85)', backdropFilter: 'blur(24px)' }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="text-sm font-black text-[#C6923A]">HAUL COMMAND</Link>
          <span className="text-[#5A6577] mx-2">/</span>
          <span className="text-sm font-semibold text-white">Autonomous</span>
          <span className="text-[#5A6577] mx-2">/</span>
          <span className="text-xs text-[#8fa3b8]">{data.country_code}</span>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' }}>Autonomous Freight</span>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', color: '#8fa3b8', border: '1px solid rgba(255,255,255,0.08)' }}>{data.language}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>{data.keyword.title}</h1>
          <p className="text-[#8fa3b8] text-sm max-w-2xl leading-relaxed">{data.keyword.meta}</p>
        </div>

        {/* Compliance Overview */}
        <div className="seo-highlight mb-8">
          <h2 className="text-sm font-black text-white uppercase tracking-wider mb-3">Escort Requirements in {data.country_name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-bold text-[#5A6577] uppercase mb-1">Autonomous Vehicle Classification</div>
              <p className="text-xs text-[#b0bac9]">Autonomous trucks operating in {data.country_name} may require escort vehicles depending on vehicle size, route complexity, and local regulations. Check your specific corridor requirements below.</p>
            </div>
            <div>
              <div className="text-[10px] font-bold text-[#5A6577] uppercase mb-1">Escort Vehicle Requirements</div>
              <p className="text-xs text-[#b0bac9]">Escort vehicles for autonomous freight in {data.country_name} typically require: amber warning lights, "OVERSIZE LOAD" signage, two-way communication, and GPS tracking capability.</p>
            </div>
          </div>
        </div>

        {/* Key Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="seo-card">
            <div className="text-[10px] font-bold text-[#5A6577] uppercase mb-1">Country</div>
            <div className="text-lg font-black text-white">{data.country_name}</div>
            <div className="text-[10px] text-[#8fa3b8]">{data.country_code}</div>
          </div>
          <div className="seo-card">
            <div className="text-[10px] font-bold text-[#5A6577] uppercase mb-1">Language</div>
            <div className="text-lg font-black text-white">{data.language}</div>
          </div>
          <div className="seo-card">
            <div className="text-[10px] font-bold text-[#5A6577] uppercase mb-1">Available Operators</div>
            <div className="text-lg font-black text-[#C6923A]">View Directory</div>
          </div>
        </div>

        {/* Content sections */}
        <div className="seo-card mb-8">
          <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4">Why Autonomous Trucks Need Escort Services</h2>
          <div className="space-y-3 text-xs text-[#b0bac9] leading-relaxed">
            <p>As autonomous trucking technology advances, the need for professional escort vehicles has increased significantly. In {data.country_name}, self-driving trucks operating on public roads require escort services for several critical reasons:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white">Safety Compliance:</strong> Regulatory bodies require escort vehicles to monitor autonomous truck operations and intervene if necessary.</li>
              <li><strong className="text-white">Route Navigation:</strong> Escort operators provide real-time route intelligence including construction zones, traffic incidents, and road hazards.</li>
              <li><strong className="text-white">Public Safety:</strong> Escort vehicles alert other road users to the presence of autonomous freight vehicles.</li>
              <li><strong className="text-white">Emergency Response:</strong> Trained escort operators can take immediate action in emergency scenarios.</li>
              <li><strong className="text-white">Communication Bridge:</strong> Escorts serve as the human communication link between the autonomous system and other road users.</li>
            </ul>
          </div>
        </div>

        <div className="seo-card mb-8">
          <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4">Major Autonomous Truck Operators in {data.country_name}</h2>
          <p className="text-xs text-[#b0bac9] leading-relaxed mb-4">Several autonomous trucking companies operate or are testing in {data.country_name}, including Aurora Innovation, Waymo Via, Kodiak Robotics, Daimler Truck Autonomous, and Einride. Each company requires certified escort operators for their testing and commercial operations.</p>
          <Link href="/companies">
            <button className="text-xs font-bold text-[#C6923A] hover:underline">View all companies →</button>
          </Link>
        </div>

        {/* CTA */}
        <div className="seo-card text-center py-10">
          <h3 className="text-lg font-black text-white mb-2">Find Autonomous Truck Escort Operators</h3>
          <p className="text-sm text-[#8fa3b8] mb-5 max-w-md mx-auto">Haul Command connects autonomous freight companies with certified escort operators worldwide.</p>
          <Link href="/directory">
            <button className="action-btn">Browse Operators →</button>
          </Link>
        </div>
      </main>
    </div>
  );
}
