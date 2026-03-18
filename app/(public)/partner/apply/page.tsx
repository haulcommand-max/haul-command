'use client';

/**
 * Partner Application — Band C Rank 4
 * 
 * Application page for infrastructure partners, installers, upfitters,
 * support service providers, etc.
 * 
 * Partner types: installers, upfitters, radio shops, property hosts,
 * escort support, route specialists, equipment providers.
 */

import { useState } from 'react';
import Link from 'next/link';
import { MobileGate } from '@/components/mobile/MobileGate';
import { track } from '@/lib/telemetry';

const PARTNER_TYPES = [
    { key: 'installer', label: 'Installer / Radio Shop', icon: '🔧', desc: 'Warning lights, radios, equipment installation' },
    { key: 'upfitter', label: 'Equipment Upfitter', icon: '⚙️', desc: 'Vehicle upfitting and outfitting services' },
    { key: 'property_host', label: 'Property Host', icon: '🏗', desc: 'Staging yards, secure parking, meetup zones' },
    { key: 'escort_support', label: 'Escort Support', icon: '🚘', desc: 'Pilot car support, route planning, coordination' },
    { key: 'route_specialist', label: 'Route Specialist', icon: '🛣', desc: 'Route surveys, bridge checks, permit support' },
    { key: 'equipment_provider', label: 'Equipment Provider', icon: '📦', desc: 'Rental equipment, temporary signage, safety gear' },
    { key: 'truck_repair', label: 'Truck Repair', icon: '🔩', desc: 'Heavy duty repair and roadside service' },
];

export default function PartnerApplyPage() {
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: '', email: '', company: '', location: '', message: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        track('partner_application_submitted' as any, {
            metadata: { partner_type: selectedType, company: formData.company, location: formData.location },
        });
        setSubmitted(true);
    };

    const content = (
        <div style={{ minHeight: '100vh', background: '#060b12', color: '#f5f7fb' }}>
            <div style={{ padding: '48px 16px 80px', maxWidth: 700, margin: '0 auto' }}>
                {/* Header */}
                <Link href="/infrastructure" style={{
                    fontSize: 12, color: 'rgba(255,255,255,0.4)', textDecoration: 'none',
                    display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24,
                }}>
                    ← Back to Infrastructure
                </Link>

                <h1 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.03em', margin: '0 0 8px' }}>
                    Become a Partner
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, margin: '0 0 32px' }}>
                    Join the Haul Command support network. Get discovered by heavy haul carriers and operators on the routes that matter most.
                </p>

                {submitted ? (
                    <div style={{
                        padding: '40px 24px', borderRadius: 20, textAlign: 'center',
                        background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)',
                    }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#22C55E', marginBottom: 8 }}>
                            Application Received
                        </div>
                        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, maxWidth: 400, margin: '0 auto' }}>
                            We'll review your application and get back to you within 48 hours.
                            Vetted partners get priority placement on corridor and market pages.
                        </div>
                        <Link href="/" style={{
                            display: 'inline-flex', marginTop: 20, padding: '12px 24px', borderRadius: 12,
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            color: '#fff', fontWeight: 700, fontSize: 13, textDecoration: 'none',
                        }}>
                            Return to Home →
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        {/* Partner type selection */}
                        <div style={{ marginBottom: 24 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                                What type of partner are you?
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                                {PARTNER_TYPES.map(pt => (
                                    <button
                                        key={pt.key}
                                        type="button"
                                        onClick={() => setSelectedType(pt.key)}
                                        style={{
                                            padding: '12px', borderRadius: 12, textAlign: 'left',
                                            background: selectedType === pt.key ? 'rgba(241,169,27,0.08)' : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${selectedType === pt.key ? 'rgba(241,169,27,0.25)' : 'rgba(255,255,255,0.06)'}`,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <div style={{ fontSize: 18, marginBottom: 4 }}>{pt.icon}</div>
                                        <div style={{ fontSize: 12, fontWeight: 800, color: selectedType === pt.key ? '#F1A91B' : '#fff' }}>
                                            {pt.label}
                                        </div>
                                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                                            {pt.desc}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Form fields */}
                        {selectedType && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {[
                                    { key: 'name', label: 'Your Name', type: 'text', required: true },
                                    { key: 'email', label: 'Email', type: 'email', required: true },
                                    { key: 'company', label: 'Company / Business Name', type: 'text', required: true },
                                    { key: 'location', label: 'City, State', type: 'text', required: true },
                                ].map(field => (
                                    <div key={field.key}>
                                        <label style={{ fontSize: 11, fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>
                                            {field.label} {field.required && '*'}
                                        </label>
                                        <input
                                            type={field.type}
                                            required={field.required}
                                            value={(formData as any)[field.key]}
                                            onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                                            style={{
                                                width: '100%', padding: '12px 14px', borderRadius: 10,
                                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                                color: '#fff', fontSize: 14, outline: 'none',
                                            }}
                                        />
                                    </div>
                                ))}
                                <div>
                                    <label style={{ fontSize: 11, fontWeight: 700, color: '#888', display: 'block', marginBottom: 4 }}>
                                        Tell us about your services
                                    </label>
                                    <textarea
                                        value={formData.message}
                                        onChange={e => setFormData({ ...formData, message: e.target.value })}
                                        rows={4}
                                        style={{
                                            width: '100%', padding: '12px 14px', borderRadius: 10,
                                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                                            color: '#fff', fontSize: 14, outline: 'none', resize: 'vertical',
                                        }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    style={{
                                        width: '100%', padding: '14px 24px', borderRadius: 14,
                                        background: 'linear-gradient(135deg, #F1A91B, #f1c27b)',
                                        color: '#000', fontWeight: 900, fontSize: 15, border: 'none',
                                        cursor: 'pointer', marginTop: 8,
                                    }}
                                >
                                    Submit Application
                                </button>
                            </div>
                        )}
                    </form>
                )}
            </div>
        </div>
    );

    return <MobileGate mobile={content} desktop={content} />;
}
