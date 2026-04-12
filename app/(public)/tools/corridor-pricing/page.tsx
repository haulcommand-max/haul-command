import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { LineChart, Route, ArrowRight, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Corridor Pricing History & Lane Rates | Haul Command',
  description: 'Track heavy haul and pilot car lane rates, pricing history, and spot market volume indexes across major oversize routing corridors.',
  alternates: { canonical: 'https://www.haulcommand.com/tools/corridor-pricing' }
};

interface PricingHistory {
  id: string;
  corridor_slug: string;
  month_start: string;
  avg_rate_per_mile: number;
  min_rate_per_mile: number;
  max_rate_per_mile: number;
  volume_index: number;
}

export default async function CorridorPricingHistoryPage() {
  const supabase = createClient();
  const { data: pricing } = await supabase
    .from('hc_corridor_pricing')
    .select('*')
    .order('corridor_slug', { ascending: true })
    .order('month_start', { ascending: false });

  const activeRecords = (pricing || []) as PricingHistory[];

  // Group by corridor to show the latest snapshot first
  const groupedRecords = activeRecords.reduce((acc, record) => {
    if (!acc[record.corridor_slug]) {
      acc[record.corridor_slug] = [];
    }
    acc[record.corridor_slug].push(record);
    return acc;
  }, {} as Record<string, PricingHistory[]>);

  return (
    <>
      <ProofStrip variant="bar" />
      <div style={{ minHeight: '100vh', background: '#050c14', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>
        
        {/* -- HERO -- */}
        <div style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(16,185,129,0.08), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3.5rem 1.5rem 3rem' }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              <Link href="/tools" style={{ color: '#6b7280', textDecoration: 'none' }}>Tools Hub</Link>
              <span style={{ color: '#4b5563' }}>â€º</span>
              <span style={{ color: '#10b981' }}>Pricing & Rates</span>
            </nav>
            <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Lane & Corridor<br />
              <span style={{ color: '#10b981' }}>Pricing History</span>
            </h1>
            <p style={{ margin: '0 0 2rem', fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.65, maxWidth: 640 }}>
              Stop guessing on spot rates. Track real-time and historical per-mile pricing for pilot cars across major industrial transit corridors. 
            </p>

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12, color: '#22c55e', fontSize: 13, fontWeight: 700 }}>
              <LineChart style={{ width: 16, height: 16 }} />
              Live Operator Data Aggregation
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24, marginBottom: 48 }}>
            {Object.entries(groupedRecords).map(([slug, records]) => {
               const current = records[0];
               const previous = records[1];
               const trend = previous ? (current.avg_rate_per_mile > previous.avg_rate_per_mile ? 'up' : current.avg_rate_per_mile < previous.avg_rate_per_mile ? 'down' : 'flat') : 'flat';
               
               return (
                  <div key={slug} style={{
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: 16, overflow: 'hidden'
                  }}>
                    <div style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: '#f9fafb', textTransform: 'uppercase', letterSpacing: 0.5 }}>{slug.replace(/-/g, ' ')}</h3>
                          <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>As of {new Date(current.month_start).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                        </div>
                        <div style={{ 
                           display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8,
                           background: 'rgba(16,185,129,0.1)', color: '#10b981'
                        }}>
                           <Route style={{ width: 16, height: 16 }} />
                           <span style={{ fontSize: 12, fontWeight: 700 }}>Active Lane</span>
                        </div>
                      </div>

                      <div style={{ padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.03)', marginBottom: 16 }}>
                          <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, marginBottom: 4 }}>Average Spot Rate</div>
                          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 2 }}>
                                  <DollarSign style={{ width: 20, height: 20, color: '#10b981', alignSelf: 'center' }} />
                                  <span style={{ fontSize: 36, fontWeight: 900, color: '#f9fafb', lineHeight: 1 }}>{current.avg_rate_per_mile.toFixed(2)}</span>
                                  <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>/ mi</span>
                              </div>
                              {previous && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingBottom: 4, color: trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#64748b' }}>
                                    {trend === 'up' ? <TrendingUp style={{ width: 14, height: 14 }} /> : trend === 'down' ? <TrendingDown style={{ width: 14, height: 14 }} /> : null}
                                    <span style={{ fontSize: 12, fontWeight: 700 }}>{Math.abs(current.avg_rate_per_mile - previous.avg_rate_per_mile).toFixed(2)} vs last mo</span>
                                </div>
                              )}
                          </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 8px' }}>
                          <div>
                             <span style={{ display: 'block', fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Floor Rate</span>
                             <span style={{ fontSize: 14, fontWeight: 800, color: '#cbd5e1' }}>${current.min_rate_per_mile.toFixed(2)}</span>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                             <span style={{ display: 'block', fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Ceiling Rate</span>
                             <span style={{ fontSize: 14, fontWeight: 800, color: '#cbd5e1' }}>${current.max_rate_per_mile.toFixed(2)}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                             <span style={{ display: 'block', fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Volume Index</span>
                             <span style={{ fontSize: 14, fontWeight: 800, color: '#3b82f6' }}>{current.volume_index}/100</span>
                          </div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '12px 20px', background: 'rgba(0,0,0,0.2)' }}>
                      <Link href={`/corridors/${slug}`} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, padding: '10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                        View Corridor Intelligence <ArrowRight style={{ width: 14, height: 14 }} />
                      </Link>
                    </div>
                  </div>
               );
            })}
          </div>

          <NoDeadEndBlock
            heading="Negotiate with Confidence"
            moves={[
              { href: '/available-now', icon: 'ðŸŸ¢', title: 'Find Escorts Now', desc: 'Secure capacity on these lanes', primary: true, color: '#10b981' },
              { href: '/loads', icon: 'ðŸ“¦', title: 'Post a Load', desc: 'Broadcast to active operators' },
            ]}
          />
        </div>
      </div>
    </>
  );
}