'use client';

import Script from 'next/script';

const PARTNER_ID = process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID;

export function LinkedInInsightTag() {
  if (!PARTNER_ID) return null;

  return (
    <>
      <Script id="linkedin-insight" strategy="afterInteractive">
        {`
          _linkedin_partner_id = "${PARTNER_ID}";
          window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
          window._linkedin_data_partner_ids.push(_linkedin_partner_id);
          (function(l) {
            if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
            window.lintrk.q=[]}
            var s = document.getElementsByTagName("script")[0];
            var b = document.createElement("script");
            b.type = "text/javascript";b.async = true;
            b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
            s.parentNode.insertBefore(b, s);
          })(window.lintrk);
        `}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          alt=""
          src={`https://px.ads.linkedin.com/collect/?pid=${PARTNER_ID}&fmt=gif`}
        />
      </noscript>
    </>
  );
}

// LinkedIn conversion events
export function trackLinkedInConversion(conversionId: string) {
  if (typeof window === 'undefined') return;
  if (typeof (window as any).lintrk === 'function') {
    (window as any).lintrk('track', { conversion_id: conversionId });
  }
}

export const LI_CONVERSIONS = {
  TRAINING_ENROLLMENT_START: process.env.NEXT_PUBLIC_LI_CONV_TRAINING || '',
  CORPORATE_TRAINING_INQUIRY: process.env.NEXT_PUBLIC_LI_CONV_CORPORATE || '',
  OPERATOR_SIGNUP: process.env.NEXT_PUBLIC_LI_CONV_OPERATOR || '',
  BROKER_SIGNUP: process.env.NEXT_PUBLIC_LI_CONV_BROKER || '',
} as const;
