import { Metadata } from 'next/dist/lib/metadata/types/metadata-interface';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { COMPANIES, COMPANY_TYPE_LABELS, COMPANY_TYPE_COLORS, getAllCompanySlugs, getCompanyBySlug } from '@/lib/data/company-seed';

export async function generateStaticParams() {
  return getAllCompanySlugs().map(slug => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const company = getCompanyBySlug(slug);
  if (!company) return { title: 'Company Not Found' };
  return {
    title: `${company.company_name} Escort Requirements and Pilot Car Services | Haul Command`,
    description: `${company.company_name} requires an estimated ${company.estimated_annual_escorts.toLocaleString()} escort services annually across ${company.countries_operating.join(', ')}. Find certified pilot car operators for ${company.company_name} operations on Haul Command.`,
    openGraph: {
      title: `${company.company_name} — Escort & Pilot Car Requirements`,
      description: `${company.description} Find available escort operators on Haul Command.`,
    },
  };
}

export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const company = getCompanyBySlug(slug);
  if (!company) notFound();

  const typeColor = COMPANY_TYPE_COLORS[company.company_type] || '#C6923A';
  const typeLabel = COMPANY_TYPE_LABELS[company.company_type] || company.company_type;

  return (
    <div className="min-h-screen text-white" style={{ background: '#060b12', fontFamily: 'var(--font-body)' }}>
      <style>{`
        .claim-banner {background:linear-gradient(135deg,rgba(198,146,58,0.12),rgba(198,146,58,0.04));border:2px solid rgba(198,146,58,0.3);border-radius:20px;padding:32px;text-align:center;}
        .claim-btn {display:inline-flex;align-items:center;gap:8px;padding:14px 32px;border-radius:14px;font-size:14px;font-weight:800;background:linear-gradient(135deg,#C6923A,#E0B05C,#C6923A);color:#0a0a0f;border:none;cursor:pointer;box-shadow:0 4px 24px rgba(198,146,58,0.3);transition:all 0.2s;}
        .claim-btn:hover {transform:translateY(-2px);box-shadow:0 8px 32px rgba(198,146,58,0.4);}
        .stat-card {background:rgba(14,17,24,0.95);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:24px;}
        .corridor-tag {display:inline-flex;align-items:center;gap:6px;padding:6px 14px;border-radius:10px;font-size:12px;font-weight:700;background:rgba(198,146,58,0.08);border:1px solid rgba(198,146,58,0.15);color:#C6923A;}
        .country-tag {display:inline-flex;align-items:center;gap:4px;padding:4px 12px;border-radius:8px;font-size:11px;font-weight:700;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);color:#b0bac9;}
      `}</style>

      <nav className="border-b border-white/[0.06]" style={{ background: 'rgba(11,11,12,0.85)', backdropFilter: 'blur(24px)' }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-sm font-black text-[#C6923A]">HAUL COMMAND</Link>
          <Link href="/companies" className="text-xs font-semibold text-[#8fa3b8] hover:text-white">All Companies</Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* UNCLAIMED BANNER */}
        <div className="claim-banner mb-10">
          <div className="text-[10px] font-black text-[#C6923A] uppercase tracking-[0.3em] mb-2">⚠️ UNCLAIMED</div>
          <h2 className="text-lg font-black text-white mb-2">Is this your company?</h2>
          <p className="text-sm text-[#8fa3b8] mb-5 max-w-md mx-auto">
            Claim this page to manage your company profile, respond to escort requests, and connect with certified operators.
          </p>
          <Link href={`/claim?company=${company.slug}`}>
            <button className="claim-btn">Claim This Page →</button>
          </Link>
        </div>

        {/* Company Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full" style={{ background: `${typeColor}15`, color: typeColor, border: `1px solid ${typeColor}25` }}>{typeLabel}</span>
            <span className="text-[10px] font-bold text-[#5A6577] uppercase tracking-wider">{company.hq_city}, {company.hq_country}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-3" style={{ fontFamily: 'var(--font-display)' }}>{company.company_name}</h1>
          <p className="text-[#8fa3b8] text-sm sm:text-base max-w-2xl leading-relaxed">{company.description}</p>
          {company.website && (
            <a href={company.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-[#C6923A] hover:underline">
              {company.website.replace('https://', '')} ↗
            </a>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          <div className="stat-card">
            <div className="text-[10px] font-bold text-[#5A6577] uppercase tracking-wider mb-1">Est. Annual Escorts</div>
            <div className="text-2xl font-black" style={{ color: typeColor, fontFamily: 'var(--font-mono, monospace)' }}>{company.estimated_annual_escorts.toLocaleString()}</div>
          </div>
          <div className="stat-card">
            <div className="text-[10px] font-bold text-[#5A6577] uppercase tracking-wider mb-1">Countries Operating</div>
            <div className="text-2xl font-black text-white" style={{ fontFamily: 'var(--font-mono, monospace)' }}>{company.countries_operating.length}</div>
          </div>
          <div className="stat-card">
            <div className="text-[10px] font-bold text-[#5A6577] uppercase tracking-wider mb-1">Related Corridors</div>
            <div className="text-2xl font-black text-white" style={{ fontFamily: 'var(--font-mono, monospace)' }}>{company.related_corridors.length}</div>
          </div>
        </div>

        {/* Countries */}
        <div className="mb-10">
          <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4">Countries of Operation</h2>
          <div className="flex flex-wrap gap-2">
            {company.countries_operating.map(c => (
              <span key={c} className="country-tag">{c}</span>
            ))}
          </div>
        </div>

        {/* Corridors */}
        <div className="mb-10">
          <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4">Related Corridors</h2>
          <div className="flex flex-wrap gap-2">
            {company.related_corridors.map(c => (
              <Link key={c} href={`/corridors`}>
                <span className="corridor-tag">{c}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="stat-card text-center py-10">
          <h3 className="text-lg font-black text-white mb-2">Need Escort Services for {company.company_name} Loads?</h3>
          <p className="text-sm text-[#8fa3b8] mb-5">Post a load on Haul Command and get matched with certified operators in minutes.</p>
          <Link href="/load-board">
            <button className="claim-btn">Post a Load →</button>
          </Link>
        </div>
      </main>
    </div>
  );
}
