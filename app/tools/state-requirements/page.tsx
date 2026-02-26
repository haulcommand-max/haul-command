'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import ToolsSidebar from "@/components/tools/ToolsSidebar";

// Free Tool #4 — State Requirements Cheatsheet
const STATES = [
    { code: 'TX', name: 'Texas', cert: true, heightPole: true, insurance: '$500K', escort1: '12\'', escort2: '16\'', night: 'Restricted', notes: 'TX pilot car certification required' },
    { code: 'FL', name: 'Florida', cert: true, heightPole: true, insurance: '$300K', escort1: '12\'', escort2: '14.6\'', night: 'Restricted', notes: 'FDOT permit required for each move' },
    { code: 'CA', name: 'California', cert: true, heightPole: true, insurance: '$1M', escort1: '12\'', escort2: '14\'', night: 'No', notes: 'Caltrans certification, no night superloads' },
    { code: 'OH', name: 'Ohio', cert: true, heightPole: true, insurance: '$500K', escort1: '12\'', escort2: '14\'', night: 'Some', notes: 'ODOT-approved pilot car operator course' },
    { code: 'PA', name: 'Pennsylvania', cert: true, heightPole: true, insurance: '$500K', escort1: '12\'', escort2: '16\'', night: 'No', notes: 'PennDOT escort rules, no superload night moves' },
    { code: 'GA', name: 'Georgia', cert: true, heightPole: true, insurance: '$500K', escort1: '12\'', escort2: '14\'', night: 'Restricted', notes: 'GDOT online certification accepted' },
    { code: 'IL', name: 'Illinois', cert: true, heightPole: true, insurance: '$500K', escort1: '12\'', escort2: '15\'', night: 'Some', notes: 'IDOT permit, special bridge restrictions' },
    { code: 'NY', name: 'New York', cert: false, heightPole: true, insurance: '$1M', escort1: '12\'', escort2: '14\'', night: 'Restricted', notes: 'No state cert but carrier standards apply' },
    { code: 'LA', name: 'Louisiana', cert: true, heightPole: true, insurance: '$500K', escort1: '12\'', escort2: '14\'', night: 'Restricted', notes: 'DOTD pilot vehicle operator cert' },
    { code: 'OK', name: 'Oklahoma', cert: true, heightPole: true, insurance: '$300K', escort1: '12\'', escort2: '14\'', night: 'Yes', notes: 'TX reciprocity accepted' },
    { code: 'MT', name: 'Montana', cert: false, heightPole: true, insurance: '$300K', escort1: '12\'', escort2: '16\'', night: 'Yes', notes: 'No state cert, wind turbine corridor' },
    { code: 'WA', name: 'Washington', cert: true, heightPole: true, insurance: '$500K', escort1: '12\'', escort2: '14\'', night: 'Restricted', notes: 'WSDOT pilot car certification' },
];

export default function StateRequirementsCheatsheet() {
    const [search, setSearch] = useState('');
    const [certFilter, setCertFilter] = useState<boolean | null>(null);

    const filtered = STATES.filter(s => {
        if (search && !`${s.code} ${s.name}`.toLowerCase().includes(search.toLowerCase())) return false;
        if (certFilter !== null && s.cert !== certFilter) return false;
        return true;
    });

    return (
        <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui", padding: '2rem 1rem' }}>
            <div style={{ maxWidth: 1000, margin: '0 auto' }}>
                <header style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ display: 'inline-flex', gap: 6, padding: '4px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 20, marginBottom: 12 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: 2 }}>📋 Free Tool</span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900, color: '#f9fafb' }}>State Requirements Cheatsheet</h1>
                    <p style={{ margin: '8px 0 0', fontSize: 13, color: '#6b7280' }}>Quick-reference guide to pilot car requirements across all states.</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                    <div>
                        {/* Filters */}
                        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                            <input type="text" placeholder="Search state..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#f9fafb', fontSize: 12, flex: 1, minWidth: 140, outline: 'none' }} />
                            {[
                                { label: 'All', val: null },
                                { label: 'Cert Required', val: true },
                                { label: 'No Cert', val: false },
                            ].map(f => (
                                <button key={f.label} onClick={() => setCertFilter(f.val)} style={{
                                    padding: '4px 14px', borderRadius: 8, fontSize: 10, fontWeight: 700, cursor: 'pointer',
                                    background: certFilter === f.val ? 'rgba(241,169,27,0.15)' : 'rgba(255,255,255,0.04)',
                                    border: `1px solid ${certFilter === f.val ? 'rgba(241,169,27,0.4)' : 'rgba(255,255,255,0.08)'}`,
                                    color: certFilter === f.val ? '#F1A91B' : '#6b7280',
                                }}>{f.label}</button>
                            ))}
                        </div>

                        {/* Table */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                        {['State', 'Cert', 'Height Pole', 'Insurance', '1 Escort @', '2 Escorts @', 'Night', 'Notes'].map(h => (
                                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 9, fontWeight: 800, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((s, i) => (
                                        <tr key={s.code} style={{ borderBottom: i < filtered.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                                            <td style={{ padding: '10px 12px' }}>
                                                <Link href={`/requirements/${s.code.toLowerCase()}/escort-vehicle-rules`} style={{ color: '#F1A91B', fontWeight: 700, textDecoration: 'none' }}>{s.code}</Link>
                                                <span style={{ color: '#6b7280', marginLeft: 6 }}>{s.name}</span>
                                            </td>
                                            <td style={{ padding: '10px 12px', color: s.cert ? '#10b981' : '#6b7280' }}>{s.cert ? '✅' : '❌'}</td>
                                            <td style={{ padding: '10px 12px', color: s.heightPole ? '#10b981' : '#6b7280' }}>{s.heightPole ? '✅' : '❌'}</td>
                                            <td style={{ padding: '10px 12px', color: '#d1d5db', fontFamily: 'JetBrains Mono' }}>{s.insurance}</td>
                                            <td style={{ padding: '10px 12px', color: '#f59e0b', fontWeight: 700 }}>{s.escort1}</td>
                                            <td style={{ padding: '10px 12px', color: '#ef4444', fontWeight: 700 }}>{s.escort2}</td>
                                            <td style={{ padding: '10px 12px', color: s.night === 'Yes' ? '#10b981' : s.night === 'No' ? '#ef4444' : '#f59e0b' }}>{s.night}</td>
                                            <td style={{ padding: '10px 12px', color: '#6b7280', fontSize: 11 }}>{s.notes}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div style={{ marginTop: 24, textAlign: 'center' }}>
                            <p style={{ fontSize: 11, color: '#4b5563', marginBottom: 12 }}>Data may not reflect latest changes. Always verify with the state DOT.</p>
                            <Link href="/tools" style={{ color: '#F1A91B', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>← Back to Free Tools</Link>
                        </div>
                    </div>
                    <aside><ToolsSidebar currentPath="/tools/state-requirements" /></aside>
                </div>
            </div>
        </div>
    );
}
