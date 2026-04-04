'use client';

import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const AMBER = "#BA7517";
const AMBER_LIGHT = "#FAEEDA";
const AMBER_DARK = "#633806";

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 500,
  color: "var(--color-text-tertiary)", letterSpacing: "0.06em",
  textTransform: "uppercase", marginBottom: 4
};

const FW_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  "Cole Gordon":    { bg: "#E6F1FB", border: "#378ADD", text: "#0C447C", badge: "#185FA5" },
  "Billy Gene Shaw":{ bg: "#FAEEDA", border: "#EF9F27", text: "#633806", badge: "#BA7517" },
  "Alex Hormozi":   { bg: "#EAF3DE", border: "#639922", text: "#173404", badge: "#3B6D11" },
};

const ADVERTISER_TYPES = [
  "Insurance Provider","Permit Filing Service","Equipment Supplier",
  "Fuel Card Provider","Route Survey Company","Training & Certification",
  "Factoring Company","Pilot Car Operator","Carrier / Trucking Company","Load Board / Broker"
];
const AUDIENCES = [
  "Pilot Car Operators","Heavy Haul Carriers","Freight Brokers",
  "Owner-Operators","Fleet Managers","Permit Agents","Dispatchers","CDL Drivers"
];
const COUNTRIES = [
  "United States","Canada","Australia","United Kingdom",
  "Germany","Netherlands","Brazil","South Africa","UAE","New Zealand","All 120 Countries"
];
const CORRIDORS = [
  "All Corridors","I-10 (LA→FL)","I-40 (CA→NC)","US-2 (MT→WA)",
  "I-80 (CA→NJ)","Trans-Canada Highway","A1/M1 (UK)","Pacific Hwy (AU)"
];

interface AdVariant {
  framework: string;
  headline: string;
  subheadline: string;
  body: string;
  cta: string;
  image_prompt: string;
}

function AdGenerator() {
  const [advertiserType, setAdvertiserType] = useState("");
  const [audience, setAudience] = useState<string[]>([]);
  const [country, setCountry] = useState("United States");
  const [corridor, setCorridor] = useState("All Corridors");
  const [offer, setOffer] = useState("");
  const [frameworks, setFrameworks] = useState<string[]>(["Cole Gordon","Billy Gene Shaw","Alex Hormozi"]);
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState<AdVariant[] | null>(null);
  const [copied, setCopied] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleAudience = (a: string) =>
    setAudience(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const toggleFramework = (fw: string) =>
    setFrameworks(prev => prev.includes(fw) ? prev.filter(x => x !== fw) : [...prev, fw]);

  const generateAds = async () => {
    if (!advertiserType || !offer.trim()) {
      setError("Advertiser type and offer description are required.");
      return;
    }
    setError(null);
    setLoading(true);
    setVariants(null);
    try {
      // Intentionally routed through a Next.js API route if you don't have direct access here.
      // E.g. implement POST /api/adgrid/claude
      const resp = await fetch("/api/adgrid/claude", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          advertiserType,
          audience: audience.length ? audience.join(", ") : "Heavy haul industry operators",
          country,
          corridor,
          offer,
          frameworks: frameworks.join(", ")
        })
      });
      const data = await resp.json();
      setVariants(data.variants);
    } catch (err) {
      setError("Generation failed — check your configuration and try again.");
      console.error(err);
    }
    setLoading(false);
  };

  const copyAll = (v: AdVariant, i: number) => {
    const t = `${v.headline}\n${v.subheadline}\n\n${v.body}\n\nCTA: ${v.cta}\n\nImage prompt: ${v.image_prompt}`;
    navigator.clipboard.writeText(t);
    setCopied(i);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "330px 1fr", minHeight: 580 }}>
      {/* Config */}
      <div style={{ borderRight: "0.5px solid var(--color-border-tertiary)", padding: "1.25rem", overflowY: "auto", display: "flex", flexDirection: "column", gap: 14 }}>
        <p style={{ ...labelStyle, margin: 0 }}>Campaign Setup</p>

        <div>
          <label style={labelStyle}>Advertiser Type</label>
          <select value={advertiserType} onChange={e => setAdvertiserType(e.target.value)} style={{ width: "100%", background: '#0a0a0c', border: '1px solid #333', color: '#fff', padding: 8, borderRadius: 6 }}>
            <option value="">Select type...</option>
            {ADVERTISER_TYPES.map(t => <option key={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Target Audience</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {AUDIENCES.map(a => (
              <button key={a} onClick={() => toggleAudience(a)} style={{
                fontSize: 11, padding: "4px 9px", borderRadius: 20, cursor: "pointer", transition: "all 0.12s",
                border: `0.5px solid ${audience.includes(a) ? AMBER : "var(--color-border-secondary)"}`,
                background: audience.includes(a) ? AMBER_LIGHT : "transparent",
                color: audience.includes(a) ? AMBER_DARK : "var(--color-text-secondary)"
              }}>{a}</button>
            ))}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <label style={labelStyle}>Market</label>
            <select value={country} onChange={e => setCountry(e.target.value)} style={{ width: "100%", fontSize: 12, background: '#0a0a0c', border: '1px solid #333', color: '#fff', padding: 8, borderRadius: 6 }}>
              {COUNTRIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Corridor</label>
            <select value={corridor} onChange={e => setCorridor(e.target.value)} style={{ width: "100%", fontSize: 12, background: '#0a0a0c', border: '1px solid #333', color: '#fff', padding: 8, borderRadius: 6 }}>
              {CORRIDORS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Offer Description</label>
          <textarea
            value={offer}
            onChange={e => setOffer(e.target.value)}
            placeholder="What are you selling? Price, key benefits, guarantees, risk reversals, what makes it a no-brainer..."
            style={{ width: "100%", height: 90, resize: "vertical", fontFamily: "var(--font-sans)", fontSize: 13, boxSizing: "border-box", background: '#0a0a0c', border: '1px solid #333', color: '#fff', padding: 8, borderRadius: 6 }}
          />
        </div>

        <div>
          <label style={labelStyle}>Frameworks</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {["Cole Gordon","Billy Gene Shaw","Alex Hormozi"].map(fw => {
              const c = FW_COLORS[fw];
              const active = frameworks.includes(fw);
              return (
                <div key={fw} onClick={() => toggleFramework(fw)} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                  border: `0.5px solid ${active ? c.border : "var(--color-border-tertiary)"}`,
                  borderRadius: "var(--border-radius-md)",
                  background: active ? c.bg : "transparent",
                  cursor: "pointer", transition: "all 0.12s"
                }}>
                  <div style={{
                    width: 13, height: 13, borderRadius: 3, flexShrink: 0, transition: "all 0.12s",
                    background: active ? c.badge : "transparent",
                    border: `1.5px solid ${active ? c.badge : "var(--color-border-secondary)"}`
                  }} />
                  <span style={{ fontSize: 12, fontWeight: active ? 500 : 400, color: active ? c.text : "var(--color-text-secondary)" }}>{fw}</span>
                </div>
              );
            })}
          </div>
        </div>

        {error && <p style={{ fontSize: 12, color: "var(--color-text-danger)", margin: 0 }}>{error}</p>}

        <button onClick={generateAds} disabled={loading} style={{
          padding: "11px", background: loading ? "var(--color-background-secondary)" : AMBER,
          color: loading ? "var(--color-text-tertiary)" : "#fff",
          border: "none", borderRadius: "var(--border-radius-md)",
          fontWeight: 500, fontSize: 14, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.15s"
        }}>
          {loading ? "Generating..." : "Generate Ad Variants"}
        </button>
      </div>

      {/* Output */}
      <div style={{ padding: "1.25rem", overflowY: "auto" }}>
        {!variants && !loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10 }}>
            <div style={{ fontSize: 40, opacity: 0.15, lineHeight: 1 }}>◈</div>
            <p style={{ fontSize: 14, color: "var(--color-text-tertiary)", margin: 0 }}>Configure and generate AI-powered ad variants</p>
            <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", margin: 0, opacity: 0.7 }}>Cole Gordon · Billy Gene Shaw · Alex Hormozi</p>
          </div>
        )}

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 14 }}>
            <div style={{ width: 36, height: 36, border: `3px solid ${AMBER_LIGHT}`, borderTop: `3px solid ${AMBER}`, borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>Applying frameworks to your offer...</p>
          </div>
        )}

        {variants && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {variants.map((v, i) => {
              const c = FW_COLORS[v.framework] || FW_COLORS["Cole Gordon"];
              return (
                <div key={i} style={{ border: `0.5px solid ${c.border}`, borderRadius: "var(--border-radius-lg)", overflow: "hidden" }}>
                  <div style={{ background: c.bg, padding: "8px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", color: c.text }}>{v.framework} Framework</span>
                    <button onClick={() => copyAll(v, i)} style={{
                      fontSize: 11, padding: "3px 10px", borderRadius: 12,
                      border: `0.5px solid ${c.border}`, background: "transparent",
                      color: c.text, cursor: "pointer"
                    }}>{copied === i ? "Copied!" : "Copy All"}</button>
                  </div>
                  <div style={{ padding: "1rem 1.25rem", background: '#0e0e11' }}>
                    <p style={{ fontSize: 17, fontWeight: 500, margin: "0 0 4px", color: "var(--color-text-primary)", lineHeight: 1.35 }}>{v.headline}</p>
                    <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 10px" }}>{v.subheadline}</p>
                    <p style={{ fontSize: 13, color: "var(--color-text-primary)", margin: "0 0 12px", lineHeight: 1.65 }}>{v.body}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                      <span style={{ padding: "6px 18px", borderRadius: 4, background: c.badge, color: "#fff", fontSize: 13, fontWeight: 500 }}>{v.cta}</span>
                      <button onClick={() => { navigator.clipboard.writeText(v.cta); setCopied(`cta${i}`); setTimeout(() => setCopied(null), 2000); }} style={{
                        fontSize: 11, padding: "3px 8px", borderRadius: 12,
                        border: "0.5px solid var(--color-border-tertiary)", background: "transparent",
                        color: "var(--color-text-tertiary)", cursor: "pointer"
                      }}>{copied === `cta${i}` ? "Copied" : "Copy CTA"}</button>
                    </div>
                    <div style={{ padding: "8px 12px", background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)" }}>
                      <p style={{ ...labelStyle, margin: "0 0 3px" }}>Image Prompt</p>
                      <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0, lineHeight: 1.55 }}>{v.image_prompt}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style dangerouslySetInnerHTML={{ __html:`@keyframes spin { to { transform: rotate(360deg); } }` }} />
    </div>
  );
}

function ROIDashboard() {
  const [range, setRange] = useState("30d");
  const [campaign, setCampaign] = useState("All Campaigns");

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;

  const perfData = Array.from({ length: days }, (_, i) => ({
    day: i + 1,
    impressions: Math.floor(750 + Math.sin(i / 2.8) * 280 + Math.random() * 180),
    clicks: Math.floor(38 + Math.sin(i / 3.5) * 18 + Math.random() * 25),
    leads: Math.floor(4 + Math.sin(i / 4.5) * 3 + Math.random() * 6)
  }));

  const totImpressions = perfData.reduce((a, b) => a + b.impressions, 0);
  const totClicks = perfData.reduce((a, b) => a + b.clicks, 0);
  const totLeads = perfData.reduce((a, b) => a + b.leads, 0);
  const ctr = ((totClicks / totImpressions) * 100).toFixed(2);
  const spend = Math.round(totImpressions * 0.0042);
  const cpl = (spend / totLeads).toFixed(0);
  const pipeline = totLeads * 340;
  const roi = Math.round(((pipeline - spend) / spend) * 100);

  const metrics = [
    { label: "Impressions",     value: totImpressions.toLocaleString(), sub: `${ctr}% CTR`          },
    { label: "Clicks",          value: totClicks.toLocaleString(),      sub: "Unique engagements"    },
    { label: "Leads",           value: totLeads.toLocaleString(),       sub: `$${cpl} cost per lead` },
    { label: "Ad Spend",        value: `$${spend.toLocaleString()}`,    sub: "USD"                   },
    { label: "Est. Pipeline",   value: `$${pipeline.toLocaleString()}`, sub: `${roi}% ROI`           },
  ];

  const corridors = [
    { name: "I-10  LA → FL", leads: 89, impressions: 14200, spend: 284 },
    { name: "I-40  CA → NC", leads: 74, impressions: 11800, spend: 236 },
    { name: "I-80  CA → NJ", leads: 61, impressions: 9600,  spend: 192 },
    { name: "US-2  MT → WA", leads: 52, impressions: 8400,  spend: 168 },
    { name: "Trans-Canada",  leads: 38, impressions: 6200,  spend: 124 },
  ];

  const audience = [
    { name: "Pilot Car Ops", value: 38, color: AMBER      },
    { name: "Carriers",      value: 28, color: "#0F6E56"  },
    { name: "Brokers",       value: 19, color: "#185FA5"  },
    { name: "Owner-Ops",     value: 15, color: "#7F77DD"  },
  ];

  return (
    <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <select value={campaign} onChange={e => setCampaign(e.target.value)} style={{ fontSize: 13, background: '#0a0a0c', border: '1px solid #333', color: '#fff', padding: '6px 10px', borderRadius: 6 }}>
          {["All Campaigns","Insurance Providers","Permit Services","Equipment Suppliers","Fuel Cards"].map(c => <option key={c}>{c}</option>)}
        </select>
        <div style={{ display: "flex", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", overflow: "hidden" }}>
          {["7d","30d","90d"].map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: "5px 13px", fontSize: 12, border: "none", cursor: "pointer",
              borderLeft: r !== "7d" ? "0.5px solid var(--color-border-tertiary)" : "none",
              background: range === r ? "var(--color-background-secondary)" : "transparent",
              color: range === r ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
              fontWeight: range === r ? 500 : 400
            }}>{r}</button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 8 }}>
        {metrics.map((m, i) => (
          <div key={i} style={{ background: "var(--color-background-secondary)", borderRadius: "var(--border-radius-md)", padding: "0.875rem 1rem" }}>
            <p style={{ ...labelStyle, margin: "0 0 4px" }}>{m.label}</p>
            <p style={{ fontSize: 18, fontWeight: 500, margin: "0 0 2px", color: "var(--color-text-primary)" }}>{m.value}</p>
            <p style={{ fontSize: 11, color: "var(--color-text-secondary)", margin: 0 }}>{m.sub}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 12 }}>
        <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem" }}>
          <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 1rem", color: "var(--color-text-primary)" }}>Performance over time</p>
          <div style={{ position: "relative", height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={perfData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(130,130,130,0.12)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#888" }} tickLine={false} axisLine={false} interval={Math.floor(days / 6)} />
                <YAxis tick={{ fontSize: 10, fill: "#888" }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, background: '#121214', border: '1px solid #333' }} />
                <Line type="monotone" dataKey="impressions" stroke={AMBER}    strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="clicks"      stroke="#185FA5"  strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="leads"       stroke="#0F6E56"  strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: 11, color: "var(--color-text-secondary)" }}>
            {[["Impressions", AMBER],["Clicks","#185FA5"],["Leads","#0F6E56"]].map(([lbl, col]) => (
              <span key={lbl} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 10, height: 2, background: col, display: "inline-block", borderRadius: 1 }}></span>{lbl}
              </span>
            ))}
          </div>
        </div>

        <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", padding: "1rem 1.25rem" }}>
          <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 0.5rem", color: "var(--color-text-primary)" }}>Audience breakdown</p>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={audience} cx="50%" cy="50%" outerRadius={68} dataKey="value" strokeWidth={0}>
                  {audience.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, background: '#121214', border: '1px solid #333' }} formatter={v => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {audience.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 7, height: 7, borderRadius: 2, background: a.color, display: "inline-block" }}></span>
                  <span style={{ color: "var(--color-text-secondary)" }}>{a.name}</span>
                </span>
                <span style={{ fontWeight: 500, color: "var(--color-text-primary)" }}>{a.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Corridor Table */}
      <div style={{ border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-lg)", overflow: "hidden" }}>
        <div style={{ padding: "0.75rem 1.25rem", borderBottom: "0.5px solid var(--color-border-tertiary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: "var(--color-text-primary)" }}>Corridor performance</p>
          <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Top 5 by leads</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "var(--color-background-secondary)" }}>
                {["Corridor","Impressions","Leads","Spend","CPL","Reach Index"].map(h => (
                  <th key={h} style={{ padding: "7px 16px", textAlign: "left", fontSize: 10, fontWeight: 500, color: "var(--color-text-tertiary)", textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {corridors.map((row, i) => {
                const cpl = (row.spend / row.leads).toFixed(2);
                const score = row.leads / corridors[0].leads;
                return (
                  <tr key={i} style={{ borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                    <td style={{ padding: "9px 16px", fontWeight: 500, color: "var(--color-text-primary)", whiteSpace: "nowrap", fontFamily: "var(--font-mono)", fontSize: 12 }}>{row.name}</td>
                    <td style={{ padding: "9px 16px", color: "var(--color-text-secondary)" }}>{row.impressions.toLocaleString()}</td>
                    <td style={{ padding: "9px 16px", fontWeight: 500, color: "var(--color-text-primary)" }}>{row.leads}</td>
                    <td style={{ padding: "9px 16px", color: "var(--color-text-secondary)" }}>${row.spend}</td>
                    <td style={{ padding: "9px 16px", color: "var(--color-text-secondary)" }}>${cpl}</td>
                    <td style={{ padding: "9px 16px", minWidth: 120 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 4, background: "var(--color-background-secondary)", borderRadius: 2 }}>
                          <div style={{ width: `${Math.round(score * 100)}%`, height: "100%", background: AMBER, borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", minWidth: 28, textAlign: "right" }}>{Math.round(score * 100)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function AdGridSystem() {
  const [tab, setTab] = useState("generator");
  return (
    <div style={{ background: "var(--color-background-primary)", borderRadius: "var(--border-radius-lg)", border: "0.5px solid var(--color-border-tertiary)", overflow: "hidden", "--color-background-primary": "#000", "--color-background-secondary": "#121214", "--color-border-tertiary": "#222", "--color-text-primary": "#fff", "--color-text-secondary": "#a1a1aa", "--color-text-tertiary": "#71717a", "--border-radius-md": "8px", "--border-radius-lg": "12px", "--color-border-secondary": "#333", "--color-text-danger": "#ef4444" } as any}>
      <div style={{ padding: "0.875rem 1.25rem", borderBottom: "0.5px solid var(--color-border-tertiary)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 26, height: 26, background: AMBER, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "-0.5px" }}>AG</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--color-text-primary)" }}>AdGrid</span>
          <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>— Haul Command Advertising Platform</span>
        </div>
        <div style={{ display: "flex", border: "0.5px solid var(--color-border-tertiary)", borderRadius: "var(--border-radius-md)", overflow: "hidden" }}>
          {[["generator","Ad Generator"],["dashboard","ROI Dashboard"]].map(([k, lbl], i) => (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: "5px 14px", fontSize: 12, border: "none", cursor: "pointer",
              borderLeft: i > 0 ? "0.5px solid var(--color-border-tertiary)" : "none",
              background: tab === k ? "var(--color-background-secondary)" : "transparent",
              color: tab === k ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
              fontWeight: tab === k ? 500 : 400
            }}>{lbl}</button>
          ))}
        </div>
      </div>
      {tab === "generator" ? <AdGenerator /> : <ROIDashboard />}
    </div>
  );
}
