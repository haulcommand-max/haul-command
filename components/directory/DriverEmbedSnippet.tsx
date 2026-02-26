import React from 'react';
import { Copy, Code, CheckCircle } from 'lucide-react';

interface DriverEmbedSnippetProps {
    driverId: string;
    driverName: string;
    state: string;
}

export function DriverEmbedSnippet({ driverId, driverName, state }: DriverEmbedSnippetProps) {
    const profileUrl = `https://haulcommand.com/directory/us/${state.toLowerCase()}/profile/${driverId}`;

    const snippet = `<!-- Haul Command Verification Badge -->
<a href="${profileUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-block;border:1px solid #F1A91B;border-radius:8px;padding:8px 16px;background:#0a0a0f;color:#F1A91B;font-family:system-ui,sans-serif;text-decoration:none;font-weight:bold;font-size:14px;box-shadow:0 4px 12px rgba(241,169,27,0.15);">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="display:inline;vertical-align:text-bottom;margin-right:6px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
  Verified on Haul Command
</a>`;

    return (
        <div className="bg-[#0a0a0f] border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#F1A91B]/10 rounded-xl flex items-center justify-center border border-[#F1A91B]/20">
                    <Code className="w-5 h-5 text-[#F1A91B]" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg">Earn Trust & Get More Loads</h3>
                    <p className="text-sm text-slate-400">Embed your verification badge on your own website.</p>
                </div>
            </div>

            <div className="mb-6 flex justify-center py-4 bg-black/50 rounded-lg border border-white/5">
                <a href={profileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', border: '1px solid #F1A91B', borderRadius: '8px', padding: '8px 16px', background: '#0a0a0f', color: '#F1A91B', fontFamily: 'system-ui, sans-serif', textDecoration: 'none', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 4px 12px rgba(241,169,27,0.15)' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    Verified on Haul Command
                </a>
            </div>

            <div className="relative group">
                <textarea
                    readOnly
                    value={snippet}
                    className="w-full bg-slate-950 text-emerald-400 font-mono text-xs p-4 rounded-xl border border-white/10 h-32 focus:outline-none resize-none"
                />
                <button
                    onClick={() => navigator.clipboard.writeText(snippet)}
                    className="absolute top-3 right-3 p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                >
                    <Copy className="w-3.5 h-3.5" />
                    Copy Code
                </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-3 text-center">
                Paste this HTML code into your WordPress, Wix, or Squarespace site footer.
            </p>
        </div>
    );
}
