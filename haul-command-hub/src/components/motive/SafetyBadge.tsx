'use client';

import React from 'react';

interface SafetyBadgeProps {
  score: number | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

function scoreColor(score: number): string {
  if (score >= 90) return 'text-green-400 border-green-500/30 bg-green-500/10';
  if (score >= 75) return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
  if (score >= 60) return 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10';
  return 'text-red-400 border-red-500/30 bg-red-500/10';
}

function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Needs Improvement';
}

/**
 * SafetyBadge — displays a Motive-powered safety score.
 * Used on directory cards, leaderboard, and operator profiles.
 */
export default function SafetyBadge({ score, size = 'md', showLabel = true }: SafetyBadgeProps) {
  if (score == null) return null;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  };

  return (
    <div
      className={`inline-flex items-center rounded-lg border font-bold tabular-nums ${scoreColor(score)} ${sizeClasses[size]}`}
      title={`Safety Score: ${Math.round(score)}/100 — powered by Motive ELD`}
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path
          fillRule="evenodd"
          d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      <span>{Math.round(score)}</span>
      {showLabel && <span className="font-medium opacity-75 text-[0.85em]">{scoreLabel(score)}</span>}
    </div>
  );
}
