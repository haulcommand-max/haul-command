import Link from "next/link";
import { ChevronRight } from "lucide-react";

const POPULAR_STATES = [
    { code: 'fl', name: 'Florida' },
    { code: 'tx', name: 'Texas' },
    { code: 'ga', name: 'Georgia' },
    { code: 'ca', name: 'California' },
    { code: 'oh', name: 'Ohio' },
    { code: 'pa', name: 'Pennsylvania' }
];

export default function RatesIndex() {
    return (
        <main className="page-container" style={{ padding: '2rem 1rem', minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <h1 style={{ margin: 0, fontSize: 32, fontWeight: 900, color: '#f9fafb', letterSpacing: -0.5, marginBottom: 12 }}>
                    Market <span style={{ color: '#F1A91B' }}>Rates</span>
                </h1>
                <p style={{ color: '#9ca3af', fontSize: 16, marginBottom: 32 }}>
                    Select a state to view pilot car cost intelligence. Market insights are updated continuously based on live Haul Command data.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
                    {POPULAR_STATES.map(s => (
                        <Link key={s.code} href={`/rates/${s.code}/pilot-car-cost`} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '16px 20px', background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, textDecoration: 'none', color: '#f9fafb',
                            fontWeight: 600
                        }}>
                            {s.name}
                            <ChevronRight style={{ width: 16, height: 16, color: '#6b7280' }} />
                        </Link>
                    ))}
                </div>
            </div>
        </main>
    );
}
