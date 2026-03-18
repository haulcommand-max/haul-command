import type { HCAction } from '@/lib/hc-types';

interface ActionQuadProps {
  actions: HCAction[];
}

const ACTION_ICONS: Record<string, string> = {
  hc_act_find_escorts: '🔍',
  hc_act_post_load: '📦',
  hc_act_view_requirements: '📋',
  hc_act_claim_listing: '✅',
};

const ACTION_DESCRIPTIONS: Record<string, string> = {
  hc_act_find_escorts: 'Search verified escort operators near your route',
  hc_act_post_load: 'Post your oversize load for immediate coverage',
  hc_act_view_requirements: 'Check escort rules by state and country',
  hc_act_claim_listing: 'Own your profile and unlock premium features',
};

export default function HCActionQuad({ actions }: ActionQuadProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
      {actions.slice(0, 4).map((action) => (
        <a
          key={action.id}
          href={action.href}
          className="group relative bg-white/[0.03] hover:bg-accent/[0.06] border border-white/[0.08] hover:border-accent/30 rounded-2xl p-5 sm:p-6 transition-all duration-200 flex flex-col items-center text-center"
        >
          <span className="text-3xl mb-3 group-hover:scale-110 transition-transform">
            {ACTION_ICONS[action.id] || '→'}
          </span>
          <span className="text-white font-bold text-sm sm:text-base group-hover:text-accent transition-colors">
            {action.label}
          </span>
          <span className="text-gray-500 text-[11px] sm:text-xs mt-1.5 leading-relaxed">
            {ACTION_DESCRIPTIONS[action.id] || ''}
          </span>
        </a>
      ))}
    </div>
  );
}
