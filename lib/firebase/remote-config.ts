/**
 * Firebase Remote Config — Haul Command
 *
 * Provides feature flags via Firebase Remote Config.
 * Falls back gracefully if not configured.
 */

export async function getRemoteConfig(): Promise<Record<string, any> | null> {
  if (typeof window === 'undefined') return null;
  try {
    const { initializeApp, getApps, getApp } = await import('firebase/app');
    const { getRemoteConfig: getRC, fetchAndActivate, getAll } = await import('firebase/remote-config');

    const app = getApps().length > 0 ? getApp() : null;
    if (!app) return null;

    const rc = getRC(app);
    rc.settings.minimumFetchIntervalMillis = 3600000; // 1 hour
    await fetchAndActivate(rc);
    return getAll(rc);
  } catch {
    return null;
  }
}
