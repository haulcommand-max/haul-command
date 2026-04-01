"use client";
import { useEffect, useState } from "react";

interface AbuseFlag {
    id: string;
    profile_id: string | null;
    entity_type: string;
    entity_id: string | null;
    flag_type: string;
    severity: number;
    notes: string | null;
    created_at: string;
    resolved_at: string | null;
}

const SEV_COLORS: Record<number, string> = {
    1: "text-gray-400",
    2: "text-yellow-400",
    3: "text-orange-400",
    4: "text-red-400",
    5: "text-red-300 font-bold",
};

export default function AdminAbusePage() {
    const [flags, setFlags] = useState<AbuseFlag[]>([]);
    const [loading, setLoading] = useState(true);
    const [resolving, setResolving] = useState<string | null>(null);

    async function fetch_flags() {
        const res = await fetch("/api/admin/abuse?open=1");
        if (res.ok) setFlags(await res.json());
        setLoading(false);
    }

    useEffect(() => { fetch_flags(); }, []);

    async function resolve(id: string) {
        setResolving(id);
        await fetch("/api/admin/abuse/resolve", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id }),
        });
        setFlags((prev) => prev.filter((f) => f.id !== id));
        setResolving(null);
    }

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <header className="px-5 pt-8 pb-4 border-b border-gray-800">
                <h1 className="text-2xl font-black">Abuse Flags</h1>
                <p className="text-gray-400 text-sm">Open: {flags.length}</p>
            </header>

            <div className="p-5">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : flags.length === 0 ? (
                    <div className="text-center py-20 text-gray-600">
                        <p className="text-4xl mb-3">✓</p>
                        <p>No open flags</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {flags.map((flag) => (
                            <div
                                key={flag.id}
                                className="bg-gray-900 border border-gray-800 rounded-xl p-4"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`text-xs font-bold uppercase ${SEV_COLORS[flag.severity] ?? SEV_COLORS[2]}`}>
                                                SEV-{flag.severity}
                                            </span>
                                            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded-full">
                                                {flag.flag_type}
                                            </span>
                                            <span className="text-xs text-gray-600">{flag.entity_type}</span>
                                        </div>
                                        <p className="text-sm text-gray-300 truncate">{flag.notes ?? "No notes"}</p>
                                        <p className="text-xs text-gray-600 mt-1">
                                            {new Date(flag.created_at).toLocaleString()}
                                            {flag.entity_id && <> · entity: {flag.entity_id.slice(0, 8)}…</>}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => resolve(flag.id)}
                                        disabled={resolving === flag.id}
                                        className="shrink-0 text-xs px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors disabled:opacity-60"
                                    >
                                        {resolving === flag.id ? "…" : "Resolve"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
