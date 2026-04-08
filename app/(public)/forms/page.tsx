import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { FileText, Save, Bell, CheckCircle, Lock, Download, ChevronRight, AlertTriangle } from 'lucide-react';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

// ══════════════════════════════════════════════════════════════
// /forms — DOCUMENT HUB & AUTOFILL
// Hormozi Lens: Value-stacking. The forms hub is a high-utility wedge.
// Cole Gordon Lens: Fast qualification and friction-free ops.
// ══════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Forms & Document Hub | Haul Command',
  description:
    'Download industry-standard Bills of Lading, Service Agreements, and securely store your insurance and W9s for instant autofill dispatch.',
  keywords: [
    'pilot car bill of lading template',
    'heavy haul service agreement',
    'escort vehicle contract',
    'oversize load w9 autofill',
    'pilot car insurance tracker',
  ],
  alternates: { canonical: 'https://www.haulcommand.com/forms' },
  openGraph: {
    title: 'Forms & Document Hub | Haul Command',
    description: 'Stop retyping the same information. Access industry standard forms and store compliance documents securely.',
    url: 'https://www.haulcommand.com/forms',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

interface FormTemplate {
  id: string;
  template_name: string;
  template_slug: string;
  description: string;
  category: string;
  is_premium: boolean;
}

interface StoredForm {
  id: string;
  document_type: string;
  expiration_date: string | null;
  form_data: any;
  operator_name: string;
}

export default async function FormsHubPage() {
  const supabase = createClient();

  // 1. Fetch available templates
  const { data: templates } = await supabase
    .from('hc_form_templates')
    .select('*')
    .order('is_premium', { ascending: false });

  // 2. Fetch a few active stored forms for demonstration of reminders
  const { data: storedForms } = await supabase
    .from('hc_forms_storage')
    .select('*, hc_global_operators(name)')
    .eq('document_type', 'insurance')
    .limit(3);

  const activeTemplates = (templates || []) as FormTemplate[];
  
  const sampleReminders = (storedForms || []).map(row => ({
    ...row,
    operator_name: (row.hc_global_operators as any)?.name || 'Operator',
  })) as StoredForm[];

  return (
    <>
      <ProofStrip variant="bar" />

      <div style={{ minHeight: '100vh', background: '#060b12', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>
        
        {/* ── Hero ── */}
        <div style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.05)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(20,184,166,0.08), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3.5rem 1.5rem 3rem' }}>
            <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 20, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
              <ChevronRight style={{ width: 12, height: 12 }} />
              <span style={{ color: '#14b8a6' }}>Forms & Documents</span>
            </nav>

            <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Document Vault &amp;<br />
              <span style={{ color: '#14b8a6' }}>Autofill Engine</span>
            </h1>
            <p style={{ margin: '0 0 2rem', fontSize: '1.05rem', color: '#94a3b8', lineHeight: 1.65, maxWidth: 560 }}>
              Stop retyping your DOT and insurance info on every job. Store securely. Generate instantly. Track expirations automatically.
            </p>

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Save style={{ width: 16, height: 16, color: '#14b8a6' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f9fafb' }}>Auto-Fill Memory</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell style={{ width: 16, height: 16, color: '#f59e0b' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f9fafb' }}>Expiration Alerts</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText style={{ width: 16, height: 16, color: '#3b82f6' }} />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#f9fafb' }}>Industry Templates</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

          {/* ── Active Reminders Dashboard UI (Preview) ── */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f9fafb', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
               Your Active Reminders
               <span style={{ fontSize: 10, padding: '2px 8px', background: 'rgba(255,255,255,0.1)', borderRadius: 20 }}>DEMO</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sampleReminders.length > 0 ? sampleReminders.map(r => {
                    const expiry = new Date(r.expiration_date!);
                    const daysLeft = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 3600 * 24));
                    const isUrgent = daysLeft < 45;

                    return (
                        <div key={r.id} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '16px 20px', borderRadius: 12,
                            background: isUrgent ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.03)',
                            border: `1px solid ${isUrgent ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.08)'}`
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                <div style={{ 
                                    width: 40, height: 40, borderRadius: 8, 
                                    background: isUrgent ? 'rgba(245,158,11,0.1)' : 'rgba(20,184,166,0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {isUrgent ? <AlertTriangle style={{ color: '#f59e0b', width: 20 }} /> : <CheckCircle style={{ color: '#14b8a6', width: 20 }} />}
                                </div>
                                <div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#f9fafb', textTransform: 'capitalize' }}>
                                        {r.document_type} Policy
                                    </div>
                                    <div style={{ fontSize: 13, color: '#94a3b8' }}>
                                        Carrier: {r.form_data?.carrier || 'Unknown'} • Limit: ${r.form_data?.policy_limit}
                                    </div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 15, fontWeight: 800, color: isUrgent ? '#f59e0b' : '#14b8a6' }}>
                                    {daysLeft} Days
                                </div>
                                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                    Until Renewal
                                </div>
                            </div>
                        </div>
                    );
                }) : (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 12 }}>
                        No upcoming expirations tracked.
                    </div>
                )}
            </div>
          </section>

          {/* ── Templates Library ── */}
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#f9fafb', marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
               Template Library
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
                {activeTemplates.map(t => (
                    <div key={t.id} style={{
                        position: 'relative', overflow: 'hidden', padding: '24px', borderRadius: 16,
                        background: t.is_premium ? 'linear-gradient(145deg, rgba(212,168,68,0.05), rgba(0,0,0,0))' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${t.is_premium ? 'rgba(212,168,68,0.2)' : 'rgba(255,255,255,0.07)'}`
                    }}>
                        {t.is_premium && (
                           <div style={{ position: 'absolute', top: 16, right: 16, color: '#D4A844' }}>
                               <Lock style={{ width: 18, height: 18 }} />
                           </div>
                        )}
                        <div style={{ display: 'inline-block', marginBottom: 12, padding: '4px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#94a3b8' }}>
                            {t.category}
                        </div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f9fafb', marginBottom: 8 }}>
                            {t.template_name}
                        </h3>
                        <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.5, marginBottom: 20 }}>
                            {t.description}
                        </p>
                        
                        {t.is_premium ? (
                            <Link href="/pricing" style={{
                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                padding: '12px', borderRadius: 8, textDecoration: 'none',
                                background: 'linear-gradient(135deg, #C6923A, #E0B05C)', color: '#000', fontSize: 13, fontWeight: 800
                            }}>
                                Upgrade to Unlock
                            </Link>
                        ) : (
                            <button style={{
                                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                padding: '12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                background: 'rgba(20,184,166,0.1)', color: '#14b8a6', fontSize: 13, fontWeight: 700
                            }}>
                                <Download style={{ width: 14, height: 14 }} /> Download Template
                            </button>
                        )}
                    </div>
                ))}
            </div>
          </section>

          {/* ── Internal link mesh ── */}
          <section style={{ marginBottom: 32, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/resources" style={{ padding: '8px 14px', background: 'rgba(56,189,248,0.06)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#38bdf8', textDecoration: 'none' }}>📚 Resource Hub</Link>
            <Link href="/pricing" style={{ padding: '8px 14px', background: 'rgba(212,168,68,0.06)', border: '1px solid rgba(212,168,68,0.15)', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#D4A844', textDecoration: 'none' }}>💲 Pricing Details</Link>
            <Link href="/claim" style={{ padding: '8px 14px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#22c55e', textDecoration: 'none' }}>✓ Create Operator Profile</Link>
          </section>

          {/* ── No-Dead-End block ── */}
          <NoDeadEndBlock
            heading="Make Every Job Faster"
            moves={[
              { href: '/claim', icon: '⚡', title: 'Setup Autofill', desc: 'Add your DOT and Insurance once', primary: true, color: '#14b8a6' },
              { href: '/resources', icon: '📚', title: 'Guides & Tools', desc: 'Permit calculators and legal resources' },
              { href: '/available-now', icon: '🟢', title: 'Go Live', desc: 'Find your next load today' },
            ]}
          />

        </div>
      </div>
    </>
  );
}
