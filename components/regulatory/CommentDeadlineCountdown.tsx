'use client';

import { useMemo } from 'react';

export interface CommentDeadlineCountdownProps {
  deadline: string | null | undefined;
  status?: string | null;
  label?: string;
}

function getDayDiff(deadline: string) {
  const target = new Date(`${deadline}T23:59:59`);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function CommentDeadlineCountdown({ deadline, status, label = 'Comment deadline' }: CommentDeadlineCountdownProps) {
  const state = useMemo(() => {
    if (!deadline) {
      return {
        text: 'No public comment deadline listed',
        className: 'border-white/10 bg-white/5 text-slate-300',
      };
    }

    const days = getDayDiff(deadline);
    const formatted = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(`${deadline}T12:00:00`));

    if (status && status !== 'comment_open') {
      return {
        text: `${label}: ${formatted}`,
        className: 'border-slate-500/30 bg-slate-500/10 text-slate-200',
      };
    }

    if (days < 0) {
      return {
        text: 'Comment period closed',
        className: 'border-slate-500/30 bg-slate-500/10 text-slate-200',
      };
    }

    if (days <= 7) {
      return {
        text: `${label}: ${formatted} — ${days} day${days === 1 ? '' : 's'} left`,
        className: 'border-red-400/40 bg-red-500/15 text-red-100',
      };
    }

    if (days <= 21) {
      return {
        text: `${label}: ${formatted} — ${days} days left`,
        className: 'border-amber-300/40 bg-amber-400/15 text-amber-100',
      };
    }

    return {
      text: `${label}: ${formatted} — ${days} days left`,
      className: 'border-emerald-300/40 bg-emerald-400/15 text-emerald-100',
    };
  }, [deadline, status, label]);

  return (
    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${state.className}`}>
      {state.text}
    </span>
  );
}
