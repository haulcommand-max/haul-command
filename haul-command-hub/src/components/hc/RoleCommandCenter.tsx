'use client';

import { useRole } from '@/lib/role-context';
import type { RoleConfig, RoleAction, RoleModule } from '@/lib/role-config';
import RoleSelector from './RoleSelector';

/**
 * RoleCommandCenter — The role-aware home layout.
 *
 * When no role is selected → shows RoleSelector
 * When role is selected → shows role-specific:
 *   - Headline + first question
 *   - Primary action grid (4 actions)
 *   - Live modules
 *   - Secondary actions
 *
 * This is the core deliverable of the role-aware system.
 * Different role = different home = different question = different next step.
 */
export default function RoleCommandCenter() {
  const { role, config, hasRole } = useRole();

  // No role selected → show selector
  if (!hasRole || !config) {
    return (
      <section className="relative py-10 sm:py-16 md:py-20 px-4 overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent" />
        <div className="w-full max-w-5xl mx-auto relative z-10">
          <RoleSelector />
        </div>
      </section>
    );
  }

  // Role selected → show command center
  return (
    <section className="relative py-8 sm:py-12 md:py-16 px-4 overflow-hidden border-b border-white/5">
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent" />
      <div className="w-full max-w-5xl mx-auto relative z-10 space-y-6 sm:space-y-8">

        {/* ─── Role Header ─────────────────────────────────── */}
        <RoleHeader config={config} />

        {/* ─── First Question ──────────────────────────────── */}
        <FirstQuestion config={config} />

        {/* ─── Primary Action Grid ─────────────────────────── */}
        <PrimaryActionGrid actions={config.primaryActions} />

        {/* ─── Live Modules ────────────────────────────────── */}
        <LiveModuleStrip modules={config.liveModules} />

        {/* ─── Secondary Actions ───────────────────────────── */}
        <SecondaryActionRow actions={config.secondaryActions} />

      </div>
    </section>
  );
}


// ─── Sub-Components ──────────────────────────────────────────

function RoleHeader({ config }: { config: RoleConfig }) {
  const { clearRole } = useRole();

  return (
    <div className="text-center">
      {/* Role badge */}
      <button
        onClick={clearRole}
        className="inline-flex items-center gap-1.5 bg-accent/[0.08] border border-accent/20 rounded-full px-3 py-1 mb-3 sm:mb-4 hover:bg-accent/[0.15] transition-all group"
        title="Change role"
      >
        <span className="text-sm">{config.icon}</span>
        <span className="text-[10px] text-accent font-bold uppercase tracking-wider">
          {config.shortLabel}
        </span>
        <span className="text-[10px] text-accent/50 group-hover:text-accent transition-colors">
          ✎
        </span>
      </button>

      {/* Headline */}
      <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter mb-2 sm:mb-3 leading-[0.95] break-words">
        {config.headline.split('.').map((part, i) => {
          if (i === 0) {
            // Accent the last word of the first segment
            const words = part.trim().split(' ');
            if (words.length > 1) {
              const lastWord = words.pop();
              return (
                <span key={i}>
                  {words.join(' ')}{' '}
                  <span className="text-accent">{lastWord}</span>
                  {'. '}
                </span>
              );
            }
            return <span key={i} className="text-accent">{part.trim()}</span>;
          }
          if (!part.trim()) return null;
          return <span key={i}>{part.trim()}. </span>;
        })}
      </h1>

      {/* Subheadline */}
      <p className="text-[#b0b0b0] text-sm sm:text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
        {config.subheadline}
      </p>
    </div>
  );
}


function FirstQuestion({ config }: { config: RoleConfig }) {
  if (!config.firstQuestions.length) return null;

  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
      {config.firstQuestions.map((q, i) => (
        <div
          key={i}
          className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-full px-3 sm:px-4 py-1.5 sm:py-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-accent/60 flex-shrink-0" />
          <span className="text-[#b0b0b0] text-xs sm:text-sm font-medium break-words">
            {q}
          </span>
        </div>
      ))}
    </div>
  );
}


function PrimaryActionGrid({ actions }: { actions: RoleAction[] }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 w-full max-w-2xl mx-auto">
      {actions.slice(0, 4).map((action) => (
        <a
          key={action.id}
          href={action.href}
          className="group relative bg-white/[0.03] hover:bg-accent/[0.06] border border-white/[0.08] hover:border-accent/30 rounded-2xl p-4 sm:p-5 transition-all duration-200 flex flex-col items-center text-center min-w-0"
        >
          <span className="text-2xl sm:text-3xl mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
            {action.icon}
          </span>
          <span className="text-white font-bold text-xs sm:text-sm group-hover:text-accent transition-colors break-words">
            {action.label}
          </span>
          <span className="text-[#8b95a5] text-[10px] sm:text-xs mt-1 leading-relaxed break-words">
            {action.description}
          </span>
        </a>
      ))}
    </div>
  );
}


function LiveModuleStrip({ modules }: { modules: RoleModule[] }) {
  if (!modules.length) return null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        <span className="text-[10px] text-[#8b95a5] font-bold uppercase tracking-wider">
          Live for You
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {modules.map((mod) => (
          <div
            key={mod.id}
            className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 sm:p-4 min-w-0"
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-sm flex-shrink-0">{mod.icon}</span>
              <span className="text-white text-[10px] sm:text-xs font-bold truncate">
                {mod.label}
              </span>
            </div>
            {/* Placeholder metric — will be replaced with real data */}
            <div className="text-accent text-lg sm:text-xl font-black tabular-nums">
              —
            </div>
            <div className="text-[9px] text-[#6b7280] mt-0.5 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-green-500/50" />
              Loading…
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


function SecondaryActionRow({ actions }: { actions: RoleAction[] }) {
  if (!actions.length) return null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex flex-wrap justify-center gap-2">
        {actions.map((action) => (
          <a
            key={action.id}
            href={action.href}
            className="inline-flex items-center gap-1.5 bg-white/[0.03] hover:bg-accent/[0.06] border border-white/[0.08] hover:border-accent/20 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-medium text-[#8b95a5] hover:text-accent transition-all group"
          >
            <span className="text-sm flex-shrink-0">{action.icon}</span>
            <span className="break-words">{action.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
