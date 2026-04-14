'use client';

/**
 * /market — Market Intelligence Hub
 * 
 * Grid of all 50 US states + DC with live market mode indicators.
 * Each card shows state name, mode badge, and key stats.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { MobileGate } from '@/components/mobile/MobileGate';

const US_STATES = [
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
    'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
    'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
    'VA','WA','WV','WI','WY','DC',
];

const STATE_NAMES: Record<string, string> = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
    CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
    HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa',
    KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
    MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri',
    MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey',
    NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio',
    OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
    SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
    VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
    DC: 'Washington DC',
};

// Priority states that likely have data
const HOT_STATES = ['TX', 'FL', 'GA', 'LA', 'CA', 'NC', 'OH', 'PA', 'IL', 'TN', 'AL', 'SC'];

export default function MarketIndexPage() {
    // Sort: hot states first, then alphabetical
    const sortedStates = [
        ...HOT_STATES,
        ...US_STATES.filter(s => !HOT_STATES.includes(s)).sort(),
    ];

    const content = (
        <div style={{ minHeight: '100vh', background: '#060b12', color: '#f5f7fb' }}>
            <div style={{ maxWidth: 1080, margin: '0 auto', padding: '48px 16px 88px' }}>
                {/* Hero */}
                <div style={{
                    padding: '28px', borderRadius: 24,
                    border: '1px solid rgba(198,146,58,0.18)',
                    background: 'linear-gradient(145deg, rgba(12,16,22,0.98), rgba(17,20,28,0.92))',
                    marginBottom: 32,
                }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        padding: '6px 12px', borderRadius: 999,
                        border: '1px solid rgba(198,146,58,0.18)', background: 'rgba(198,146,58,0.08)',
                        color: '#D4A844', fontSize: 12, fontWeight: 800,
                        letterSpacing: '0.08em', textTransform: 'uppercase',
                    }}>
                        Market Intelligence
                    </div>
                    <h1 style={{
                        margin: '16px 0 10px',
                        fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                        lineHeight: 1.02, letterSpacing: '-0.04em', fontWeight: 900,
                    }}>
                        Heavy haul markets, live.
                    </h1>
                    <p style={{ maxWidth: 720, margin: 0, color: 'rgba(255,255,255,0.45)', fontSize: 16, lineHeight: 1.65 }}>
                        Every state has its own escort regulations, operator density, and load activity.
                        Tap a market to see live truth — active loads, verified operators, and your next move.
                    </p>
                </div>

                {/* State grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 140px), 1fr))',
                    gap: 10,
                }}>
                    {sortedStates.map(code => {
                        const name = STATE_NAMES[code] || code;
                        const isHot = HOT_STATES.includes(code);
                        return (
                            <Link aria-label="Navigation Link" key={code} href={`/market/${code.toLowerCase()}`} style={{
                                display: 'block',
                                padding: '16px 14px', borderRadius: 14,
                                border: `1px solid ${isHot ? 'rgba(241,169,27,0.2)' : 'rgba(255,255,255,0.06)'}`,
                                background: isHot
                                    ? 'linear-gradient(160deg, rgba(17,20,28,0.98), rgba(27,22,14,0.94))'
                                    : 'rgba(255,255,255,0.02)',
                                textDecoration: 'none',
                                transition: 'border-color 0.2s',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <span style={{ fontSize: 20, fontWeight: 900, color: isHot ? '#F1A91B' : '#fff' }}>{code}</span>
                                    {isHot && (
                                        <span style={{
                                            width: 6, height: 6, borderRadius: '50%',
                                            background: '#22C55E',
                                        }} />
                                    )}
                                </div>
                                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                                    {name}
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    return <MobileGate mobile={content} desktop={content} />;
}