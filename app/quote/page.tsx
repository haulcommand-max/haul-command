"use client";

import { useEffect, useState } from "react";
import { calculateRange, PricingBenchmark } from "@/lib/pricing";

export default function QuoteWizard() {
    const [services, setServices] = useState<any[]>([]);
    const [benchmarks, setBenchmarks] = useState<PricingBenchmark[]>([]);
    const [regions, setRegions] = useState<any[]>([]);

    const [form, setForm] = useState({
        service_key: "",
        region_key: "",
        miles: 0,
        days: 1,
        addons: [] as string[]
    });

    const [quote, setQuote] = useState<any>(null);

    useEffect(() => {
        // Load initial data
        fetch("/api/public/services").then(r => r.json()).then(data => {
            setServices(data || []);
            // Flat map benchmarks for local calc
            const allBenchmarks = (data || []).flatMap((s: any) => s.pricing_benchmarks || []);
            setBenchmarks(allBenchmarks);
        });
        // Hardcoded regions for MVP or fetch if API exists
        setRegions([
            { key: "southeast", label: "Southeast" },
            { key: "midwest", label: "Midwest" },
            { key: "northeast", label: "Northeast" },
            { key: "southwest", label: "Southwest" },
            { key: "west_coast", "label": "West Coast" },
            { key: "all", label: "National" }
        ]);
    }, []);

    const handleCalculate = () => {
        const result = calculateRange(form, benchmarks);
        setQuote(result);
    };

    return (
        <div style={{ maxWidth: 600, margin: "0 auto", padding: 20, border: "1px solid #ccc" }}>
            <h2>Smart Quote Calculator</h2>

            <div style={{ display: "grid", gap: 15 }}>
                <label>
                    Service Type
                    <select style={{ width: "100%", padding: 8 }} onChange={e => setForm({ ...form, service_key: e.target.value })}>
                        <option value="">Select...</option>
                        {services.filter(s => s.category === 'service').map(s => <option key={s.service_key} value={s.service_key}>{s.label}</option>)}
                    </select>
                </label>

                <label>
                    Region
                    <select style={{ width: "100%", padding: 8 }} onChange={e => setForm({ ...form, region_key: e.target.value })}>
                        <option value="">Select...</option>
                        {regions.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                    </select>
                </label>

                <label>
                    Total Miles
                    <input type="number" style={{ width: "100%", padding: 8 }} value={form.miles} onChange={e => setForm({ ...form, miles: Number(e.target.value) })} />
                </label>

                <label>
                    Est. Days
                    <input type="number" style={{ width: "100%", padding: 8 }} value={form.days} onChange={e => setForm({ ...form, days: Number(e.target.value) })} />
                </label>

                <div>
                    <label>Add-ons</label>
                    {services.filter(s => s.category === 'addon').map(s => (
                        <div key={s.service_key}>
                            <label>
                                <input type="checkbox" onChange={e => {
                                    if (e.target.checked) setForm({ ...form, addons: [...form.addons, s.service_key] });
                                    else setForm({ ...form, addons: form.addons.filter(x => x !== s.service_key) });
                                }} /> {s.label}
                            </label>
                        </div>
                    ))}
                </div>

                <button onClick={handleCalculate} style={{ padding: 10, background: "black", color: "white", fontWeight: "bold" }}>Calculate Fair Range</button>
            </div>

            {quote && (
                <div style={{ marginTop: 20, padding: 15, background: "#f5f5f5" }}>
                    <h3>Recommended: ${quote.min.toFixed(2)} - ${quote.max.toFixed(2)}</h3>
                    <p style={{ fontSize: 12 }}>Based on market data for {form.miles} miles.</p>
                    <ul>
                        {quote.lineItems.map((l: any, i: number) => (
                            <li key={i}>{l.label}: ${l.min.toFixed(2)} - ${l.max.toFixed(2)} ({l.unit})</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
