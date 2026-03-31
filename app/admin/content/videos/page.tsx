/**
 * Admin Video Dashboard — /admin/content/videos
 * Shows: Pending Approval | In Production | Published
 * Approve → triggers translation + YouTube pipeline
 */
'use client';

import { useState, useEffect, useCallback } from 'react';

interface VideoJob {
  id: string;
  language: string;
  status: string;
  heygen_status: string;
  video_url: string | null;
  youtube_url: string | null;
  admin_approved: boolean;
  admin_rejected: boolean;
  topic_slug: string | null;
  duration_secs: number | null;
  created_at: string;
  script_text: string | null;
  blog_post?: { title?: string; meta_description?: string; id?: string };
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  rendering:      { label: '⟳ Rendering', color: '#f5c842' },
  translating:    { label: '🌐 Translating', color: '#00ccff' },
  complete:       { label: '✓ Ready', color: '#00ff88' },
  failed:         { label: '✗ Failed', color: '#ef4444' },
  queued:         { label: '⏳ Queued', color: '#8fa3c0' },
};

const LANG_FLAGS: Record<string, string> = {
  en: '🇺🇸', es: '🇪🇸', pt: '🇧🇷', de: '🇩🇪', fr: '🇫🇷',
  ar: '🇦🇪', nl: '🇳🇱', ja: '🇯🇵', ko: '🇰🇷', hi: '🇮🇳',
};

export default function VideoAdminPage() {
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending'|'production'|'published'>('pending');
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [previewJob, setPreviewJob] = useState<VideoJob | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/video/admin-list');
      const data = await res.json();
      setJobs(data.jobs || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const approve = async (job: VideoJob) => {
    setActionLoading(p => ({ ...p, [job.id]: true }));
    try {
      await fetch('/api/video/admin-list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id, action: 'approve' }),
      });
      await fetchJobs();
      setPreviewJob(null);
    } catch(e){ console.error(e); }
    finally { setActionLoading(p => ({ ...p, [job.id]: false })); }
  };

  const reject = async (job: VideoJob) => {
    setActionLoading(p => ({ ...p, [job.id]: true }));
    try {
      await fetch('/api/video/admin-list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id, action: 'reject' }),
      });
      await fetchJobs();
      setPreviewJob(null);
    } catch(e){ console.error(e); }
    finally { setActionLoading(p => ({ ...p, [job.id]: false })); }
  };

  const pending    = jobs.filter(j => j.status === 'complete' && !j.admin_approved && !j.admin_rejected && j.language === 'en');
  const production = jobs.filter(j => ['rendering','translating','queued'].includes(j.status));
  const published  = jobs.filter(j => j.admin_approved && j.youtube_url);

  const tabs = [
    { id: 'pending',    label: `Pending Approval`, count: pending.length, color: '#f5c842' },
    { id: 'production', label: `In Production`,    count: production.length, color: '#00ccff' },
    { id: 'published',  label: `Published`,         count: published.length, color: '#00ff88' },
  ] as const;

  const activeList = activeTab === 'pending' ? pending : activeTab === 'production' ? production : published;

  return (
    <div style={{ minHeight: '100vh', background: '#07090f', color: '#e0e0e6', fontFamily: "'Inter','Segoe UI',sans-serif" }}>

      {/* Header */}
      <div style={{ background: '#0a0d16', borderBottom: '1px solid #1a223a', padding: '20px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>🎬 Video Dashboard</h1>
          <div style={{ fontSize: 13, color: '#8fa3c0', marginTop: 4 }}>HeyGen pipeline · 10 languages · YouTube auto-publish</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button aria-label="Interactive Button" onClick={fetchJobs} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#e0e0e6', borderRadius: 10, padding: '8px 16px', fontSize: 13, cursor: 'pointer',
          }}>↻ Refresh</button>
          <a href="/admin/content" style={{
            background: 'transparent', border: '1px solid rgba(0,204,255,0.2)',
            color: '#00ccff', borderRadius: 10, padding: '8px 16px', fontSize: 13, textDecoration: 'none',
          }}>← Content Admin</a>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: 16, padding: '20px 28px', borderBottom: '1px solid #1a223a', flexWrap: 'wrap' }}>
        {[
          { val: jobs.length, label: 'Total Videos', color: '#e0e0e6' },
          { val: pending.length, label: 'Awaiting Approval', color: '#f5c842' },
          { val: production.length, label: 'In Production', color: '#00ccff' },
          { val: published.length, label: 'Published to YouTube', color: '#00ff88' },
          { val: jobs.filter(j => j.status === 'failed').length, label: 'Failed', color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12, padding: '12px 18px',
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: '#8fa3c0', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
        <div style={{
          background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)',
          borderRadius: 12, padding: '12px 18px',
        }}>
          <div style={{ fontSize: 12, color: '#8fa3c0', marginBottom: 4 }}>Time investment</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#00ff88' }}>~2 min/video · Everything else automated</div>
        </div>
      </div>

      <div style={{ padding: '24px 28px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {tabs.map(tab => (
            <button aria-label="Interactive Button" key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              padding: '8px 18px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none',
              background: activeTab === tab.id ? `rgba(255,255,255,0.08)` : 'transparent',
              color: activeTab === tab.id ? '#f0f4f8' : '#8fa3c0',
              borderBottom: activeTab === tab.id ? `2px solid ${tab.color}` : '2px solid transparent',
            }}>
              {tab.label} {tab.count > 0 && <span style={{ marginLeft: 6, background: tab.color, color: '#07090f', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 800 }}>{tab.count}</span>}
            </button>
          ))}
        </div>

        {loading && <div style={{ color: '#8fa3c0', textAlign: 'center', padding: 40 }}>Loading...</div>}

        {!loading && activeList.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#8fa3c0' }}>
            {activeTab === 'pending' ? '✓ No videos awaiting approval' : `No videos in this category`}
          </div>
        )}

        {/* Video list */}
        <div style={{ display: 'grid', gap: 14 }}>
          {activeList.map(job => {
            const title = job.blog_post?.title || job.topic_slug || job.id;
            const statusCfg = STATUS_CONFIG[job.status] || { label: job.status, color: '#8fa3c0' };
            return (
              <div key={job.id} style={{
                background: 'rgba(255,255,255,0.02)', border: `1px solid ${job.status === 'complete' && !job.admin_approved ? 'rgba(245,200,66,0.3)' : 'rgba(255,255,255,0.07)'}`,
                borderRadius: 16, padding: '18px 22px',
                display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
              }}>
                {/* Thumbnail placeholder */}
                <div style={{
                  width: 100, height: 60, borderRadius: 8, background: '#1a1a28',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24, flexShrink: 0, border: '1px solid #2a2a3a', cursor: job.video_url ? 'pointer' : 'default',
                }} onClick={() => job.video_url && setPreviewJob(job)}>
                  {job.video_url ? '▶' : '⏳'}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#f0f4f8', marginBottom: 4 }} title={title}>{title.slice(0,80)}</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: statusCfg.color, fontWeight: 700 }}>{statusCfg.label}</span>
                    <span style={{ fontSize: 11, color: '#8fa3c0' }}>{LANG_FLAGS[job.language]} {job.language.toUpperCase()}</span>
                    {job.duration_secs && <span style={{ fontSize: 11, color: '#8fa3c0' }}>⏱ {Math.round(job.duration_secs / 60)}m {job.duration_secs % 60}s</span>}
                    <span style={{ fontSize: 11, color: '#8fa3c0' }}>{new Date(job.created_at).toLocaleDateString()}</span>
                  </div>
                  {job.youtube_url && (
                    <a href={job.youtube_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#ef4444', marginTop: 4, display: 'block' }}>
                      ▶ YouTube →
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  {job.video_url && (
                    <button aria-label="Interactive Button" onClick={() => setPreviewJob(job)} style={{
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#e0e0e6', borderRadius: 10, padding: '7px 14px', fontSize: 13, cursor: 'pointer',
                    }}>Preview</button>
                  )}
                  {job.status === 'complete' && !job.admin_approved && !job.admin_rejected && (
                    <>
                      <button aria-label="Interactive Button" disabled={actionLoading[job.id]} onClick={() => approve(job)} style={{
                        background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.3)',
                        color: '#00ff88', borderRadius: 10, padding: '7px 16px', fontSize: 13,
                        cursor: 'pointer', fontWeight: 700, opacity: actionLoading[job.id] ? 0.6 : 1,
                      }}>
                        {actionLoading[job.id] ? '...' : '✓ Approve'}
                      </button>
                      <button aria-label="Interactive Button" disabled={actionLoading[job.id]} onClick={() => reject(job)} style={{
                        background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                        color: '#ef4444', borderRadius: 10, padding: '7px 14px', fontSize: 13,
                        cursor: 'pointer', opacity: actionLoading[job.id] ? 0.6 : 1,
                      }}>
                        ✗ Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Video Preview Modal */}
      {previewJob && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          padding: 24,
        }} onClick={() => setPreviewJob(null)}>
          <div style={{
            background: '#0c0f1a', border: '1px solid #2a3050',
            borderRadius: 20, padding: 28, width: '100%', maxWidth: 760,
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{previewJob.blog_post?.title || previewJob.topic_slug}</div>
                <div style={{ fontSize: 12, color: '#8fa3c0', marginTop: 4 }}>
                  {LANG_FLAGS[previewJob.language]} {previewJob.language.toUpperCase()} · {previewJob.duration_secs ? `${Math.round(previewJob.duration_secs / 60)}m` : '?'}
                </div>
              </div>
              <button aria-label="Interactive Button" onClick={() => setPreviewJob(null)} style={{ background: 'none', border: 'none', color: '#8fa3c0', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {previewJob.video_url && (
              <video controls style={{ width: '100%', borderRadius: 12, background: '#000', maxHeight: 400 }}>
                <source src={previewJob.video_url} type="video/mp4" />
              </video>
            )}

            {!previewJob.admin_approved && !previewJob.admin_rejected && previewJob.status === 'complete' && (
              <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
                <button aria-label="Interactive Button" onClick={() => reject(previewJob)} style={{
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
                  color: '#ef4444', borderRadius: 10, padding: '10px 20px', fontSize: 14, cursor: 'pointer',
                }}>✗ Reject</button>
                <button aria-label="Interactive Button" onClick={() => approve(previewJob)} style={{
                  background: 'linear-gradient(90deg, #00cc66, #00ff88)',
                  color: '#07090f', border: 'none', borderRadius: 10,
                  padding: '10px 24px', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                }}>✓ Approve → Publish to YouTube</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
