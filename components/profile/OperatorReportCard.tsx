interface ReportCardProps { reportCard: any; operator: any }
function StatRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-[#0c1015] last:border-0">
      <span className="text-xs text-[#566880]">{label}</span>
      <div className="text-right"><span className="text-sm font-semibold text-[#d0dce8]">{value}</span>{sub && <p className="text-[10px] text-[#3a5068]">{sub}</p>}</div>
    </div>
  )
}
export function OperatorReportCard({ reportCard: rc, operator }: ReportCardProps) {
  const onTime = rc?.on_time_rate ? `${Math.round(Number(rc.on_time_rate)*100)}%` : '—'
  const miles = rc?.miles_escorted ? Number(rc.miles_escorted).toLocaleString() : '—'
  const loads = rc?.loads_completed ?? operator.jobs_completed ?? 0
  const responseMin = operator.avg_response_time_minutes ?? operator.avg_response_minutes
  const responseStr = responseMin ? `${Math.round(responseMin)}m` : '—'
  const corridors = rc?.corridors_active ?? (Array.isArray(operator.corridors_familiar) ? operator.corridors_familiar.length : 0)
  return (
    <div className="bg-[#0f1a24] border border-[#1e3048] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-[#f0f2f5]">Report Card</h2>
        {rc?.rank_title && <span className="text-[10px] text-[#d4950e] font-bold">{rc.rank_title}{rc.rank_level ? ` · L${rc.rank_level}` : ''}</span>}
      </div>
      <StatRow label="Loads Completed" value={loads.toLocaleString()} sub="verified jobs" />
      <StatRow label="On-Time Rate" value={onTime} sub="arrival accuracy" />
      <StatRow label="Miles Escorted" value={miles} sub="total career" />
      <StatRow label="Avg Response" value={responseStr} sub="to load requests" />
      <StatRow label="Active Corridors" value={corridors.toString()} sub="routes served" />
      {rc?.signals_reported > 0 && <StatRow label="CSN Signals Filed" value={rc.signals_reported.toString()} sub={`${Math.round(Number(rc.signal_accuracy||0)*100)}% accuracy`} />}
      {rc?.safety_incidents === 0 && <div className="mt-3 text-xs text-[#22c55e] bg-[#0d2000] border border-[#2a5010] rounded-lg px-3 py-2">✓ Zero safety incidents recorded</div>}
      <div className="mt-4 pt-4 border-t border-[#0c1015]"><p className="text-[10px] text-[#3a4e64]">Member since {new Date(operator.created_at).toLocaleDateString('en-US',{month:'long',year:'numeric'})}</p></div>
    </div>
  )
}
