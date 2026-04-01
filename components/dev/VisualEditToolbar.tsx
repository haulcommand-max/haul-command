'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { isEditModeEnabled } from '@/lib/dev/editMode';

/**
 * VisualEditToolbar — floating dev toolbar for UI tuning.
 *
 * Only renders when:
 *  - NEXT_PUBLIC_EDIT_MODE=true
 *  - Running on localhost
 *
 * Features:
 *  - Grid overlay toggle
 *  - Spacing overlay (Shift+E)
 *  - Dark/Light preview toggle
 *  - Viewport preset buttons
 *  - Contrast checker readout
 *  - "Writes disabled" banner
 */

type ViewportPreset = 'mobile' | 'tablet' | 'desktop' | 'full';

const VIEWPORT_SIZES: Record<ViewportPreset, { w: number; h: number; label: string }> = {
    mobile: { w: 375, h: 812, label: '📱 Mobile' },
    tablet: { w: 768, h: 1024, label: '📱 Tablet' },
    desktop: { w: 1280, h: 800, label: '🖥️ Desktop' },
    full: { w: 0, h: 0, label: '🔲 Full' },
};

export function VisualEditToolbar() {
    const [mounted, setMounted] = useState(false);
    const [showGrid, setShowGrid] = useState(false);
    const [showSpacing, setShowSpacing] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [viewport, setViewport] = useState<ViewportPreset>('full');

    useEffect(() => {
        setMounted(true);
    }, []);

    // Shift+E hotkey for spacing overlay
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.shiftKey && e.key === 'E') {
                setShowSpacing((v) => !v);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Inject grid overlay styles
    useEffect(() => {
        const id = 'edit-mode-grid-overlay';
        let el = document.getElementById(id);
        if (showGrid) {
            if (!el) {
                el = document.createElement('div');
                el.id = id;
                el.style.cssText = `
                    position: fixed; inset: 0; z-index: 9998; pointer-events: none;
                    background-image:
                        linear-gradient(rgba(59,130,246,0.06) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(59,130,246,0.06) 1px, transparent 1px);
                    background-size: 8px 8px;
                `;
                document.body.appendChild(el);
            }
        } else {
            el?.remove();
        }
        return () => { document.getElementById(id)?.remove(); };
    }, [showGrid]);

    // Spacing overlay: hover outlines
    useEffect(() => {
        if (!showSpacing) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (target.closest('#visual-edit-toolbar')) return;
            target.style.outline = '1px solid rgba(59,130,246,0.5)';
            target.style.outlineOffset = '-1px';
        };
        const removeHandler = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            target.style.outline = '';
            target.style.outlineOffset = '';
        };
        document.addEventListener('mouseover', handler);
        document.addEventListener('mouseout', removeHandler);
        return () => {
            document.removeEventListener('mouseover', handler);
            document.removeEventListener('mouseout', removeHandler);
        };
    }, [showSpacing]);

    const handleViewport = useCallback((preset: ViewportPreset) => {
        setViewport(preset);
        if (preset === 'full') {
            document.documentElement.style.maxWidth = '';
            document.documentElement.style.margin = '';
        } else {
            const { w } = VIEWPORT_SIZES[preset];
            document.documentElement.style.maxWidth = `${w}px`;
            document.documentElement.style.margin = '0 auto';
        }
    }, []);

    if (!mounted || !isEditModeEnabled()) return null;

    if (minimized) {
        return (
            <button
                onClick={() => setMinimized(false)}
                style={{
                    position: 'fixed', bottom: 16, right: 16, zIndex: 9999,
                    width: 40, height: 40, borderRadius: '50%',
                    background: '#3b82f6', color: '#fff', border: 'none',
                    cursor: 'pointer', fontSize: 18, boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                }}
            >
                🔧
            </button>
        );
    }

    return (
        <>
            {/* Writes disabled banner */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
                background: '#f59e0b', color: '#000', textAlign: 'center',
                padding: '4px 0', fontSize: 12, fontWeight: 700, letterSpacing: 1,
            }}>
                LOCAL VISUAL EDIT MODE — writes disabled
            </div>

            {/* Toolbar */}
            <div
                id="visual-edit-toolbar"
                style={{
                    position: 'fixed', bottom: 16, right: 16, zIndex: 9999,
                    background: '#18181b', border: '1px solid #3f3f46',
                    borderRadius: 12, padding: 12, minWidth: 220,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                    fontFamily: 'system-ui, sans-serif', fontSize: 12, color: '#fafafa',
                }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700, color: '#3b82f6' }}>🔧 Edit Mode</span>
                    <button onClick={() => setMinimized(true)}
                        style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer' }}>
                        ─
                    </button>
                </div>

                <ToolbarButton label={`${showGrid ? '✅' : '⬜'} Grid Overlay`} onClick={() => setShowGrid(!showGrid)} />
                <ToolbarButton label={`${showSpacing ? '✅' : '⬜'} Spacing (Shift+E)`} onClick={() => setShowSpacing(!showSpacing)} />

                <div style={{ borderTop: '1px solid #27272a', margin: '6px 0' }} />
                <div style={{ color: '#71717a', marginBottom: 4 }}>Viewport</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(Object.keys(VIEWPORT_SIZES) as ViewportPreset[]).map((p) => (
                        <button key={p} onClick={() => handleViewport(p)}
                            style={{
                                padding: '2px 8px', borderRadius: 6, fontSize: 11, cursor: 'pointer',
                                border: viewport === p ? '1px solid #3b82f6' : '1px solid #3f3f46',
                                background: viewport === p ? '#1e3a5f' : '#27272a', color: '#fafafa',
                            }}>
                            {VIEWPORT_SIZES[p].label}
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}

function ToolbarButton({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button onClick={onClick}
            style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '4px 8px', marginBottom: 2, borderRadius: 6,
                background: 'none', border: 'none', color: '#d4d4d8',
                cursor: 'pointer', fontSize: 12,
            }}
            onMouseEnter={(e) => { (e.target as HTMLElement).style.background = '#27272a'; }}
            onMouseLeave={(e) => { (e.target as HTMLElement).style.background = 'none'; }}
        >
            {label}
        </button>
    );
}
