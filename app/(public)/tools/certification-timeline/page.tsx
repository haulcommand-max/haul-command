import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Award, ShieldCheck, Map, ArrowRight, Zap, GraduationCap } from 'lucide-react';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'State Certification Timelines & Reciprocity | Haul Command',
  description: 'View pilot car certification requirements, reciprocity paths, and training timelines for all 50 states.',
  alternates: { canonical: 'https://www.haulcommand.com/tools/certification-timeline' }
};

interface CertPath {
  id: string;
  jurisdiction_code: string;
  jurisdiction_name: string;
  requires_certification: boolean;
  training_hours: number;
  certification_cost: number;
  renewal_period_years: number;
  reciprocity_states: string[];
}

export default async function CertificationTimelinePage() {
  const supabase = createClient();
  const { data: certs } = await supabase
    .from('hc_certification_paths')
    .select('*')
    .order('jurisdiction_name', { ascending: true });

  const activeRecords = (certs || []) as CertPath[];

  return (
    <>
      <ProofStrip variant="bar" />
      <div style={{ minHeight: '100vh', background: '#0a0914', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>
        
        {/* -- HERO -- */}
        <div style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(245,158,11,0.08), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3.5rem 1.5rem 3rem' }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              <Link href="/tools" style={{ color: '#6b7280', textDecoration: 'none' }}>Tools Hub</Link>
              <span style={{ color: '#4b5563' }}>"º</span>
              <span style={{ color: '#f59e0b' }}>Certifications</span>
            </nav>
            <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Pilot Car Certification<br />
              <span style={{ color: '#f59e0b' }}>Timelines & Reciprocity</span>
            </h1>
            <p style={{ margin: '0 0 2rem', fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.65, maxWidth: 640 }}>
              Understand exactly how long it takes and what it costs to get legally certified in each state, plus a live reciprocity matrix so you know where your current badge works.
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20, marginBottom: 48 }}>
            {activeRecords.map((c) => (
               <div key={c.id} style={{
                 background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                 borderRadius: 16, overflow: 'hidden', padding: '20px'
               }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                   <div>
                     <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 800, color: '#f9fafb' }}>{c.jurisdiction_name}</h3>
                     <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>State / Province</span>
                   </div>
                   {c.requires_certification ? (
                     <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                       <ShieldCheck style={{ width: 12, height: 12 }} /> Mandatory
                     </span>
                   ) : (
                     <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'rgba(34,197,94,0.1)', color: '#22c55e', borderRadius: 8, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                       <Zap style={{ width: 12, height: 12 }} /> No Cert Required
                     </span>
                   )}
                 </div>

                 {c.requires_certification && (
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                     <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)' }}>
                       <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Training Required</div>
                       <div style={{ fontSize: 16, fontWeight: 800, color: '#f9fafb' }}>{c.training_hours} <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>hrs</span></div>
                     </div>
                     <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)' }}>
                       <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>Total Cost</div>
                       <div style={{ fontSize: 16, fontWeight: 800, color: '#f9fafb' }}>${c.certification_cost}</div>
                     </div>
                   </div>
                 )}

                 {c.reciprocity_states && c.reciprocity_states.length > 0 && (
                   <div>
                     <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                       <Map style={{ width: 12, height: 12 }} /> Honored by:
                     </div>
                     <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                       {c.reciprocity_states.map((s) => (
                         <span key={s} style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1', fontSize: 11, fontWeight: 700, borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }}>
                           {s}
                         </span>
                       ))}
                     </div>
                   </div>
                 )}
               </div>
            ))}
          </div>

          <NoDeadEndBlock
            heading="Update Your Profile"
            moves={[
              { href: '/claim', icon: 'âœ…', title: 'Claim Your Profile', desc: 'Add your certifications', primary: true, color: '#f59e0b' },
              { href: '/forms', icon: 'ðŸ“„', title: 'Forms Hub', desc: 'Auto-fill compliance forms' },
            ]}
          />
        </div>
      </div>
    </>
  );
}