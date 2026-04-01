import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, MessageSquare, Shield, MapPin, Clock, ArrowRight } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Contact Us | Haul Command',
    description: 'Get in touch with the Haul Command team. Support for operators, brokers, and shippers. Listing management, billing questions, and partnership inquiries.',
    alternates: { canonical: 'https://haulcommand.com/contact' },
};

const CONTACT_OPTIONS = [
    {
        icon: Mail,
        title: 'General Support',
        description: 'Questions about your account, listings, or the platform.',
        action: 'support@haulcommand.com',
        href: 'mailto:support@haulcommand.com',
        cta: 'Send Email',
    },
    {
        icon: Shield,
        title: 'Listing Management',
        description: 'Claim, update, or request removal of a directory listing.',
        action: '/remove-listing',
        href: '/remove-listing',
        cta: 'Manage Listing',
    },
    {
        icon: MessageSquare,
        title: 'Partnerships & Enterprise',
        description: 'TMS integrations, API access, white-label, or large-fleet onboarding.',
        action: 'partnerships@haulcommand.com',
        href: 'mailto:partnerships@haulcommand.com',
        cta: 'Get in Touch',
    },
];

const FAQ = [
    { q: 'How do I claim my listing?', a: 'Visit the claim page, enter your phone number, and verify via SMS. You\'ll instantly gain control of your operator profile.', link: '/claim' },
    { q: 'How do I remove my listing?', a: 'Go to the listing management page and submit a removal request. We process requests within 24 hours.', link: '/remove-listing' },
    { q: 'Is Haul Command free for operators?', a: 'Yes. Claiming your profile, appearing in the directory, and receiving load alerts are permanently free.' },
    { q: 'How do I post a load?', a: 'Sign in and navigate to the Load Board. You\'ll need an account to post loads and initiate escrow payments.', link: '/loads' },
];

export default function ContactPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>
            {/* Hero */}
            <section style={{ padding: '4rem 1rem 2rem', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
                <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center', padding: '4px 14px', background: 'rgba(241,169,27,0.08)', border: '1px solid rgba(241,169,27,0.2)', borderRadius: 20, marginBottom: 16 }}>
                    <Mail style={{ width: 12, height: 12, color: '#F1A91B' }} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: 2 }}>Contact</span>
                </div>
                <h1 style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 900, color: '#f9fafb' }}>
                    How Can We Help?
                </h1>
                <p style={{ fontSize: 15, color: '#6b7280', maxWidth: 520, margin: '0 auto' }}>
                    Whether you're an operator, broker, or shipper — our team is here. Most inquiries are answered within 4 business hours.
                </p>
            </section>

            {/* Contact options grid */}
            <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 1rem 3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                {CONTACT_OPTIONS.map((opt) => (
                    <div key={opt.title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '1.5rem' }}>
                        <opt.icon style={{ width: 20, height: 20, color: '#F1A91B', marginBottom: 12 }} />
                        <h2 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#f9fafb' }}>{opt.title}</h2>
                        <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16, lineHeight: 1.5 }}>{opt.description}</p>
                        <Link
                            href={opt.href}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '8px 18px', background: 'linear-gradient(135deg, #F1A91B, #d97706)',
                                color: '#000', fontSize: 12, fontWeight: 800, borderRadius: 8,
                                textDecoration: 'none', textTransform: 'uppercase', letterSpacing: 1,
                            }}
                        >
                            {opt.cta} <ArrowRight style={{ width: 12, height: 12 }} />
                        </Link>
                    </div>
                ))}
            </section>

            {/* Response times */}
            <section style={{ maxWidth: 900, margin: '0 auto', padding: '0 1rem 3rem' }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {[
                        { icon: Clock, label: 'Avg. Response', value: '< 4 hours' },
                        { icon: MapPin, label: 'Coverage', value: '50 US States + Canada' },
                        { icon: Shield, label: 'Listing Removals', value: '< 24 hours' },
                    ].map((stat) => (
                        <div key={stat.label} style={{ flex: '1 1 200px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12, padding: '1rem', textAlign: 'center' }}>
                            <stat.icon style={{ width: 16, height: 16, color: '#5A6577', margin: '0 auto 8px' }} />
                            <div style={{ fontSize: 20, fontWeight: 900, color: '#F1A91B', fontFamily: "'JetBrains Mono', monospace" }}>{stat.value}</div>
                            <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 1, marginTop: 4 }}>{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <section style={{ maxWidth: 720, margin: '0 auto', padding: '0 1rem 4rem' }}>
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#f9fafb', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1 }}>Frequently Asked</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {FAQ.map((item) => (
                        <div key={item.q} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '1rem' }}>
                            <h3 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: '#d1d5db' }}>{item.q}</h3>
                            <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{item.a}</p>
                            {item.link && (
                                <Link href={item.link} style={{ display: 'inline-block', marginTop: 8, fontSize: 12, color: '#F1A91B', textDecoration: 'none', fontWeight: 700 }}>
                                    Go → 
                                </Link>
                            )}
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
