"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function AdminFlags() {
    const [flags, setFlags] = useState<any[]>([]);
    const supabase = supabaseBrowser();

    useEffect(() => {
        supabase.from("feature_flags").select("*").order("key").then(({ data }) => setFlags(data ?? []));
    }, []);

    const toggleFlag = async (key: string, enabled: boolean) => {
        setFlags(f => f.map(x => x.key === key ? { ...x, enabled } : x));

        await fetch("/api/admin-set-setting", {
            method: "POST",
            body: JSON.stringify({ table: "feature_flags", key, enabled })
        });
    };

    return (
        <div>
            <h1>feature flags</h1>
            <ul>
                {flags.map(f => (
                    <li key={f.key} style={{ display: "flex", gap: 10, margin: 5 }}>
                        <input type="checkbox" checked={f.enabled} onChange={(e) => toggleFlag(f.key, e.target.checked)} />
                        <strong>{f.key}</strong>
                        <span style={{ fontSize: 12, opacity: 0.7 }}>{JSON.stringify(f.rules)}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
