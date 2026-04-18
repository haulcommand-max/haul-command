import type { Metadata } from 'next';
import Link from 'next/link';
import { GraduationCap } from 'lucide-react';

export const metadata: Metadata = {
  title: { default: 'Training | Haul Command', template: '%s | Haul Command Training' },
  description: 'Haul Command Training — earn badges, improve directory rank, and unlock broker trust for heavy haul operators.',
};

const TRAINING_NAV = [
  { href: '/training',             label: 'Overview' },
  { href: '/training/levels/road-ready',  label: 'Road Ready' },
  { href: '/training/levels/certified',   label: 'Certified' },
  { href: '/training/levels/elite',       label: 'Elite' },
  { href: '/training/levels/av-ready',    label: 'AV-Ready' },
  { href: '/training/enterprise',         label: 'Enterprise' },
];

export default function TrainingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B0F14] text-white">
      {/* Training section header */}
      <div className="border-b border-white/5 bg-[#0d1219]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 text-yellow-400">
            <GraduationCap size={18} />
            <span className="text-sm font-bold uppercase tracking-wider">Training</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {TRAINING_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="shrink-0 px-3 py-1.5 text-xs text-gray-400 hover:text-white rounded-md hover:bg-white/5 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      {children}
    </div>
  );
}
