// components/motive/HOSCompatibilityBadge.tsx
// Shows green checkmark/red X based on HOS remaining vs estimated drive time

'use client';

interface Props {
  hoursRemaining: number;
  estimatedDriveHours: number;
}

export default function HOSCompatibilityBadge({ hoursRemaining, estimatedDriveHours }: Props) {
  const canComplete = hoursRemaining >= estimatedDriveHours;
  const buffer = hoursRemaining - estimatedDriveHours;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 4,
        background: canComplete ? '#22c55e12' : '#ef444412',
        border: `1px solid ${canComplete ? '#22c55e30' : '#ef444430'}`,
        color: canComplete ? '#22c55e' : '#ef4444',
        fontSize: 11,
        fontWeight: 600,
      }}
      title={
        canComplete
          ? `${hoursRemaining.toFixed(1)}h remaining — sufficient for ${estimatedDriveHours.toFixed(1)}h drive`
          : `${hoursRemaining.toFixed(1)}h remaining — insufficient for ${estimatedDriveHours.toFixed(1)}h drive`
      }
    >
      {canComplete ? '✓' : '✗'}
      <span>HOS {canComplete ? 'OK' : 'SHORT'}</span>
      {canComplete && buffer < 2 && (
        <span style={{ color: '#ffcc00', fontSize: 10 }}>(tight)</span>
      )}
    </span>
  );
}
