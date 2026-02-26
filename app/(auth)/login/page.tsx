"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = supabaseBrowser();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: `${location.origin}/auth/callback` },
        });
        setLoading(false);
        if (error) {
            alert(error.message);
        } else {
            alert("Check your email for the login link!");
        }
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 50 }}>
            <h1>Login to Haul Command</h1>
            <form onSubmit={handleLogin} style={{ display: "grid", gap: 10, width: 300 }}>
                <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ padding: 10 }}
                    required
                />
                <button type="submit" disabled={loading} style={{ padding: 10 }}>
                    {loading ? "Sending link..." : "Send Magic Link"}
                </button>
            </form>
        </div>
    );
}
