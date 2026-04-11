'use client';

import { useEffect, useRef } from 'react';
import { usePostHog } from 'posthog-js/react';

export function BlogAnalyticsTrigger({ 
  eventName, 
  properties,
  children
}: { 
  eventName: string; 
  properties?: Record<string, any>;
  children?: React.ReactNode;
}) {
  const posthog = usePostHog();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Initial Page/View Event
    if (posthog) {
      posthog.capture(eventName, properties);
    }
  }, [posthog, eventName, properties]);

  useEffect(() => {
    // 2. Click Interceptor for CMS-generated <a> tags
    if (!wrapperRef.current || !posthog) return;

    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Traverse up to find if an <a> tag was clicked
      const anchor = target.closest('a');
      
      if (anchor) {
        const href = anchor.getAttribute('href');
        const text = anchor.textContent?.trim();
        
        posthog.capture('cms_link_clicked', {
          ...properties,
          destination_href: href,
          link_text: text,
          page_event_context: eventName
        });
      }
    };

    const container = wrapperRef.current;
    container.addEventListener('click', handleLinkClick);

    return () => {
      container.removeEventListener('click', handleLinkClick);
    };
  }, [posthog, eventName, properties]);

  if (!children) return null;

  return <div ref={wrapperRef} className="contents">{children}</div>;
}
