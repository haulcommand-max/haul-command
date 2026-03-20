'use client';

/**
 * DATA MARKETPLACE — Public Self-Service Buyer Flow
 *
 * Public-facing catalog of data products with:
 * - Product cards with teaser data
 * - Blurred sample previews
 * - Stripe checkout "Unlock" flow
 * - Download/API key delivery after purchase
 */

import { useState } from 'react';
import { DATA_PRODUCT_CATALOG, DataProduct } from '@/lib/monetization/data-product-engine';
import { Lock, Unlock, Download, Key, BarChart2, Map, TrendingUp, Shield, FileText, Zap, Globe, Eye } from 'lucide-react';

const PRODUCT_ICONS: Record<string, React.ReactNode> = {
    'corridor-snapshot': <TrendingUp size={20} />,
    'market-report': <BarChart2 size={20} />,
    'rate-benchmark': <FileText size={20} />,
    'competitor-tracking': <Eye size={20} />,
    'claim-gap-report': <Map size={20} />,
    'csv-export': <Download size={20} />,
    'api-access': <Key size={20} />,
    'alert-subscription': <Zap size={20} />,
    'corridor-intelligence-feed': <TrendingUp size={20} />,
    'operator-density-map': <Map size={20} />,
    'rate-benchmarks-by-country': <Globe size={20} />,
};

const FORMAT_LABELS: Record<string, string> = {
    'corridor-snapshot': 'JSON / Dashboard',
    'market-report': 'PDF / JSON',
    'rate-benchmark': 'CSV / JSON',
    'competitor-tracking': 'Dashboard / API',
    'claim-gap-report': 'CSV / Dashboard',
    'csv-export': 'CSV / Excel',
    'api-access': 'REST API',
    'alert-subscription': 'Push / Email / SMS',
    'corridor-intelligence-feed': 'Weekly CSV / API',
    'operator-density-map': 'GeoJSON / CSV',
    'rate-benchmarks-by-country': 'CSV / JSON',
};

// Sample preview data (blurred/teased)
const SAMPLE_PREVIEWS: Record<string, { headers: string[]; rows: string[][] }> = {
    'corridor-snapshot': {
        headers: ['Corridor', 'Demand Score', 'Fill Rate', 'Avg Rate'],
        rows: [
            ['Houston → Dallas', '87', '72%', '$3.20/mi'],
            ['Atlanta → Nashville', '●●●', '●●●', '●●●●●'],
            ['Phoenix → LA', '●●●', '●●●', '●●●●●'],
        ],
    },
    'rate-benchmark': {
        headers: ['Route', 'P25', 'P50 (Median)', 'P75'],
        rows: [
            ['TX → OK', '$2.10', '$2.85', '$3.40'],
            ['CA → NV', '●●●●', '●●●●', '●●●●'],
            ['FL → GA', '●●●●', '●●●●', '●●●●'],
        ],
    },
    'market-report': {
        headers: ['Market', 'Score', 'Operators', 'Growth'],
        rows: [
            ['Houston, TX', '8.2/10', '142', '+12%'],
            ['Dallas, TX', '●●●', '●●●', '●●●'],
            ['Phoenix, AZ', '●●●', '●●●', '●●●'],
        ],
    },
};

export default function DataMarketplacePage() {
    const [selectedProduct, setSelectedProduct] = useState<DataProduct | null>(null);
    const [purchasing, setPurchasing] = useState(false);
    const [previewProduct, setPreviewProduct] = useState<DataProduct | null>(null);
    const activeProducts = DATA_PRODUCT_CATALOG.filter(p => p.active);

    const handleUnlock = async (product: DataProduct) => {
        setPurchasing(true);
        try {
            // Map product catalog IDs to API SKUs
            const skuMap: Record<string, string> = {
                'corridor-snapshot': 'operations_optimizer',
                'rate-benchmark': 'pricing_intelligence',
                'market-report': 'pricing_intelligence',
                'competitor-tracking': 'risk_command',
                'claim-gap-report': 'operations_optimizer',
                'csv-export': 'operations_optimizer',
                'api-access': 'enterprise_full_signal',
                'alert-subscription': 'risk_command',
                'corridor-intelligence-feed': 'pricing_intelligence',
                'operator-density-map': 'operations_optimizer',
                'rate-benchmarks-by-country': 'pricing_intelligence',
            };
            const sku = skuMap[product.id] || 'pricing_intelligence';

            const res = await fetch('/api/data/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sku,
                    email: 'buyer@haulcommand.com', // Will be replaced with auth user email
                    country_code: 'US',
                }),
            });
            const data = await res.json();
            if (data.checkout_url) {
                window.location.href = data.checkout_url;
            } else if (data.error) {
                // If auth required, redirect to login
                window.location.href = '/login?redirect=/data';
            }
        } catch (e) {
            console.error('Checkout error:', e);
            window.location.href = '/login?redirect=/data';
        } finally {
            setPurchasing(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--hc-bg, #0B0B0C)',
            fontFamily: "var(--font-body, 'Inter', sans-serif)",
            color: '#F3F4F6',
        }}>
            {/* Hero */}
            <div style={{
                padding: '60px 24px 40px',
                textAlign: 'center',
                maxWidth: 800,
                margin: '0 auto',
            }}>
                <div style={{
                    fontSize: 10, fontWeight: 800, letterSpacing: '0.2em',
                    color: '#C6923A', textTransform: 'uppercase', marginBottom: 12,
                }}>DATA MARKETPLACE</div>
                <h1 style={{
                    fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 900,
                    fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
                    lineHeight: 1.1, margin: '0 0 16px',
                    background: 'linear-gradient(135deg, #F3F4F6 0%, #C6923A 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>Heavy Haul Intelligence, Unlocked</h1>
                <p style={{ fontSize: 15, color: '#888', lineHeight: 1.6, maxWidth: 560, margin: '0 auto' }}>
                    Corridor demand, rate benchmarks, operator density, and market reports.
                    Preview free. Unlock the full data with one click.
                </p>
            </div>

            {/* Product Grid */}
            <div className="ag-stagger" style={{
                maxWidth: 1200, margin: '0 auto', padding: '0 24px 60px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: 16,
            }}>
                {activeProducts.map(product => {
                    const preview = SAMPLE_PREVIEWS[product.id];
                    const format = FORMAT_LABELS[product.id] || 'JSON';
                    const icon = PRODUCT_ICONS[product.id] || <FileText size={20} />;

                    return (
                        <div key={product.id} className="ag-card-hover ag-slide-up" style={{
                            borderRadius: 16, overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.06)',
                            background: 'var(--hc-surface, #111214)',
                        }}>
                            {/* Header */}
                            <div style={{ padding: '20px 20px 0' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: 10,
                                        background: 'rgba(198,146,58,0.1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        color: '#C6923A',
                                    }}>{icon}</div>
                                    <div>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{product.name}</div>
                                        <div style={{ fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                            {format} • {product.refresh_frequency}
                                        </div>
                                    </div>
                                </div>
                                <p style={{ fontSize: 12, color: '#888', lineHeight: 1.5, margin: '0 0 14px' }}>
                                    {product.description}
                                </p>
                            </div>

                            {/* Sample Data Preview (blurred for locked fields) */}
                            {preview && (
                                <div style={{ padding: '0 20px', marginBottom: 14 }}>
                                    <div style={{
                                        borderRadius: 10, overflow: 'hidden',
                                        border: '1px solid rgba(255,255,255,0.04)',
                                        fontSize: 10,
                                    }}>
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: `repeat(${preview.headers.length}, 1fr)`,
                                            background: 'rgba(255,255,255,0.03)',
                                            padding: '6px 10px',
                                            fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '0.03em',
                                        }}>
                                            {preview.headers.map(h => <div key={h}>{h}</div>)}
                                        </div>
                                        {preview.rows.map((row, ri) => (
                                            <div key={ri} style={{
                                                display: 'grid',
                                                gridTemplateColumns: `repeat(${preview.headers.length}, 1fr)`,
                                                padding: '5px 10px',
                                                borderTop: '1px solid rgba(255,255,255,0.03)',
                                                color: row.some(c => c.includes('●')) ? '#444' : '#ccc',
                                                filter: row.some(c => c.includes('●')) ? 'blur(3px)' : 'none',
                                            }}>
                                                {row.map((cell, ci) => <div key={ci}>{cell}</div>)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Fields */}
                            <div style={{ padding: '0 20px', marginBottom: 14 }}>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    {product.full_fields.slice(0, 4).map(f => (
                                        <span key={f} style={{
                                            fontSize: 9, padding: '2px 6px', borderRadius: 4,
                                            background: 'rgba(255,255,255,0.04)', color: '#666',
                                        }}>{f}</span>
                                    ))}
                                    {product.full_fields.length > 4 && (
                                        <span style={{ fontSize: 9, color: '#555' }}>+{product.full_fields.length - 4} fields</span>
                                    )}
                                </div>
                            </div>

                            {/* Footer — Price + CTA */}
                            <div style={{
                                padding: '14px 20px',
                                borderTop: '1px solid rgba(255,255,255,0.04)',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                background: 'rgba(255,255,255,0.01)',
                            }}>
                                <div>
                                    <div style={{ fontSize: 24, fontWeight: 900, color: '#C6923A' }}>
                                        {product.price_usd === 0 ? 'Free' : `$${product.price_usd}`}
                                        {product.purchase_type === 'subscription' && <span style={{ fontSize: 12, color: '#888', fontWeight: 400 }}>/mo</span>}
                                    </div>
                                    <div style={{ fontSize: 9, color: '#888', textTransform: 'uppercase' }}>
                                        {product.country_scope.includes('ALL') ? '57 countries' : `${product.country_scope.length} countries`}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setPreviewProduct(product)}
                                    className="ag-press"
                                    style={{
                                        padding: '10px 16px', borderRadius: 10,
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.04)',
                                        color: '#aaa', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 4,
                                    }}
                                >
                                    <Eye size={13} /> Preview
                                </button>
                                <button
                                    onClick={() => handleUnlock(product)}
                                    disabled={purchasing}
                                    className="ag-press"
                                    style={{
                                        padding: '10px 20px', borderRadius: 10, border: 'none',
                                        background: 'linear-gradient(135deg, #C6923A 0%, #8A6428 100%)',
                                        color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', gap: 6,
                                        opacity: purchasing ? 0.5 : 1,
                                        transition: 'all 0.15s',
                                    }}
                                >
                                    <Lock size={13} />
                                    {product.price_usd === 0 ? 'Access' : 'Unlock'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
            {/* Preview Modal */}
            {previewProduct && (
                <div
                    onClick={() => setPreviewProduct(null)}
                    style={{
                        position: 'fixed', inset: 0, zIndex: 9999,
                        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: 20,
                    }}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="ag-slide-up"
                        style={{
                            background: 'var(--hc-surface, #111214)',
                            border: '1px solid rgba(198,146,58,0.3)',
                            borderRadius: 20, maxWidth: 560, width: '100%',
                            padding: '28px 24px', maxHeight: '80vh', overflowY: 'auto',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <div style={{
                                width: 36, height: 36, borderRadius: 10,
                                background: 'rgba(198,146,58,0.1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#C6923A',
                            }}>{PRODUCT_ICONS[previewProduct.id] || <FileText size={20} />}</div>
                            <div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{previewProduct.name}</div>
                                <div style={{ fontSize: 11, color: '#888' }}>Sample Data Preview</div>
                            </div>
                        </div>

                        {/* Preview table */}
                        <div style={{
                            borderRadius: 12, overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.06)',
                            marginBottom: 20,
                        }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${previewProduct.full_fields.slice(0, 5).length}, 1fr)`,
                                background: 'rgba(255,255,255,0.03)',
                                padding: '8px 12px', gap: 8,
                                fontSize: 10, fontWeight: 700, color: '#C6923A',
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>
                                {previewProduct.full_fields.slice(0, 5).map(h => <div key={h}>{h}</div>)}
                            </div>
                            {/* Row 1 - visible */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${Math.min(previewProduct.full_fields.length, 5)}, 1fr)`,
                                padding: '8px 12px', gap: 8,
                                borderTop: '1px solid rgba(255,255,255,0.04)',
                                fontSize: 11, color: '#ccc',
                            }}>
                                {previewProduct.full_fields.slice(0, 5).map((_, ci) => (
                                    <div key={ci}>{ci === 0 ? 'Houston → Dallas' : ci === 1 ? '87' : ci === 2 ? '72%' : ci === 3 ? '$3.20' : '142'}</div>
                                ))}
                            </div>
                            {/* Row 2 - blurred */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${Math.min(previewProduct.full_fields.length, 5)}, 1fr)`,
                                padding: '8px 12px', gap: 8,
                                borderTop: '1px solid rgba(255,255,255,0.04)',
                                fontSize: 11, color: '#666', filter: 'blur(3px)',
                            }}>
                                {previewProduct.full_fields.slice(0, 5).map((_, ci) => (
                                    <div key={ci}>{ci === 0 ? 'Atlanta → Nashville' : ci === 1 ? '91' : ci === 2 ? '63%' : ci === 3 ? '$2.95' : '89'}</div>
                                ))}
                            </div>
                            {/* Row 3 - blurred */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: `repeat(${Math.min(previewProduct.full_fields.length, 5)}, 1fr)`,
                                padding: '8px 12px', gap: 8,
                                borderTop: '1px solid rgba(255,255,255,0.04)',
                                fontSize: 11, color: '#666', filter: 'blur(4px)',
                            }}>
                                {previewProduct.full_fields.slice(0, 5).map((_, ci) => (
                                    <div key={ci}>{ci === 0 ? 'Phoenix → Los Angeles' : ci === 1 ? '78' : ci === 2 ? '81%' : ci === 3 ? '$3.45' : '67'}</div>
                                ))}
                            </div>
                        </div>

                        <p style={{ fontSize: 12, color: '#888', lineHeight: 1.5, marginBottom: 16 }}>
                            Showing 1 of {previewProduct.full_fields.length} fields. Unlock for full access with {previewProduct.refresh_frequency} updates.
                        </p>

                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => setPreviewProduct(null)} className="ag-press" style={{
                                padding: '10px 20px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)',
                                background: 'transparent', color: '#aaa', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                            }}>
                                Close
                            </button>
                            <button onClick={() => { setPreviewProduct(null); handleUnlock(previewProduct); }} className="ag-press" style={{
                                padding: '10px 20px', borderRadius: 10, border: 'none',
                                background: 'linear-gradient(135deg, #C6923A, #8A6428)',
                                color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}>
                                <Lock size={13} /> Unlock ${previewProduct.price_usd}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
