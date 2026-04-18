'use client';

import React from 'react';

/**
 * UnsourcedDisclaimer — Visual disclaimer for UNSOURCED compliance rules
 *
 * Renders an amber-bordered warning box when a regulation rule has
 * source_quality='UNSOURCED'. Prevents users from relying on
 * unverified compliance information for route planning.
 *
 * Usage:
 * <UnsourcedDisclaimer
 *   ruleTitle="Height Restriction Warning"
 *   state="Texas"
 *   sourceQuality="UNSOURCED"
 * />
 *
 * Only renders when sourceQuality is 'UNSOURCED'. Otherwise returns null.
 */

interface UnsourcedDisclaimerProps {
  /** The title of the regulation rule */
  ruleTitle?: string;
  /** The state/province this rule applies to */
  state?: string;
  /** Source quality from the regulations table */
  sourceQuality: string;
  /** Optional className override */
  className?: string;
}

export default function UnsourcedDisclaimer({
  ruleTitle,
  state,
  sourceQuality,
  className = '',
}: UnsourcedDisclaimerProps) {
  if (sourceQuality !== 'UNSOURCED') return null;

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl border border-amber-500/30 
        bg-amber-500/5 backdrop-blur-sm p-4 mb-4
        ${className}
      `}
      role="alert"
      aria-label="Unverified regulation disclaimer"
    >
      {/* Glow accent */}
      <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/60" />

      <div className="flex items-start gap-3 pl-3">
        {/* Warning icon */}
        <div className="shrink-0 mt-0.5">
          <svg
            className="w-5 h-5 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
        </div>

        <div>
          <p className="text-amber-400 font-semibold text-sm mb-1">
            Unverified Regulation
          </p>
          <p className="text-gray-400 text-xs leading-relaxed">
            {ruleTitle && (
              <span className="text-gray-300 font-medium">{ruleTitle}: </span>
            )}
            This compliance rule{state ? ` for ${state}` : ''} has not been independently verified by Haul Command.
            Always confirm current requirements directly with the relevant state DOT or permitting authority
            before planning your route.
          </p>
          <p className="text-gray-500 text-[10px] mt-2 uppercase tracking-wider font-semibold">
            Source: UNSOURCED · Last verified: Never
          </p>
        </div>
      </div>
    </div>
  );
}
