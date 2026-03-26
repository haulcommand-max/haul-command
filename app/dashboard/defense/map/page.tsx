'use client';

import { useEffect, useRef, useState } from 'react';
import { useThreatMapSync } from '@/hooks/useThreatMapSync';
import { useSessionDNA } from '@/hooks/useSessionDNA';

// Equirectangular projection math
function latLngToXY(lat: number, lng: number, w: number, h: number) {
  const x = ((lng + 180) / 360) * w;
  const y = ((90 - lat) / 180) * h;
  return { x, y };
}

type ThreatPoint = { id: string; lat: number; lng: number; is_bot: boolean };

export default function DispatchMapPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { points, repaintTicker } = useThreatMapSync();
  const [stats, setStats] = useState({ total: 0, bots: 0, humans: 0 });
  useSessionDNA(); // Silent fingerprint extraction

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#050810');
    bg.addColorStop(1, '#080c18');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Grid lines (equirectangular grid)
    ctx.strokeStyle = 'rgba(109, 114, 246, 0.07)';
    ctx.lineWidth = 0.5;
    for (let lat = -90; lat <= 90; lat += 30) {
      const y = ((90 - lat) / 180) * H;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
    for (let lng = -180; lng <= 180; lng += 30) {
      const x = ((lng + 180) / 360) * W;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }

    let bots = 0;
    let humans = 0;

    // Draw points
    for (const pt of points) {
      const { x, y } = latLngToXY(pt.lat, pt.lng, W, H);
      if (x < 0 || x > W || y < 0 || y > H) continue;

      if (pt.is_bot) {
        bots++;
        // Pulsing red scrapers
        const grad = ctx.createRadialGradient(x, y, 0, x, y, 6);
        grad.addColorStop(0, 'rgba(255, 80, 80, 0.9)');
        grad.addColorStop(1, 'rgba(255, 80, 80, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        humans++;
        // Soft blue humans
        ctx.fillStyle = 'rgba(109, 114, 246, 0.75)';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    setStats({ total: points.length, bots, humans });

  }, [repaintTicker, points]);

  return (
    <div className="min-h-screen bg-[#080b11] text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2230]">
        <div>
          <h1 className="text-lg font-black tracking-tight">🌍 GLOBAL THREAT &amp; DISPATCH MAP</h1>
          <p className="text-gray-500 text-xs">Real-time request_log stream · Anti-Gravity Defense Layer</p>
        </div>
        <div className="flex gap-6 text-sm">
          <div className="text-center">
            <p className="text-2xl font-black text-white">{stats.total.toLocaleString()}</p>
            <p className="text-gray-500 text-xs">Total IPs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-red-400">{stats.bots.toLocaleString()}</p>
            <p className="text-gray-500 text-xs">Hostile Scrapers</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-[#6d72f6]">{stats.humans.toLocaleString()}</p>
            <p className="text-gray-500 text-xs">Human Traffic</p>
          </div>
        </div>
      </div>

      {/* Map Canvas */}
      <div className="flex-1 relative">
        <canvas
          ref={canvasRef}
          width={1440}
          height={720}
          className="w-full h-full object-cover"
          style={{ imageRendering: 'pixelated' }}
        />
        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur rounded-lg p-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-gray-300">Hostile Bot / Scraper</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#6d72f6]" style={{ marginLeft: 2 }} />
            <span className="text-gray-300">Organic Traffic</span>
          </div>
        </div>
      </div>
    </div>
  );
}
