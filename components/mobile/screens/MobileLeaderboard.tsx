'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

/* ══════════════════════════════════════════════════════════════
   Mobile Leaderboard — Frame 8
   Corridor selector + period tabs + top-3 podium + ranked list
   Now wired to /api/v1/leaderboard for real Supabase data.
   Falls back to truthful empty state when data is sparse.
   ══════════════════════════════════════════════════════════════ */

const ShieldIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--m-gold)" stroke="none">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10" stroke="#000" strokeWidth={2.5} fill="none"
      strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ArrowUpIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#22C55E"
    strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);

const ArrowDownIcon = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#EF4444"
    strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

interface LeaderEntry {
  rank: number;
  name: string;
  location: string;
  score: number;
  verified: boolean;
  moveDirection: 'up' | 'down' | 'none';
  moveAmount: number;
  userId?: string;
}

const CORRIDORS = ['Global', 'I-10', 'I-35', 'I-75', 'I-20'];
const PERIODS = ['This Week', 'This Month', 'All Time'];

/* ── Data fetching hook ── */
function useLeaderboardData(corridor: string) {
  const [entries, setEntries] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [empty, setEmpty] = useState(false);

  useEffect(() => {
    setLoading(true);
    setEmpty(false);

    const params = new URLSearchParams({ limit: '20' });
    if (corridor !== 'Global') {
      params.set('corridor', corridor.toLowerCase().replace(/\s+/g, '-'));
    }

    fetch(`/api/v1/leaderboard?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.ok && data.leaderboard && data.leaderboard.length > 0) {
          const mapped: LeaderEntry[] = data.leaderboard.map((entry: any, i: number) => ({
            rank: entry.rank ?? i + 1,
            name: entry.display_name || entry.user_id?.slice(0, 8) || `Operator #${i + 1}`,
            location: entry.primary_state || entry.city || '—',
            score: entry.total_points ?? 0,
            verified: entry.verification?.tier >= 2 || false,
            moveDirection: 'none' as const,
            moveAmount: 0,
            userId: entry.user_id,
          }));
          setEntries(mapped);
          setEmpty(false);
        } else {
          setEntries([]);
          setEmpty(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setEntries([]);
        setEmpty(true);
        setLoading(false);
      });
  }, [corridor]);

  return { entries, loading, empty };
}

function PodiumCard({ entry, position }: { entry: LeaderEntry; position: 'first' | 'second' | 'third' }) {
  const sizes = {
    first:  { w: 100, h: 120, avatar: 48, fontSize: 24, labelSize: 11, scoreSize: 14 },
    second: { w: 88,  h: 100, avatar: 40, fontSize: 20, labelSize: 10, scoreSize: 12 },
    third:  { w: 88,  h: 100, avatar: 40, fontSize: 20, labelSize: 10, scoreSize: 12 },
  };
  const s = sizes[position];
  const isFirst = position === 'first';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      width: s.w, marginTop: isFirst ? 0 : 20,
    }}>
      {/* Rank badge */}
      <div style={{
        width: s.avatar, height: s.avatar, borderRadius: 'var(--m-radius-full)',
        background: isFirst
          ? 'linear-gradient(135deg, #F1A91B 0%, #D4A844 100%)'
          : 'var(--m-surface-raised)',
        border: isFirst ? '3px solid var(--m-gold)' : '2px solid var(--m-border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 900, fontSize: s.fontSize,
        color: isFirst ? '#000' : 'var(--m-text-primary)',
        marginBottom: 'var(--m-sm)',
        boxShadow: isFirst ? '0 0 24px rgba(241,169,27,0.3)' : 'none',
        position: 'relative',
      }}>
        #{entry.rank}
        {isFirst && (
          <span style={{
            position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
            fontSize: 16,
          }}>👑</span>
        )}
      </div>
      <span style={{
        fontSize: s.labelSize, fontWeight: 700,
        color: 'var(--m-text-primary)',
        textAlign: 'center', lineHeight: 1.2,
        maxWidth: s.w, overflow: 'hidden',
        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {entry.name}
      </span>
      <span style={{
        fontSize: s.scoreSize, fontWeight: 900,
        color: isFirst ? 'var(--m-gold)' : 'var(--m-text-secondary)',
        marginTop: 2,
      }}>
        {entry.score.toFixed(1)}
      </span>
    </div>
  );
}

function RankRow({ entry }: { entry: LeaderEntry }) {
  const profileSlug = entry.userId
    ? `/place/${entry.userId}`
    : `/place/${entry.name.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <Link href={profileSlug}
      style={{
        display: 'flex', alignItems: 'center', gap: 'var(--m-md)',
        padding: 'var(--m-md) var(--m-screen-pad)',
        borderBottom: '1px solid var(--m-border-subtle)',
        textDecoration: 'none', color: 'inherit',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Rank number */}
      <span style={{
        width: 28, fontWeight: 900,
        fontSize: 'var(--m-font-h3)',
        color: 'var(--m-text-muted)',
        textAlign: 'center', flexShrink: 0,
      }}>
        {entry.rank}
      </span>

      {/* Avatar */}
      <div style={{
        width: 36, height: 36, borderRadius: 'var(--m-radius-full)',
        background: 'var(--m-surface-raised)',
        border: '1px solid var(--m-border-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 700, color: 'var(--m-text-secondary)',
        flexShrink: 0,
      }}>
        {entry.name.charAt(0)}
      </div>

      {/* Name + location */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          <span style={{
            fontSize: 'var(--m-font-body)', fontWeight: 700,
            color: 'var(--m-text-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {entry.name}
          </span>
          {entry.verified && <ShieldIcon />}
        </div>
        <div style={{
          fontSize: 'var(--m-font-caption)', color: 'var(--m-text-muted)',
        }}>
          {entry.location}
        </div>
      </div>

      {/* Score + movement */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{
          fontSize: 'var(--m-font-body)', fontWeight: 900,
          color: 'var(--m-gold)', fontVariantNumeric: 'tabular-nums',
        }}>
          {entry.score.toFixed(2)}
        </div>
        {entry.moveDirection !== 'none' && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            gap: 2, marginTop: 2,
          }}>
            {entry.moveDirection === 'up' ? <ArrowUpIcon /> : <ArrowDownIcon />}
            <span style={{
              fontSize: 'var(--m-font-overline)', fontWeight: 700,
              color: entry.moveDirection === 'up' ? '#22C55E' : '#EF4444',
            }}>
              {entry.moveAmount}
            </span>
          </div>
        )}
        {entry.moveDirection === 'none' && (
          <div style={{
            fontSize: 'var(--m-font-overline)', color: 'var(--m-text-muted)',
            marginTop: 2, textAlign: 'right',
          }}>—</div>
        )}
      </div>
    </Link>
  );
}

/* ── Thin Market Empty State ── */
function EmptyLeaderboard({ corridor }: { corridor: string }) {
  return (
    <div style={{
      padding: 'var(--m-4xl) var(--m-screen-pad)',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 40, marginBottom: 'var(--m-lg)' }}>🏆</div>
      <div style={{
        fontSize: 'var(--m-font-h2)', fontWeight: 800,
        color: 'var(--m-text-primary)', marginBottom: 'var(--m-sm)',
      }}>
        {corridor === 'Global' ? 'Leaderboard building...' : `${corridor} leaderboard building...`}
      </div>
      <div style={{
        fontSize: 'var(--m-font-body-sm)',
        color: 'var(--m-text-secondary)',
        lineHeight: 1.5,
        maxWidth: 300,
        margin: '0 auto var(--m-xl)',
      }}>
        {corridor === 'Global'
          ? 'Rankings populate as operators claim profiles, complete jobs, and earn verification badges.'
          : `This corridor doesn't have enough ranked operators yet. Rankings populate as operators claim profiles and earn trust points on this route.`
        }
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--m-sm)', maxWidth: 260, margin: '0 auto' }}>
        <Link href="/claim" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: 44, borderRadius: 'var(--m-radius-md)',
          background: 'var(--m-gold)', color: '#000',
          fontSize: 'var(--m-font-body-sm)', fontWeight: 800,
          textDecoration: 'none',
        }}>
          Claim Your Profile
        </Link>
        <Link href="/corridor" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: 44, borderRadius: 'var(--m-radius-md)',
          background: 'transparent', color: 'var(--m-text-primary)',
          border: '1px solid var(--m-border-default)',
          fontSize: 'var(--m-font-body-sm)', fontWeight: 700,
          textDecoration: 'none',
        }}>
          Browse Corridors
        </Link>
      </div>
    </div>
  );
}

/* ── Loading Skeleton ── */
function LeaderboardSkeleton() {
  return (
    <div style={{ padding: 'var(--m-xl) var(--m-screen-pad)' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--m-md)',
          padding: 'var(--m-md) 0', borderBottom: '1px solid var(--m-border-subtle)',
        }}>
          <div className="m-skeleton" style={{ width: 28, height: 20 }} />
          <div className="m-skeleton m-skeleton--avatar" style={{ width: 36, height: 36 }} />
          <div style={{ flex: 1 }}>
            <div className="m-skeleton m-skeleton--text" style={{ marginBottom: 4 }} />
            <div className="m-skeleton" style={{ width: '40%', height: 10 }} />
          </div>
          <div className="m-skeleton" style={{ width: 50, height: 20 }} />
        </div>
      ))}
    </div>
  );
}

export default function MobileLeaderboard() {
  const [corridor, setCorridor] = useState(CORRIDORS[0]);
  const [period, setPeriod] = useState(PERIODS[0]);
  const { entries, loading, empty } = useLeaderboardData(corridor);

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="m-shell-content" style={{ background: 'var(--m-bg)', minHeight: '100dvh' }}>
      {/* Header */}
      <div style={{
        padding: 'var(--m-safe-top) var(--m-screen-pad) 0',
        paddingTop: 'calc(var(--m-safe-top) + var(--m-md))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h1 style={{
          fontSize: 'var(--m-font-h1)', fontWeight: 900,
          color: 'var(--m-text-primary)', margin: 0,
        }}>Leaderboard</h1>

        {/* Corridor selector */}
        <select
          value={corridor}
          onChange={e => setCorridor(e.target.value)}
          style={{
            background: 'var(--m-surface-raised)',
            border: '1px solid var(--m-gold)',
            borderRadius: 'var(--m-radius-full)',
            color: 'var(--m-gold)',
            fontSize: 'var(--m-font-body-sm)', fontWeight: 700,
            padding: '6px 28px 6px 12px',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23D4A844' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
            cursor: 'pointer',
          }}
        >
          {CORRIDORS.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Period label */}
      <div style={{
        padding: 'var(--m-sm) var(--m-screen-pad) 0',
        fontSize: 'var(--m-font-body-sm)', color: 'var(--m-text-muted)',
      }}>Period</div>

      {/* Period tabs */}
      <div style={{
        display: 'flex', gap: 'var(--m-xs)',
        padding: 'var(--m-sm) var(--m-screen-pad)',
      }}>
        {PERIODS.map(p => (
          <button key={p}
            onClick={() => setPeriod(p)}
            className={`m-chip ${period === p ? 'm-chip--gold' : 'm-chip--tag'}`}
            style={{
              cursor: 'pointer', border: 'none',
              fontWeight: period === p ? 800 : 600,
              padding: '8px 16px',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <LeaderboardSkeleton />
      ) : empty ? (
        <EmptyLeaderboard corridor={corridor} />
      ) : (
        <>
          {/* ── Top 3 Podium ── */}
          <div style={{
            display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
            gap: 'var(--m-md)',
            padding: 'var(--m-xl) var(--m-screen-pad) var(--m-lg)',
            position: 'relative',
          }}>
            {/* Glow effect behind #1 */}
            <div style={{
              position: 'absolute',
              top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 180, height: 100,
              background: 'radial-gradient(ellipse, rgba(241,169,27,0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />

            {top3.length >= 2 && <PodiumCard entry={top3[1]} position="second" />}
            {top3.length >= 1 && <PodiumCard entry={top3[0]} position="first" />}
            {top3.length >= 3 && <PodiumCard entry={top3[2]} position="third" />}
          </div>

          {/* ── Ranked List ── */}
          <div style={{
            background: 'var(--m-surface)',
            borderTop: '1px solid var(--m-border-subtle)',
            borderRadius: 'var(--m-radius-xl) var(--m-radius-xl) 0 0',
          }}>
            {rest.map(entry => (
              <RankRow key={entry.rank} entry={entry} />
            ))}
          </div>
        </>
      )}

      <div style={{ height: 'var(--m-3xl)' }} />
    </div>
  );
}
