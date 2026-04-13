# MOBILE APP SHELL PLAN (Capacitor)

## Integration Plan
The `capacitor.config.ts` file already exists, proving the root shell is established. This plan prevents breaking the responsive web-app during App Store prep.

## Platform UX Enforcement
1. **Thumb-First Layout:** The primary workflow for dispatchers and pilots happens in the cab or on site. Navigation must be bottom-anchored.
2. **Safe Areas:** Utilize CSS `env(safe-area-inset-top)` and `safe-area-inset-bottom` around headers and native-feeling tabs.
3. **Interstitials:** No full-page detours for filters or small settings. Use `react-spring` or `Motion` bottom-sheets.
4. **Haptics:** Tie Capacitor Haptics API to `StateButton` and `PulsingButton` completion states.
5. **Connectivity:** Graceful offline states. Pilot cars lose cell service on long desert/mountain corridors. The Map and core contacts must cache heavily via Service Worker/PWA logic inside the shell.
