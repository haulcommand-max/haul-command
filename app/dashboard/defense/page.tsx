"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { ShieldAlert, Activity, Ban, Bot, MousePointerClick } from "lucide-react";

// The client requires NEXT_PUBLIC keys which are safe to expose
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface RequestLog {
  id: string;
  ip: string;
  path: string;
  is_bot: boolean;
  user_agent: string;
  created_at: string;
}

export default function ScraperDefenseDashboard() {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [totalRequests, setTotalRequests] = useState(0);
  const [botCount, setBotCount] = useState(0);

  useEffect(() => {
    // 1. Initial Load of last 100 requests
    const fetchInitial = async () => {
      const { data } = await supabase
        .from('request_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (data) {
        setLogs(data);
        setTotalRequests(data.length);
        setBotCount(data.filter(d => d.is_bot).length);
      }
    };
    fetchInitial();

    // 2. Real-time Subscription to stream scraping attacks live
    const channel = supabase
      .channel("live-bot-defense")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "request_log" },
        (payload) => {
          const freshLog = payload.new as RequestLog;
          setLogs((prev) => [freshLog, ...prev].slice(0, 100)); // Keep only latest 100
          
          setTotalRequests(prev => prev + 1);
          if (freshLog.is_bot) setBotCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 p-6 sm:p-12 font-mono">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-rose-900 pb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-rose-500/10 rounded-lg">
              <ShieldAlert className="h-8 w-8 text-rose-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">Anti-Gravity Console</h1>
              <p className="text-sm text-slate-400">Live Scraper Detection & IP Threat Tracking</p>
            </div>
          </div>
          
          {/* Status badge */}
          <div className="flex items-center px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-semibold pulse-animation border border-emerald-500/20">
            <Activity className="h-4 w-4 mr-2" />
            Active Surveillance
          </div>
        </div>

        {/* Global Stats Metics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center text-slate-400 mb-2">
              <MousePointerClick className="h-4 w-4 mr-2" />
              API Requests (Last 100)
            </div>
            <div className="text-4xl font-bold text-white">{totalRequests}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center text-rose-400 mb-2">
              <Bot className="h-4 w-4 mr-2" />
              Bots Detected
            </div>
            <div className="text-4xl font-bold text-rose-400">{botCount}</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center text-orange-400 mb-2">
              <Ban className="h-4 w-4 mr-2" />
              Threat Ratio
            </div>
            <div className="text-4xl font-bold text-orange-400">
              {totalRequests > 0 ? Math.round((botCount / totalRequests) * 100) : 0}%
            </div>
          </div>
        </div>

        {/* Live Feed Terminal */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mt-8">
          <div className="bg-slate-800 px-6 py-3 border-b border-slate-700 flex justify-between items-center text-sm font-bold tracking-wide">
            <span className="text-slate-300">LIVE FEED — INCOMING SIGNATURES</span>
            <span className="text-xs text-rose-500 animate-pulse">● REC</span>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 bg-slate-900/50">
                  <th className="px-6 py-4 font-semibold">Timestamp</th>
                  <th className="px-6 py-4 font-semibold">Source IP</th>
                  <th className="px-6 py-4 font-semibold">Classification</th>
                  <th className="px-6 py-4 font-semibold">Target Route</th>
                  <th className="px-6 py-4 font-semibold">User Agent Fingerprint</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      Listening for incoming traffic on the edge...
                    </td>
                  </tr>
                )}
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(log.created_at).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-300">
                      {log.ip}
                    </td>
                    <td className="px-6 py-4">
                      {log.is_bot ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                          <Bot className="h-3 w-3 mr-1" /> HOSTILE BOT
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          HUMAN
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-indigo-400">
                      {log.path}
                    </td>
                    <td className="px-6 py-4 text-slate-500 truncate max-w-[200px]" title={log.user_agent}>
                      {log.user_agent}
                    </td>
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
