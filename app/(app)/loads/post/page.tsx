'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type CSSProperties } from 'react';
import { MobileButton, MobileCard, MobileEmpty, MobileScreenHeader } from '@/components/mobile/MobileComponents';
import { createClient } from '@/utils/supabase/client';

interface MatchCard {
    type: 'sure_thing' | 'best_value' | 'speedster';
    label: string;
    tagline: string;
    operator_id: string;
    operator_name: string;
    trust_score: number;
    response_min: number | null;
    rate_per_mile: number | null;
    corridor_match_count: number;
    composite_score: number;
    confidence: 'high' | 'medium' | 'low';
    reasoning: string[];
}

interface MatchResponse {
    matches: MatchCard[];
    candidate_pool_size: number;
    generated_at: string;
}

interface WaveResponse {
    ok: boolean;
    offers_created: number;
    wave: number;
    wave_size: number;
    expires_at: string;
    ttl_seconds: number;
    candidates_considered: number;
}

type WizardStep = 1 | 2 | 3 | 4 | 5;

const REGIONS = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
    'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'NT', 'NU', 'ON', 'PE',
    'QC', 'SK', 'YT',
] as const;

const LOAD_TYPES = [
    { id: 'oversized', label: 'Oversized / wide load', note: 'General heavy haul' },
    { id: 'superload', label: 'Superload', note: 'Maximum planning' },
    { id: 'high_pole', label: 'High pole required', note: 'Overheight support' },
    { id: 'standard', label: 'Standard escort', note: 'Routine escort work' },
] as const;

const URGENCY_OPTIONS = [
    { id: 'normal', label: 'Standard', note: 'Plan ahead' },
    { id: 'soon', label: 'Urgent', note: 'Same day' },
    { id: 'now', label: 'Rescue', note: 'Immediate' },
] as const;

const STEP_LABELS: Array<{ step: WizardStep; label: string }> = [
    { step: 1, label: 'Route' },
    { step: 2, label: 'Load details' },
    { step: 3, label: 'Review' },
    { step: 4, label: 'Preview' },
    { step: 5, label: 'Dispatch' },
];

const MATCH_ACCENTS: Record<MatchCard['type'], { border: string; bg: string; text: string }> = {
    sure_thing: { border: '#22C55E', bg: 'rgba(34, 197, 94, 0.12)', text: '#86EFAC' },
    best_value: { border: '#C6923A', bg: 'rgba(198, 146, 58, 0.12)', text: '#F1C27B' },
    speedster: { border: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)', text: '#FCA5A5' },
};

const labelStyle: CSSProperties = {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--m-text-muted, #8f97a7)',
};

function createInitialForm() {
    return {
        origin_city: '',
        origin_state: '',
        origin_lat: '',
        origin_lng: '',
        dest_city: '',
        dest_state: '',
        dest_lat: '',
        dest_lng: '',
        pickup_start: '',
        pickup_end: '',
        load_height: '',
        load_width: '',
        load_length: '',
        load_weight: '',
        load_type: 'oversized',
        urgency: 'normal',
        base_rate: '',
        escort_lead: '1',
        escort_chase: '0',
        requires_police: false,
        requires_high_pole: false,
        special_notes: '',
    };
}

function parseNumber(value: string) {
    return Number.parseFloat(value.replace(/,/g, '')) || null;
}

function getLoadTypeLabel(value: string) {
    return LOAD_TYPES.find((item) => item.id === value)?.label ?? 'Oversized / wide load';
}

function getUrgencyLabel(value: string) {
    return URGENCY_OPTIONS.find((item) => item.id === value)?.label ?? 'Standard';
}

export default function PostLoadPage() {
    const router = useRouter();
    const supabase = createClient();
    const [step, setStep] = useState<WizardStep>(1);
    const [form, setForm] = useState(createInitialForm());
    const [loadId, setLoadId] = useState<string | null>(null);
    const [matchResult, setMatchResult] = useState<MatchResponse | null>(null);
    const [waveResult, setWaveResult] = useState<WaveResponse | null>(null);
    const [elapsedMs, setElapsedMs] = useState<number | null>(null);
    const [posting, setPosting] = useState(false);
    const [dispatching, setDispatching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showAdvancedCoords, setShowAdvancedCoords] = useState(false);
    const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

    const routeReady = Boolean(
        form.origin_city.trim() &&
        form.origin_state.trim() &&
        form.dest_city.trim() &&
        form.dest_state.trim(),
    );
    const detailsReady = Boolean(
        form.load_height.trim() &&
        form.load_width.trim() &&
        form.load_length.trim() &&
        form.load_weight.trim() &&
        form.base_rate.trim(),
    );

    function setField<Key extends keyof ReturnType<typeof createInitialForm>>(key: Key, value: ReturnType<typeof createInitialForm>[Key]) {
        setForm((current) => ({ ...current, [key]: value }));
    }

    function resetFlow() {
        setStep(1);
        setForm(createInitialForm());
        setLoadId(null);
        setMatchResult(null);
        setWaveResult(null);
        setElapsedMs(null);
        setError(null);
        setShowAdvancedCoords(false);
        setSelectedMatchId(null);
    }

    async function handleGeneratePreview() {
        if (!routeReady || !detailsReady) {
            setError('Add the route, dimensions, and rate before posting the load.');
            return;
        }

        setPosting(true);
        setError(null);
        setMatchResult(null);
        setWaveResult(null);
        const startedAt = performance.now();

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('Please sign in to post a load.');
                return;
            }

            const payload: Record<string, unknown> = {
                origin_lat: parseNumber(form.origin_lat),
                origin_lng: parseNumber(form.origin_lng),
                origin_city: form.origin_city || null,
                origin_state: form.origin_state || null,
                dest_lat: parseNumber(form.dest_lat),
                dest_lng: parseNumber(form.dest_lng),
                dest_city: form.dest_city || null,
                dest_state: form.dest_state || null,
                pickup_start: form.pickup_start || null,
                pickup_end: form.pickup_end || null,
                load_height: parseNumber(form.load_height),
                load_width: parseNumber(form.load_width),
                load_length: parseNumber(form.load_length),
                load_weight: parseNumber(form.load_weight),
                load_type: form.load_type,
                urgency: form.urgency,
                base_rate: parseNumber(form.base_rate),
                status: 'open',
                escort_class_required: {
                    lead: Number.parseInt(form.escort_lead, 10) || 0,
                    chase: Number.parseInt(form.escort_chase, 10) || 0,
                    police: form.requires_police,
                    high_pole: form.requires_high_pole,
                },
                special_notes: form.special_notes || null,
                broker_id: session.user.id,
            };

            const { data: loadData, error: loadError } = await supabase.from('loads').insert(payload).select('id').single();
            if (loadError || !loadData) {
                setError(loadError?.message ?? 'Failed to create load.');
                return;
            }

            setLoadId(loadData.id);

            const response = await fetch('/api/loads/match-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    load_id: loadData.id,
                    origin_state: form.origin_state,
                    dest_state: form.dest_state,
                    budget_max: parseNumber(form.base_rate) ?? undefined,
                    load_type: form.load_type,
                }),
            });

            setElapsedMs(Math.round(performance.now() - startedAt));

            if (response.ok) {
                const data: MatchResponse = await response.json();
                setMatchResult(data);
                setSelectedMatchId(data.matches[0]?.operator_id ?? null);
            } else {
                setMatchResult({ matches: [], candidate_pool_size: 0, generated_at: new Date().toISOString() });
                setError('The load posted successfully, but match preview is temporarily unavailable.');
            }

            setStep(4);
        } catch (caughtError) {
            setError(String(caughtError));
        } finally {
            setPosting(false);
        }
    }

    async function handleDispatch() {
        if (!loadId) {
            return;
        }

        setDispatching(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            if (!supabaseUrl) {
                setError('Supabase URL is not configured.');
                return;
            }

            const response = await fetch(`${supabaseUrl}/functions/v1/match-generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.access_token}`,
                },
                body: JSON.stringify({ load_id: loadId, wave: 1 }),
            });

            if (!response.ok) {
                const body = await response.json().catch(() => ({}));
                setError(body?.error ?? 'Failed to dispatch offers.');
                return;
            }

            const data: WaveResponse = await response.json();
            setWaveResult(data);
            setStep(5);
        } catch (caughtError) {
            setError(String(caughtError));
        } finally {
            setDispatching(false);
        }
    }

    const routeSummary = `${form.origin_city || 'Origin'}, ${form.origin_state || '--'} -> ${form.dest_city || 'Destination'}, ${form.dest_state || '--'}`;

    return (
        <div className="m-shell-content" style={{ minHeight: '100dvh', background: 'var(--m-bg, #060b12)' }}>
            <MobileScreenHeader
                title="Post a Load"
                rightAction={
                    <Link href="/loads" style={{ textDecoration: 'none' }}>
                        <button className="m-btn m-btn--secondary m-btn--small" style={{ width: 'auto' }}>Load Board</button>
                    </Link>
                }
            />

            <div style={{ maxWidth: 760, margin: '0 auto', padding: '16px var(--m-screen-pad, 16px) calc(var(--m-nav-height, 56px) + var(--m-safe-bottom, 0px) + 132px)' }}>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 2 }}>
                    {STEP_LABELS.map((item) => (
                        <div key={item.step} style={{ minWidth: 112, padding: '12px 14px', borderRadius: 16, border: `1px solid ${item.step <= step ? 'rgba(198, 146, 58, 0.26)' : 'rgba(255, 255, 255, 0.06)'}`, background: item.step <= step ? 'rgba(198, 146, 58, 0.08)' : 'rgba(255, 255, 255, 0.02)' }}>
                            <div style={{ ...labelStyle, color: item.step <= step ? 'var(--hc-gold-400)' : 'var(--m-text-muted, #8f97a7)' }}>Step {item.step}</div>
                            <div style={{ marginTop: 6, fontSize: 14, fontWeight: 800, color: 'var(--m-text-primary, #f5f7fb)' }}>{item.label}</div>
                        </div>
                    ))}
                </div>

                <Section title="Broker dispatch flow" description="Route, load details, review, match preview, then dispatch. Coordinates stay hidden until you ask for them.">
                    <div style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--m-text-secondary, #c7ccd7)' }}>This mobile rebuild keeps the current Supabase insert and match-generation flow, but removes the desktop grids and exposes lat/lng only inside the advanced section.</div>
                </Section>

                {error && <ErrorBanner message={error} />}

                {step === 1 && (
                    <>
                        <Section title="Route" description="Cities and state or province pickers come first. Coordinates stay out of the main flow.">
                            <div style={{ display: 'grid', gap: 12 }}>
                                <Field label="Origin city" value={form.origin_city} placeholder="Houston" onChange={(value) => setField('origin_city', value)} />
                                <Field label="Origin state or province" value={form.origin_state} placeholder="Select" options={REGIONS} onChange={(value) => setField('origin_state', value)} />
                                <Field label="Destination city" value={form.dest_city} placeholder="Phoenix" onChange={(value) => setField('dest_city', value)} />
                                <Field label="Destination state or province" value={form.dest_state} placeholder="Select" options={REGIONS} onChange={(value) => setField('dest_state', value)} />
                            </div>
                        </Section>

                        <Section title="Pickup window" description="Optional, but it helps the preview rank operators by timing instead of only geography.">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))', gap: 12 }}>
                                <Field label="Earliest pickup" type="datetime-local" value={form.pickup_start} onChange={(value) => setField('pickup_start', value)} />
                                <Field label="Latest pickup" type="datetime-local" value={form.pickup_end} onChange={(value) => setField('pickup_end', value)} />
                            </div>
                        </Section>

                        <StickyBar>
                            <MobileButton variant="primary" disabled={!routeReady} onClick={() => { setError(null); setStep(2); }}>
                                Continue to load details
                            </MobileButton>
                        </StickyBar>
                    </>
                )}

                {step === 2 && (
                    <>
                        <Section title="Load details" description="Build the load in one column: type, dimensions, escort plan, urgency, then optional notes.">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
                                {LOAD_TYPES.map((item) => (
                                    <ChoiceButton key={item.id} active={form.load_type === item.id} label={item.label} note={item.note} onClick={() => setField('load_type', item.id)} />
                                ))}
                            </div>
                        </Section>

                        <Section title="Dimensions" description="Use the actual dimensions escorts need when they decide whether the move is routine, tight, or rescue-grade.">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 12 }}>
                                <Field label="Height (ft)" value={form.load_height} placeholder="16.5" inputMode="decimal" onChange={(value) => setField('load_height', value)} />
                                <Field label="Width (ft)" value={form.load_width} placeholder="14" inputMode="decimal" onChange={(value) => setField('load_width', value)} />
                                <Field label="Length (ft)" value={form.load_length} placeholder="120" inputMode="decimal" onChange={(value) => setField('load_length', value)} />
                                <Field label="Weight (lb)" value={form.load_weight} placeholder="80000" inputMode="decimal" onChange={(value) => setField('load_weight', value)} />
                            </div>
                        </Section>

                        <Section title="Escort configuration" description="Set escort count, urgency, and rate before the preview request goes out.">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 12 }}>
                                <Field label="Lead escorts" value={form.escort_lead} placeholder="1" inputMode="numeric" onChange={(value) => setField('escort_lead', value)} />
                                <Field label="Chase escorts" value={form.escort_chase} placeholder="0" inputMode="numeric" onChange={(value) => setField('escort_chase', value)} />
                                <Field label="Base rate ($)" value={form.base_rate} placeholder="600" inputMode="decimal" onChange={(value) => setField('base_rate', value)} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10, marginTop: 12 }}>
                                <ChoiceButton active={form.requires_police} label="Police escort" note="Toggle if required" onClick={() => setField('requires_police', !form.requires_police)} />
                                <ChoiceButton active={form.requires_high_pole} label="High pole" note="Toggle if required" onClick={() => setField('requires_high_pole', !form.requires_high_pole)} />
                            </div>

                            <div style={{ marginTop: 14 }}>
                                <div style={labelStyle}>Urgency</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, marginTop: 8 }}>
                                    {URGENCY_OPTIONS.map((item) => (
                                        <ChoiceButton key={item.id} active={form.urgency === item.id} label={item.label} note={item.note} onClick={() => setField('urgency', item.id)} />
                                    ))}
                                </div>
                            </div>
                        </Section>

                        <Section title="Notes and advanced route data" description="The main flow stays clean. Open advanced only when the load truly needs precise coordinates.">
                            <Field label="Special notes" value={form.special_notes} placeholder="Escort meet points, bridge notes, or dispatcher instructions." rows={4} onChange={(value) => setField('special_notes', value)} />
                            <button type="button" onClick={() => setShowAdvancedCoords((current) => !current)} style={togglePanelStyle}>
                                {showAdvancedCoords ? 'Hide advanced coordinates' : 'Show advanced coordinates'}
                            </button>
                            {showAdvancedCoords && (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 12, marginTop: 12 }}>
                                    <Field label="Origin latitude" value={form.origin_lat} placeholder="29.7604" inputMode="decimal" onChange={(value) => setField('origin_lat', value)} />
                                    <Field label="Origin longitude" value={form.origin_lng} placeholder="-95.3698" inputMode="decimal" onChange={(value) => setField('origin_lng', value)} />
                                    <Field label="Destination latitude" value={form.dest_lat} placeholder="33.4484" inputMode="decimal" onChange={(value) => setField('dest_lat', value)} />
                                    <Field label="Destination longitude" value={form.dest_lng} placeholder="-112.0740" inputMode="decimal" onChange={(value) => setField('dest_lng', value)} />
                                </div>
                            )}
                        </Section>

                        <StickyBar>
                            <MobileButton variant="secondary" onClick={() => setStep(1)}>Back</MobileButton>
                            <MobileButton variant="primary" disabled={!detailsReady} onClick={() => { setError(null); setStep(3); }}>
                                Continue to review
                            </MobileButton>
                        </StickyBar>
                    </>
                )}

                {step === 3 && (
                    <>
                        <Section title="Review" description="Final mobile review before the load record is created and the top match preview is generated.">
                            <SummaryItem label="Route" value={routeSummary} />
                            <SummaryItem label="Load type" value={getLoadTypeLabel(form.load_type)} />
                            <SummaryItem label="Dimensions" value={`${form.load_height || '--'} ft H / ${form.load_width || '--'} ft W / ${form.load_length || '--'} ft L`} />
                            <SummaryItem label="Weight" value={`${form.load_weight || '--'} lb`} />
                            <SummaryItem label="Escort plan" value={`${form.escort_lead} lead / ${form.escort_chase} chase`} />
                            <SummaryItem label="Urgency" value={getUrgencyLabel(form.urgency)} />
                            <SummaryItem label="Base rate" value={form.base_rate ? `$${form.base_rate}` : '--'} />
                        </Section>

                        <Section title="What happens next" description="The same backend flow stays in place, but the mobile sequence is now clearer and easier to control.">
                            <InfoItem index="1" title="Create the load record" body="Supabase gets the live load record first, using the same payload path the old screen used." />
                            <InfoItem index="2" title="Generate the top match preview" body="The app calls the existing match-generation API and stacks the best operators vertically for mobile review." />
                            <InfoItem index="3" title="Dispatch wave one" body="If the preview looks right, dispatch sends the first offer wave without making the broker leave the app shell." />
                        </Section>

                        <StickyBar>
                            <MobileButton variant="secondary" onClick={() => setStep(2)}>Back</MobileButton>
                            <MobileButton variant="primary" disabled={!routeReady || !detailsReady || posting} onClick={handleGeneratePreview}>
                                {posting ? 'Posting load...' : 'Post load and preview matches'}
                            </MobileButton>
                        </StickyBar>
                    </>
                )}

                {step === 4 && (
                    <>
                        <Section title="Match preview" description="Top operators are stacked vertically now, so the preview behaves like a mobile dispatch queue instead of a desktop card grid.">
                            <SummaryItem label="Route" value={routeSummary} />
                            <SummaryItem label="Urgency" value={getUrgencyLabel(form.urgency)} />
                            <SummaryItem label="Rate" value={form.base_rate ? `$${form.base_rate}` : '--'} />
                            <SummaryItem label="Match time" value={elapsedMs !== null ? `${elapsedMs} ms` : '--'} />
                            {matchResult && <SummaryItem label="Candidate pool" value={String(matchResult.candidate_pool_size)} />}
                        </Section>

                        {matchResult?.matches.length ? (
                            <div style={{ display: 'grid', gap: 12 }}>
                                {matchResult.matches.map((match) => (
                                    <MatchPreview key={match.operator_id} match={match} active={selectedMatchId === match.operator_id} onClick={() => setSelectedMatchId((current) => current === match.operator_id ? null : match.operator_id)} />
                                ))}
                            </div>
                        ) : (
                            <Section title="No preview matches" description="The load is posted already. You can still dispatch wave one and let the offer engine continue searching.">
                                <MobileEmpty title="No mobile preview matches right now" description="This load can still move into dispatch. The mobile preview just did not return a ranked stack this pass." />
                            </Section>
                        )}

                        <StickyBar>
                            <MobileButton variant="secondary" onClick={() => setStep(3)} disabled={dispatching}>Edit review</MobileButton>
                            <MobileButton variant="primary" onClick={handleDispatch} disabled={dispatching}>
                                {dispatching ? 'Dispatching offers...' : 'Dispatch wave one'}
                            </MobileButton>
                        </StickyBar>
                    </>
                )}

                {step === 5 && (
                    <>
                        <Section title="Offers dispatched" description="Wave one is out. The broker stays in the app shell and moves straight into the next action.">
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: 12 }}>
                                <StatBox label="Offers sent" value={String(waveResult?.offers_created ?? 0)} />
                                <StatBox label="Wave" value={String(waveResult?.wave ?? 1)} />
                                <StatBox label="Pool size" value={String(waveResult?.candidates_considered ?? 0)} />
                                <StatBox label="TTL" value={`${Math.round((waveResult?.ttl_seconds ?? 180) / 60)} min`} />
                            </div>
                        </Section>

                        <Section title="Next actions" description="Keep the broker moving instead of sending them into a dead end.">
                            <div style={{ display: 'grid', gap: 10 }}>
                                <MobileButton variant="primary" onClick={() => { if (loadId) router.push(`/loads/${loadId}`); }}>View load details</MobileButton>
                                <MobileButton variant="secondary" onClick={() => router.push('/loads')}>Open load board</MobileButton>
                                <MobileButton variant="secondary" onClick={resetFlow}>Post another load</MobileButton>
                            </div>
                        </Section>
                    </>
                )}
            </div>
        </div>
    );
}

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
    return (
        <div style={{ marginTop: 12 }}>
            <MobileCard>
                <div style={{ ...labelStyle, color: 'var(--hc-gold-400)' }}>{title}</div>
                {description && <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.6, color: 'var(--m-text-secondary, #c7ccd7)' }}>{description}</div>}
                <div style={{ marginTop: 14 }}>{children}</div>
            </MobileCard>
        </div>
    );
}

function ErrorBanner({ message }: { message: string }) {
    return <div style={{ marginTop: 12, padding: '14px 16px', borderRadius: 16, border: '1px solid rgba(239, 68, 68, 0.18)', background: 'rgba(239, 68, 68, 0.08)', color: '#FCA5A5', fontSize: 14, lineHeight: 1.55 }}>{message}</div>;
}

function Field({
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
    options,
    rows,
    inputMode,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    options?: readonly string[];
    rows?: number;
    inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}) {
    return (
        <div>
            <div style={labelStyle}>{label}</div>
            {options ? (
                <select className="m-input" value={value} onChange={(event) => onChange(event.target.value)} style={{ width: '100%', marginTop: 8 }}>
                    <option value="">{placeholder}</option>
                    {options.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
            ) : rows ? (
                <textarea value={value} placeholder={placeholder} rows={rows} onChange={(event) => onChange(event.target.value)} style={{ width: '100%', marginTop: 8, resize: 'vertical', borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.03)', color: 'var(--m-text-primary, #f5f7fb)', padding: '14px 16px', fontSize: 16, lineHeight: 1.55, boxSizing: 'border-box' }} />
            ) : (
                <input className="m-input" type={type} value={value} inputMode={inputMode} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} style={{ width: '100%', marginTop: 8 }} />
            )}
        </div>
    );
}

function ChoiceButton({ active, label, note, onClick }: { active: boolean; label: string; note: string; onClick: () => void }) {
    return (
        <button type="button" onClick={onClick} style={{ padding: '14px 12px', borderRadius: 16, border: `1px solid ${active ? 'rgba(198, 146, 58, 0.36)' : 'rgba(255, 255, 255, 0.08)'}`, background: active ? 'rgba(198, 146, 58, 0.08)' : 'rgba(255, 255, 255, 0.02)', color: 'inherit', textAlign: 'left', minHeight: 92 }}>
            <div style={{ fontSize: 14, lineHeight: 1.3, fontWeight: 800, color: 'var(--m-text-primary, #f5f7fb)' }}>{label}</div>
            <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.5, color: active ? 'var(--hc-gold-400)' : 'var(--m-text-muted, #8f97a7)' }}>{note}</div>
        </button>
    );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '12px 14px', borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.06)', background: 'rgba(255, 255, 255, 0.03)', marginTop: 10 }}>
            <div style={labelStyle}>{label}</div>
            <div style={{ fontSize: 14, lineHeight: 1.5, textAlign: 'right', color: 'var(--m-text-primary, #f5f7fb)' }}>{value}</div>
        </div>
    );
}

function InfoItem({ index, title, body }: { index: string; title: string; body: string }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr', gap: 12, padding: '12px 14px', borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.06)', background: 'rgba(255, 255, 255, 0.03)', marginTop: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'rgba(198, 146, 58, 0.12)', color: 'var(--hc-gold-400)', fontWeight: 900 }}>{index}</div>
            <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--m-text-primary, #f5f7fb)' }}>{title}</div>
                <div style={{ marginTop: 4, fontSize: 13, lineHeight: 1.6, color: 'var(--m-text-secondary, #c7ccd7)' }}>{body}</div>
            </div>
        </div>
    );
}

function MatchPreview({ match, active, onClick }: { match: MatchCard; active: boolean; onClick: () => void }) {
    const accent = MATCH_ACCENTS[match.type];
    return (
        <button type="button" onClick={onClick} style={{ width: '100%', padding: 0, borderRadius: 20, border: `1px solid ${active ? accent.border : 'rgba(255, 255, 255, 0.08)'}`, background: 'transparent', color: 'inherit', textAlign: 'left' }}>
            <MobileCard>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'start' }}>
                    <div>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 10px', borderRadius: 999, background: accent.bg, color: accent.text, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{match.label}</div>
                        <div style={{ marginTop: 12, fontSize: 20, lineHeight: 1.1, fontWeight: 900 }}>{match.operator_name}</div>
                        <div style={{ marginTop: 4, fontSize: 13, color: 'var(--m-text-secondary, #c7ccd7)' }}>{match.tagline}</div>
                    </div>
                    <div style={{ minWidth: 62, padding: '10px 12px', borderRadius: 16, background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.06)', textAlign: 'center' }}>
                        <div style={{ ...labelStyle, fontSize: 10 }}>Score</div>
                        <div style={{ marginTop: 4, fontSize: 22, fontWeight: 900, color: accent.border }}>{Math.round(match.composite_score * 100)}</div>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))', gap: 10, marginTop: 16 }}>
                    <StatBox label="Trust" value={`${match.trust_score}/100`} compact />
                    <StatBox label="Response" value={match.response_min ? `${match.response_min} min` : '--'} compact />
                    <StatBox label="Rate" value={match.rate_per_mile ? `$${match.rate_per_mile.toFixed(2)}/mi` : '--'} compact />
                    <StatBox label="Corridor xp" value={String(match.corridor_match_count)} compact />
                </div>
                <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
                    {match.reasoning.map((item) => (
                        <div key={item} style={{ display: 'flex', gap: 8, alignItems: 'start', fontSize: 13, lineHeight: 1.55, color: 'var(--m-text-secondary, #c7ccd7)' }}>
                            <span style={{ color: accent.border, fontWeight: 900 }}>+</span>
                            <span>{item}</span>
                        </div>
                    ))}
                </div>
            </MobileCard>
        </button>
    );
}

function StatBox({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
    return (
        <div style={{ padding: compact ? 12 : 14, borderRadius: 16, border: '1px solid rgba(255, 255, 255, 0.06)', background: 'rgba(255, 255, 255, 0.03)' }}>
            <div style={{ ...labelStyle, fontSize: 10 }}>{label}</div>
            <div style={{ marginTop: 6, fontSize: compact ? 18 : 24, fontWeight: 900, color: 'var(--m-text-primary, #f5f7fb)' }}>{value}</div>
        </div>
    );
}

function StickyBar({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ position: 'sticky', bottom: 'calc(var(--m-nav-height, 56px) + var(--m-safe-bottom, 0px) + 12px)', zIndex: 5, marginTop: 20 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', padding: 12, borderRadius: 22, border: '1px solid rgba(198, 146, 58, 0.16)', background: 'rgba(9, 11, 15, 0.9)', backdropFilter: 'blur(18px)', boxShadow: 'var(--shadow-gold)' }}>
                {children}
            </div>
        </div>
    );
}

const togglePanelStyle: CSSProperties = {
    width: '100%',
    marginTop: 12,
    padding: '14px 16px',
    borderRadius: 16,
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(255, 255, 255, 0.02)',
    color: 'var(--m-text-primary, #f5f7fb)',
    fontSize: 14,
    fontWeight: 800,
};
