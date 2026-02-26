"use client";

import { useState } from "react";

export default function AIChatPage() {
    const [input, setInput] = useState("");
    const [response, setResponse] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        setLoading(true);
        setResponse(""); // clear previous

        try {
            const res = await fetch("/api/ai/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ input }),
            });

            const data = await res.json();
            if (data.error) throw new Error(JSON.stringify(data.error));

            setResponse(data.text);
        } catch (err: any) {
            setResponse(`Error: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: 600, margin: "20px auto", padding: 20, border: "1px solid #ccc", borderRadius: 8 }}>
            <h2>Haul Command AI Gateway</h2>
            <p style={{ fontSize: 12, color: "#666" }}>Secure server-side proxy to OpenAI. Your API key remains secret.</p>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10, marginTop: 15 }}>
                <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    placeholder="Ask Haul Command..."
                    rows={4}
                    style={{ width: "100%", padding: 10 }}
                />
                <button type="submit" disabled={loading} style={{ padding: 10, background: loading ? "#ccc" : "black", color: "white" }}>
                    {loading ? "Thinking..." : "Send"}
                </button>
            </form>

            {response && (
                <div style={{ marginTop: 20, whiteSpace: "pre-wrap", background: "#f5f5f5", padding: 15, borderRadius: 4 }}>
                    <strong>Response:</strong>
                    <div style={{ marginTop: 5 }}>{response}</div>
                </div>
            )}
        </div>
    );
}
