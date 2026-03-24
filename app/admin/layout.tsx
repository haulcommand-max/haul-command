import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin — AI Command Center | Haul Command',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Admin top bar */}
      <nav className="border-b border-white/5 bg-black/50 px-4 py-3 flex items-center gap-6">
        <a href="/admin" className="flex items-center gap-2">
          <div className="w-6 h-6 bg-amber-500 rounded flex items-center justify-center text-black font-bold text-xs">HC</div>
          <span className="text-sm font-bold text-white">Admin</span>
        </a>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <a href="/admin/ai-costs" className="hover:text-amber-400 transition-colors">🧠 AI Costs</a>
          <a href="/admin/batch-jobs" className="hover:text-amber-400 transition-colors">🚀 Batch Jobs</a>
          <a href="/admin/directory" className="hover:text-amber-400 transition-colors">🗂️ Directory</a>
          <a href="/admin/content" className="hover:text-amber-400 transition-colors">✏️ Content</a>
          <a href="/admin/revenue" className="hover:text-amber-400 transition-colors">💰 Revenue</a>
          <a href="/admin/trust" className="hover:text-amber-400 transition-colors">🚨 Trust</a>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <a href="/route-check" target="_blank" className="text-xs text-gray-600 hover:text-amber-400 transition-colors">
            /route-check ↗
          </a>
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
