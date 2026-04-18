import Link from 'next/link';
import { ShieldCheck, AlertTriangle, Clock, BookOpen } from 'lucide-react';
import type { TrainingUserStatus } from '@/lib/training/types';
import { getHighestActiveBadge, getBadgeDisplayState } from '@/lib/training/badges';
import { BADGE_META } from '@/lib/training/types';

interface TrainingStatusCardProps {
  userStatus: TrainingUserStatus | null;
}

export default function TrainingStatusCard({ userStatus }: TrainingStatusCardProps) {
  if (!userStatus || (!userStatus.enrollments?.length && !userStatus.badges?.length)) {
    return (
      <div className="border border-white/10 rounded-xl p-5 bg-white/[0.02]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
            <BookOpen size={18} className="text-gray-400" />
          </div>
          <div>
            <div className="font-semibold text-white text-sm">No Training Yet</div>
            <div className="text-xs text-gray-500">Start training to improve your rank and trust</div>
          </div>
        </div>
        <Link
          href="/training"
          className="block w-full py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 text-sm font-semibold rounded-lg border border-yellow-500/20 transition-colors text-center"
        >
          Browse Training →
        </Link>
      </div>
    );
  }

  const highestBadge = getHighestActiveBadge(userStatus.badges ?? []);
  const badgesWithIssues = (userStatus.badges ?? []).filter(b => b.status !== 'active');
  const meta = highestBadge ? BADGE_META[highestBadge.badge_slug] : null;
  const state = highestBadge ? getBadgeDisplayState(highestBadge) : null;

  return (
    <div className="border border-white/10 rounded-xl p-5 bg-white/[0.02] space-y-4">
      <div className="text-xs text-gray-500 uppercase tracking-wider font-mono">Training Status</div>

      {/* Active badge */}
      {highestBadge && meta && state && (
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${state.colorClass}`}>
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="font-bold text-white text-sm">{meta.label}</div>
            <div className={`text-xs ${state.isActive ? 'text-green-400' : 'text-orange-400'}`}>
              {state.stateLabel}
            </div>
          </div>
        </div>
      )}

      {/* Issues */}
      {badgesWithIssues.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-orange-500/5 border border-orange-500/20 rounded-lg">
          <AlertTriangle size={14} className="text-orange-400 mt-0.5 shrink-0" />
          <div className="text-xs text-orange-300">
            {badgesWithIssues.length} badge{badgesWithIssues.length > 1 ? 's' : ''} need renewal or review.{' '}
            <Link href="/training" className="underline">Refresh now</Link>
          </div>
        </div>
      )}

      {/* Enrollments summary */}
      {userStatus.enrollments && userStatus.enrollments.length > 0 && (
        <div className="border-t border-white/5 pt-3">
          <div className="text-xs text-gray-500 mb-2">Enrolled Courses</div>
          <div className="space-y-1.5">
            {userStatus.enrollments.slice(0, 3).map((e) => (
              <div key={e.training_id} className="flex items-center justify-between">
                <span className="text-xs text-gray-300 capitalize">{e.node_id?.replace(/-/g, ' ')}</span>
                <span className={`text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded ${
                  e.status === 'completed' ? 'text-green-400 bg-green-400/10' :
                  e.status === 'in_progress' ? 'text-yellow-400 bg-yellow-400/10' :
                  e.status === 'expired' ? 'text-red-400 bg-red-400/10' :
                  'text-gray-400 bg-gray-400/10'
                }`}>
                  {e.status.replace(/_/g, ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Link
        href="/training"
        className="block w-full py-2 text-xs font-semibold text-center text-gray-400 hover:text-white border border-white/5 rounded-lg transition-colors"
      >
        View all training →
      </Link>
    </div>
  );
}
