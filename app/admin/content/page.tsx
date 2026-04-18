'use client';

import { useEffect, useState } from 'react';

type ContentItem = {
  id: string;
  topic: string;
  content_type: string;
  target_audience: string;
  status: string;
  scheduled_for: string | null;
  published_url: string | null;
  generated_content: string | null;
  created_at: string;
};

type PartnerInquiry = {
  id: string;
  company: string;
  role: string;
  primary_interest: string;
  email: string;
  corridors_or_regions: string | null;
  loads_per_month: string | null;
  status: string;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  queued: 'bg-[#1A1A1A]0/20 text-gray-400',
  generating: 'bg-blue-500/20 text-blue-400',
  generated: 'bg-amber-500/20 text-amber-400',
  published: 'bg-green-500/20 text-green-400',
  failed: 'bg-red-500/20 text-red-400',
  ready_to_post: 'bg-purple-500/20 text-purple-400',
  script_ready: 'bg-cyan-500/20 text-cyan-400',
  rejected: 'bg-red-500/20 text-red-400',
};

const TYPE_LABELS: Record<string, string> = {
  blog_article: '\ud83d\udcdd Blog',
  linkedin_post: '\ud83d\udcbc LinkedIn',
  youtube_script: '\ud83c\udfa5 YouTube',
  regulation_page: '\ud83d\udcdc Regulation',
  corridor_page: '\ud83d\uddfa Corridor',
};

export default function AdminContentPage() {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'linkedin' | 'youtube' | 'inquiries'>('pipeline');
  const [items, setItems] = useState<ContentItem[]>([]);
  const [inquiries, setInquiries] = useState<PartnerInquiry[]>([]);
  const [preview, setPreview] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    load();
  }, [activeTab]);

  async function load() {
    setLoading(true);
    const [itemsRes, inquiriesRes, metricsRes] = await Promise.all([
      fetch('/api/admin/content'),
      fetch('/api/admin/inquiries'),
      fetch('/api/admin/content/metrics'),
    ]);
    if (itemsRes.ok) setItems(await itemsRes.json());
    if (inquiriesRes.ok) setInquiries(await inquiriesRes.json());
    if (metricsRes.ok) setMetrics(await metricsRes.json());
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/content/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  }

  async function updateInquiry(id: string, status: string) {
    await fetch(`/api/admin/inquiries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    load();
  }

  const linkedinItems = items.filter(i => i.content_type === 'linkedin_post' && i.status === 'ready_to_post');
  const youtubeItems = items.filter(i => i.content_type === 'youtube_script' && i.status === 'script_ready');

  return (
    <div className=" bg-[#0a0a0a] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Content Command Center</h1>
          <button aria-label="Interactive Button"
            onClick={() => fetch('/api/cron/content-engine', {
              headers: { 'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ''}` }
            }).then(() => load())}
            className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm hover:bg-amber-500/30 transition-colors"
          >
            \u25b6 Run Content Engine
          </button>
        </div>

        {/* Metrics */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-2xl font-bold text-amber-400">{metrics.published_this_month}</p>
              <p className="text-xs text-gray-500">Articles this month</p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-2xl font-bold text-purple-400">{metrics.linkedin_pending}</p>
              <p className="text-xs text-gray-500">LinkedIn pending</p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-2xl font-bold text-cyan-400">{metrics.youtube_scripts}</p>
              <p className="text-xs text-gray-500">YouTube scripts ready</p>
            </div>
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-2xl font-bold text-green-400">{metrics.new_inquiries}</p>
              <p className="text-xs text-gray-500">Partner inquiries</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'pipeline', label: '\ud83d\udce5 Content Pipeline' },
            { id: 'linkedin', label: `\ud83d\udcbc LinkedIn (${linkedinItems.length})` },
            { id: 'youtube', label: `\ud83c\udfa5 YouTube (${youtubeItems.length})` },
            { id: 'inquiries', label: `\ud83e\udd1d Inquiries (${inquiries.filter(i => i.status === 'new').length})` },
          ].map(tab => (
            <button aria-label="Interactive Button"
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Pipeline Tab */}
        {activeTab === 'pipeline' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-white/10">
                  <th className="pb-3 pr-4">Type</th>
                  <th className="pb-3 pr-4">Topic</th>
                  <th className="pb-3 pr-4">Audience</th>
                  <th className="pb-3 pr-4">Status</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {items.map(item => (
                  <tr key={item.id} className="py-3">
                    <td className="py-3 pr-4 text-xs text-gray-400">{TYPE_LABELS[item.content_type] || item.content_type}</td>
                    <td className="py-3 pr-4 max-w-xs">
                      <p className="truncate">{item.topic}</p>
                      {item.published_url && (
                        <a href={item.published_url} className="text-xs text-amber-400 hover:underline">{item.published_url}</a>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-500">{item.target_audience}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS_COLORS[item.status] || 'bg-[#1A1A1A]0/20 text-gray-400'}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        {item.generated_content && (
                          <button aria-label="Interactive Button"
                            onClick={() => setPreview(item)}
                            className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-xs"
                          >
                            Preview
                          </button>
                        )}
                        {item.status === 'generated' && (
                          <button aria-label="Interactive Button"
                            onClick={() => updateStatus(item.id, 'published')}
                            className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-xs"
                          >
                            Publish
                          </button>
                        )}
                        {item.status !== 'rejected' && item.status !== 'published' && (
                          <button aria-label="Interactive Button"
                            onClick={() => updateStatus(item.id, 'rejected')}
                            className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded text-xs"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* LinkedIn Tab */}
        {activeTab === 'linkedin' && (
          <div className="space-y-4">
            {linkedinItems.length === 0 && (
              <div className="text-center py-12 text-gray-600">No LinkedIn posts ready. Run the content engine to generate more.</div>
            )}
            {linkedinItems.map(item => (
              <div key={item.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                <p className="text-xs text-gray-500 mb-3">{item.target_audience} \u2022 {new Date(item.created_at).toLocaleDateString()}</p>
                <p className="whitespace-pre-wrap text-gray-300 text-sm mb-4">{item.generated_content}</p>
                <div className="flex gap-3">
                  <button aria-label="Interactive Button"
                    onClick={() => { navigator.clipboard.writeText(item.generated_content || ''); updateStatus(item.id, 'published'); }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white font-medium rounded-lg text-sm"
                  >
                    Copy + Mark Approved
                  </button>
                  <button aria-label="Interactive Button"
                    onClick={() => updateStatus(item.id, 'rejected')}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* YouTube Tab */}
        {activeTab === 'youtube' && (
          <div className="space-y-4">
            {youtubeItems.length === 0 && (
              <div className="text-center py-12 text-gray-600">No YouTube scripts ready. Run the content engine to generate more.</div>
            )}
            {youtubeItems.map(item => (
              <div key={item.id} className="p-6 bg-white/5 border border-white/10 rounded-2xl">
                <h3 className="font-bold mb-1">{item.topic}</h3>
                <p className="text-xs text-gray-500 mb-4">{item.target_audience} \u2022 {new Date(item.created_at).toLocaleDateString()}</p>
                <div className="bg-[#0d0d0d] rounded-xl p-4 max-h-60 overflow-y-auto mb-4">
                  <pre className="text-xs text-gray-400 whitespace-pre-wrap font-mono">{item.generated_content}</pre>
                </div>
                <div className="flex gap-3">
                  <button aria-label="Interactive Button"
                    onClick={() => navigator.clipboard.writeText(item.generated_content || '')}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white font-medium rounded-lg text-sm"
                  >
                    Copy Script
                  </button>
                  <button aria-label="Interactive Button"
                    onClick={() => updateStatus(item.id, 'published')}
                    className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm"
                  >
                    Mark Recorded
                  </button>
                  <button aria-label="Interactive Button"
                    onClick={() => updateStatus(item.id, 'rejected')}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 rounded-lg text-sm"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Inquiries Tab */}
        {activeTab === 'inquiries' && (
          <div className="space-y-3">
            {inquiries.length === 0 && (
              <div className="text-center py-12 text-gray-600">No partner inquiries yet.</div>
            )}
            {inquiries.map(inq => (
              <div key={inq.id} className={`p-5 bg-white/5 border rounded-xl ${
                inq.status === 'new' ? 'border-amber-500/30' : 'border-white/10'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-bold">{inq.company}</p>
                    <p className="text-sm text-gray-400">{inq.role} \u2022 {inq.primary_interest}</p>
                    <p className="text-sm text-amber-400">{inq.email}</p>
                    {inq.corridors_or_regions && (
                      <p className="text-xs text-gray-500 mt-1">Corridors: {inq.corridors_or_regions}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-1">{new Date(inq.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      inq.status === 'new' ? 'bg-amber-500/20 text-amber-400' :
                      inq.status === 'contacted' ? 'bg-green-500/20 text-green-400' :
                      'bg-[#1A1A1A]0/20 text-gray-400'
                    }`}>{inq.status}</span>
                    {inq.status === 'new' && (
                      <button aria-label="Interactive Button"
                        onClick={() => updateInquiry(inq.id, 'contacted')}
                        className="px-2 py-0.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded text-xs"
                      >
                        Mark Contacted
                      </button>
                    )}
                    <button aria-label="Interactive Button"
                      onClick={() => updateInquiry(inq.id, 'archived')}
                      className="px-2 py-0.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded text-xs"
                    >
                      Archive
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preview Modal */}
        {preview && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setPreview(null)}
          >
            <div
              className="bg-[#111] border border-white/10 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">{preview.topic}</h3>
                <button aria-label="Interactive Button" onClick={() => setPreview(null)} className="text-gray-500 hover:text-white">\u00d7</button>
              </div>
              <div
                className="prose prose-invert prose-sm max-w-none text-gray-300"
                dangerouslySetInnerHTML={{ __html: preview.generated_content || '' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}