'use client';

import { useState, useEffect, useCallback } from 'react';

interface SeedEntry {
    id: string;
    company_name: string;
    city: string | null;
    state_abbr: string | null;
    phone: string | null;
    status: string;
    notes: string | null;
}

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-amber-500/20 text-amber-400',
    imported: 'bg-green-500/20 text-green-400',
    duplicate: 'bg-blue-500/20 text-blue-400',
    failed: 'bg-red-500/20 text-red-400',
};

export default function DirectorySeedsPage() {
    const [entries, setEntries] = useState<SeedEntry[]>([]);
    const [stats, setStats] = useState({ pending: 0, imported: 0, duplicate: 0, failed: 0 });
    const [statusFilter, setStatusFilter] = useState('pending');
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [processResult, setProcessResult] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [pasteInput, setPasteInput] = useState('');
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<string | null>(null);

    const fetchEntries = useCallback(async (status: string) => {
        setLoading(true);
        const res = await fetch(`/api/admin/directory/seeds?status=${status}`);
        const data = await res.json();
        setEntries(data.entries ?? []);
        setTotal(data.total ?? 0);
        setLoading(false);
    }, []);

    const fetchStats = useCallback(async () => {
        const statuses = ['pending', 'imported', 'duplicate', 'failed'] as const;
        const counts = { pending: 0, imported: 0, duplicate: 0, failed: 0 };
        await Promise.all(statuses.map(async s => {
            const res = await fetch(`/api/admin/directory/seeds?status=${s}`);
            const d = await res.json();
            counts[s] = d.total ?? 0;
        }));
        setStats(counts);
    }, []);

    useEffect(() => { fetchEntries(statusFilter); }, [statusFilter, fetchEntries]);
    useEffect(() => { fetchStats(); }, [fetchStats]);

    const handleProcessAll = async () => {
        setProcessing(true);
        setProcessResult(null);
        const res = await fetch('/api/admin/directory/seeds/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ limit: 200 }),
        });
        const data = await res.json();
        const r = data.result;
        setProcessResult(`✅ Imported: ${r?.imported ?? 0} · Duplicates: ${r?.duplicate ?? 0} · Failed: ${r?.failed ?? 0}`);
        setProcessing(false);
        fetchEntries(statusFilter);
        fetchStats();
    };

    const handleImport = async () => {
        if (!pasteInput.trim()) return;
        setImporting(true);
        setImportResult(null);
        const lines = pasteInput.trim().split('\n').filter(l => l.trim());
        const rowEntries = lines.map(line => {
            const m = line.match(/^(.+?)\s*[-–|,]\s*(.+?),\s*([A-Z]{2})$/i);
            if (m) return { company_name: m[1].trim(), city: m[2].trim(), state_abbr: m[3].toUpperCase() };
            return { company_name: line.trim() };
        }).filter(e => e.company_name.length > 2);

        const res = await fetch('/api/admin/directory/seeds', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ entries: rowEntries }),
        });
        const data = await res.json();
        setImportResult(`✅ Queued ${data.inserted ?? 0} entries`);
        setPasteInput('');
        setImporting(false);
        fetchEntries(statusFilter);
        fetchStats();
    };

    return (
        <div className="min-h-screen bg-slate-900 text-slate-50 p-6 space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold text-white">Directory Seed Queue</h1>
                <p className="text-slate-400 mt-1">Import competitor listings → unclaimed profiles → claim campaign.</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {Object.entries(stats).map(([s, count]) => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                        className={`rounded-xl p-4 border text-left transition-all ${statusFilter === s ? 'ring-2 ring-amber-500' : ''} ${STATUS_COLORS[s] ?? 'bg-slate-800 border-slate-700'}`}>
                        <div className="text-2xl font-bold">{count}</div>
                        <div className="text-sm capitalize">{s}</div>
                    </button>
                ))}
            </div>

            {/* Process Button */}
            <div className="flex flex-wrap items-center gap-3">
                <button onClick={handleProcessAll} disabled={processing || stats.pending === 0}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-900 font-bold px-5 py-2 rounded-lg transition-colors">
                    {processing ? '⟳ Processing...' : `▶ Process All Pending (${stats.pending})`}
                </button>
                {processResult && <span className="text-sm text-slate-300">{processResult}</span>}
            </div>

            {/* Paste Import */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-5 space-y-3">
                <h2 className="font-bold text-white">Paste Competitor Listings</h2>
                <p className="text-slate-400 text-sm">One per line: <code className="text-amber-400">Company Name - City, ST</code></p>
                <textarea value={pasteInput} onChange={e => setPasteInput(e.target.value)} rows={5}
                    placeholder="1st Amber Lights Pilot Car - Boring, OR&#10;A-1 Pilot Car Inc - Phoenix, AZ"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-sm font-mono resize-y focus:outline-none focus:ring-1 focus:ring-amber-500" />
                <div className="flex items-center gap-3">
                    <button onClick={handleImport} disabled={importing || !pasteInput.trim()}
                        className="bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white font-semibold px-4 py-2 rounded-lg text-sm">
                        {importing ? '⟳ Importing...' : '↑ Queue for Import'}
                    </button>
                    {importResult && <span className="text-sm text-slate-300">{importResult}</span>}
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-700">
                <table className="w-full text-sm">
                    <thead className="bg-slate-800 text-slate-400 text-left">
                        <tr>
                            <th className="px-4 py-3">Company</th>
                            <th className="px-4 py-3">City</th>
                            <th className="px-4 py-3">State</th>
                            <th className="px-4 py-3">Phone</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Loading...</td></tr>
                        ) : entries.length === 0 ? (
                            <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">No entries</td></tr>
                        ) : entries.map(e => (
                            <tr key={e.id} className="border-t border-slate-700/50 hover:bg-slate-800/30">
                                <td className="px-4 py-3 text-white font-medium">{e.company_name}</td>
                                <td className="px-4 py-3 text-slate-400">{e.city ?? '—'}</td>
                                <td className="px-4 py-3 text-slate-400">{e.state_abbr ?? '—'}</td>
                                <td className="px-4 py-3 text-slate-400">{e.phone ?? '—'}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[e.status] ?? ''}`}>{e.status}</span>
                                </td>
                                <td className="px-4 py-3 text-slate-500 text-xs">{e.notes ?? '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {total > 0 && <p className="text-slate-500 text-sm">{total} total entries · showing {entries.length}</p>}
        </div>
    );
}
