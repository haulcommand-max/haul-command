'use client';

import React from 'react';

/* ─── Trust Score Ladder / Explainer ──────────────────────── */
const ladderItems = [
  {
    grade: 'A',
    range: '90–100',
    label: 'Elite',
    desc: 'Top-tier operator. Maximum visibility, priority dispatch, and premium placement.',
    color: 'emerald',
    actions: ['Verified identity', 'Completed loads on-time', 'Strong compliance record', 'Active profile'],
  },
  {
    grade: 'B',
    range: '75–89',
    label: 'Strong',
    desc: 'Reliable operator with consistent performance. Expanded job access.',
    color: 'blue',
    actions: ['Claim profile', 'Complete 5+ loads', 'Maintain compliance docs'],
  },
  {
    grade: 'C',
    range: '60–74',
    label: 'Standard',
    desc: 'Visible in directory. Room for improvement to unlock premium features.',
    color: 'amber',
    actions: ['Claim profile', 'Upload insurance docs', 'Respond to enquiries'],
  },
  {
    grade: 'D',
    range: '40–59',
    label: 'Limited',
    desc: 'Limited visibility. Action required to improve trust score.',
    color: 'orange',
    actions: ['Verify phone number', 'Claim profile', 'Complete profile details'],
  },
  {
    grade: 'F',
    range: '0–39',
    label: 'Unverified',
    desc: 'Unclaimed profile with estimated data. Claim to start building trust.',
    color: 'red',
    actions: ['Claim your listing today'],
  },
];

const colorMap: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-500' },
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-500' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', dot: 'bg-orange-500' },
  red: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-500' },
};

export default function TrustScoreLadder({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5 sm:p-8 ${className}`}>
      <h3 className="text-white font-black text-lg sm:text-xl tracking-tighter mb-1">
        Trust Score <span className="text-accent">Ladder</span>
      </h3>
      <p className="text-gray-500 text-xs mb-6">
        Your Haul Command Trust Score determines your visibility, job priority, and premium access.
        Here&apos;s how to climb.
      </p>

      <div className="space-y-3">
        {ladderItems.map((item, idx) => {
          const c = colorMap[item.color];
          return (
            <div
              key={item.grade}
              className={`${c.bg} ${c.border} border rounded-xl p-4 transition-all hover:scale-[1.01]`}
              style={{ animationDelay: `${idx * 80}ms` }}
            >
              <div className="flex items-start gap-3">
                {/* Grade Badge */}
                <div className={`w-10 h-10 rounded-lg ${c.bg} ${c.border} border-2 flex items-center justify-center flex-shrink-0`}>
                  <span className={`font-black text-lg ${c.text}`}>{item.grade}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`font-bold text-sm ${c.text}`}>{item.label}</span>
                    <span className="text-[9px] font-mono text-gray-600">{item.range}</span>
                  </div>
                  <p className="text-gray-400 text-xs mb-2">{item.desc}</p>

                  {/* Action Items */}
                  <div className="flex flex-wrap gap-1.5">
                    {item.actions.map((action) => (
                      <span
                        key={action}
                        className="text-[9px] text-gray-500 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full"
                      >
                        {action}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="mt-6 text-center">
        <a
          href="/claim"
          className="inline-flex items-center gap-2 bg-accent text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-all ag-magnetic"
        >
          Start Climbing — Claim Free →
        </a>
      </div>
    </div>
  );
}
