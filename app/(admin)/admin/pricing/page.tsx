"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/browser";

export default function AdminPricing() {
    const [data, setData] = useState<any[]>([]);
    const supabase = supabaseBrowser();

    const fetchData = async () => {
        const { data } = await supabase.from("pricing_benchmarks").select("*, service_types(label)");
        setData(data || []);
    };

    useEffect(() => { fetchData(); }, []);

    const updateRate = async (id: string, field: string, value: any) => {
        await supabase.from("pricing_benchmarks").update({ [field]: value }).eq("id", id);
        fetchData(); // Refresh to confirm
    };

    return (
        <div>
            <h1>Pricing Benchmarks Management</h1>
            <table width="100%" cellPadding={5}>
                <thead>
                    <tr style={{ textAlign: "left" }}>
                        <th>Service</th>
                        <th>Region</th>
                        <th>Unit</th>
                        <th>Min</th>
                        <th>Max</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map(row => (
                        <tr key={row.id} style={{ borderBottom: "1px solid #eee" }}>
                            <td>{row.service_types?.label}</td>
                            <td>{row.region_key}</td>
                            <td>{row.unit}</td>
                            <td>
                                <input
                                    type="number"
                                    defaultValue={row.min_rate}
                                    onBlur={e => updateRate(row.id, 'min_rate', e.target.value)}
                                    style={{ width: 80 }}
                                />
                            </td>
                            <td>
                                <input
                                    type="number"
                                    defaultValue={row.max_rate}
                                    onBlur={e => updateRate(row.id, 'max_rate', e.target.value)}
                                    style={{ width: 80 }}
                                />
                            </td>
                            <td>
                                <button onClick={() => { if (confirm('Delete?')) supabase.from('pricing_benchmarks').delete().eq('id', row.id).then(fetchData) }}>x</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div style={{ marginTop: 20 }}>
                <p>To add new rows, use the SQL seed file or build a create form here.</p>
            </div>
        </div>
    );
}
