import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import SaveButton from '@/components/capture/SaveButton';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('company_listings').select('company_name, company_type, country_code, primary_corridors').eq('slug', slug).single();
  if (!data) return { title: 'Company Not Found' };
  const corridors = (data.primary_corridors || []).slice(0, 3).join(', ');
  return {
    title: `${data.company_name} Escort Requirements and Pilot Car Services | Haul Command`,
    description: `Find certified escort vehicles and pilot car services for ${data.company_name} loads. Coverage on ${corridors || 'major corridors'}. Real-time dispatch, compliance verification, and trusted operators.`,
  };
}

export default async function CompanyPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: company } = await supabase.from('company_listings').select('*').eq('slug', slug).single();
  if (!company) notFound();

  const typeLabels: Record<string, string> = { autonomous: 'Autonomous Freight', broker: 'Freight Broker', fleet: 'Carrier Fleet', wind_energy: 'Wind Energy', mining: 'Mining', heavy_haul: 'Heavy Haul', logistics: 'Logistics' };
  const typeColors: Record<string, { bg: string; text: string }> = {
    autonomous: { bg: 'rgba(0,255,136,0.12)', text: '#00ff88' },
    heavy_haul: { bg: 'rgba(255,200,0,0.12)', text: '#ffc800' },
    wind_energy: { bg: 'rgba(0,212,255,0.12)', text: '#00d4ff' },
    broker: { bg: 'rgba(167,139,250,0.12)', text: '#a78bfa' },
    fleet: { bg: 'rgba(251,146,60,0.12)', text: '#fb923c' },
    mining: { bg: 'rgba(156,163,175,0.12)', text: '#9ca3af' },
    logistics: { bg: 'rgba(96,165,250,0.12)', text: '#60a5fa' },
  };
  const tc = typeColors[company.company_type] || typeColors.logistics;
  const corridors = company.primary_corridors || [];
  const countries = company.countries_operating || [company.country_code];

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#fff' }}>
      {company.status === 'unclaimed' && (
        <div style={{ background: 'linear-gradient(90deg, #b8860b, #daa520)', padding: '16px 24px', textAlign: 'center' }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#000' }}>🏆 UNCLAIMED — Is this your company? </span>
          <a href={`mailto:enterprise@haulcommand.com?subject=Claim ${company.company_name}&body=I would like to claim the ${company.company_name} page on Haul Command.`} style={{ display: 'inline-block', marginLeft: 12, padding: '6px 20px', borderRadius: 6, background: '#000', color: '#daa520', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Claim This Page</a>
        </div>
      )}
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '60px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <span style={{ padding: '4px 14px', borderRadius: 20, background: tc.bg, color: tc.text, fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>{typeLabels[company.company_type] || company.company_type}</span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>{countries.join(' · ')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <h1 style={{ fontSize: 40, fontWeight: 800, margin: 0 }}>{company.company_name}</h1>
          <SaveButton entityType="company" entityId={slug} entityLabel={company.company_name} variant="pill" />
        </div>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: 32 }}>{company.description}</p>
        {company.website && <a href={company.website} target="_blank" rel="noopener noreferrer" style={{ color: '#00d4ff', fontSize: 14 }}>{company.website} ↗</a>}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, margin: '40px 0' }}>
          <div style={{ padding: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#00ff88' }}>{company.estimated_annual_escorts?.toLocaleString() || '—'}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Est. Annual Escorts</div>
          </div>
          <div style={{ padding: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#00d4ff' }}>{countries.length}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Countries Operating</div>
          </div>
          <div style={{ padding: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 12, textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#ffc800' }}>{corridors.length}</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Primary Corridors</div>
          </div>
        </div>

        {corridors.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Primary Corridors</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {corridors.map((c: string, i: number) => (
                <span key={i} style={{ padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>{c}</span>
              ))}
            </div>
          </div>
        )}

        <div style={{ padding: 32, background: 'rgba(0,212,255,0.06)', borderRadius: 16, border: '1px solid rgba(0,212,255,0.15)', textAlign: 'center' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>Need an escort for a {company.company_name} load?</h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>Haul Command connects you with certified operators on {company.company_name} corridors.</p>
          <a href="/" style={{ display: 'inline-block', padding: '12px 32px', borderRadius: 10, background: 'linear-gradient(135deg, #00ff88, #00d4ff)', color: '#000', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>Find Escort Operators</a>
        </div>
      </div>
    </div>
  );
}
