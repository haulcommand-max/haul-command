'use client';

import React from 'react';

/* ─── Post-Claim Monetization Launcher ────────────────────── */
const launcherItems = [
  {
    icon: '📡',
    title: 'AdGrid Placement',
    desc: 'Get featured across search results, corridors, and state pages.',
    href: '/advertise',
    color: 'accent',
    tag: 'Revenue',
  },
  {
    icon: '🔔',
    title: 'Load Alerts',
    desc: 'Get notified instantly when matching loads post in your territory.',
    href: '/dashboard',
    color: 'blue',
    tag: 'Growth',
  },
  {
    icon: '🛡️',
    title: 'Trust Score Upgrade',
    desc: 'Upload docs and complete verification to hit Trust Grade A.',
    href: '/claim',
    color: 'emerald',
    tag: 'Trust',
  },
  {
    icon: '📍',
    title: 'Territory Claim',
    desc: 'Lock in your service area for priority routing in your corridors.',
    href: '/claim',
    color: 'purple',
    tag: 'Territory',
  },
  {
    icon: '⚡',
    title: 'QuickPay Activation',
    desc: 'Enable 24-hour payment for completed loads via Stripe Connect.',
    href: '/pricing',
    color: 'amber',
    tag: 'Payment',
  },
  {
    icon: '📊',
    title: 'Profile Analytics',
    desc: 'See who viewed your profile, search impressions, and contact rate.',
    href: '/dashboard/earnings',
    color: 'cyan',
    tag: 'Data',
  },
];

const colorMap: Record<string, string> = {
  accent: 'bg-accent/10 border-accent/30 text-accent',
  blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
  emerald: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
  purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
  amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
  cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
};

export default function PostClaimLauncher({ className = '' }: { className?: string }) {
  return (
    <div className={`${className}`}>
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1.5 mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-400 text-xs font-bold">Profile Claimed Successfully</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tighter mb-2">
          Now <span className="text-accent">Activate Revenue</span>
        </h2>
        <p className="text-gray-500 text-sm max-w-lg mx-auto">
          Your profile is live. These tools turn your listing into a revenue engine.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {launcherItems.map((item) => {
          const colors = colorMap[item.color] || colorMap.accent;
          return (
            <a
              key={item.title}
              href={item.href}
              className="group block bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-accent/20 hover:bg-accent/[0.02] transition-all ag-spring-hover"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{item.icon}</span>
                <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${colors}`}>
                  {item.tag}
                </span>
              </div>
              <h3 className="text-white font-bold text-sm mb-1 group-hover:text-accent transition-colors">
                {item.title}
              </h3>
              <p className="text-gray-500 text-[11px] leading-relaxed mb-3">{item.desc}</p>
              <span className="text-accent text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                Activate →
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
