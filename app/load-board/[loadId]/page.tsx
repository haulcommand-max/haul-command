import React from 'react';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { MapPin, Truck, DollarSign, Shield, Clock, ArrowLeft, ArrowRight, Package, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react';
import { HCContentPageShell, HCContentSection, HCContentContainer } from "@/components/content-system/shell/HCContentPageShell";
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { stateFullName } from '@/lib/geo/state-names';

// ═══════════════════════════════════════════════════════════════
// /load-board/[loadId] — Load Detail Page
// P1 FIX: This directory was empty. "View Details" links from
// the load board crashed to the error boundary.
// ═══════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ loadId: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { loadId } = await params;
  return {
    title: `Load Details | Haul Command`,
    description: `View details for load ${loadId}. Route, dimensions, budget, broker trust, and escort requirements.`,
    robots: { index: false, follow: true },
  };
}

export default async function LoadDetailPage({ params }: PageProps) {
  const { loadId } = await params;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  let load: any = null;
  try {
    const { data } = await supabase
      .from('jobs')
      .select('*, profiles:posted_by(display_name, trust_score, avatar_url), hc_escrows(status, amount)')
      .eq('id', loadId)
      .single();
    load = data;
  } catch (e) {
    console.warn('[load-detail] Query failed for id:', loadId, e);
  }

  // No load found — show clean fallback
  if (!load) {
    return (
      <HCContentPageShell>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '120px 24px 80px', textAlign: 'center' }}>
          <Package style={{ width: 48, height: 48, color: '#64748b', margin: '0 auto 24px' }} />
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#f9fafb', marginBottom: 12 }}>Load Not Found</h1>
          <p style={{ fontSize: 15, color: '#94a3b8', marginBottom: 32, lineHeight: 1.6 }}>
            This load may have been filled, expired, or removed by the posting broker.
          </p>
          <Link href="/load-board" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 28px', borderRadius: 12,
            background: 'linear-gradient(135deg, #C6923A, #E0B05C)',
            color: '#000', fontWeight: 800, fontSize: 14, textDecoration: 'none',
          }}>
            <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Load Board
          </Link>
        </div>
      </HCContentPageShell>
    );
  }

  const hasEscrow = load.hc_escrows?.some((e: any) => e.status === 'ESCROW_LOCKED');
  const escrowAmount = load.hc_escrows?.find((e: any) => e.status === 'ESCROW_LOCKED')?.amount;
  const trustScore = load.profiles?.trust_score;
  const brokerName = load.profiles?.display_name || 'Anonymous Broker';
  const originState = stateFullName(load.origin_state) || load.origin_state || '';
  const destState = stateFullName(load.destination_state) || load.destination_state || '';

  return (
    <HCContentPageShell>
      {/* Breadcrumb + back */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#0A0D14' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem 2.5rem' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
            <Link href="/load-board" style={{ color: '#6b7280', textDecoration: 'none' }}>Load Board</Link>
            <ChevronRight style={{ width: 12, height: 12 }} />
            <span style={{ color: '#C6923A' }}>Load Details</span>
          </nav>

          {/* Route header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
            <h1 style={{
              margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
              fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.02em',
            }}>
              {load.origin_city || 'Origin'}
              <span style={{ color: '#475569', margin: '0 10px', fontSize: '0.7em' }}>→</span>
              {load.destination_city || 'Destination'}
            </h1>

            {load.status === 'OPEN' && (
              <span style={{
                padding: '4px 12px', borderRadius: 8,
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
                fontSize: 10, fontWeight: 800, color: '#86efac', textTransform: 'uppercase',
              }}>
                Open
              </span>
            )}
            {hasEscrow && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 12px', borderRadius: 8,
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                fontSize: 10, fontWeight: 700, color: '#86efac',
              }}>
                <Shield style={{ width: 10, height: 10 }} /> Funds Verified
              </span>
            )}
          </div>

          <p style={{ margin: 0, fontSize: 14, color: '#94a3b8', lineHeight: 1.5 }}>
            {originState}{originState && destState ? ' → ' : ''}{destState}
            {load.created_at && ` · Posted ${new Date(load.created_at).toLocaleDateString()}`}
          </p>
        </div>
      </div>

      <HCContentSection>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

            {/* Left column — details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

              {/* Description */}
              <div style={{ padding: '20px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f9fafb', marginBottom: 12 }}>Load Description</h2>
                <p style={{ fontSize: 14, color: '#d1d5db', lineHeight: 1.7, margin: 0 }}>
                  {load.description || 'Oversize load requiring pilot car escort services. Contact the posting broker for specific dimensions and route details.'}
                </p>
              </div>

              {/* Load specs */}
              {(load.width || load.height || load.length || load.weight) && (
                <div style={{ padding: '20px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f9fafb', marginBottom: 16 }}>Load Dimensions</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                    {[
                      load.width && { label: 'Width', value: `${load.width} ft` },
                      load.height && { label: 'Height', value: `${load.height} ft` },
                      load.length && { label: 'Length', value: `${load.length} ft` },
                      load.weight && { label: 'Weight', value: `${Number(load.weight).toLocaleString()} lbs` },
                    ].filter(Boolean).map((spec: any) => (
                      <div key={spec.label} style={{
                        padding: '14px', borderRadius: 10, textAlign: 'center',
                        background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                      }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{spec.label}</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#f9fafb' }}>{spec.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Broker info */}
              <div style={{ padding: '20px', borderRadius: 14, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#f9fafb', marginBottom: 12 }}>Posted By</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(198,146,58,0.1)', border: '1px solid rgba(198,146,58,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, fontWeight: 900, color: '#C6923A',
                  }}>
                    {brokerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#f9fafb' }}>{brokerName}</div>
                    {trustScore && trustScore > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Shield style={{ width: 12, height: 12, color: trustScore > 8 ? '#93c5fd' : '#f59e0b' }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: trustScore > 8 ? '#93c5fd' : '#f59e0b' }}>
                          Trust Score: {trustScore}/10
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right column — actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 100 }}>

              {/* Price card */}
              <div style={{
                padding: '24px', borderRadius: 16, textAlign: 'center',
                background: 'linear-gradient(135deg, rgba(198,146,58,0.06), rgba(198,146,58,0.02))',
                border: '1px solid rgba(198,146,58,0.2)',
              }}>
                {load.budget_amount ? (
                  <>
                    <div style={{ fontSize: 32, fontWeight: 900, color: '#22c55e', marginBottom: 4 }}>
                      ${Number(load.budget_amount).toLocaleString()}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', marginBottom: 16 }}>
                      Budget
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#C6923A', marginBottom: 16 }}>
                    Request for Quote
                  </div>
                )}

                {hasEscrow && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px', borderRadius: 8, marginBottom: 16,
                    background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)',
                  }}>
                    <CheckCircle style={{ width: 14, height: 14, color: '#22c55e' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#86efac' }}>
                      Escrow Verified{escrowAmount ? ` — $${Number(escrowAmount).toLocaleString()}` : ''}
                    </span>
                  </div>
                )}

                <Link href={`/auth/signup?intent=bid&load=${loadId}`} style={{
                  display: 'block', padding: '14px', borderRadius: 12, textAlign: 'center',
                  background: 'linear-gradient(135deg, #C6923A, #E0B05C)',
                  color: '#000', fontWeight: 800, fontSize: 14, textDecoration: 'none',
                  marginBottom: 8,
                }}>
                  Submit Bid
                </Link>
                <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>
                  Sign in or create an account to bid on this load.
                </p>
              </div>

              {/* Quick actions */}
              <Link href="/tools/escort-calculator" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderRadius: 12,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                color: '#d1d5db', fontSize: 13, fontWeight: 600, textDecoration: 'none',
              }}>
                <span>Estimate escort cost</span>
                <ArrowRight style={{ width: 14, height: 14, color: '#64748b' }} />
              </Link>

              <Link href="/escort-requirements" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 16px', borderRadius: 12,
                background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                color: '#d1d5db', fontSize: 13, fontWeight: 600, textDecoration: 'none',
              }}>
                <span>Check state requirements</span>
                <ArrowRight style={{ width: 14, height: 14, color: '#64748b' }} />
              </Link>
            </div>
          </div>
        </div>
      </HCContentSection>

      <HCContentSection>
        <HCContentContainer>
          <NoDeadEndBlock
            heading="More Options"
            moves={[
              { href: '/load-board', icon: '📋', title: 'Load Board', desc: 'Browse all loads', primary: true, color: '#3b82f6' },
              { href: '/available-now', icon: '🟢', title: 'Available Now', desc: 'Ready escorts' },
              { href: '/tools/escort-calculator', icon: '🧮', title: 'Rate Calculator', desc: 'Cost estimates' },
              { href: '/directory', icon: '🔍', title: 'Directory', desc: 'Find operators' },
            ]}
          />
        </HCContentContainer>
      </HCContentSection>
    </HCContentPageShell>
  );
}
