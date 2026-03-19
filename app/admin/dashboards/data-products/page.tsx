'use client';

/**
 * ADMIN DATA PRODUCTS DASHBOARD
 *
 * Shows data product sales, access patterns, and revenue.
 */

import { useState, useEffect } from 'react';
import { DATA_PRODUCT_CATALOG } from '@/lib/monetization/data-product-engine';

export default function DataProductsDashboard() {
    const products = DATA_PRODUCT_CATALOG;

    return (
        <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
            <h1 style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Data Products</h1>
            <p style={{ fontSize: 12, color: '#888', marginBottom: 24 }}>Self-serve data monetization • Product catalog • Sales</p>

            {/* Catalog */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
                {products.map(p => (
                    <div key={p.id} style={{
                        padding: '20px', borderRadius: 16,
                        border: '1px solid rgba(255,255,255,0.06)',
                        background: 'rgba(255,255,255,0.02)',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{p.name}</div>
                            <span style={{
                                fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                background: p.active ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.05)',
                                color: p.active ? '#22C55E' : '#888',
                            }}>{p.active ? 'ACTIVE' : 'DRAFT'}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#888', marginTop: 6, lineHeight: 1.5 }}>{p.description}</div>

                        <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.04)',
                        }}>
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 900, color: '#F1A91B' }}>
                                    {p.price_usd === 0 ? 'Free*' : `$${p.price_usd}`}
                                    {p.purchase_type === 'subscription' && <span style={{ fontSize: 11, color: '#888' }}>/mo</span>}
                                </div>
                                <div style={{ fontSize: 9, color: '#888', marginTop: 2, textTransform: 'uppercase' }}>{p.purchase_type}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{
                                    fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
                                    background: 'rgba(59,130,246,0.1)', color: '#3B82F6',
                                    textTransform: 'uppercase',
                                }}>
                                    {p.tier_required}
                                </div>
                                <div style={{ fontSize: 9, color: '#888', marginTop: 4 }}>
                                    {p.country_scope.includes('ALL') ? 'All countries' : `${p.country_scope.length} countries`}
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: 12, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {p.full_fields.slice(0, 5).map(f => (
                                <span key={f} style={{
                                    fontSize: 8, padding: '2px 6px', borderRadius: 4,
                                    background: 'rgba(255,255,255,0.04)', color: '#888',
                                }}>{f}</span>
                            ))}
                            {p.full_fields.length > 5 && (
                                <span style={{ fontSize: 8, color: '#888' }}>+{p.full_fields.length - 5} more</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
