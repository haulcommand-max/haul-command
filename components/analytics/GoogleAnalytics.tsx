'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';



const GA4_ID = process.env.NEXT_PUBLIC_GA4_ID;

export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA4_ID || typeof window.gtag !== 'function') return;
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    window.gtag('config', GA4_ID, { page_path: url });
  }, [pathname, searchParams]);

  if (!GA4_ID) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA4_ID}', {
            page_path: window.location.pathname,
            send_page_view: true
          });
        `}
      </Script>
    </>
  );
}

// Track custom Haul Command events
export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params || {});
}

export const HC_EVENTS = {
  LOAD_BOARD_VIEW: 'load_board_view',
  DIRECTORY_SEARCH: 'directory_search',
  TRAINING_PAGE_VIEW: 'training_page_view',
  AV_PAGE_VIEW: 'av_page_view',
  PRICING_PAGE_VIEW: 'pricing_page_view',
  CORPORATE_TRAINING_INQUIRY: 'corporate_training_inquiry',
  PARTNER_FORM_SUBMIT: 'partner_form_submit',
  OPERATOR_SIGNUP: 'operator_signup',
  BROKER_SIGNUP: 'broker_signup',
  CLAIM_START: 'claim_start',
  LOAD_POSTED: 'load_posted',
} as const;
