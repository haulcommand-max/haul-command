'use client';

import React from 'react';

// ══════════════════════════════════════════════════════════════
// SKELETON LOADER LIBRARY — Premium loading states
// ══════════════════════════════════════════════════════════════

interface SkeletonProps {
    width?: number | string;
    height?: number | string;
    borderRadius?: number;
    style?: React.CSSProperties;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
    return (
        <div className="skeleton" style={{ width, height, borderRadius, ...style }} />
    );
}

// Card skeleton — mimics a load card or profile card
export function CardSkeleton() {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14,
            padding: '1.25rem',
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <Skeleton width={120} height={16} />
                        <Skeleton width={20} height={16} borderRadius={4} />
                        <Skeleton width={100} height={16} />
                    </div>
                    <Skeleton width={180} height={12} />
                </div>
                <Skeleton width={80} height={28} borderRadius={6} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <Skeleton width={70} height={24} borderRadius={8} />
                <Skeleton width={90} height={24} borderRadius={8} />
                <Skeleton width={60} height={24} borderRadius={8} />
            </div>
        </div>
    );
}

// Profile skeleton — mimics a directory profile card
export function ProfileSkeleton() {
    return (
        <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14,
            padding: '1.25rem',
            display: 'flex', alignItems: 'center', gap: 16,
        }}>
            <Skeleton width={48} height={48} borderRadius={24} />
            <div style={{ flex: 1 }}>
                <Skeleton width={160} height={16} style={{ marginBottom: 8 }} />
                <Skeleton width={120} height={12} />
            </div>
            <Skeleton width={40} height={40} borderRadius={8} />
        </div>
    );
}

// Stat skeleton — mimics a stats panel
export function StatsSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, gap: '1rem' }}>
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                    padding: '1rem',
                    textAlign: 'center',
                }}>
                    <Skeleton width={60} height={32} borderRadius={6} style={{ margin: '0 auto 8px' }} />
                    <Skeleton width={80} height={10} borderRadius={4} style={{ margin: '0 auto' }} />
                </div>
            ))}
        </div>
    );
}

// Table skeleton
export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1rem', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {Array.from({ length: cols }).map((_, i) => (
                    <Skeleton key={i} width={80} height={10} />
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, ri) => (
                <div key={ri} style={{
                    display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '1rem',
                    padding: '14px 16px', borderBottom: ri < rows - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                }}>
                    {Array.from({ length: cols }).map((_, ci) => (
                        <Skeleton key={ci} width={ci === 0 ? 140 : 60} height={14} />
                    ))}
                </div>
            ))}
        </div>
    );
}
