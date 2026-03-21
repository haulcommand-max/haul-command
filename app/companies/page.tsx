import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Company Directory — Autonomous, Heavy Haul & Wind Energy | Haul Command',
  description: 'Browse companies that rely on escort vehicles and pilot car services. Autonomous trucking, heavy haul, wind energy, and more.',
};

export default async function CompaniesIndexPage() {
  const supabase = await createClient();
  const { data: companies } = await supabase.from('company_listings').select('slug, company_name, company_type, country_code, estimated_annual_escorts, status').order('estimated_annual_escorts', { ascending: false });

  const typeColors: Record<string, string> = { autonomous: '#00ff88', heavy_haul: '#ffc800', wind_energy: '#00d4ff', broker: '#a78bfa', fleet: '#fb923c', mining: '#9ca3af', logistics: '#60a5fa' };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#fff' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '80px 24px' }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 12 }}>Company Directory</h1>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 48 }}>Companies that use escort vehicles and pilot car services worldwide.</p>
        <div style={{ display: 'grid', gap: 12 }}>
          {(companies || []).map((c) => (
            <Link key={c.slug} href={`/companies/${c.slug}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', textDecoration: 'none', color: '#fff', transition: 'border-color 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 16, fontWeight: 700 }}>{c.company_name}</span>
                <span style={{ padding: '2px 8px', borderRadius: 6, background: `${typeColors[c.company_type] || '#666'}20`, color: typeColors[c.company_type] || '#666', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{c.company_type.replace('_', ' ')}</span>
                {c.status === 'unclaimed' && <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(218,165,32,0.15)', color: '#daa520', fontSize: 11, fontWeight: 600 }}>UNCLAIMED</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                <span>{c.country_code}</span>
                <span>{c.estimated_annual_escorts?.toLocaleString() || '—'} escorts/yr</span>
                <span style={{ color: 'rgba(255,255,255,0.3)' }}>→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
