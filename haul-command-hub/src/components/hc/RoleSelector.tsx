'use client';

import { useRole } from '@/lib/role-context';
import { ROLE_LIST, ROLE_CONFIGS, type HCRole } from '@/lib/role-config';

/**
 * RoleSelector — First-screen role picker.
 * 
 * This is NOT cosmetic. Selecting a role rewires:
 * - The first question on the home screen
 * - The primary 4 action buttons
 * - The live modules and proof blocks
 * - The recommended next steps
 * - Empty state copy throughout the app
 */
export default function RoleSelector() {
  const { setRole } = useRole();

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tighter mb-2 sm:mb-3 break-words">
          What&apos;s Your <span className="text-accent">Role?</span>
        </h2>
        <p className="text-[#b0b0b0] text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
          Pick your role. We&apos;ll set up the right tools, actions, and intel for what you actually do.
        </p>
      </div>

      {/* Role Cards — revenue-generating roles first */}
      <div className="flex flex-col gap-4">
        {ROLE_LIST.filter(r => r !== 'observer_researcher').map((roleId) => {
          const cfg = ROLE_CONFIGS[roleId];
          
          let buttonStyles = "bg-white/[0.03] hover:bg-accent/[0.06] border border-white/[0.08] hover:border-accent/30";
          let iconStyles = "text-2xl sm:text-3xl";
          let bgImage = null;

          if (roleId === 'escort_operator') {
            buttonStyles = "bg-gradient-to-br from-[#1a1500] to-[#0a0800] border border-yellow-500/30 hover:border-yellow-400/60 hover:shadow-[0_0_20px_rgba(234,179,8,0.15)] ring-1 ring-inset ring-yellow-500/10";
            iconStyles = "text-3xl sm:text-4xl translate-y-[-2px]";
          } else if (roleId === 'broker_dispatcher') {
            buttonStyles = "bg-gradient-to-br from-[#00101f] to-[#00050a] border border-blue-500/30 hover:border-blue-400/60 hover:shadow-[0_0_20px_rgba(59,130,246,0.15)] ring-1 ring-inset ring-blue-500/10";
            iconStyles = "text-3xl sm:text-4xl translate-y-[-2px]";
          } else if (roleId === 'both') {
            buttonStyles = "bg-gradient-to-br from-white/[0.05] to-black border border-white/[0.1] hover:border-white/30";
          }

          return (
            <button
              key={roleId}
              onClick={() => setRole(roleId)}
              className={`group w-full text-left rounded-2xl p-5 sm:p-6 transition-all duration-300 overflow-hidden relative ${buttonStyles}`}
            >
              {roleId === 'escort_operator' && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              )}
              {roleId === 'broker_dispatcher' && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
              )}

              <div className="flex items-center gap-4 sm:gap-5 min-w-0 relative z-10">
                {/* Icon Box */}
                <div className={`w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-xl bg-black/40 border border-white/5 flex-shrink-0 group-hover:scale-105 transition-transform shadow-inner`}>
                  <span className={iconStyles}>
                    {roleId === 'both' ? '⚡' : cfg.icon}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 py-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`font-black text-lg sm:text-xl tracking-tight transition-colors ${
                      roleId === 'escort_operator' ? 'text-yellow-400 group-hover:text-yellow-300' :
                      roleId === 'broker_dispatcher' ? 'text-blue-400 group-hover:text-blue-300' :
                      'text-white group-hover:text-gray-200'
                    }`}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-[#8b95a5] text-xs sm:text-sm font-medium break-words leading-relaxed">
                    {cfg.description}
                  </p>
                </div>

                {/* Arrow */}
                <div className="w-8 h-8 rounded-full bg-white/[0.03] flex items-center justify-center flex-shrink-0 group-hover:bg-white/[0.1] transition-colors">
                  <span className={`text-lg transition-colors ${
                    roleId === 'escort_operator' ? 'text-yellow-500 group-hover:text-yellow-300' :
                    roleId === 'broker_dispatcher' ? 'text-blue-500 group-hover:text-blue-300' :
                    'text-gray-400 group-hover:text-white'
                  }`}>
                    →
                  </span>
                </div>
              </div>
            </button>
          );
        })}

        {/* Observer / Researcher — subdued, bottom of the list */}
        {(() => {
          const obsCfg = ROLE_CONFIGS['observer_researcher'];
          return (
            <button
              onClick={() => setRole('observer_researcher')}
              className="group w-full text-left bg-white/[0.01] hover:bg-white/[0.03] border border-white/[0.04] hover:border-white/[0.08] rounded-xl px-4 py-3 transition-all duration-200 opacity-60 hover:opacity-90"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg flex-shrink-0 text-gray-500">{obsCfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-gray-400 font-medium text-xs group-hover:text-white transition-colors">
                    {obsCfg.label}
                  </span>
                  <span className="text-gray-600 text-[10px] ml-2">{obsCfg.description}</span>
                </div>
                <span className="text-gray-700 group-hover:text-gray-400 text-sm flex-shrink-0 transition-colors">→</span>
              </div>
            </button>
          );
        })()}
      </div>

      {/* Skip hint */}
      <p className="text-center text-[#6b7280] text-[11px] mt-4 sm:mt-6">
        You can change this anytime from the menu.
      </p>
    </div>
  );
}

// ─── Compact Role Switcher (for navbar/menu) ─────────────────

export function RoleSwitcher() {
  const { role, config, clearRole } = useRole();

  if (!role || !config) return null;

  return (
    <button
      onClick={clearRole}
      className="flex items-center gap-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] rounded-lg px-2.5 py-1.5 transition-all group"
      title="Change role"
    >
      <span className="text-sm">{config.icon}</span>
      <span className="text-[10px] text-[#8b95a5] font-medium group-hover:text-white transition-colors hidden sm:inline">
        {config.shortLabel}
      </span>
      <span className="text-[10px] text-gray-600 group-hover:text-accent transition-colors">
        ✎
      </span>
    </button>
  );
}
