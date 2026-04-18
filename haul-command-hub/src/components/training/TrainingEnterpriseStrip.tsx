import Link from 'next/link';
import { Building2, Users, Download, Key } from 'lucide-react';

const ENTERPRISE_FEATURES = [
  { icon: <Users size={16} />,    text: 'Multi-seat training dashboard' },
  { icon: <Building2 size={16} />, text: 'Company roster & completion tracking' },
  { icon: <Download size={16} />,  text: 'Completion exports & audit reports' },
  { icon: <Key size={16} />,       text: 'Badge verification API' },
];

interface TrainingEnterpriseStripProps {
  variant?: 'full' | 'compact';
}

export default function TrainingEnterpriseStrip({ variant = 'full' }: TrainingEnterpriseStripProps) {
  if (variant === 'compact') {
    return (
      <div className="border border-white/10 rounded-xl p-5 bg-white/[0.02] flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Enterprise & Teams</div>
          <div className="font-bold text-white">Training for brokers, carriers &amp; dispatch operations</div>
          <div className="text-sm text-gray-400 mt-0.5">Multi-seat plans · dashboards · completion exports · badge API</div>
        </div>
        <Link
          href="/training/enterprise"
          className="shrink-0 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg border border-white/10 transition-colors whitespace-nowrap"
        >
          View Plans →
        </Link>
      </div>
    );
  }

  return (
    <div className="border border-yellow-500/20 rounded-xl p-8 bg-yellow-500/5">
      <div className="max-w-2xl">
        <div className="text-xs text-yellow-400 uppercase tracking-widest mb-2 font-mono">Enterprise &amp; Teams</div>
        <h2 className="text-2xl font-black text-white mb-3">
          Training at scale for brokers, carriers &amp; dispatch operations
        </h2>
        <p className="text-gray-400 leading-relaxed mb-6">
          Multi-seat plans with company dashboards, roster tracking, badge verification API, and completion exports.
          Purpose-built for operations that need team-wide compliance visibility.
        </p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          {ENTERPRISE_FEATURES.map((f) => (
            <div key={f.text} className="flex items-center gap-2.5 text-sm text-gray-300">
              <span className="text-yellow-400">{f.icon}</span>
              {f.text}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/training/enterprise"
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg text-sm transition-colors"
          >
            View Enterprise Plans
          </Link>
          <Link
            href="/training/enterprise#contact"
            className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-lg text-sm border border-white/10 transition-colors"
          >
            Talk to Sales
          </Link>
        </div>
      </div>
    </div>
  );
}
