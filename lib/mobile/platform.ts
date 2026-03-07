/**
 * Haul Command — Platform Detection & Native Utilities
 *
 * Provides isNative, platform, and feature flags for conditional rendering.
 */

import { Capacitor } from '@capacitor/core';

export function isNativePlatform(): boolean {
    try {
        return Capacitor.isNativePlatform();
    } catch {
        return false;
    }
}

export function getPlatform(): 'ios' | 'android' | 'web' {
    try {
        const p = Capacitor.getPlatform();
        if (p === 'ios') return 'ios';
        if (p === 'android') return 'android';
        return 'web';
    } catch {
        return 'web';
    }
}

export function isPluginAvailable(name: string): boolean {
    try {
        return Capacitor.isPluginAvailable(name);
    } catch {
        return false;
    }
}
