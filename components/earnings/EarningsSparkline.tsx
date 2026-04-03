'use client';
/**
 * EarningsSparkline — 7-day micro-chart for earnings trends.
 *
 * P2: Visual proof of value — shows daily earnings as a tiny inline SVG sparkline.
 * Renders without any charting library (pure SVG).
 */
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { EarningsService, formatCents, type SparklineData } from '@/lib/earnings/earnings-service';

interface EarningsSparklineProps {
  /** User ID to fetch earnings for */
  userId: string;
  /** Number of days to show (default: 7) */
  days?: number;
  /** Width of the sparkline SVG */
  width?: number;
  /** Height of the sparkline SVG */
  height?: number;
  /** Show trend badge */
  showTrend?: boolean;
  /** Show total label */
  showTotal?: boolean;
  /** Accent color for the line */
  color?: string;
  /** Style overrides */
  className?: string;
}

export default function EarningsSparkline({
  userId,
  days = 7,
  width = 160,
  height = 44,
  showTrend = true,
  showTotal = true,
  color = '#22C55E',
  className = '',
}: EarningsSparklineProps) {
  const [data, setData] = useState<SparklineData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const service = new EarningsService();
    service.getSparkline(userId, days).then(d => {
      setData(d);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [userId, days]);

  const { path, gradientId, totalCents, points } = useMemo(() => {
    if (!data || data.days.length === 0) {
      return { path: '', gradientId: '', totalCents: 0, points: [] };
    }

    const values = data.days.map(d => d.total_cents);
    const max = Math.max(...values, 1); // avoid division by zero
    const padding = 4;
    const innerW = width - padding * 2;
    const innerH = height - padding * 2;
    const gId = `sparkline-grad-${userId.slice(0, 8)}`;

    const pts = values.map((v, i) => ({
      x: padding + (i / Math.max(1, values.length - 1)) * innerW,
      y: padding + innerH - (v / max) * innerH,
    }));

    // Build smooth SVG path using quadratic bezier curves
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpX = (prev.x + curr.x) / 2;
      d += ` Q ${cpX} ${prev.y} ${curr.x} ${curr.y}`;
    }

    // Area fill path
    const areaPath = d + ` L ${pts[pts.length - 1].x} ${height} L ${pts[0].x} ${height} Z`;

    return {
      path: d,
      areaPath,
      gradientId: gId,
      totalCents: values.reduce((s, v) => s + v, 0),
      points: pts,
    };
  }, [data, width, height, userId]);

  if (loading) {
    return (
      <div className={`earnings-sparkline-skeleton ${className}`} style={{
        width, height: height + 20,
        borderRadius: 12,
        background: 'rgba(255,255,255,0.03)',
        animation: 'pulse 1.5s infinite',
      }} />
    );
  }

  if (!data || data.days.every(d => d.total_cents === 0)) {
    return null; // Don't show empty sparklines
  }

  const trendColor = data.trend_pct > 0 ? '#22C55E' : data.trend_pct < 0 ? '#EF4444' : '#6B7280';
  const trendLabel = data.trend_pct > 0 ? `+${data.trend_pct}%` : `${data.trend_pct}%`;

  return (
    <div className={`earnings-sparkline ${className}`} style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      {/* SVG Sparkline */}
      <div style={{ position: 'relative' }}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ display: 'block' }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>

          {/* Area fill */}
          {points.length > 1 && (
            <path
              d={`${path} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`}
              fill={`url(#${gradientId})`}
            />
          )}

          {/* Line */}
          {points.length > 1 && (
            <path
              d={path}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                filter: `drop-shadow(0 0 4px ${color}40)`,
              }}
            />
          )}

          {/* End dot */}
          {points.length > 0 && (
            <circle
              cx={points[points.length - 1].x}
              cy={points[points.length - 1].y}
              r={3}
              fill={color}
              stroke="#0a0a0a"
              strokeWidth={1.5}
            />
          )}
        </svg>
      </div>

      {/* Labels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {showTotal && (
          <span style={{
            fontSize: 14,
            fontWeight: 800,
            color: '#f5f7fb',
            lineHeight: 1,
          }}>
            {formatCents(totalCents)}
          </span>
        )}
        {showTrend && data.trend_pct !== 0 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={trendColor} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              {data.trend_pct > 0 ? (
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              ) : (
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
              )}
            </svg>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              color: trendColor,
            }}>
              {trendLabel}
            </span>
          </div>
        )}
        <span style={{
          fontSize: 9,
          fontWeight: 600,
          color: 'rgba(255,255,255,0.3)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {days}d trend
        </span>
      </div>
    </div>
  );
}
