import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Box, ArrowRight, ShieldAlert, FileText, LayoutDashboard, Search } from 'lucide-react';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Oversize Load Type Library | Haul Command',
  description: 'A comprehensive directory of oversize load types encompassing typical dimensions, escort requirements, and industry-specific traversal risks.',
  alternates: { canonical: 'https://www.haulcommand.com/tools/load-types' }
};

interface LoadType {
  id: string;
  name: string;
  slug: string;
  category: string;
  typical_dimensions: { length?: string; width?: string; height?: string; weight?: string };
  escort_requirements: string;
  industry_risks: string;
}

export default async function LoadTypesPage() {
  const supabase = createClient();
  const { data: loadTypes } = await supabase
    .from('hc_load_types')
    .select('*')
    .order('name', { ascending: true });

  const activeRecords = (loadTypes || []) as LoadType[];

  return (
    <>
      <ProofStrip variant="bar" />
      <div style={{ minHeight: '100vh', background: '#080c14', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>
        
        {/* -- HERO -- */}
        <div style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(59,130,246,0.08), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3.5rem 1.5rem 3rem' }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              <Link href="/tools" style={{ color: '#6b7280', textDecoration: 'none' }}>Tools Hub</Link>
              <span style={{ color: '#4b5563' }}>"º</span>
              <span style={{ color: '#3b82f6' }}>Load Types</span>
            </nav>
            <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Oversize Load<br />
              <span style={{ color: '#3b82f6' }}>Categorization Library</span>
            </h1>
            <p style={{ margin: '0 0 2rem', fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.65, maxWidth: 640 }}>
              Stop guessing escort requirements for specific payloads. Access standard dimension metrics, inherent route risks, and historical compliance data for the most frequent superload classes.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24, marginBottom: 48 }}>
            {activeRecords.map((t) => (
              <div key={t.id} style={{
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column'
              }}>
                <div style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <LayoutDashboard style={{ color: '#3b82f6', width: 22, height: 22 }} />
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: '#f9fafb' }}>{t.name}</h3>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase' }}>
                          {t.category}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16 }}>
                    <div><span style={{ display: 'block', fontSize: 10, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Weight</span><span style={{ fontSize: 13, color: '#d1d5db', fontWeight: 500 }}>{t.typical_dimensions?.weight || 'Varies'}</span></div>
                    <div><span style={{ display: 'block', fontSize: 10, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Length</span><span style={{ fontSize: 13, color: '#d1d5db', fontWeight: 500 }}>{t.typical_dimensions?.length || 'Varies'}</span></div>
                    <div><span style={{ display: 'block', fontSize: 10, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Height</span><span style={{ fontSize: 13, color: '#d1d5db', fontWeight: 500 }}>{t.typical_dimensions?.height || 'Varies'}</span></div>
                    <div><span style={{ display: 'block', fontSize: 10, color: '#6b7280', textTransform: 'uppercase', fontWeight: 600 }}>Width</span><span style={{ fontSize: 13, color: '#d1d5db', fontWeight: 500 }}>{t.typical_dimensions?.width || 'Varies'}</span></div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <FileText style={{ color: '#8b5cf6', width: 14, height: 14 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase' }}>Escort Requirements</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{t.escort_requirements}</p>
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <ShieldAlert style={{ color: '#ef4444', width: 14, height: 14 }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#fca5a5', textTransform: 'uppercase' }}>Primary Risks</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: '#94a3b8', lineHeight: 1.5 }}>{t.industry_risks}</p>
                  </div>
                </div>
                
                <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '12px 20px', background: 'rgba(0,0,0,0.2)' }}>
                  <Link href={`/tools/permit-calculator`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, padding: '10px', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                    View Permit SLAs <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <NoDeadEndBlock
            heading="Analyze Your Next Haul"
            moves={[
              { href: '/tools/permit-calculator', icon: 'ðŸ“‹', title: 'Permit Calculator', desc: 'Find state-specific rules', primary: true, color: '#3b82f6' },
              { href: '/available-now', icon: 'ðŸŸ¢', title: 'Hire Escorts', desc: 'Available to dispatch' },
            ]}
          />
        </div>
      </div>
    </>
  );
}