"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function AdminApprovals() {
    const [claims, setClaims] = useState<any[]>([]);
    const supabase = supabaseBrowser();

    const fetchClaims = () => {
        supabase.from("driver_claims").select("*").eq("status", "pending").order("created_at")
            .then(({ data }) => setClaims(data ?? []));
    };

    useEffect(fetchClaims, []);

    const decide = async (id: string, status: "approved" | "rejected") => {
        await supabase.from("driver_claims").update({ status, decided_at: new Date() }).eq("id", id);
        // Logic: if approved, trigger edge function to update driver_profile.is_verified = true
        // For now, just update claim status locally
        fetchClaims();
    };

    return (
        <div>
            <h1>pending approvals</h1>
            {claims.length === 0 && <p>inbox zero</p>}
            {claims.map(c => (
                <div key={c.id} style={{ border: "1px solid #333", padding: 10, margin: 10 }}>
                    <div><strong>driver:</strong> {c.driver_id}</div>
                    <pre>{JSON.stringify(c.submitted_payload, null, 2)}</pre>
                    <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={() => decide(c.id, "approved")}>approve</button>
                        <button onClick={() => decide(c.id, "rejected")}>reject</button>
                    </div>
                </div>
            ))}
        </div>
    );
}
