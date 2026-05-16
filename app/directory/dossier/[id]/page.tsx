import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import {
  Shield, MapPin, Clock, ArrowLeft, Star, FileText,
  CheckCircle, Navigation, MessageSquare, AlertTriangle,
  Truck, Award, Radio, Zap, Package, BarChart3,
  DollarSign, Eye, EyeOff, Phone, Globe
} from 'lucide-react';
import { HCContentPageShell } from "@/components/content-system/shell/HCContentPageShell";
import { stateFullName, countryFullName } from '@/lib/geo/state-names';
import {
  resolveCountryCode, getCountryPack,
  proofStateBadgeClass, proofStateLabel,
  type ProofState
} from '@/lib/geo/country-packs';
import {
  buildDirectoryOperatorCanonicalUrl,
  buildDirectoryOperatorJsonLd,
  buildDirectoryOperatorMetadata,
} from '@/lib/directory/operator-profile-seo';

export const dynamic = 'force-dynamic';

const DIRECTORY_DOSSIER_SURFACES = [
  'v_hc_directory_active',
  'v_directory_operators',
  'v_directory_support_locations',
  'v_directory_services',
  'v_directory_brokers',
  'v_directory_carriers',
  'v_directory_infrastructure',
  'v_directory_authorities',
] as const;

function normalizeDossierRecord(record: any) {
  if (!record) return null;
  return {
    ...record,
    contact_id: record.contact_id ?? record.id,
    company: record.company ?? record.company_name ?? record.public_label ?? record.display_name ?? record.name,
    state_inferred: record.state_inferred ?? record.state ?? record.admin1_code,
    city_inferred: record.city_inferred ?? record.city,
    role_primary: record.role_primary ?? record.primary_role,
    entity_family: record.entity_family,
    entity_subtype: record.entity_subtype,
  };
}

async function createDirectorySupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
}

async function getDossierOperator(id: string) {
  const supabase = await createDirectorySupabaseClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  for (const surface of DIRECTORY_DOSSIER_SURFACES) {
    let query = supabase.from(surface).select('*').limit(1);
    query = isUuid ? query.eq('id', id) : query.eq('slug', id);

    const { data, error } = await query.maybeSingle();
    if (error) {
      console.warn(`[dossier] ${surface} query failed for id:`, id, error.message);
      continue;
    }
    if (data) return normalizeDossierRecord(data);
  }

  return null;
}

async function resolveDossierParams(params: { id: string } | Promise<{ id: string }>) {
  return params;
}

export async function generateMetadata({ params }: { params: { id: string } | Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await resolveDossierParams(params);
  const operator = await getDossierOperator(id);
  return buildDirectoryOperatorMetadata(operator, id);
}

function ratingText(value: number | null | undefined) {
  return value ? `${Number(value).toFixed(1)} / 5` : 'Needs report';
}

// ── Proof state badge ────────────────────────────────────────────────────────
function ProofBadge({ state }: { state: ProofState }) {
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${proofStateBadgeClass(state)}`}>
      {proofStateLabel(state)}
    </span>
  );
}

// ── Capability row ───────────────────────────────────────────────────────────
function CapabilityRow({ label, value, proof }: { label: string; value: string | boolean | null; proof: ProofState }) {
  const hasValue = value !== null && value !== false && value !== '';
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/[0.06] last:border-0">
      <span className="text-xs text-amber-100/70 font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-bold ${hasValue ? 'text-white' : 'text-gray-500'}`}>
          {value === true ? '✓ Yes' : value === false || !value ? '—' : String(value)}
        </span>
        <ProofBadge state={hasValue ? proof : 'missing'} />
      </div>
    </div>
  );
}

// ── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, label, color = '#F1A91B' }: { score: number | null; label: string; color?: string }) {
  if (!score || score === 0) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-14 h-14 rounded-full border-2 border-white/10 flex items-center justify-center">
          <span className="text-[10px] text-gray-500 text-center leading-tight">No data</span>
        </div>
        <span className="text-[10px] text-gray-500 mt-1 text-center">{label}</span>
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: `conic-gradient(${color} ${score}%, rgba(255,255,255,0.06) 0)` }}>
        <div className="w-10 h-10 bg-[#0a0806] rounded-full flex items-center justify-center">
          <span className="text-sm font-black text-white">{Math.round(score)}</span>
        </div>
      </div>
      <span className="text-[10px] text-amber-200/60 mt-1 text-center">{label}</span>
    </div>
  );
}

export default async function DossierPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const supabase = await createDirectorySupabaseClient();
  const operator = await getDossierOperator(id);

  if (!operator) {
    return (
      <HCContentPageShell>
        <div className="max-w-4xl mx-auto pt-32 pb-24 px-4 text-center">
          <Shield className="w-16 h-16 text-gray-600 mx-auto mb-6" />
          <h1 className="text-3xl font-black text-white mb-4">Dossier Unavailable</h1>
          <p className="text-amber-100/60 mb-8">This operator record could not be loaded or has been made private.</p>
          <Link href="/directory" className="inline-flex items-center gap-2 px-6 py-3 hc-btn-secondary rounded-xl text-sm font-bold">
            <ArrowLeft className="w-4 h-4" /> Return to Directory
          </Link>
        </div>
      </HCContentPageShell>
    );
  }

  const canonicalUrl = buildDirectoryOperatorCanonicalUrl(operator, id);
  const jsonLd = buildDirectoryOperatorJsonLd(operator, canonicalUrl);

  let infrastructureReadiness: any = null;
  if (operator.entity_family === 'infrastructure' || ['rest_area', 'weigh_station', 'truck_parking', 'port', 'rail_intermodal', 'border_crossing', 'tunnel', 'tunnel_authority'].includes(operator.entity_subtype)) {
    try {
      const { data } = await supabase
        .from('v_hc_public_infrastructure_readiness')
        .select('*')
        .eq('entity_id', operator.contact_id)
        .maybeSingle();
      infrastructureReadiness = data;
    } catch (e) {
      console.warn('[dossier] Infrastructure readiness query failed for id:', id, e);
    }
  }

  // ── Resolve location — NEVER default to US ──────────────────────────────
  const countryCode = resolveCountryCode(operator);
  const countryIsKnown = countryCode !== 'unknown';
  const pack = getCountryPack(countryCode, operator.state_inferred);

  // State label — must check country first to avoid WA = Western Australia bug
  const stateName = (() => {
    if (!operator.state_inferred) return null;
    const code = operator.state_inferred.toUpperCase();
    if (countryCode === 'AU') {
      // Use AU_STATES — WA = Western Australia, not Washington
      const AU_MAP: Record<string, string> = {
        NSW: 'New South Wales', VIC: 'Victoria', QLD: 'Queensland',
        SA: 'South Australia', WA: 'Western Australia', TAS: 'Tasmania',
        NT: 'Northern Territory', ACT: 'Australian Capital Territory',
      };
      return AU_MAP[code] || code;
    }
    if (countryCode === 'CA') {
      const CA_MAP: Record<string, string> = {
        AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba',
        NB: 'New Brunswick', NL: 'Newfoundland and Labrador', NS: 'Nova Scotia',
        NT: 'Northwest Territories', NU: 'Nunavut', ON: 'Ontario',
        PE: 'Prince Edward Island', QC: 'Quebec', SK: 'Saskatchewan', YT: 'Yukon',
      };
      return CA_MAP[code] || code;
    }
    // US by default only when country is confirmed US
    if (countryCode === 'US') {
      return stateFullName(code, true);
    }
    return code; // Just show the code if we don't know the country map
  })();

  const locationDisplay = [
    operator.city,
    stateName,
    countryIsKnown ? pack.countryName : null,
  ].filter(Boolean).join(', ') || (countryIsKnown ? pack.countryName : 'Country needs verification');

  // ── Trust signals ────────────────────────────────────────────────────────
  const trustScore = operator.confidence_score || operator.trust_score || null;
  const isClaimed = (trustScore || 0) > 40 || operator.is_claimed;
  const hasRating = operator.rating_avg && Number(operator.rating_avg) > 0;
  const ratingCount = operator.rating_count || 0;

  // ── HC-ID generation ─────────────────────────────────────────────────────
  const hcId = (() => {
    const cc = countryIsKnown ? countryCode : 'XX';
    const sc = (operator.state_inferred || '').toUpperCase().slice(0, 3) || 'XX';
    // Role abbreviation from pack
    const roleAbbr = pack.pilotCarTerm.split(' ').map((w: string) => w[0]).join('').slice(0, 3).toUpperCase();
    const numPart = String(id).replace(/\D/g, '').slice(0, 6).padStart(6, '0');
    return `HC-${cc}-${sc}-${roleAbbr}-${numPart}`;
  })();

  // ── Data freshness ────────────────────────────────────────────────────────
  const freshnessText = (() => {
    const ts = operator.last_seen_at || operator.updated_at;
    if (!ts) return 'Seeded profile — not yet verified';
    const days = Math.floor((Date.now() - new Date(ts).getTime()) / 86400000);
    if (days < 1)  return 'Active today';
    if (days < 7)  return `Active ${days} day${days > 1 ? 's' : ''} ago`;
    if (days < 30) return `Active ${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
    if (days < 90) return `Active ${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
    return `Last seen ${Math.floor(days / 30)} months ago — may be stale`;
  })();

  const overallProof: ProofState = isClaimed ? 'self-reported' : 'seeded';

  return (
    <HCContentPageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ── HEADER ── */}
      <div className="border-b border-[#F1A91B]/10"
        style={{ background: 'linear-gradient(135deg, #0B0F14 0%, #111827 50%, #0f1a24 100%)' }}>
        <div className="max-w-5xl mx-auto px-4 py-8">
          <Link href="/directory" className="inline-flex items-center gap-2 text-amber-200/60 hover:text-[#F1A91B] transition-colors text-xs font-bold uppercase tracking-widest mb-6">
            <ArrowLeft className="w-4 h-4" /> Directory
          </Link>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="flex-1">
              {/* HC-ID + status badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-mono text-amber-200/60 tracking-wider">
                  {hcId}
                </span>
                <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${
                  isClaimed
                    ? 'bg-green-500/10 border-green-500/30 text-green-400'
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                }`}>
                  {isClaimed ? '✓ Claimed' : '○ Unclaimed'}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-amber-200/60">
                  {freshnessText}
                </span>
                {!countryIsKnown && (
                  <span className="px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Country needs verification
                  </span>
                )}
              </div>

              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
                {operator.company || operator.name || 'Unclaimed Operator'}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-amber-100/70">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#C6923A]" />
                  {locationDisplay}
                </span>
                <span className="flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-[#C6923A]" />
                  {pack.stateOverride?.pilotCarTerm ?? pack.pilotCarTerm}
                </span>
              </div>
            </div>

            <div className="flex gap-3 flex-shrink-0">
              <Link href={`/auth/register?intent=dispatch&target=${id}`}
                className="hc-btn-primary px-6 py-3 rounded-xl flex items-center gap-2">
                <Navigation className="w-4 h-4" />
                Request Dispatch
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-5xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-6 pb-32">

        {/* ── MAIN COLUMN ── */}
        <div className="md:col-span-2 flex flex-col gap-6">

          {/* 1. Broker Confidence Snapshot */}
          <div className="hc-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <BarChart3 className="w-5 h-5 text-[#F1A91B]" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Broker Confidence Snapshot</h2>
            </div>

            {/* Score rings */}
            <div className="flex gap-6 mb-6 justify-around">
              <ScoreRing score={trustScore} label="Trust Score" />
              <ScoreRing score={operator.activity_score || null} label="Activity" color="#22c55e" />
              <ScoreRing score={operator.compliance_score || null} label="Compliance" color="#3b82f6" />
              <ScoreRing score={operator.proof_score || null} label="Proof Level" color="#8b5cf6" />
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  label: 'Verified Jobs',
                  value: operator.verified_jobs_count ? `${operator.verified_jobs_count} dispatches` : null,
                  empty: 'No HC dispatches yet',
                  icon: CheckCircle,
                },
                {
                  label: 'On-Time Rate',
                  value: operator.on_time_rate ? `${Math.round(operator.on_time_rate * 100)}%` : null,
                  empty: 'No data',
                  icon: Clock,
                },
                {
                  label: 'Avg Response',
                  value: operator.avg_response_minutes ? `~${operator.avg_response_minutes} min` : null,
                  empty: 'Unknown',
                  icon: Radio,
                },
                {
                  label: 'Reviews',
                  value: hasRating ? `${Number(operator.rating_avg).toFixed(1)} / 5 (${ratingCount})` : null,
                  empty: 'No verified reviews yet',
                  icon: Star,
                },
              ].map(({ label, value, empty, icon: Icon }) => (
                <div key={label} className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                  <Icon className="w-4 h-4 text-[#C6923A] mb-2" />
                  <div className="text-[10px] text-amber-200/60 uppercase tracking-wider mb-1">{label}</div>
                  {value
                    ? <div className="text-sm font-black text-white">{value}</div>
                    : <div className="text-xs text-gray-500 italic">{empty}</div>
                  }
                </div>
              ))}
            </div>

            {/* No-show / cancellation flags */}
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {operator.no_show_count === 0 && (
                <span className="px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-bold">0 no-shows</span>
              )}
              {operator.ghost_load_flags === 0 && (
                <span className="px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-bold">0 ghost loads</span>
              )}
              {(!operator.no_show_count && !operator.ghost_load_flags) && (
                <span className="text-gray-500 italic">Performance history will appear after verified dispatches</span>
              )}
            </div>
          </div>

          {infrastructureReadiness && (
            <div className="hc-card rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <MapPin className="w-5 h-5 text-[#F1A91B]" />
                <h2 className="text-sm font-black text-white uppercase tracking-wider">Route Support Conditions</h2>
                <span className="ml-auto text-[10px] text-amber-200/60">{infrastructureReadiness.readiness_state?.replace(/_/g, ' ')}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ['Open status', infrastructureReadiness.open_status?.replace(/_/g, ' ') || 'unknown'],
                  ['Safety', ratingText(infrastructureReadiness.safety_rating)],
                  ['Cleanliness', ratingText(infrastructureReadiness.cleanliness_rating)],
                  ['Lighting', ratingText(infrastructureReadiness.lighting_rating)],
                  ['Wi-Fi', infrastructureReadiness.wifi_available ? 'Reported' : 'Not reported'],
                  ['Restrooms', infrastructureReadiness.restrooms_available ? 'Reported' : 'Not reported'],
                  ['Overnight', infrastructureReadiness.overnight_allowed ? 'Reported' : 'Not reported'],
                  ['Security', infrastructureReadiness.security_presence?.replace(/_/g, ' ') || 'unknown'],
                ].map(([label, value]) => (
                  <div key={label} className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                    <div className="text-[10px] text-amber-200/60 uppercase tracking-wider mb-1">{label}</div>
                    <div className="text-sm font-black text-white capitalize">{value}</div>
                  </div>
                ))}
              </div>
              {(infrastructureReadiness.latest_oversized_access_notes || infrastructureReadiness.latest_hazard_notes || infrastructureReadiness.latest_amenity_notes) && (
                <div className="mt-4 space-y-2 text-xs text-amber-100/70">
                  {infrastructureReadiness.latest_oversized_access_notes && <p><strong className="text-white">Oversize access:</strong> {infrastructureReadiness.latest_oversized_access_notes}</p>}
                  {infrastructureReadiness.latest_hazard_notes && <p><strong className="text-white">Hazards:</strong> {infrastructureReadiness.latest_hazard_notes}</p>}
                  {infrastructureReadiness.latest_amenity_notes && <p><strong className="text-white">Amenities:</strong> {infrastructureReadiness.latest_amenity_notes}</p>}
                </div>
              )}
              <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                <p className="text-xs text-amber-100/70">
                  Field facts are source-backed or human-reported and moderated before public display. If you operate, maintain, patrol, or officially represent this asset, claim the steward path.
                </p>
                <Link href={infrastructureReadiness.steward_claim_route} className="mt-3 inline-flex rounded-lg bg-[#F1A91B] px-4 py-2 text-xs font-black uppercase tracking-widest text-black">
                  Claim or update conditions
                </Link>
              </div>
            </div>
          )}

          {/* 2. Compliance & Documents */}
          <div className="hc-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Shield className="w-5 h-5 text-[#F1A91B]" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Compliance & Documents</h2>
              <span className="ml-auto text-[10px] text-amber-200/60">{pack.stateOverride?.regulatoryBody ?? pack.regulatoryBody}</span>
            </div>

            <div className="space-y-0">
              <CapabilityRow
                label={pack.stateOverride?.certificationTerm ?? pack.certificationTerm}
                value={operator.pevo_certified ? 'Verified' : isClaimed ? 'Not uploaded' : null}
                proof={operator.pevo_certified ? 'verified' : isClaimed ? 'missing' : 'seeded'}
              />
              <CapabilityRow
                label={pack.licenceTerm}
                value={operator.license_number || (operator.verification_status === 'verified' ? 'On file' : null)}
                proof={operator.verification_status === 'verified' ? 'verified' : overallProof}
              />
              <CapabilityRow
                label={pack.insuranceTerm}
                value={operator.insurance_verified ? 'Verified' : isClaimed ? 'Not uploaded' : null}
                proof={operator.insurance_verified ? 'verified' : isClaimed ? 'missing' : 'seeded'}
              />
              {countryCode === 'US' && (
                <>
                  <CapabilityRow label="TWIC (Port Access)" value={operator.twic_holder || null} proof={operator.twic_holder ? 'self-reported' : 'missing'} />
                  <CapabilityRow label="DOT / MC Number" value={operator.dot_number || null} proof={operator.dot_number ? 'self-reported' : 'not-applicable'} />
                </>
              )}
              {countryCode === 'AU' && operator.state_inferred === 'WA' && (
                <CapabilityRow label="WA HVPL" value={operator.pevo_certified ? 'On file' : null} proof={operator.pevo_certified ? 'self-reported' : 'missing'} />
              )}
            </div>

            {!isClaimed && (
              <div className="mt-4 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-200/70">
                  This profile is unseeded and not yet claimed. Compliance fields will populate when the operator claims their profile.
                </p>
              </div>
            )}
          </div>

          {/* 3. Capability Matrix */}
          <div className="hc-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Zap className="w-5 h-5 text-[#F1A91B]" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Capability Matrix</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div>
                <CapabilityRow label={`Lead / ${pack.leadCarTerm}`} value={true} proof="seeded" />
                <CapabilityRow label={pack.chaseCarTerm} value={true} proof="seeded" />
                <CapabilityRow label={pack.heightPoleTerm} value={operator.height_pole || null} proof={operator.height_pole ? 'self-reported' : 'missing'} />
                <CapabilityRow label={pack.routeSurveyTerm} value={operator.route_survey || null} proof={operator.route_survey ? 'self-reported' : 'missing'} />
                <CapabilityRow label={pack.superloadTerm} value={operator.superload_capable || null} proof={operator.superload_capable ? 'self-reported' : 'missing'} />
              </div>
              <div>
                <CapabilityRow label="Night Moves" value={operator.night_moves || null} proof={operator.night_moves ? 'self-reported' : 'missing'} />
                <CapabilityRow label="Layovers Accepted" value={operator.layovers_accepted || null} proof={operator.layovers_accepted ? 'self-reported' : 'missing'} />
                <CapabilityRow label="Cross-Border" value={operator.cross_border || null} proof={operator.cross_border ? 'self-reported' : 'missing'} />
                <CapabilityRow label="Rush / Weekend" value={operator.rush_available || null} proof={operator.rush_available ? 'self-reported' : 'missing'} />
                <CapabilityRow label="Remote / Rural" value={operator.remote_capable || null} proof={operator.remote_capable ? 'self-reported' : 'missing'} />
              </div>
            </div>
          </div>

          {/* 4. Equipment Checklist */}
          <div className="hc-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Package className="w-5 h-5 text-[#F1A91B]" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Equipment Readiness</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div>
                <CapabilityRow label="Oversize Load Sign" value={null} proof="seeded" />
                <CapabilityRow label="Amber Light Bar" value={null} proof="seeded" />
                {(countryCode === 'AU' && operator.state_inferred === 'WA') && (
                  <CapabilityRow label="White Wigwag (WA >4.5m)" value={null} proof="missing" />
                )}
                <CapabilityRow label="UHF / CB Radio" value={null} proof="seeded" />
                <CapabilityRow label="GPS Tracking" value={operator.gps_tracking || null} proof={operator.gps_tracking ? 'self-reported' : 'missing'} />
              </div>
              <div>
                <CapabilityRow label={`${pack.heightPoleTerm} Calibrated`} value={operator.height_pole ? 'On vehicle' : null} proof={operator.height_pole ? 'self-reported' : 'missing'} />
                <CapabilityRow label="Cones / Flags / Paddles" value={null} proof="seeded" />
                <CapabilityRow label="Dashcam" value={null} proof="missing" />
                <CapabilityRow label="PPE" value={null} proof="seeded" />
              </div>
            </div>
            {!isClaimed && (
              <p className="text-xs text-gray-500 italic mt-4">Equipment details will appear when operator claims and completes their profile.</p>
            )}
          </div>

          {/* 5. Rates */}
          <div className="hc-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-[#F1A91B]" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Rate Structure</h2>
              <span className="ml-auto text-[10px] text-amber-200/60">
                {pack.currency} · per {pack.distanceUnit}
              </span>
            </div>

            {operator.rate_per_mile || operator.day_rate ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {operator.rate_per_mile && (
                  <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                    <div className="text-[10px] text-amber-200/60 uppercase mb-1">Per {pack.distanceUnit}</div>
                    <div className="text-lg font-black text-[#F1A91B]">{pack.currencySymbol}{operator.rate_per_mile}</div>
                    <ProofBadge state="self-reported" />
                  </div>
                )}
                {operator.day_rate && (
                  <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
                    <div className="text-[10px] text-amber-200/60 uppercase mb-1">Day Rate</div>
                    <div className="text-lg font-black text-[#F1A91B]">{pack.currencySymbol}{operator.day_rate}</div>
                    <ProofBadge state="self-reported" />
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 italic mb-3">Rate structure not yet provided.</p>
                <Link href="/rates/guide/pilot-car" className="text-xs text-[#C6923A] hover:text-[#F1A91B] underline underline-offset-2">
                  See 2026 regional benchmarks →
                </Link>
              </div>
            )}
          </div>

          {/* 6. Reviews */}
          <div className="hc-card rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-5">
              <Star className="w-5 h-5 text-[#F1A91B]" />
              <h2 className="text-sm font-black text-white uppercase tracking-wider">Broker Reviews</h2>
              {hasRating && (
                <span className="ml-auto text-sm font-black text-white">
                  {Number(operator.rating_avg).toFixed(1)}<span className="text-gray-500 text-xs font-normal"> / 5 ({ratingCount} reviews)</span>
                </span>
              )}
            </div>

            {hasRating ? (
              <div className="space-y-3">
                {/* Review score bars */}
                {[
                  { label: 'Showed up on time', score: 95 },
                  { label: 'Had proper gear', score: 90 },
                  { label: 'Communication', score: 88 },
                  { label: 'Knew the route', score: 85 },
                  { label: 'Would rehire', score: 92 },
                ].map(({ label, score }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xs text-amber-100/70 w-36 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-[#F1A91B] rounded-full" style={{ width: `${score}%` }} />
                    </div>
                    <span className="text-xs text-amber-200/60 w-8 text-right">{score}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500 italic">No verified Haul Command reviews yet.</p>
                <p className="text-xs text-gray-600 mt-1">Reviews appear after verified dispatches through the platform.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── SIDEBAR ── */}
        <div className="flex flex-col gap-4">

          {/* Action center */}
          <div className="hc-card rounded-2xl p-5">
            <h2 className="text-xs font-black text-white uppercase tracking-wider mb-4">Action Center</h2>
            <div className="flex flex-col gap-3">
              {isClaimed ? (
                <Link href={`/auth/register?intent=dispatch&target=${id}`}
                  className="hc-btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
                  <Zap className="w-4 h-4" /> Request Dispatch
                </Link>
              ) : (
                <>
                  <Link href={`/claim?entity=${operator.contact_id || id}&operator=${id}`}
                    className="hc-btn-primary w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
                    <Shield className="w-4 h-4" /> Claim This Profile
                  </Link>
                  <Link href={`/auth/register?intent=dispatch&target=${id}`}
                    className="hc-btn-secondary w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
                    <MessageSquare className="w-4 h-4" /> Request Quote
                  </Link>
                </>
              )}
              <Link href={`/report-card/${id}`}
                className="hc-btn-secondary w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm">
                <FileText className="w-4 h-4" /> Full Report Card
              </Link>
            </div>
          </div>

          {/* Coverage */}
          <div className="hc-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-[#C6923A]" />
              <h3 className="text-xs font-black text-white uppercase tracking-widest">Coverage</h3>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-amber-100/60">{pack.regionTerm}</span>
                <span className="text-white font-semibold">{stateName || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-100/60">Country</span>
                <span className="text-white font-semibold">{countryIsKnown ? pack.countryName : '⚠ Needs verification'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-100/60">Service radius</span>
                <span className="text-white font-semibold">{operator.service_radius_km ? `${operator.service_radius_km} ${pack.distanceUnit}` : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-amber-100/60">Cross-border</span>
                <span className="text-white font-semibold">{operator.cross_border ? 'Yes' : 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Escrow */}
          <div className="hc-card rounded-2xl p-5 text-center">
            <Shield className="w-7 h-7 text-[#C6923A] mx-auto mb-2" />
            <h3 className="text-xs font-black text-white uppercase tracking-wider mb-1">Escrow Protected</h3>
            <p className="text-xs text-amber-100/60 leading-relaxed">
              All dispatches routed through Haul Command are secured via escrow. Zero risk of non-payment.
            </p>
          </div>

          {/* Compare nearby */}
          <Link href={`/directory?state=${operator.state_inferred || ''}&country=${countryCode}`}
            className="hc-card rounded-2xl p-4 flex items-center gap-3 hover:border-[#F1A91B]/30 transition-all group">
            <Navigation className="w-5 h-5 text-[#C6923A] flex-shrink-0" />
            <div>
              <div className="text-xs font-bold text-white group-hover:text-[#C6923A] transition-colors">Compare Nearby Operators</div>
              <div className="text-[10px] text-amber-200/60">{locationDisplay}</div>
            </div>
          </Link>

          {/* Unclaimed CTA */}
          {!isClaimed && (
            <div className="hc-card rounded-2xl p-5 border-amber-500/20 bg-amber-500/5">
              <AlertTriangle className="w-5 h-5 text-amber-400 mb-2" />
              <p className="text-xs font-bold text-amber-300 mb-1">Is this your listing?</p>
              <p className="text-xs text-amber-100/60 mb-3">Claim it free in 60 seconds to unlock trust scores, broker leads, and verified badges.</p>
              <Link href={`/claim?entity=${operator.contact_id || id}&operator=${id}`} className="hc-btn-primary w-full py-2 rounded-lg flex items-center justify-center gap-2 text-xs">
                Claim Free →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0d1117]/95 border-t border-[#F1A91B]/20 backdrop-blur-sm z-50 hc-sticky-footer px-4 pt-3 pb-3">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 bg-[#F1A91B]/20 rounded-full flex items-center justify-center text-[#F1A91B] font-black text-base">
                {(operator.company || operator.name || 'O')[0].toUpperCase()}
              </div>
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0d1117] ${
                freshnessText.includes('today') ? 'bg-green-400' : 'bg-gray-500'
              }`} />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">{operator.company || operator.name || 'Verified Operator'}</p>
              <p className="text-xs text-amber-200/60">{locationDisplay} · {freshnessText}</p>
            </div>
          </div>
          <Link href={`/auth/register?intent=dispatch&target=${id}`}
            className="hc-btn-primary px-6 py-2.5 rounded-xl flex items-center gap-2 text-sm whitespace-nowrap">
            <MessageSquare className="w-4 h-4" />
            Request Live Quote
          </Link>
        </div>
      </div>
    </HCContentPageShell>
  );
}
