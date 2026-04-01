/**
 * Hydration Safe Date Utilities
 * Prevents React hydration mismatch warnings by ensuring stable initial server rendering.
 */
import { useEffect, useState } from 'react';

export function useHydrationSafeDate(isoDate: string) {
  const [renderedDate, setRenderedDate] = useState<string>('');

  useEffect(() => {
    if (isoDate) {
      setRenderedDate(new Date(isoDate).toLocaleDateString());
    }
  }, [isoDate]);

  // Return a generic placeholder or empty string for the initial server render
  return renderedDate;
}
