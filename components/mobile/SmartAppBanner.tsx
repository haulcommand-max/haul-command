'use client';

/**
 * Smart App Banner for iOS/Android deep linking.
 * Shows app install banner on mobile browsers.
 */
export function SmartAppBanner() {
  return (
    <>
      {/* iOS Smart App Banner */}
      <meta name="apple-itunes-app" content="app-id=TBD, app-argument=https://haulcommand.com" />
      {/* Android - manifest handles this, but meta as fallback */}
      <meta name="google-play-app" content="app-id=com.haulcommand.app" />
      {/* Deep link fallbacks */}
      <Link aria-label="Navigation Link" rel="alternate" href="android-app://com.haulcommand.app/https/haulcommand.com" />
      <Link aria-label="Navigation Link" rel="alternate" href="ios-app://TBD/https/haulcommand.com" />
    </>
  );
}
