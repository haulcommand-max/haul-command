'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ADGRID â€” CAMPAIGN CREATION WIZARD
// 3-step flow: Details â†’ Targeting â†’ Creatives
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const T = {
    bg: '#060b12',
    bgElevated: '#0f1720',
    bgCard: '#121a24',
    border: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.14)',
    textPrimary: '#ffffff',
    textBody: '#cfd8e3',
    textSecondary: '#8fa3b8',
    textLabel: '#9fb3c8',
    gold: '#f5b942',
    blue: '#3ba4ff',
    green: '#27d17f',
    red: '#f87171',
    amber: '#f59e0b',
    purple: '#a78bfa',
} as const;

const supabase = createClient();

type Step = 1 | 2 | 3;

interface CampaignForm {
    campaign_name: string;
    budget: string;
    daily_cap: string;
    start_date: string;
    end_date: string;
    roles: string[];
    jurisdictions: string[];
    corridors: string[];
    headline: string;
    body: string;
    cta_text: string;
    cta_url: string;
    image_url: string;
    creative_type: string;
}

const US_STATES = [
    'US-FL', 'US-TX', 'US-CA', 'US-GA', 'US-OH', 'US-PA', 'US-NC', 'US-IL', 'US-NY',
    'US-LA', 'US-OK', 'US-AZ', 'US-MI', 'US-VA', 'US-WA', 'US-IN', 'US-TN', 'US-MO',
    'US-WI', 'US-MN', 'US-AL', 'US-SC', 'US-KY', 'US-OR', 'US-NV', 'US-NJ', 'US-CO',
    'US-AR', 'US-IA', 'US-MS', 'US-KS', 'US-NE', 'US-NM', 'US-WV', 'US-ID', 'US-UT',
    'US-MT', 'US-ND', 'US-SD', 'US-WY', 'US-ME', 'US-NH', 'US-VT', 'US-MA', 'US-CT',
    'US-RI', 'US-DE', 'US-MD', 'US-NJ',
];

const CORRIDORS = ['I-10', 'I-75', 'I-95', 'I-40', 'I-35', 'I-80', 'I-90', 'I-20', 'I-70', 'I-5'];

const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 10,
    background: T.bgCard, border: `1px solid ${T.border}`,
    color: T.textPrimary, fontSize: 14, outline: 'none',
    boxSizing: 'border-box' as const, transition: 'border-color 0.15s',
    fontFamily: "'Inter', system-ui",
};

const labelStyle = {
    display: 'block', fontSize: 10, fontWeight: 800 as const,
    textTransform: 'uppercase' as const, letterSpacing: '0.12em',
    color: T.textLabel, marginBottom: 6,
};

function StepIndicator({ current, total }: { current: number; total: number }) {
    return (
        <div style={{display: 'flex',gap: 8,alignItems: 'center',marginBottom: 24 }}>
            {Array.from({ length: total }).map((_, i) => {
                const step = i + 1;
                const active = step === current;
                const completed = step < current;
                return (
                    <React.Fragment key={step}>
                        <div style={{width: 32,height: 32,borderRadius: '50%',display: 'flex',alignItems: 'center',justifyContent: 'center',background: completed ? T.green : active ? T.gold : T.bgCard,border: `2px solid ${completed ? T.green : active ? T.gold : T.border}`,color: completed || active ? '#0a0f16' : T.textSecondary,fontSize: 13,fontWeight: 900,transition: 'all 0.2s'}}>
                            {completed ? 'âœ“' : step}
                        </div>
                        {i < total - 1 && (
                            <div style={{flex: 1,height: 2,borderRadius: 1,background: completed ? T.green : T.border,transition: 'background 0.2s'}} />
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}

function TagSelector({ items, selected, onToggle, color }: {
    items: string[];
    selected: string[];
    onToggle: (item: string) => void;
    color: string;
}) {
    return (
        <div style={{display: 'flex',gap: 6,flexWrap: 'wrap' }}>
            {items.map(item => {
                const active = selected.includes(item);
                return (
                    <button aria-label="Interactive Button" key={item} onClick={() => onToggle(item)} style={{padding: '5px 12px',borderRadius: 8,fontSize: 11,fontWeight: 700,background: active ? `${color}18` : 'rgba(255,255,255,0.04)',border: `1px solid ${active ? `${color}45` : T.border}`,color: active ? color : T.textSecondary,cursor: 'pointer',transition: 'all 0.15s'}}>
                        {item}
                    </button>
                );
            })}
        </div>
    );
}

export default function CampaignCreatePage() {
    const router = useRouter();
    const [step, setStep] = useState<Step>(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState<CampaignForm>({
        campaign_name: '',
        budget: '',
        daily_cap: '',
        start_date: '',
        end_date: '',
        roles: [],
        jurisdictions: [],
        corridors: [],
        headline: '',
        body: '',
        cta_text: 'Learn More',
        cta_url: '',
        image_url: '',
        creative_type: 'native',
    });

    const updateField = useCallback((field: keyof CampaignForm, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }));
    }, []);

    const toggleArrayItem = useCallback((field: 'roles' | 'jurisdictions' | 'corridors', item: string) => {
        setForm(prev => ({
            ...prev,
            [field]: prev[field].includes(item)
                ? prev[field].filter(i => i !== item)
                : [...prev[field], item],
        }));
    }, []);

    const canAdvance = step === 1
        ? form.campaign_name && form.budget && form.daily_cap
        : step === 2
            ? true // targeting is optional
            : form.headline && form.cta_url;

    const handleSubmit = useCallback(async () => {
        setSubmitting(true);
        setError(null);

        const budgetCents = Math.round(parseFloat(form.budget || '0') * 100);
        const dailyCapCents = Math.round(parseFloat(form.daily_cap || '0') * 100);

        // 1. Create campaign
        const { data: campaign, error: campErr } = await supabase
            .from('ad_campaigns')
            .insert({
                campaign_name: form.campaign_name,
                budget_cents: budgetCents,
                daily_cap_cents: dailyCapCents,
                targeting: {
                    ...(form.roles.length > 0 && { roles: form.roles }),
                    ...(form.jurisdictions.length > 0 && { jurisdictions: form.jurisdictions }),
                    ...(form.corridors.length > 0 && { corridors: form.corridors }),
                },
                status: 'draft',
                start_date: form.start_date || null,
                end_date: form.end_date || null,
            })
            .select()
            .single();

        if (campErr || !campaign) {
            setError(campErr?.message || 'Failed to create campaign');
            setSubmitting(false);
            return;
        }

        // 2. Create creative
        if (form.headline && form.cta_url) {
            const { error: creativeErr } = await supabase
                .from('ad_creatives')
                .insert({
                    campaign_id: campaign.id,
                    headline: form.headline,
                    body: form.body || null,
                    cta_text: form.cta_text || 'Learn More',
                    cta_url: form.cta_url,
                    image_url: form.image_url || null,
                    creative_type: form.creative_type || 'native',
                    status: 'active',
                });

            if (creativeErr) {
                setError(`Campaign created, but creative failed: ${creativeErr.message}`);
                setSubmitting(false);
                return;
            }
        }

        setSubmitting(false);
        router.push('/admin/ads');
    }, [form, router]);

    return (
        <div style={{background: T.bg,minHeight: '100vh' }}>
            <div style={{maxWidth: 640,margin: '0 auto',padding: '30px 20px 60px' }}>

                {/* Back link */}
                <a href="/admin/ads" style={{display: 'inline-flex',alignItems: 'center',gap: 6,fontSize: 12,color: T.textSecondary,textDecoration: 'none',marginBottom: 20,fontWeight: 600}}>
                    â† Back to Dashboard
                </a>

                <h1 style={{margin: '0 0 6px',fontSize: 26,fontWeight: 800,color: T.textPrimary,fontFamily: "var(--font-display, 'Space Grotesk', system-ui)"}}>
                    Create Campaign
                </h1>
                <p style={{margin: '0 0 24px',fontSize: 13,color: T.textSecondary }}>
                    Set up your ad campaign in 3 steps: details, targeting, and creative
                </p>

                <StepIndicator current={step} total={3} />

                {/* â”€â”€ STEP 1: Campaign Details â”€â”€ */}
                {step === 1 && (
                    <div style={{background: T.bgCard,border: `1px solid ${T.border}`,borderRadius: 16,padding: 24}}>
                        <h2 style={{margin: '0 0 20px',fontSize: 18,fontWeight: 800,color: T.textPrimary }}>
                            Campaign Details
                        </h2>

                        <div style={{marginBottom: 16 }}>
                            <label style={labelStyle}>Campaign Name *</label>
                            <input
                                value={form.campaign_name}
                                onChange={e => updateField('campaign_name', e.target.value)}
                                placeholder="e.g., Florida Corridor Spring Push"
                                style={inputStyle}
                            />
                        </div>

                        <div style={{display: 'grid',gridTemplateColumns: '1fr 1fr',gap: 12,marginBottom: 16 }}>
                            <div>
                                <label style={labelStyle}>Total Budget ($) *</label>
                                <input
                                    type="number" min="0" step="10"
                                    value={form.budget}
                                    onChange={e => updateField('budget', e.target.value)}
                                    placeholder="500"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Daily Cap ($) *</label>
                                <input
                                    type="number" min="0" step="5"
                                    value={form.daily_cap}
                                    onChange={e => updateField('daily_cap', e.target.value)}
                                    placeholder="25"
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={{display: 'grid',gridTemplateColumns: '1fr 1fr',gap: 12 }}>
                            <div>
                                <label style={labelStyle}>Start Date</label>
                                <input type="date" value={form.start_date}
                                    onChange={e => updateField('start_date', e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>End Date</label>
                                <input type="date" value={form.end_date}
                                    onChange={e => updateField('end_date', e.target.value)}
                                    style={inputStyle}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* â”€â”€ STEP 2: Targeting â”€â”€ */}
                {step === 2 && (
                    <div style={{background: T.bgCard,border: `1px solid ${T.border}`,borderRadius: 16,padding: 24}}>
                        <h2 style={{margin: '0 0 6px',fontSize: 18,fontWeight: 800,color: T.textPrimary }}>
                            Targeting
                        </h2>
                        <p style={{margin: '0 0 20px',fontSize: 12,color: T.textSecondary }}>
                            Optional â€” leave empty to target all users. Narrow down to increase relevance.
                        </p>

                        <div style={{marginBottom: 20 }}>
                            <label style={labelStyle}>User Roles</label>
                            <TagSelector
                                items={['broker', 'escort', 'operator', 'admin', 'carrier']}
                                selected={form.roles}
                                onToggle={item => toggleArrayItem('roles', item)}
                                color={T.purple}
                            />
                        </div>

                        <div style={{marginBottom: 20 }}>
                            <label style={labelStyle}>Jurisdictions</label>
                            <div style={{maxHeight: 200,overflowY: 'auto',padding: 4 }}>
                                <TagSelector
                                    items={US_STATES}
                                    selected={form.jurisdictions}
                                    onToggle={item => toggleArrayItem('jurisdictions', item)}
                                    color={T.blue}
                                />
                            </div>
                            {form.jurisdictions.length > 0 && (
                                <div style={{fontSize: 11,color: T.gold,marginTop: 6,fontWeight: 600 }}>
                                    {form.jurisdictions.length} jurisdiction{form.jurisdictions.length > 1 ? 's' : ''} selected
                                </div>
                            )}
                        </div>

                        <div>
                            <label style={labelStyle}>Corridors</label>
                            <TagSelector
                                items={CORRIDORS}
                                selected={form.corridors}
                                onToggle={item => toggleArrayItem('corridors', item)}
                                color={T.gold}
                            />
                        </div>
                    </div>
                )}

                {/* â”€â”€ STEP 3: Creative â”€â”€ */}
                {step === 3 && (
                    <div style={{background: T.bgCard,border: `1px solid ${T.border}`,borderRadius: 16,padding: 24}}>
                        <h2 style={{margin: '0 0 20px',fontSize: 18,fontWeight: 800,color: T.textPrimary }}>
                            Ad Creative
                        </h2>

                        <div style={{marginBottom: 16 }}>
                            <label style={labelStyle}>Headline *</label>
                            <input
                                value={form.headline}
                                onChange={e => updateField('headline', e.target.value)}
                                placeholder="e.g., Need Escort Coverage in FL?"
                                style={inputStyle}
                            />
                        </div>

                        <div style={{marginBottom: 16 }}>
                            <label style={labelStyle}>Body Text</label>
                            <textarea
                                value={form.body}
                                onChange={e => updateField('body', e.target.value)}
                                placeholder="Brief description of your service or offer..."
                                rows={3}
                                style={{ ...inputStyle,resize: 'vertical' as const }}
                            />
                        </div>

                        <div style={{display: 'grid',gridTemplateColumns: '1fr 1fr',gap: 12,marginBottom: 16 }}>
                            <div>
                                <label style={labelStyle}>CTA Button Text</label>
                                <input
                                    value={form.cta_text}
                                    onChange={e => updateField('cta_text', e.target.value)}
                                    placeholder="Learn More"
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Creative Type</label>
                                <select
                                    value={form.creative_type}
                                    onChange={e => updateField('creative_type', e.target.value)}
                                    style={{ ...inputStyle,cursor: 'pointer' }}
                                >
                                    <option value="native">Native Card</option>
                                    <option value="inline">Inline Row</option>
                                    <option value="sidebar">Sidebar</option>
                                    <option value="banner">Banner</option>
                                </select>
                            </div>
                        </div>

                        <div style={{marginBottom: 16 }}>
                            <label style={labelStyle}>Destination URL *</label>
                            <input
                                value={form.cta_url}
                                onChange={e => updateField('cta_url', e.target.value)}
                                placeholder="https://your-site.com/offer"
                                style={inputStyle}
                            />
                        </div>

                        <div style={{marginBottom: 16 }}>
                            <label style={labelStyle}>Image URL (optional)</label>
                            <input
                                value={form.image_url}
                                onChange={e => updateField('image_url', e.target.value)}
                                placeholder="https://..."
                                style={inputStyle}
                            />
                        </div>

                        {/* Live Preview */}
                        {form.headline && (
                            <div style={{marginTop: 20 }}>
                                <label style={labelStyle}>Ad Preview</label>
                                <div style={{padding: 16,borderRadius: 14,background: T.bgElevated,border: `1px solid ${T.border}`}}>
                                    <div style={{fontSize: 9,fontWeight: 800,color: T.textLabel,textTransform: 'uppercase',letterSpacing: '0.1em',marginBottom: 8 }}>
                                        Sponsored
                                    </div>
                                    {form.image_url && (
                                        <div style={{width: '100%',height: 120,borderRadius: 10,background: T.bgCard,marginBottom: 10,backgroundImage: `url(${form.image_url})`,backgroundSize: 'cover',backgroundPosition: 'center'}} />
                                    )}
                                    <div style={{fontSize: 15,fontWeight: 800,color: T.textPrimary,marginBottom: 4 }}>
                                        {form.headline}
                                    </div>
                                    {form.body && (
                                        <p style={{fontSize: 12,color: T.textSecondary,margin: '0 0 10px',lineHeight: 1.5 }}>
                                            {form.body}
                                        </p>
                                    )}
                                    <span style={{display: 'inline-block',padding: '6px 14px',borderRadius: 8,fontSize: 11,fontWeight: 800,background: `${T.gold}15`,color: T.gold,border: `1px solid ${T.gold}30`}}>
                                        {form.cta_text || 'Learn More'}
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{marginTop: 12,padding: '10px 14px',borderRadius: 10,background: 'rgba(248,113,113,0.1)',border: '1px solid rgba(248,113,113,0.3)',color: T.red,fontSize: 12,fontWeight: 600}}>
                        {error}
                    </div>
                )}

                {/* Navigation */}
                <div style={{display: 'flex',justifyContent: 'space-between',marginTop: 20,gap: 12 }}>
                    {step > 1 ? (
                        <button aria-label="Interactive Button" onClick={() => setStep((step - 1) as Step)} style={{padding: '11px 24px',borderRadius: 10,background: T.bgCard,border: `1px solid ${T.border}`,color: T.textBody,fontSize: 13,fontWeight: 700,cursor: 'pointer'}}>
                            â† Back
                        </button>
                    ) : <div />}

                    {step < 3 ? (
                        <button aria-label="Interactive Button"
                            onClick={() => setStep((step + 1) as Step)}
                            disabled={!canAdvance}
                            style={{padding: '11px 24px',borderRadius: 10,background: canAdvance ? `linear-gradient(135deg, ${T.gold}, #d97706)` : T.bgCard,color: canAdvance ? '#0a0f16' : T.textSecondary,fontSize: 13,fontWeight: 900,border: 'none',cursor: canAdvance ? 'pointer' : 'not-allowed',textTransform: 'uppercase',letterSpacing: '0.05em',opacity: canAdvance ? 1 : 0.5}}
                        >
                            Continue â†’
                        </button>
                    ) : (
                        <button aria-label="Interactive Button"
                            onClick={handleSubmit}
                            disabled={!canAdvance || submitting}
                            style={{padding: '11px 24px',borderRadius: 10,background: `linear-gradient(135deg, ${T.green}, #059669)`,color: '#fff',fontSize: 13,fontWeight: 900,border: 'none',cursor: submitting ? 'wait' : 'pointer',textTransform: 'uppercase',letterSpacing: '0.05em',boxShadow: `0 3px 16px rgba(39,209,127,0.28)`,opacity: submitting ? 0.7 : 1}}
                        >
                            {submitting ? 'Creatingâ€¦' : 'ðŸš€ Create Campaign'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}