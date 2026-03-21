import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Permit Agents Directory | Haul Command',
  description: 'Find verified permit agents who handle oversize and heavy haul permits across all 50 states.',
};

export default async function PermitAgentsPage() {
  const supabase = await createClient();
  const { data: agents } = await supabase.from('permit_agents').select('*').order('rating', { ascending: false });

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a1a', color: '#fff' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '80px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Permit Agents</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 40 }}>Verified professionals who handle oversize/overweight permits.</p>

        {(!agents || agents.length === 0) ? (
          <div style={{ textAlign: 'center', padding: 60, background: 'rgba(255,255,255,0.03)', borderRadius: 16 }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>🧑‍💼</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Agent directory launching soon</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 400, margin: '0 auto' }}>Permit professionals are being onboarded. Check back shortly or apply to be listed.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {agents.map((a) => (
              <div key={a.id} style={{ padding: 20, background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 700 }}>{a.business_name}</span>
                    {a.verified && <span style={{ padding: '2px 8px', borderRadius: 6, background: 'rgba(0,255,136,0.12)', color: '#00ff88', fontSize: 11, fontWeight: 600 }}>VERIFIED</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                    {(a.states_covered || []).join(', ')} · {a.avg_turnaround_hours}h avg turnaround · {a.completed_permits_count} permits completed
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#00ff88' }}>${a.rate_per_permit}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>per permit</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
