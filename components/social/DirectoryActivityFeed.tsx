'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

/* ═══════════════════════════════════════════════════════════════════
   DirectoryActivityFeed — Live social updates from operators
   Shows recent posts, follows, endorsements in a rolling feed
   ═══════════════════════════════════════════════════════════════════ */

const T = {
  bg: '#060b12', bgCard: '#0f1a26', border: 'rgba(255,255,255,0.07)',
  gold: '#f5b942', green: '#27d17f', red: '#f87171', blue: '#3ba4ff',
  text: '#f0f4f8', muted: '#8fa3b8',
} as const;

interface FeedItem {
  id: string;
  type: 'post' | 'follow' | 'endorsement' | 'joined';
  name: string;
  content: string;
  time: string;
  corridor?: string;
}

// Seed feed items for when social data is empty
const SEED_FEED: FeedItem[] = [
  { id: 'f1', type: 'post', name: 'Lone Star Pilot Cars', content: 'Available for I-10 runs this week. Height pole equipped.', time: '3m ago', corridor: 'I-10 Gulf' },
  { id: 'f2', type: 'joined', name: 'Gulf Coast Escorts LLC', content: 'Just joined Haul Command — verified in Texas', time: '12m ago' },
  { id: 'f3', type: 'endorsement', name: 'KW Logistics', content: 'endorsed Pacific Northwest Pilot Cars — "Always on time, great comm"', time: '28m ago' },
  { id: 'f4', type: 'follow', name: 'Midwest Heavy Haul', content: 'started following Sunshine State Pilot Cars', time: '45m ago' },
  { id: 'f5', type: 'post', name: 'Dixie Oversize Escorts', content: 'Just completed a 190-mile wide load escort. I-75 clear.', time: '1h ago', corridor: 'I-75 SE' },
  { id: 'f6', type: 'joined', name: 'Mountain West Escorts', content: 'Just joined Haul Command — verified in Colorado', time: '2h ago' },
];

const TYPE_CONFIG = {
  post: { emoji: '💬', color: T.blue, verb: 'posted' },
  follow: { emoji: '👤', color: T.gold, verb: '' },
  endorsement: { emoji: '⭐', color: T.green, verb: '' },
  joined: { emoji: '🎉', color: T.green, verb: '' },
};

export function DirectoryActivityFeed() {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to load real data, fall back to seeds
    async function loadFeed() {
      try {
        const res = await fetch('/api/social/posts?limit=6');
        const data = await res.json();
        if (data.posts && data.posts.length > 0) {
          const items: FeedItem[] = data.posts.map((p: any) => ({
            id: p.id,
            type: 'post' as const,
            name: p.profiles?.full_name || 'Verified Operator',
            content: p.content,
            time: timeSince(p.created_at),
            corridor: p.corridor_slug,
          }));
          setFeed(items);
        } else {
          setFeed(SEED_FEED);
        }
      } catch {
        setFeed(SEED_FEED);
      }
      setLoading(false);
    }
    loadFeed();
  }, []);

  return (
    <div style={{
      background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 18,
      padding: '20px', maxWidth: 400,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: T.green, boxShadow: `0 0 6px ${T.green}` }} />
        <span style={{ fontSize: 11, fontWeight: 800, color: T.text, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Live Activity
        </span>
      </div>

      {/* Feed items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 40, background: 'rgba(255,255,255,0.03)', borderRadius: 8 }} className="ag-skeleton" />
          ))
        ) : (
          feed.map((item, i) => {
            const cfg = TYPE_CONFIG[item.type];
            return (
              <div key={item.id} className="ag-slide-up" style={{ animationDelay: `${i * 60}ms`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 2 }}>{cfg.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 700, color: T.text }}>{item.name}</span>
                    {cfg.verb && <span style={{ color: T.muted }}> {cfg.verb}</span>}
                    <span style={{ color: T.muted }}> {item.content}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <span style={{ fontSize: 10, color: T.muted }}>{item.time}</span>
                    {item.corridor && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: T.gold, background: 'rgba(245,185,66,0.08)', padding: '1px 6px', borderRadius: 4 }}>
                        {item.corridor}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sign-in CTA */}
      <Link href="/login" style={{
        display: 'block', textAlign: 'center', marginTop: 16, padding: '8px',
        borderRadius: 10, background: 'rgba(245,185,66,0.06)', border: `1px solid rgba(245,185,66,0.15)`,
        color: T.gold, fontSize: 11, fontWeight: 800, textDecoration: 'none',
      }}>
        Sign in to post updates →
      </Link>
    </div>
  );
}

function timeSince(dateStr: string) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default DirectoryActivityFeed;
