"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  ShieldAlert,
  Activity,
  Ban,
  Bot,
  Globe,
  Zap,
  Eye,
  TrendingUp,
} from "lucide-react";

// ── Supabase Realtime client (public anon key — safe) ──────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Types ──────────────────────────────────────────────────────────────────
interface RequestLog {
  id: string;
  ip: string;
  path: string;
  is_bot: boolean;
  user_agent: string;
  created_at: string;
  country?: string;
  city?: string;
  asn?: string;
  latitude?: number;
  longitude?: number;
}

interface BlockedIP {
  id: string;
  ip: string;
  reason: string;
  blocked_at: string;
  country?: string;
  request_count?: number;
}

// ── Equirectangular projection helpers ─────────────────────────────────────
const toSVGCoords = (lat: number, lng: number, W: number, H: number) => ({
  x: ((lng + 180) / 360) * W,
  y: ((90 - lat) / 180) * H,
});

// ── 10° graticule grid lines ───────────────────────────────────────────────
const GRATICULE_H = Array.from({ length: 17 }, (_, i) => (i - 8) * 10);
const GRATICULE_V = Array.from({ length: 37 }, (_, i) => (i - 18) * 10);

// ── Animated live dot ─────────────────────────────────────────────────────
interface Dot {
  id: string;
  x: number;
  y: number;
  isBot: boolean;
  born: number;
  city?: string;
  country?: string;
  ip: string;
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function DefenseDashboard() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [blocked, setBlocked] = useState<BlockedIP[]>([]);
  const [dots, setDots] = useState<Dot[]>([]);
  const [stats, setStats] = useState({ total: 0, bots: 0, blocked: 0, rps: 0 });
  const rpsBuffer = useRef<number[]>([]);
  const [mapSize, setMapSize] = useState({ w: 960, h: 480 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setMapSize({ w: width, h: width / 2 });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const addDot = useCallback((log: RequestLog) => {
    if (log.latitude == null || log.longitude == null) return;
    const { x, y } = toSVGCoords(log.latitude, log.longitude, mapSize.w, mapSize.h);
    const dot: Dot = {
      id: `${log.id}-${Date.now()}`,
      x, y,
      isBot: log.is_bot,
      born: Date.now(),
      city: log.city,
      country: log.country,
      ip: log.ip,
    };
    setDots((prev) => [...prev.slice(-200), dot]);
    setTimeout(() => setDots((prev) => prev.filter((d) => d.id !== dot.id)), 4000);
  }, [mapSize.w, mapSize.h]);

  const bumpRPS = useCallback(() => {
    const now = Date.now();
    rpsBuffer.current = [...rpsBuffer.current.filter(t => now - t < 5000), now];
    setStats(s => ({ ...s, rps: Math.round(rpsBuffer.current.length / 5) }));
  }, []);

  useEffect(() => {
    const init = async () => {
      const [{ data: logData }, { data: blockData }] = await Promise.all([
        supabase.from("request_log").select("*").order("created_at", { ascending: false }).limit(150),
        supabase.from("blocked_ips").select("*").order("blocked_at", { ascending: false }).limit(50),
      ]);
      if (logData) {
        setLogs(logData);
        setStats(s => ({ ...s, total: logData.length, bots: logData.filter(l => l.is_bot).length }));
        logData.filter(l => l.latitude != null).slice(0, 20).forEach(l => addDot(l));
      }
      if (blockData) {
        setBlocked(blockData);
        setStats(s => ({ ...s, blocked: blockData.length }));
      }
    };
    init();

    const logChannel = supabase
      .channel("defense-request-log")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "request_log" }, (payload) => {
        const log = payload.new as RequestLog;
        setLogs((prev) => [log, ...prev].slice(0, 150));
        setStats((s) => ({ ...s, total: s.total + 1, bots: s.bots + (log.is_bot ? 1 : 0) }));
        addDot(log);
        bumpRPS();
      })
      .subscribe();

    const blockChannel = supabase
      .channel("defense-blocked-ips")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "blocked_ips" }, (payload) => {
        setBlocked((prev) => [payload.new as BlockedIP, ...prev].slice(0, 50));
        setStats((s) => ({ ...s, blocked: s.blocked + 1 }));
      })
      .subscribe();

    return () => { supabase.removeChannel(logChannel); supabase.removeChannel(blockChannel); };
  }, [addDot, bumpRPS]);

  const threatRatio = stats.total > 0 ? Math.round((stats.bots / stats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#060810] text-slate-100 font-mono">
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03]" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,100,0.05) 2px, rgba(0,255,100,0.05) 4px)" }} />
      <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-5">

        <div className="flex items-center justify-between border-b border-rose-900/40 pb-5">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-rose-500/20 rounded-xl blur-xl" />
              <div className="relative p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl"><ShieldAlert className="h-7 w-7 text-rose-400" /></div>
            </div>
            <div>
              <h1 className="text-xl font-black tracking-widest uppercase text-white">Haul Command <span className="text-rose-500">AEGIS</span></h1>
              <p className="text-xs text-slate-500 tracking-widest uppercase mt-0.5">Adversarial Edge Intelligence — Global Perimeter Defense</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />SURVEILLANCE ACTIVE
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400 text-xs font-bold tracking-wider">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />{stats.rps} RPS
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Requests", value: stats.total.toLocaleString(), icon: Activity, color: "text-sky-400", border: "border-sky-500/20", bg: "bg-sky-500/5" },
            { label: "Bot Signatures", value: stats.bots.toLocaleString(), icon: Bot, color: "text-rose-400", border: "border-rose-500/20", bg: "bg-rose-500/5" },
            { label: "IPs Blocked", value: stats.blocked.toLocaleString(), icon: Ban, color: "text-orange-400", border: "border-orange-500/20", bg: "bg-orange-500/5" },
            { label: "Threat Ratio", value: `${threatRatio}%`, icon: TrendingUp, color: threatRatio > 60 ? "text-rose-400" : threatRatio > 30 ? "text-amber-400" : "text-emerald-400", border: threatRatio > 60 ? "border-rose-500/20" : "border-amber-500/20", bg: threatRatio > 60 ? "bg-rose-500/5" : "bg-amber-500/5" },
          ].map((stat) => (
            <div key={stat.label} className={`${stat.bg} ${stat.border} border rounded-xl p-5`}>
              <div className={`flex items-center gap-2 text-xs ${stat.color} mb-3 uppercase tracking-widest`}><stat.icon className="h-3.5 w-3.5" />{stat.label}</div>
              <div className={`text-3xl font-black ${stat.color} tabular-nums`}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 bg-[#070c14] border border-slate-800/80 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80">
              <div className="flex items-center gap-2 text-slate-300 text-sm font-bold tracking-wider uppercase"><Globe className="h-4 w-4 text-sky-400" /> Live Global Attack Vectors</div>
              <div className="flex gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-rose-400"><span className="w-2 h-2 rounded-full bg-rose-500" /> Hostile Bot</span>
                <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Human</span>
              </div>
            </div>
            <div ref={containerRef} className="relative w-full" style={{ aspectRatio: "2/1" }}>
              <svg ref={svgRef} className="absolute inset-0 w-full h-full" viewBox={`0 0 ${mapSize.w} ${mapSize.h}`} preserveAspectRatio="none">
                <rect width={mapSize.w} height={mapSize.h} fill="#040810" />
                {GRATICULE_H.map((lat) => { const y = ((90 - lat) / 180) * mapSize.h; return <line key={`lat-${lat}`} x1={0} y1={y} x2={mapSize.w} y2={y} stroke={lat === 0 ? "#1e3a5f" : "#0d1f33"} strokeWidth={lat === 0 ? 1 : 0.5} />; })}
                {GRATICULE_V.map((lng) => { const x = ((lng + 180) / 360) * mapSize.w; return <line key={`lng-${lng}`} x1={x} y1={0} x2={x} y2={mapSize.h} stroke={lng === 0 ? "#1e3a5f" : "#0d1f33"} strokeWidth={lng === 0 ? 1 : 0.5} />; })}
                <path d="M 160,60 L 200,50 L 220,70 L 230,100 L 210,130 L 190,140 L 175,120 L 165,90 Z" fill="none" stroke="#1a3355" strokeWidth="1" opacity="0.8" />
                <path d="M 195,150 L 215,145 L 225,160 L 220,200 L 205,220 L 195,210 L 190,185 L 192,165 Z" fill="none" stroke="#1a3355" strokeWidth="1" opacity="0.8" />
                <path d="M 460,55 L 510,50 L 520,65 L 505,80 L 475,82 L 460,70 Z" fill="none" stroke="#1a3355" strokeWidth="1" opacity="0.8" />
                <path d="M 470,90 L 510,85 L 525,110 L 515,155 L 495,175 L 475,160 L 465,130 L 465,105 Z" fill="none" stroke="#1a3355" strokeWidth="1" opacity="0.8" />
                <path d="M 520,45 L 680,40 L 720,65 L 710,100 L 680,115 L 640,110 L 580,100 L 530,80 L 515,65 Z" fill="none" stroke="#1a3355" strokeWidth="1" opacity="0.8" />
                <path d="M 660,150 L 720,145 L 735,170 L 720,185 L 685,185 L 660,170 Z" fill="none" stroke="#1a3355" strokeWidth="1" opacity="0.8" />
                {logs.filter(l => l.latitude != null && l.longitude != null).slice(0, 100).map(log => {
                  const { x, y } = toSVGCoords(log.latitude!, log.longitude!, mapSize.w, mapSize.h);
                  return <circle key={`s-${log.id}`} cx={x} cy={y} r={1.5} fill={log.is_bot ? "#ef4444" : "#34d399"} opacity={0.25} />;
                })}
                {dots.map(dot => {
                  const age = (Date.now() - dot.born) / 4000;
                  const opacity = Math.max(0, 1 - age);
                  return (
                    <g key={dot.id}>
                      <circle cx={dot.x} cy={dot.y} r={dot.isBot ? 12 * (1 - age * 0.5) : 8 * (1 - age * 0.5)} fill="none" stroke={dot.isBot ? "#ef4444" : "#34d399"} strokeWidth={0.8} opacity={opacity * 0.4} />
                      <circle cx={dot.x} cy={dot.y} r={dot.isBot ? 3 : 2} fill={dot.isBot ? "#ef4444" : "#34d399"} opacity={opacity}><title>{dot.city}, {dot.country} — {dot.ip}</title></circle>
                    </g>
                  );
                })}
              </svg>
              <div className="absolute bottom-3 left-3 text-[9px] text-slate-600 font-mono tracking-wider uppercase">Equirectangular · Supabase Realtime · Vercel Edge Telemetry</div>
              <div className="absolute top-3 right-3 text-[9px] text-slate-700 font-mono">{dots.length} active vectors</div>
            </div>
          </div>

          <div className="bg-[#0a0810] border border-orange-900/30 rounded-2xl overflow-hidden flex flex-col">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-orange-900/30">
              <Ban className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-bold tracking-wider uppercase text-orange-300">Blocked IPs</span>
              <span className="ml-auto text-xs text-orange-600 font-mono">{stats.blocked} total</span>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-orange-900/20">
              {blocked.length === 0 ? <div className="px-5 py-8 text-center text-slate-600 text-xs">No blocked IPs yet</div> : blocked.map(b => (
                <div key={b.id} className="px-5 py-3 hover:bg-orange-500/5 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-orange-300 font-mono">{b.ip}</span>
                    {b.country && <span className="text-[10px] text-slate-600">{b.country}</span>}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{b.reason}</div>
                  {b.request_count && <div className="text-[10px] text-orange-700 mt-0.5">{b.request_count.toLocaleString()} requests before block</div>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#040810] border border-slate-800/70 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/70 bg-slate-900/30">
            <div className="flex items-center gap-2 text-sm font-bold tracking-wider uppercase text-slate-300"><Eye className="h-4 w-4 text-rose-400" />Live Feed — Incoming Signatures</div>
            <div className="flex items-center gap-2 text-xs text-rose-500 font-bold tracking-wider"><span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />REC</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-800/60 text-slate-500">
                  {["Time", "Source IP", "ASN", "Classification", "Target Route", "User Agent"].map(h => <th key={h} className="px-5 py-3 font-semibold uppercase tracking-wider text-[10px]">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/80">
                {logs.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-600">Listening for edge traffic...</td></tr>}
                {logs.slice(0, 50).map((log, i) => (
                  <tr key={log.id} className={`hover:bg-slate-800/30 transition-colors ${i === 0 ? "bg-slate-800/20" : ""}`}>
                    <td className="px-5 py-2.5 text-slate-600 tabular-nums">{new Date(log.created_at).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}</td>
                    <td className="px-5 py-2.5 font-mono text-slate-300">{log.ip}</td>
                    <td className="px-5 py-2.5 text-slate-600 font-mono text-[10px]">{log.asn ?? "—"}</td>
                    <td className="px-5 py-2.5">
                      {log.is_bot
                        ? <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 tracking-wider"><Bot className="h-2.5 w-2.5" /> HOSTILE BOT</span>
                        : <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 tracking-wider"><Zap className="h-2.5 w-2.5" /> HUMAN</span>}
                    </td>
                    <td className="px-5 py-2.5 font-mono text-sky-400/80 text-[10px]">{log.path}</td>
                    <td className="px-5 py-2.5 text-slate-600 text-[10px] truncate max-w-[200px]" title={log.user_agent}>{log.user_agent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
