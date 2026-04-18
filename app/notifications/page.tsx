import { createServerComponentClient } from '@/lib/supabase/server-auth';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const EVENT_ICONS: Record<string, string> = {
  new_load_match: 'ðŸ“', urgent_nearby_work: 'âš¡', repositioning_opportunity: 'ðŸš›',
  operator_match_found: 'âœ…', coverage_gap_alert: 'âš ï¸', urgent_replacement_needed: 'ðŸš¨',
  claim_reminder: 'ðŸ·ï¸', claim_approved: 'âœ…', profile_incomplete: 'ðŸ“Š',
  profile_benefit_unlocked: 'ðŸŒŸ', trust_score_changed: 'ðŸ›¡ï¸',
  payment_confirmed: 'ðŸ’³', payment_failed: 'âš ï¸', data_product_expiring: 'â³',
  saved_corridor_update: 'ðŸ›£ï¸', nearby_market_active: 'ðŸ“',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export const metadata = {
  title: 'Notifications | Haul Command',
};

export default async function NotificationsPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect('/login');

  const { data: notifs } = await supabase
    .from('hc_notif_events')
    .select('id,event_type,title,body,deep_link,status,created_at,corridor_slug,country_code')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const rows = notifs ?? [];
  const unread = rows.filter(r => r.status === 'sent' || r.status === 'delivered').length;

  return (
    <main className=" bg-[#0a0d14] text-white">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Notifications</h1>
            {unread > 0 && (
              <p className="mt-1 text-sm text-amber-400">{unread} unread</p>
            )}
          </div>
          <Link
            href="/notifications/preferences"
            className="rounded-xl border border-white/10 px-4 py-2 text-xs font-semibold text-white/50 hover:border-white/20 hover:text-white transition-colors"
          >
            Preferences
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="rounded-2xl border border-white/8 bg-white/4 p-10 text-center">
            <div className="text-4xl">ðŸ””</div>
            <p className="mt-3 font-semibold text-white">No notifications yet</p>
            <p className="mt-1 text-sm text-white/40">We'll alert you when loads match, markets activate, or your profile needs attention.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rows.map(n => {
              const icon = EVENT_ICONS[n.event_type] ?? 'ðŸ””';
              const isUnread = n.status === 'sent' || n.status === 'delivered';
              const card = (
                <div className={`flex gap-4 rounded-xl border px-4 py-4 transition-all ${
                  isUnread
                    ? 'border-amber-500/20 bg-amber-500/5'
                    : 'border-white/8 bg-white/3'
                }`}>
                  <span className="mt-0.5 shrink-0 text-xl">{icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-semibold leading-tight ${
                        isUnread ? 'text-white' : 'text-white/70'
                      }`}>
                        {n.title}
                        {isUnread && <span className="ml-2 inline-block h-2 w-2 rounded-full bg-amber-500 align-middle" />}
                      </p>
                      <span className="shrink-0 text-xs text-white/25">{timeAgo(n.created_at)}</span>
                    </div>
                    <p className="mt-1 text-sm text-white/50">{n.body}</p>
                    {n.corridor_slug && (
                      <Link
                        href={`/corridors/${n.corridor_slug}`}
                        className="mt-2 inline-flex text-xs text-amber-400 hover:underline"
                      >
                        View corridor â†’
                      </Link>
                    )}
                  </div>
                </div>
              );
              return n.deep_link ? (
                <Link key={n.id} href={n.deep_link} className="block">{card}</Link>
              ) : (
                <div key={n.id}>{card}</div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}