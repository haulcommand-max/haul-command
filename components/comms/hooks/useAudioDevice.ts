/**
 * useAudioDevice — Speaker/Earpiece/Wired Headset Routing
 *
 * Controls audio output routing using Web Audio API.
 * Phase 1: speaker, earpiece, wired_headset detection.
 * Phase 2: Bluetooth PTT button support.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import type { DeviceRoute } from '@/lib/comms/types';

interface UseAudioDeviceReturn {
    currentRoute: DeviceRoute;
    availableDevices: MediaDeviceInfo[];
    setRoute: (route: DeviceRoute) => void;
    hasWiredHeadset: boolean;
}

export function useAudioDevice(): UseAudioDeviceReturn {
    const [currentRoute, setCurrentRoute] = useState<DeviceRoute>('speaker');
    const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
    const [hasWiredHeadset, setHasWiredHeadset] = useState(false);

    // Enumerate audio devices
    useEffect(() => {
        async function enumerateDevices() {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
                setAvailableDevices(audioOutputs);

                // Detect wired headset
                const wired = audioOutputs.some(d =>
                    d.label.toLowerCase().includes('headset') ||
                    d.label.toLowerCase().includes('headphone') ||
                    d.label.toLowerCase().includes('wired')
                );
                setHasWiredHeadset(wired);

                // Auto-select wired if detected
                if (wired && currentRoute === 'speaker') {
                    setCurrentRoute('wired_headset');
                }
            } catch {
                // Browser may not support mediaDevices
            }
        }

        enumerateDevices();

        // Listen for device changes (plug/unplug)
        navigator.mediaDevices?.addEventListener('devicechange', enumerateDevices);
        return () => {
            navigator.mediaDevices?.removeEventListener('devicechange', enumerateDevices);
        };
    }, []);

    const setRoute = useCallback((route: DeviceRoute) => {
        setCurrentRoute(route);
        // In a real implementation, this would change the audio sink
        // via setSinkId() on audio elements
    }, []);

    return {
        currentRoute,
        availableDevices,
        setRoute,
        hasWiredHeadset,
    };
}
