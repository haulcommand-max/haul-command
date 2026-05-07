import Link from 'next/link';
import { CommentDeadlineCountdown } from './CommentDeadlineCountdown';

export interface RegulatoryWatchCardProps {
  docket_id?: string | null;
  title: string;
  status?: string | null;
  comment_deadline?: string | null;
  agency_name?: string | null;
  affected_roles?: string[] | null;
  risk_score?: number | null;
  opportunity_score?: number | null;
  plain_english?: string | null;
  page_slug?: string | null;
}

const STATUS_CLASSES: Record<string, string> = {
  comment_open: 'border-emerald-300/40 bg-emerald-400/15 text-emerald-100',
  monitoring: 'border-amber-300/40 bg-amber-400/15 text-amber-100',
  comment_closed: 'border-slate-500/30 bg-slate-500/10 text-slate-200',
  decided: 'border-blue-300/40 bg-blue-400/15 text-blue-100',
  implemented: 'border-purple-300/40 bg-purple-400/15 text-purple-100',
  withdrawn: 'border-slate-500/30 bg-slate-500/10 text-slate-200',
  appeal: 'border-red-300/40 bg-red-400/15 text-red-100',
};

function formatStatus(status?: string | null) {
  return (status || 'monitoring').replace(/_/g, ' ');
}

export function RegulatoryWatchCard({
  docket_id,
  title,
  status = 'monitoring',
  comment_deadline,
  agency_name,
  affected_roles = [],
  risk_score,
  opportunity_score,
  plain_english,
  page_slug,
}: RegulatoryWatchCardProps) {
  const href = page_slug ? `/${page_slug}` : docket_id ? `/regulations/us/fmcsa/${docket_id}` : '/regulatory-radar';
  const statusClass = STATUS_CLASSES[status ?? 'monitoring'] ?? STATUS_CLASSES.monitoring;

  return (
    <article className="rounded-2xl border border-white/10 bg-slate-950/70 p-5 shadow-xl shadow-black/20">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusClass}`}>
          {formatStatus(status)}
        </span>
        {agency_name && <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{agency_name}</span>}
        {docket_id && <span className="text-xs text-slate-500">{docket_id}</span>}
      </div>

      <h3 className="mt-4 text-xl font-bold text-white">{title}</h3>
      {plain_english && <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">{plain_english}</p>}

      <div className="mt-4">
        <CommentDeadlineCountdown deadline={comment_deadline} status={status} />
      </div>

      {affected_roles && affected_roles.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {affected_roles.slice(0, 8).map((role) => (
            <span key={role} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
              {role.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Risk</div>
          <div className="mt-1 text-2xl font-black text-white">{risk_score ?? '—'}/10</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Opportunity</div>
          <div className="mt-1 text-2xl font-black text-[#C6923A]">{opportunity_score ?? '—'}/10</div>
        </div>
      </div>

      <Link href={href} className="mt-5 inline-flex rounded-xl bg-[#C6923A] px-4 py-2 text-sm font-bold text-black transition hover:bg-[#f2c76b]">
        View regulatory brief
      </Link>
    </article>
  );
}
