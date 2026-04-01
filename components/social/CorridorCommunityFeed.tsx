'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Send, MessageCircle, Heart, Clock, MapPin, Loader2 } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   CorridorCommunityFeed — Live posts for a specific corridor
   Nextdoor-for-heavy-haul: operators post updates, brokers post needs
   ═══════════════════════════════════════════════════════════════════ */

const T = {
  bg: '#060b12', bgCard: '#0f1a26', border: 'rgba(255,255,255,0.07)',
  gold: '#f5b942', green: '#27d17f', blue: '#3ba4ff', purple: '#a78bfa',
  text: '#f0f4f8', muted: '#8fa3b8',
} as const;

interface Post {
  id: string;
  content: string;
  created_at: string;
  corridor_slug: string | null;
  profiles?: { full_name: string; city?: string; state?: string } | null;
  likes?: number;
}

// Seed posts for empty corridors
const SEED_POSTS: Post[] = [
  { id: 's1', content: 'Available for runs through Wednesday. Height pole + pilot car.', created_at: new Date(Date.now() - 900000).toISOString(), corridor_slug: null, profiles: { full_name: 'Texas Pilot Cars LLC', state: 'TX' }, likes: 3 },
  { id: 's2', content: 'Looking for escort — 104\' wind turbine blade, Thursday AM, $520/day.', created_at: new Date(Date.now() - 3600000).toISOString(), corridor_slug: null, profiles: { full_name: 'Apex Heavy Haul', state: 'OK' }, likes: 7 },
  { id: 's3', content: 'Just completed 380-mile run. Roads clear, no construction delays.', created_at: new Date(Date.now() - 7200000).toISOString(), corridor_slug: null, profiles: { full_name: 'Interstate Escorts GA', state: 'GA' }, likes: 2 },
  { id: 's4', content: 'Two-pilot required for overwidth on I-10. Need second car by Friday.', created_at: new Date(Date.now() - 14400000).toISOString(), corridor_slug: null, profiles: { full_name: 'Gulf Route Pilots', state: 'LA' }, likes: 5 },
];

function timeSince(dateStr: string) {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

interface CorridorCommunityFeedProps {
  corridorSlug: string;
  corridorName?: string;
}

export function CorridorCommunityFeed({ corridorSlug, corridorName }: CorridorCommunityFeedProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function loadPosts() {
      try {
        const res = await fetch(`/api/social/posts?corridor_slug=${corridorSlug}&limit=20`);
        const data = await res.json();
        if (data.posts && data.posts.length > 0) {
          setPosts(data.posts);
        } else {
          setPosts(SEED_POSTS.map(p => ({ ...p, corridor_slug: corridorSlug })));
        }
      } catch {
        setPosts(SEED_POSTS.map(p => ({ ...p, corridor_slug: corridorSlug })));
      }
      setLoading(false);
    }
    loadPosts();
  }, [corridorSlug]);

  const handlePost = async () => {
    if (!newPost.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newPost.trim(), corridor_slug: corridorSlug }),
      });
      const data = await res.json();
      if (data.error) {
        window.location.href = '/login';
        return;
      }
      if (data.post) {
        setPosts(prev => [data.post, ...prev]);
        setNewPost('');
      }
    } catch {
      window.location.href = '/login';
    }
    setPosting(false);
  };

  const toggleLike = (postId: string) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId); else next.add(postId);
      return next;
    });
  };

  return (
    <div className="ag-section-enter" style={{
      background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 18,
      padding: '20px', height: 'fit-content',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <MessageCircle size={15} style={{ color: T.purple }} />
        <span style={{ fontSize: 13, fontWeight: 800, color: T.text }}>
          {corridorName || corridorSlug.replace(/-/g, ' ').toUpperCase()} Community
        </span>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, boxShadow: `0 0 6px ${T.green}`, marginLeft: 'auto' }} />
      </div>

      {/* Post composer */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          display: 'flex', gap: 8, alignItems: 'flex-end',
          background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`,
          borderRadius: 12, padding: '10px 12px',
        }}>
          <textarea
            value={newPost}
            onChange={e => setNewPost(e.target.value.slice(0, 280))}
            placeholder="Post an update, availability, or request..."
            rows={2}
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none', resize: 'none',
              fontSize: 13, color: T.text, caretColor: T.gold, lineHeight: 1.5,
            }}
          />
          <button
            onClick={handlePost}
            disabled={posting || !newPost.trim()}
            className="ag-press"
            style={{
              background: newPost.trim() ? 'rgba(245,185,66,0.15)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${newPost.trim() ? 'rgba(245,185,66,0.25)' : T.border}`,
              borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
              color: newPost.trim() ? T.gold : T.muted, flexShrink: 0,
            }}
          >
            {posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
        <div style={{ fontSize: 10, color: T.muted, textAlign: 'right', marginTop: 4 }}>
          {newPost.length}/280
        </div>
      </div>

      {/* Posts */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="ag-skeleton" style={{ height: 60, borderRadius: 10 }} />
          ))
        ) : (
          posts.slice(0, 10).map((post, i) => (
            <div key={post.id} className="ag-slide-up" style={{ animationDelay: `${i * 50}ms` }}>
              <div style={{
                padding: '12px', borderRadius: 12,
                background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`,
              }}>
                {/* Author */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, flexShrink: 0,
                  }}>🚗</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {(post.profiles as any)?.full_name || 'Operator'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {(post.profiles as any)?.state && (
                        <span style={{ fontSize: 10, color: T.muted, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <MapPin size={8} /> {(post.profiles as any)?.state}
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: T.muted }}>·</span>
                      <span style={{ fontSize: 10, color: T.muted, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Clock size={8} /> {timeSince(post.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <p style={{ fontSize: 13, color: T.text, lineHeight: 1.5, margin: '0 0 8px' }}>
                  {post.content}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <button
                    onClick={() => toggleLike(post.id)}
                    className="ag-press"
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                      color: likedPosts.has(post.id) ? '#f87171' : T.muted,
                      fontSize: 11, fontWeight: 600, padding: 0,
                      transition: 'color 0.15s',
                    }}
                  >
                    <Heart size={12} fill={likedPosts.has(post.id) ? '#f87171' : 'none'} />
                    {(post.likes || 0) + (likedPosts.has(post.id) ? 1 : 0)}
                  </button>
                  <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.muted, fontSize: 11, fontWeight: 600, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MessageCircle size={12} /> Reply
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sign-in CTA */}
      <Link href="/login" className="ag-press" style={{
        display: 'block', textAlign: 'center', marginTop: 16, padding: '10px',
        borderRadius: 10, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)',
        color: T.purple, fontSize: 12, fontWeight: 800, textDecoration: 'none',
      }}>
        Sign in to join the conversation →
      </Link>
    </div>
  );
}

export default CorridorCommunityFeed;
