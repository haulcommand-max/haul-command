import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Clock, TrendingUp, TrendingDown, Minus, ShieldAlert, ArrowRight } from 'lucide-react';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'State Permit Processing SLAs | Haul Command',
  description: 'Live tracker for oversize/overweight permit processing times across 50 US States and Canadian Provinces. Avoid delays with historical permit SLA averages.',
  alternates: { canonical: 'https://www.haulcommand.com/tools/permit-sla-tracker' }
};

interface PermitSLA {
  id: string;
  jurisdiction_code: string;
  jurisdiction_name: string;
  current_processing_time_hours: number;
  historical_average_hours: number;
  trend: 'improving' | 'degrading' | 'stable';
  delay_notice: string | null;
  last_updated: string;
}

export default async function PermitSLATrackerPage() {
  const supabase = createClient();
  const { data: slas } = await supabase
    .from('hc_permit_slas')
    .select('*')
    .order('current_processing_time_hours', { ascending: false });

  const activeRecords = (slas || []) as PermitSLA[];

  return (
    <>
      <ProofStrip variant="bar" />
      <div style={{ minHeight: '100vh', background: '#09050d', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>
        
        {/* -- HERO -- */}
        <div style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(168,85,247,0.08), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3.5rem 1.5rem 3rem' }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              <Link href="/tools" style={{ color: '#6b7280', textDecoration: 'none' }}>Tools Hub</Link>
              <span style={{ color: '#4b5563' }}>›</span>
              <span style={{ color: '#a855f7' }}>Permit SLAs</span>
            </nav>
            <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Permit Processing<br />
              <span style={{ color: '#a855f7' }}>SLA Tracker</span>
            </h1>
            <p style={{ margin: '0 0 2rem', fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.65, maxWidth: 640 }}>
              Live visibility into state and provincial DOT permit processing times. Don't let your truck sit idle at the border waiting on a superload permit.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24, marginBottom: 48 }}>
            {activeRecords.map((s) => {
               const isCritical = s.current_processing_time_hours > s.historical_average_hours * 1.5;
               return (
                  <div key={s.id} style={{
                    background: 'rgba(255,255,255,0.02)', border: isCritical ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 16, overflow: 'hidden'
                  }}>
                    <div style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: '#f9fafb' }}>{s.jurisdiction_name}</h3>
                          <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', fontSize: 11, fontWeight: 800, color: '#9ca3af' }}>
                            {s.jurisdiction_code}
                          </span>
                        </div>
                        <div style={{ 
                           display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
                           background: s.trend === 'improving' ? 'rgba(34,197,94,0.1)' : s.trend === 'degrading' ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)',
                           color: s.trend === 'improving' ? '#22c55e' : s.trend === 'degrading' ? '#ef4444' : '#9ca3af'
                        }}>
                           {s.trend === 'improving' ? <TrendingUp style={{ width: 16, height: 16 }} /> : 
                            s.trend === 'degrading' ? <TrendingDown style={{ width: 16, height: 16 }} /> : 
                            <Minus style={{ width: 16, height: 16 }} />}
                           <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>{s.trend}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                          <div style={{ flex: 1, padding: '16px', background: isCritical ? 'rgba(239,68,68,0.05)' : 'rgba(0,0,0,0.2)', borderRadius: 12, border: isCritical ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(255,255,255,0.03)' }}>
                              <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>Current ETA</div>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                                  <span style={{ fontSize: 32, fontWeight: 900, color: isCritical ? '#ef4444' : '#f9fafb', lineHeight: 1 }}>{s.current_processing_time_hours}</span>
                                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>HRS</span>
                              </div>
                          </div>
                          <div style={{ flex: 1, padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.03)' }}>
                              <div style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>Historical Avg</div>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                                  <span style={{ fontSize: 24, fontWeight: 800, color: '#cbd5e1', lineHeight: 1 }}>{s.historical_average_hours}</span>
                                  <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>HRS</span>
                              </div>
                          </div>
                      </div>

                      {s.delay_notice && (
                          <div style={{ display: 'flex', gap: 10, padding: '12px', background: 'rgba(245,158,11,0.1)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.2)', alignItems: 'flex-start' }}>
                              <ShieldAlert style={{ color: '#f59e0b', width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
                              <p style={{ margin: 0, fontSize: 12, color: '#fcd34d', lineHeight: 1.5 }}>{s.delay_notice}</p>
                          </div>
                      )}
                    </div>
                  </div>
               );
            })}
          </div>

          <NoDeadEndBlock
            heading="Need Regional Support?"
            moves={[
              { href: '/corridors', icon: '🛣️', title: 'Route Corridors', desc: 'Find typical routes', primary: true, color: '#a855f7' },
              { href: '/tools/permit-authorities', icon: '🏛️', title: 'Permit Authorities', desc: 'Direct state links' },
            ]}
          />
        </div>
      </div>
    </>
  );
}
