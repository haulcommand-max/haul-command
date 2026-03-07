'use client';

import React, { useState } from 'react';

interface AdGridPartnerSignupProps {
    onComplete?: (partnerId: string) => void;
}

type PartnerType = 'advertiser' | 'affiliate' | 'sponsor' | 'equipment_vendor' | 'insurance' | 'training' | 'permit_service' | 'fuel_network';
type BillingMethod = 'cpc' | 'cpm' | 'cpa' | 'flat_monthly';

const PARTNER_TYPES: { value: PartnerType; label: string; icon: string; desc: string }[] = [
    { value: 'equipment_vendor', label: 'Equipment Vendor', icon: '🔧', desc: 'Height poles, amber lights, flags, escort equipment' },
    { value: 'insurance', label: 'Insurance Provider', icon: '🛡️', desc: 'Commercial auto, escort liability, cargo insurance' },
    { value: 'fuel_network', label: 'Fuel / Truck Stop', icon: '⛽', desc: 'Pilot/Flying J, Love\'s, TA, independent truck stops' },
    { value: 'training', label: 'Training / Certification', icon: '📚', desc: 'CDL schools, escort certification, safety courses' },
    { value: 'permit_service', label: 'Permit Service', icon: '📋', desc: 'Oversize permit expediting, state filings' },
    { value: 'sponsor', label: 'Corridor Sponsor', icon: '🏆', desc: 'Sponsor specific highway corridors or regions' },
    { value: 'advertiser', label: 'General Advertiser', icon: '📢', desc: 'Any business targeting the heavy haul industry' },
    { value: 'affiliate', label: 'Affiliate Partner', icon: '🤝', desc: 'Earn commissions on referred operators' },
];

const BILLING_METHODS: { value: BillingMethod; label: string; desc: string }[] = [
    { value: 'cpc', label: 'Cost Per Click', desc: 'Pay only when someone clicks your ad' },
    { value: 'cpm', label: 'Cost Per 1K Views', desc: 'Pay per 1,000 impressions shown' },
    { value: 'cpa', label: 'Cost Per Action', desc: 'Pay only when a conversion happens' },
    { value: 'flat_monthly', label: 'Flat Monthly', desc: 'Fixed monthly rate for guaranteed placement' },
];

export default function AdGridPartnerSignup({ onComplete }: AdGridPartnerSignupProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        company_name: '',
        contact_email: '',
        contact_phone: '',
        website_url: '',
        partner_type: '' as PartnerType,
        billing_method: 'cpc' as BillingMethod,
        monthly_budget_usd: 500,
        corridors: [] as string[],
        countries: ['US'] as string[],
    });

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/adgrid/partner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data.success) {
                setStep(4);
                onComplete?.(data.partner_id);
            }
        } catch {
            // Handle error
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="partner-signup">
            {/* Progress Bar */}
            <div className="progress-bar">
                {[1, 2, 3].map(s => (
                    <div key={s} className={`progress-step ${step >= s ? 'active' : ''}`}>
                        <div className="step-dot">{step > s ? '✓' : s}</div>
                        <span>{s === 1 ? 'Company' : s === 2 ? 'Ad Type' : 'Budget'}</span>
                    </div>
                ))}
            </div>

            {step === 1 && (
                <div className="step-content">
                    <h2>Partner with <span className="brand">HAUL COMMAND</span></h2>
                    <p className="step-desc">Reach 358,000+ pilot car & escort operators across 57 countries</p>

                    <div className="form-group">
                        <label>Company Name</label>
                        <input
                            type="text"
                            value={form.company_name}
                            onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
                            placeholder="Your company name"
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                value={form.contact_email}
                                onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))}
                                placeholder="partner@company.com"
                            />
                        </div>
                        <div className="form-group">
                            <label>Phone</label>
                            <input
                                type="tel"
                                value={form.contact_phone}
                                onChange={e => setForm(f => ({ ...f, contact_phone: e.target.value }))}
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Website</label>
                        <input
                            type="url"
                            value={form.website_url}
                            onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))}
                            placeholder="https://yourcompany.com"
                        />
                    </div>

                    <h3>What Type of Partner Are You?</h3>
                    <div className="type-grid">
                        {PARTNER_TYPES.map(t => (
                            <button
                                key={t.value}
                                className={`type-card ${form.partner_type === t.value ? 'selected' : ''}`}
                                onClick={() => setForm(f => ({ ...f, partner_type: t.value }))}
                            >
                                <span className="type-icon">{t.icon}</span>
                                <span className="type-label">{t.label}</span>
                                <span className="type-desc">{t.desc}</span>
                            </button>
                        ))}
                    </div>

                    <button className="next-btn" onClick={() => setStep(2)} disabled={!form.company_name || !form.contact_email || !form.partner_type}>
                        Next →
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="step-content">
                    <h2>Choose Your Billing Model</h2>
                    <div className="billing-grid">
                        {BILLING_METHODS.map(b => (
                            <button
                                key={b.value}
                                className={`billing-card ${form.billing_method === b.value ? 'selected' : ''}`}
                                onClick={() => setForm(f => ({ ...f, billing_method: b.value }))}
                            >
                                <span className="billing-label">{b.label}</span>
                                <span className="billing-desc">{b.desc}</span>
                            </button>
                        ))}
                    </div>
                    <div className="btn-row">
                        <button className="back-btn" onClick={() => setStep(1)}>← Back</button>
                        <button className="next-btn" onClick={() => setStep(3)}>Next →</button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="step-content">
                    <h2>Set Your Budget</h2>
                    <div className="budget-slider">
                        <label>Monthly Budget: <strong>${form.monthly_budget_usd.toLocaleString()}/mo</strong></label>
                        <input
                            type="range"
                            min={50}
                            max={10000}
                            step={50}
                            value={form.monthly_budget_usd}
                            onChange={e => setForm(f => ({ ...f, monthly_budget_usd: Number(e.target.value) }))}
                        />
                        <div className="budget-range">
                            <span>$50</span>
                            <span>$10,000</span>
                        </div>
                    </div>

                    <div className="estimate-box">
                        <h4>Estimated Reach</h4>
                        <div className="estimate-stats">
                            <div className="stat">
                                <span className="stat-value">{Math.round(form.monthly_budget_usd / 0.50).toLocaleString()}</span>
                                <span className="stat-label">Est. Clicks</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{Math.round(form.monthly_budget_usd / 0.50 * 20).toLocaleString()}</span>
                                <span className="stat-label">Est. Impressions</span>
                            </div>
                            <div className="stat">
                                <span className="stat-value">{Math.round(form.monthly_budget_usd / 0.50 * 0.03).toLocaleString()}</span>
                                <span className="stat-label">Est. Conversions</span>
                            </div>
                        </div>
                    </div>

                    <div className="btn-row">
                        <button className="back-btn" onClick={() => setStep(2)}>← Back</button>
                        <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'Creating Account...' : '🚀 Launch Campaign'}
                        </button>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="step-content success">
                    <div className="success-icon">🎉</div>
                    <h2>Welcome to AdGrid!</h2>
                    <p>Your partner account is pending review. You&apos;ll receive an email within 24 hours with access to your dashboard.</p>
                    <div className="success-features">
                        <div className="feature">📊 Real-time analytics</div>
                        <div className="feature">🎯 Corridor targeting</div>
                        <div className="feature">💰 Automated billing</div>
                        <div className="feature">🌍 57-country reach</div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .partner-signup {
                    max-width: 720px;
                    margin: 0 auto;
                    padding: 32px;
                    background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
                    border-radius: 20px;
                    border: 1px solid rgba(241,169,27,0.2);
                    color: #e0e0e0;
                }
                .progress-bar {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 32px;
                    position: relative;
                }
                .progress-bar::before {
                    content: '';
                    position: absolute;
                    top: 16px;
                    left: 10%;
                    right: 10%;
                    height: 2px;
                    background: rgba(255,255,255,0.1);
                }
                .progress-step {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 8px;
                    z-index: 1;
                }
                .step-dot {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: #222;
                    border: 2px solid #444;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 14px;
                    font-weight: 600;
                    transition: all 0.3s;
                }
                .progress-step.active .step-dot {
                    background: #F1A91B;
                    border-color: #F1A91B;
                    color: #000;
                }
                .progress-step span { font-size: 12px; color: #666; }
                .progress-step.active span { color: #F1A91B; }
                .brand { color: #F1A91B; }
                h2 { margin: 0 0 8px; font-size: 24px; color: #fff; }
                h3 { margin: 24px 0 12px; font-size: 16px; color: #ccc; }
                .step-desc { color: #888; margin: 0 0 24px; }
                .form-group {
                    margin-bottom: 16px;
                }
                .form-group label {
                    display: block;
                    font-size: 13px;
                    color: #999;
                    margin-bottom: 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .form-group input {
                    width: 100%;
                    padding: 12px 16px;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.15);
                    border-radius: 10px;
                    color: #fff;
                    font-size: 14px;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .form-group input:focus { border-color: #F1A91B; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                .type-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                    margin-bottom: 24px;
                }
                .type-card {
                    display: flex;
                    flex-direction: column;
                    align-items: flex-start;
                    padding: 14px;
                    background: rgba(255,255,255,0.04);
                    border: 2px solid transparent;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: left;
                    color: #ccc;
                }
                .type-card:hover { background: rgba(255,255,255,0.08); }
                .type-card.selected { border-color: #F1A91B; background: rgba(241,169,27,0.08); }
                .type-icon { font-size: 22px; margin-bottom: 4px; }
                .type-label { font-weight: 600; font-size: 14px; color: #fff; }
                .type-desc { font-size: 11px; color: #777; margin-top: 4px; }
                .billing-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 12px; margin-bottom: 24px; }
                .billing-card {
                    padding: 16px;
                    background: rgba(255,255,255,0.04);
                    border: 2px solid transparent;
                    border-radius: 12px;
                    cursor: pointer;
                    text-align: left;
                    color: #ccc;
                    transition: all 0.2s;
                }
                .billing-card.selected { border-color: #F1A91B; background: rgba(241,169,27,0.08); }
                .billing-label { display: block; font-weight: 600; color: #fff; font-size: 15px; }
                .billing-desc { display: block; font-size: 12px; color: #777; margin-top: 4px; }
                .budget-slider { margin-bottom: 24px; }
                .budget-slider label { font-size: 16px; color: #ccc; }
                .budget-slider strong { color: #F1A91B; font-size: 20px; }
                .budget-slider input[type="range"] { width: 100%; margin: 16px 0 4px; accent-color: #F1A91B; }
                .budget-range { display: flex; justify-content: space-between; font-size: 12px; color: #666; }
                .estimate-box {
                    background: rgba(241,169,27,0.05);
                    border: 1px solid rgba(241,169,27,0.2);
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 24px;
                }
                .estimate-box h4 { margin: 0 0 16px; color: #F1A91B; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
                .estimate-stats { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
                .stat { display: flex; flex-direction: column; align-items: center; }
                .stat-value { font-size: 24px; font-weight: 700; color: #fff; }
                .stat-label { font-size: 11px; color: #888; text-transform: uppercase; }
                .btn-row { display: flex; gap: 12px; }
                .next-btn, .submit-btn {
                    flex: 1;
                    padding: 14px;
                    background: linear-gradient(135deg, #F1A91B, #e09800);
                    border: none;
                    border-radius: 12px;
                    color: #000;
                    font-weight: 700;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .next-btn:disabled, .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .back-btn {
                    padding: 14px 24px;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.15);
                    border-radius: 12px;
                    color: #ccc;
                    cursor: pointer;
                    font-size: 14px;
                }
                .success { text-align: center; }
                .success-icon { font-size: 64px; margin-bottom: 16px; }
                .success-features {
                    display: grid;
                    grid-template-columns: repeat(2,1fr);
                    gap: 12px;
                    margin-top: 24px;
                }
                .feature {
                    padding: 14px;
                    background: rgba(255,255,255,0.04);
                    border-radius: 10px;
                    font-size: 14px;
                }
            `}</style>
        </div>
    );
}
