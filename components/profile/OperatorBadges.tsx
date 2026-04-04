interface BadgesProps { badges: any[] }
const BADGE_COLORS: Record<string,string> = { verified:'#22c55e', elite:'#d4950e', top_responder:'#8ab0d0', safety_record:'#22c55e', veteran:'#d4950e', corridor_master:'#9060d0', signal_scout:'#c0a030', default:'#566880' }
export function OperatorBadges({ badges }: BadgesProps) {
  return (
    <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6">
      <h2 className="text-base font-bold text-[#f0f2f5] mb-4">Earned Badges</h2>
      <div className="flex flex-wrap gap-3">
        {badges.map(badge => {
          const color = BADGE_COLORS[badge.badge_type] ?? BADGE_COLORS.default
          const isExpired = badge.expires_at && new Date(badge.expires_at) < new Date()
          return (
            <div key={badge.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs ${isExpired?'opacity-40':''}`} style={{ background:`${color}15`, borderColor:`${color}40`, color }}>
              {badge.badge_icon && <span>{badge.badge_icon}</span>}
              <span className="font-semibold">{badge.badge_name}</span>
              {isExpired && <span className="text-[9px] opacity-60">EXPIRED</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
