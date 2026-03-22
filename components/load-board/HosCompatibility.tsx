'use client';

/**
 * HOS Compatibility Indicator for Load Board
 * Shows green check / red X based on whether operator has
 * sufficient HOS remaining to complete a load.
 */
export function HosCompatibility({ hoursRemaining, estimatedDriveHours }: {
  hoursRemaining: number | null;
  estimatedDriveHours: number;
}) {
  if (hoursRemaining === null) {
    return (
      <span className="inline-flex items-center gap-1 text-gray-500 text-xs">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        No ELD
      </span>
    );
  }

  const canComplete = hoursRemaining >= estimatedDriveHours;
  const buffer = hoursRemaining - estimatedDriveHours;

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${canComplete ? 'text-emerald-400' : 'text-red-400'}`}>
      {canComplete ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
      {canComplete
        ? `${hoursRemaining.toFixed(1)}h avail (+${buffer.toFixed(1)}h buffer)`
        : `${hoursRemaining.toFixed(1)}h avail (need ${estimatedDriveHours.toFixed(1)}h)`
      }
    </span>
  );
}
