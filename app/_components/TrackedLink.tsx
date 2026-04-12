'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export function TrackedLink({ href, eventName, eventParams, children, className }: any) {
  return (
    <Link 
      href={href} 
      className={className} 
      onClick={() => {
        import('@/lib/analytics/track').then(({ track }) => {
          track.event(eventName, eventParams);
        });
      }}
    >
      {children}
    </Link>
  );
}

export function PageViewTracker({ eventName, params }: { eventName: string, params: any }) {
    useEffect(() => {
        import('@/lib/analytics/track').then(({ track }) => {
            track.event(eventName, params);
        });
    }, [eventName, params]);
    return null;
}