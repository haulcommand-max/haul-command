'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const categories = [
    {
        title: 'Insurance Partners',
        emoji: '🛡️',
        description: 'Commercial auto insurance designed for pilot car and escort vehicle operators.',
        items: [
            { name: 'Progressive Commercial', desc: 'Specialized oversize load escort policies', badge: 'Popular' },
            { name: 'National General', desc: 'Multi-state coverage with instant COI delivery', badge: 'Fast Quote' },
            { name: 'OOIDA', desc: 'Owner-operator insurance with escort endorsements', badge: 'Member Rate' },
        ],
        cta: 'Compare Insurance Quotes',
        color: '#10b981',
    },
    {
        title: 'Training & Certification',
        emoji: '📚',
        description: 'Get certified. Boost your leaderboard rank. Required in states like Florida (FAC 14-26).',
        items: [
            { name: 'Pilot Car Certification Course', desc: 'NPTCA-recognized, online, self-paced', badge: '$149' },
            { name: 'Defensive Driving for Escorts', desc: '8-hour course with certificate', badge: '$99' },
            { name: 'First Aid / CPR / AED', desc: 'Safety compliance, leaderboard bonus', badge: '$59' },
        ],
        cta: 'Browse Training',
        color: '#3b82f6',
    },
    {
        title: 'Equipment & Gear',
        emoji: '🚗',
        description: 'DOT-compliant signage, lights, flags, and height poles. All verified for escort use.',
        items: [
            { name: 'OVERSIZE LOAD Sign Kit', desc: 'Reflective, DOT-compliant, magnetic mount', badge: '$89' },
            { name: 'LED Arrow Board', desc: '15-lamp sequential, solar powered', badge: '$599' },
            { name: 'Height Measurement Pole', desc: 'Telescoping, 20ft range, digital readout', badge: '$349' },
        ],
        cta: 'Shop Equipment',
        color: '#f59e0b',
    },
    {
        title: 'Fuel & Maintenance',
        emoji: '⛽',
        description: 'Fuel card programs and maintenance networks for escort vehicle operators.',
        items: [
            { name: 'WEX Fleet Card', desc: '5¢/gal savings at 95% of US stations', badge: 'Top Choice' },
            { name: 'Tire Network', desc: 'Priority roadside service, 24/7', badge: 'Partnership' },
            { name: 'Maintenance Tracker', desc: 'Log vehicle maintenance, get reminders', badge: 'Free' },
        ],
        cta: 'Get Fuel Card',
        color: '#a855f7',
    },
];

export default function MarketplacePage() {
    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui, sans-serif", padding: '2.5rem 1rem' }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <motion.div initial="hidden" animate="visible" variants={fadeUp} style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'rgba(241,169,27,0.08)', border: '1px solid rgba(241,169,27,0.2)', borderRadius: 20, marginBottom: 16 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: 2 }}>Marketplace</span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: 36, fontWeight: 900, color: '#f9fafb', letterSpacing: -1 }}>
                        Everything You Need to Run
                    </h1>
                    <p style={{ margin: '8px 0 0', fontSize: 15, color: '#6b7280' }}>
                        Insurance, training, equipment, and fuel — curated for escort operators.
                    </p>
                </motion.div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {categories.map((cat, ci) => (
                        <motion.div key={cat.title} custom={ci} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                            <div style={{
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                                borderRadius: 20, padding: '1.75rem', overflow: 'hidden',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                                    <span style={{ fontSize: 28 }}>{cat.emoji}</span>
                                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#f9fafb' }}>{cat.title}</h2>
                                </div>
                                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280' }}>{cat.description}</p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                                    {cat.items.map(item => (
                                        <div key={item.name} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '12px 16px', borderRadius: 12,
                                            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)',
                                        }}>
                                            <div>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: '#d1d5db' }}>{item.name}</div>
                                                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{item.desc}</div>
                                            </div>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700,
                                                background: `${cat.color}15`, color: cat.color,
                                                border: `1px solid ${cat.color}25`, whiteSpace: 'nowrap',
                                            }}>{item.badge}</span>
                                        </div>
                                    ))}
                                </div>

                                <button style={{
                                    width: '100%', padding: '10px', borderRadius: 10, border: `1px solid ${cat.color}30`,
                                    background: `${cat.color}10`, color: cat.color, fontSize: 12, fontWeight: 700,
                                    cursor: 'pointer', transition: 'all 0.2s', textTransform: 'uppercase', letterSpacing: 0.5,
                                }}>
                                    {cat.cta} →
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
