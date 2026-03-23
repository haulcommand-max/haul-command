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

      {/* Role Cards */}
      <div className="flex flex-col gap-3">
        {ROLE_LIST.map((roleId) => {
          const cfg = ROLE_CONFIGS[roleId];
          return (
            <button
              key={roleId}
              onClick={() => setRole(roleId)}
              className="group w-full text-left bg-white/[0.03] hover:bg-accent/[0.06] border border-white/[0.08] hover:border-accent/30 rounded-2xl p-4 sm:p-5 transition-all duration-200 overflow-hidden"
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                {/* Icon */}
                <span className="text-2xl sm:text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">
                  {cfg.icon}
                </span>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white font-bold text-sm sm:text-base group-hover:text-accent transition-colors">
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-[#8b95a5] text-xs sm:text-sm mt-0.5 break-words">
                    {cfg.description}
                  </p>
                </div>

                {/* Arrow */}
                <span className="text-gray-600 group-hover:text-accent text-lg flex-shrink-0 transition-colors">
                  →
                </span>
              </div>
            </button>
          );
        })}
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
