import { Metadata } from 'next/dist/lib/metadata/types/metadata-interface';
import Link from 'next/link';
import { COMPANIES, COMPANY_TYPE_LABELS, COMPANY_TYPE_COLORS } from '@/lib/data/company-seed';

export const metadata: Metadata = {
  title: 'Companies Using Escort & Pilot Car Services | Haul Command',
  description: 'Browse autonomous freight, heavy haul, wind energy, and mining companies that require escort and pilot car services. Claim your company page on Haul Command.',
};

export default function CompaniesIndexPage() {
  const typeGroups = ['autonomous', 'heavy_haul', 'wind_energy', 'mining', 'broker'] as const;

  return (
    <div className="min-h-screen text-white" style={{ background: '#060b12', fontFamily: 'var(--font-body)' }}>
      <style>{`
        .company-card{background:rgba(14,17,24,0.95);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:20px;transition:all 0.2s;cursor:pointer;}
        .company-card:hover{border-color:rgba(198,146,58,0.2);transform:translateY(-2px);box-shadow:0 12px 40px -8px rgba(0,0,0,0.4);}
      `}</style>

      <nav className="border-b border-white/[0.06]" style={{ background: 'rgba(11,11,12,0.85)', backdropFilter: 'blur(24px)' }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center">
          <Link href="/" className="text-sm font-black text-[#C6923A]">HAUL COMMAND</Link>
          <span className="text-[#5A6577] mx-2">/</span>
          <span className="text-sm font-semibold text-white">Companies</span>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.25em] mb-3">Enterprise Directory</div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight mb-4" style={{ fontFamily: 'var(--font-display)' }}>Companies</h1>
          <p className="text-[#8fa3b8] text-sm max-w-lg mx-auto">Browse companies in autonomous freight, heavy haul, wind energy, and mining that use escort and pilot car services worldwide.</p>
        </div>

        {typeGroups.map(type => {
          const companies = COMPANIES.filter(c => c.company_type === type);
          if (companies.length === 0) return null;
          const color = COMPANY_TYPE_COLORS[type] || '#C6923A';
          return (
            <div key={type} className="mb-12">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-xs font-black uppercase tracking-[0.2em]" style={{ color }}>{COMPANY_TYPE_LABELS[type]}</span>
                <span className="text-[10px] text-[#5A6577] font-semibold">({companies.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {companies.map(c => (
                  <Link key={c.slug} href={`/companies/${c.slug}`}>
                    <div className="company-card">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="text-sm font-black text-white">{c.company_name}</h3>
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color, border: `1px solid ${color}25` }}>{c.country_code}</span>
                      </div>
                      <p className="text-[11px] text-[#8fa3b8] leading-relaxed mb-3 line-clamp-2">{c.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#5A6577]">~{c.estimated_annual_escorts.toLocaleString()} escorts/yr</span>
                        <span className="text-[10px] font-bold" style={{ color }}>View →</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </main>
    </div>
  );
}
