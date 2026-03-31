'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface SocialPost {
  id: string;
  platform: string;
  content: string;
  media_url?: string;
  status: string;
  scheduled_for?: string;
  posted_at?: string;
  post_url?: string;
  engagement?: Record<string, number>;
  created_at: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: '#0A66C2',
  facebook_page: '#1877F2',
  facebook_group: '#1565C0',
  youtube_community: '#FF0000',
  twitter: '#1DA1F2',
};

const PLATFORM_ICONS: Record<string, string> = {
  linkedin: 'in',
  facebook_page: 'f',
  facebook_group: 'f●',
  youtube_community: '▶',
  twitter: '𝕏',
};

export default function AdminSocialPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [tab, setTab] = useState<'draft' | 'scheduled' | 'posted'>('draft');
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/social?status=${tab}`, {
      headers: { 'x-admin-secret': localStorage.getItem('hc_admin_secret') || '' },
    });
    const data = await res.json();
    setPosts(data.posts || []);
    setLoading(false);
  }, [tab]);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  const approve = async (postId: string) => {
    setApprovingId(postId);
    await fetch('/api/admin/social', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-secret': localStorage.getItem('hc_admin_secret') || '',
      },
      body: JSON.stringify({ post_id: postId, action: 'approve' }),
    });
    setPosts(prev => prev.filter(p => p.id !== postId));
    setApprovingId(null);
  };

  const reject = async (postId: string) => {
    await fetch('/api/admin/social', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': localStorage.getItem('hc_admin_secret') || '' },
      body: JSON.stringify({ post_id: postId, action: 'reject' }),
    });
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  const draftCount = tab === 'draft' ? posts.length : 0;

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#e8e8e8', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Header */}
      <div style={{ background: '#0c0c10', borderBottom: '1px solid #1a1a22', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>Social Queue</h1>
          <p style={{ color: '#5a5a6a', fontSize: 12, margin: '4px 0 0' }}>
            Review, approve, and schedule social posts across all channels
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link aria-label="Navigation Link" href="/admin/revenue" style={{ padding: '8px 16px', borderRadius: 8, background: '#111118', border: '1px solid #2a2a3a', color: '#9a9ab0', fontSize: 13, textDecoration: 'none' }}>Revenue →</Link>
          <Link aria-label="Navigation Link" href="/admin/content" style={{ padding: '8px 16px', borderRadius: 8, background: '#111118', border: '1px solid #2a2a3a', color: '#9a9ab0', fontSize: 13, textDecoration: 'none' }}>Content →</Link>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#0c0c10', borderBottom: '1px solid #1a1a22', padding: '0 32px', display: 'flex', gap: 0 }}>
        {(['draft', 'scheduled', 'posted'] as const).map(t => (
          <button aria-label="Interactive Button" key={t} onClick={() => setTab(t)} style={{
            padding: '14px 20px', background: 'none',
            border: 'none', borderBottom: `2px solid ${tab === t ? '#F5A623' : 'transparent'}`,
            color: tab === t ? '#F5A623' : '#5a5a6a',
            fontSize: 13, fontWeight: tab === t ? 700 : 400, cursor: 'pointer',
            textTransform: 'capitalize',
          }}>
            {t}{t === 'draft' && draftCount > 0 && <span style={{ marginLeft: 6, background: '#F5A623', color: '#000', fontSize: 10, fontWeight: 800, padding: '1px 5px', borderRadius: 10 }}>{draftCount}</span>}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', color: '#5a5a6a', padding: 48 }}>Loading posts...</div>
        ) : posts.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#5a5a6a', padding: 48 }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
            <div style={{ fontWeight: 600 }}>No {tab} posts</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>
              {tab === 'draft' ? 'Content machine will populate this queue when new articles publish or corridors go HOT.' : `No ${tab} posts yet.`}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {posts.map(post => {
              const platColor = PLATFORM_COLORS[post.platform] || '#555';
              const platIcon = PLATFORM_ICONS[post.platform] || '📣';
              return (
                <div key={post.id} style={{
                  background: '#111118', border: '1px solid #1a1a22',
                  borderRadius: 14, padding: 24,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: platColor, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff',
                      flexShrink: 0,
                    }}>
                      {platIcon}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, textTransform: 'capitalize' }}>
                        {post.platform.replace('_', ' ')}
                      </div>
                      <div style={{ fontSize: 11, color: '#5a5a6a' }}>
                        {tab === 'scheduled' && post.scheduled_for
                          ? `Scheduled: ${new Date(post.scheduled_for).toLocaleString()}`
                          : tab === 'posted' && post.posted_at
                          ? `Posted: ${new Date(post.posted_at).toLocaleString()}`
                          : `Created: ${new Date(post.created_at).toLocaleString()}`}
                      </div>
                    </div>
                  </div>

                  {/* Post content preview */}
                  <div style={{
                    background: '#0c0c10', border: '1px solid #1a1a22',
                    borderRadius: 10, padding: 16, marginBottom: 16,
                    fontSize: 14, lineHeight: 1.6, color: '#c8c8d8',
                    whiteSpace: 'pre-wrap', maxHeight: 200, overflowY: 'auto',
                  }}>
                    {post.content}
                  </div>

                  {/* Engagement (for posted) */}
                  {tab === 'posted' && post.engagement && Object.keys(post.engagement).length > 0 && (
                    <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                      {Object.entries(post.engagement).map(([key, val]) => (
                        <div key={key} style={{ fontSize: 12 }}>
                          <span style={{ color: '#5a5a6a' }}>{key}: </span>
                          <span style={{ fontWeight: 700, color: '#F5A623' }}>{val.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  {tab === 'draft' && (
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button aria-label="Interactive Button"
                        onClick={() => approve(post.id)}
                        disabled={approvingId === post.id}
                        style={{
                          padding: '9px 20px', borderRadius: 8,
                          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                          color: '#fff', border: 'none', fontSize: 13, fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {approvingId === post.id ? 'Approving...' : '✓ Approve & Schedule'}
                      </button>
                      <button aria-label="Interactive Button"
                        onClick={() => reject(post.id)}
                        style={{
                          padding: '9px 20px', borderRadius: 8,
                          background: '#111118', border: '1px solid rgba(239,68,68,0.3)',
                          color: '#ef4444', fontSize: 13, cursor: 'pointer',
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {tab === 'posted' && post.post_url && (
                    <a href={post.post_url} target="_blank" rel="noopener noreferrer" style={{
                      display: 'inline-block', padding: '8px 16px', borderRadius: 8,
                      background: '#111118', border: `1px solid ${platColor}40`,
                      color: platColor, fontSize: 12, fontWeight: 600, textDecoration: 'none',
                    }}>
                      View on {post.platform.replace('_', ' ')} →
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
