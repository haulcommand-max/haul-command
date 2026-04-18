"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export type HardcodedModule = {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration_minutes: number;
  order_index: number;
  certification_tier: 'hc_certified' | 'av_ready' | 'elite';
  is_free: boolean;
};

type ProgressResponse = {
  slug: string;
  progress: { status: string; score: number | null } | null;
};

const TIER_CONFIG = {
  hc_certified: { name: 'HC Certified', color: '#A8A8A8' },
  av_ready: { name: 'HC AV-Ready', color: '#F5A623' },
  elite: { name: 'HC Elite', color: '#E5E4E2' },
};

export function ModuleList({ modules }: { modules: HardcodedModule[] }) {
  const [progressData, setProgressData] = useState<Record<string, ProgressResponse['progress']>>({});

  useEffect(() => {
    fetch('/api/training/modules')
      .then(r => r.json())
      .then(d => {
        if (d.modules) {
          const map: Record<string, ProgressResponse['progress']> = {};
          d.modules.forEach((m: any) => {
            map[m.slug] = m.progress;
          });
          setProgressData(map);
        }
      })
      .catch(() => {}); // silently fail if not logged in
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.02em' }}>
        All 7 Modules
      </h2>
      <p style={{ color: '#6a6a7a', marginBottom: 40, fontSize: 15 }}>
        Each module is a standalone credential. Work through them in sequence or jump to what you need most.
      </p>

      {modules.map((m) => {
        const tierConf = TIER_CONFIG[m.certification_tier];
        const statusColors: Record<string, string> = {
          passed: '#22c55e', in_progress: '#F5A623', failed: '#ef4444', not_started: '#6a6a7a',
        };
        const p = progressData[m.slug];
        const status = p?.status || 'not_started';
        
        return (
          <Link aria-label="Navigation Link" key={m.slug} href={`/training/${m.slug}`}
            style={{ textDecoration: 'none', display: 'block', marginBottom: 12 }}
          >
            <div style={{
              background: '#111118',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              transition: 'border-color 0.2s, transform 0.15s',
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = tierConf.color + '50';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.transform = '';
              }}
            >
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                background: `${tierConf.color}18`,
                border: `1px solid ${tierConf.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 800, color: tierConf.color,
                flexShrink: 0,
              }}>
                {m.order_index}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{m.title}</span>
                  {m.is_free && (
                    <span style={{
                      background: 'rgba(34,197,94,0.12)', color: '#22c55e',
                      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      letterSpacing: '0.06em',
                    }}>FREE</span>
                  )}
                  <span style={{
                    background: `${tierConf.color}15`, color: tierConf.color,
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    letterSpacing: '0.04em',
                  }}>{tierConf.name.toUpperCase()}</span>
                </div>
                <div style={{ fontSize: 13, color: '#6a6a7a', lineHeight: 1.4 }}>
                  {m.description.slice(0, 100)}{m.description.length > 100 ? '…' : ''}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <div style={{ fontSize: 12, color: '#6a6a7a' }}>⏱ {m.duration_minutes}m</div>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: statusColors[status] || '#6a6a7a',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  {status.replace('_', ' ')}
                  {p?.score !== null && p?.score !== undefined && ` — ${p.score}%`}
                </div>
                <span style={{ color: tierConf.color, fontSize: 18 }}>→</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
