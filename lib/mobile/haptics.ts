/**
 * Haptics utility — Cross-platform haptic feedback for mobile interactions.
 *
 * P2: Premium feel on letter taps, swipe thresholds, and action confirmations.
 * Uses Capacitor Haptics plugin when available, falls back to navigator.vibrate().
 */

type HapticIntensity = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

// Vibration patterns in ms
const VIBRATION_PATTERNS: Record<HapticIntensity, number[]> = {
  light: [10],
  medium: [20],
  heavy: [40],
  selection: [5],
  success: [10, 50, 20],
  warning: [20, 30, 20, 30, 20],
  error: [40, 50, 40],
};

/**
 * Trigger haptic feedback.
 * Automatically detects platform capabilities.
 */
export function triggerHaptic(intensity: HapticIntensity = 'medium'): void {
  try {
    // 1. Try Capacitor Haptics (native app)
    if (typeof window !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.()) {
      const { Haptics, ImpactStyle, NotificationType } = (window as any).Capacitor.Plugins;
      if (Haptics) {
        switch (intensity) {
          case 'light':
            Haptics.impact({ style: ImpactStyle?.Light ?? 'LIGHT' });
            break;
          case 'medium':
            Haptics.impact({ style: ImpactStyle?.Medium ?? 'MEDIUM' });
            break;
          case 'heavy':
            Haptics.impact({ style: ImpactStyle?.Heavy ?? 'HEAVY' });
            break;
          case 'selection':
            Haptics.selectionStart();
            setTimeout(() => Haptics.selectionEnd(), 50);
            break;
          case 'success':
            Haptics.notification({ type: NotificationType?.Success ?? 'SUCCESS' });
            break;
          case 'warning':
            Haptics.notification({ type: NotificationType?.Warning ?? 'WARNING' });
            break;
          case 'error':
            Haptics.notification({ type: NotificationType?.Error ?? 'ERROR' });
            break;
        }
        return;
      }
    }

    // 2. Fallback: Web Vibration API (Android Chrome, some PWAs)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      const pattern = VIBRATION_PATTERNS[intensity] || VIBRATION_PATTERNS.medium;
      navigator.vibrate(pattern);
      return;
    }

    // 3. No haptic support — silent no-op
  } catch {
    // Silently fail — haptics are enhancement only
  }
}

/**
 * Check if haptic feedback is supported on this device.
 */
export function isHapticSupported(): boolean {
  if (typeof window === 'undefined') return false;

  // Capacitor native
  if ((window as any).Capacitor?.isNativePlatform?.()) {
    return !!(window as any).Capacitor.Plugins?.Haptics;
  }

  // Web Vibration API
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Trigger haptic on an element tap (useful for letter indexes, buttons, etc.)
 * Returns an onClick handler that triggers haptic then calls the original handler.
 */
export function withHaptic<T extends (...args: any[]) => void>(
  handler: T,
  intensity: HapticIntensity = 'selection',
): (...args: Parameters<T>) => void {
  return (...args: Parameters<T>) => {
    triggerHaptic(intensity);
    handler(...args);
  };
}
