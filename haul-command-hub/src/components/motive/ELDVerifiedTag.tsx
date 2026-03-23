'use client';

import React from 'react';

interface ELDVerifiedTagProps {
  fleetSize?: number | null;
  lastSyncedAt?: string | null;
  variant?: 'inline' | 'card';
}

/**
 * ELDVerifiedTag — "HC Verified" trust signal powered by Motive ELD data.
 * Displays on directory cards and profiles to show the operator has
 * a live ELD connection with verified fleet data.
 */
export default function ELDVerifiedTag({ fleetSize, lastSyncedAt, variant = 'inline' }: ELDVerifiedTagProps) {
  const freshness = lastSyncedAt
    ? getTimeAgo(new Date(lastSyncedAt))
    : null;

  if (variant === 'card') {
    return (
      <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
            <svg className="w-3 h-3 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="text-blue-400 text-sm font-bold">HC Verified</span>
          <span className="text-[10px] text-gray-500 ml-auto">HC Verified</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-400">
          {fleetSize != null && (
            <span>{fleetSize} vehicle{fleetSize !== 1 ? 's' : ''}</span>
          )}
          {freshness && (
            <span>Updated {freshness}</span>
          )}
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg px-2.5 py-1 text-xs">
      <svg className="w-3 h-3 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
      <span className="text-blue-400 font-bold">HC Verified</span>
      {fleetSize != null && <span className="text-blue-400/50">· {fleetSize} vehicles</span>}
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}
