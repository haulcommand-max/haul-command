import React from 'react';
import ToolsSidebar from "@/components/tools/ToolsSidebar";
import RelatedLinks from '@/components/seo/RelatedLinks';

export default function CostCalculatorPage() {
    return (
        <div data-tool-interact="true" style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui, sans-serif", padding: '2rem 1rem' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '2rem' }}>
                <div style={{ padding: '3rem', background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>ðŸ’°</div>
                    <h1 style={{ fontSize: 32, fontWeight: 900, color: '#f9fafb', marginBottom: 16 }}>Cost Calculator</h1>
                    <p style={{ color: '#9ca3af', fontSize: 16, maxWidth: 500, margin: '0 auto' }}>
                        The advanced oversize load cost calculator is currently in development.
                        It will feature real-time toll, permit, and escort cost estimations across all 50 states.
                    </p>
                    <div style={{ marginTop: 32 }}>
                        <a href="/tools" style={{ display: 'inline-block', padding: '12px 24px', background: '#F1A91B', color: '#000', fontWeight: 800, borderRadius: 8, textDecoration: 'none' }}>
                            â† Back to Tools
                        </a>
                    </div>

                    {/* SEO Internal Links â€” passes equity to escort-calc, permit-checker, directory */}
                    <div style={{ marginTop: '3rem', textAlign: 'left' }}>
                        <RelatedLinks
                            pageType="tool"
                            context={{ toolSlug: 'cost-calculator' }}
                            heading="Available tools to try now"
                        />
                    </div>
                </div>
                <aside>
                    <ToolsSidebar currentPath="/tools/cost-calculator" />
                </aside>
            </div>
        </div>
    );
}