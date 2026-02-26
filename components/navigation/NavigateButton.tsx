'use client';

import { Navigation } from 'lucide-react';
import { getNavigationChoices, coordsToString, openNavigation } from '@/lib/navigation';
import { useState, useRef, useEffect } from 'react';

interface NavigateButtonProps {
    lat: number;
    lng: number;
    label?: string;
    className?: string;
}

/**
 * "Navigate" button — opens Google Maps or Apple Maps for directions.
 * Phase 1: free deep-link, zero API cost.
 */
export default function NavigateButton({ lat, lng, label, className = '' }: NavigateButtonProps) {
    const [showChoices, setShowChoices] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const destination = coordsToString(lat, lng);
    const choices = getNavigationChoices(label || destination);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setShowChoices(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={ref} className={`relative inline-flex ${className}`}>
            <button
                onClick={() => setShowChoices(!showChoices)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs
                    bg-hc-gold-500 text-black hover:bg-hc-gold-400 transition-all shadow-sm
                    active:scale-95"
                title="Get driving directions"
            >
                <Navigation className="w-3.5 h-3.5" />
                Navigate
            </button>

            {showChoices && (
                <div className="absolute top-full mt-1 right-0 z-50 bg-hc-card border border-hc-border
                    rounded-lg shadow-xl min-w-[200px] overflow-hidden animate-in fade-in slide-in-from-top-1">
                    <button
                        onClick={() => {
                            openNavigation({ destination: label || destination, provider: 'google' });
                            setShowChoices(false);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left
                            text-hc-text hover:bg-hc-elevated transition-colors"
                    >
                        <span>🗺️</span>
                        <span>{choices.google.label}</span>
                    </button>
                    <button
                        onClick={() => {
                            openNavigation({ destination: label || destination, provider: 'apple' });
                            setShowChoices(false);
                        }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left
                            text-hc-text hover:bg-hc-elevated transition-colors border-t border-hc-border"
                    >
                        <span>🍎</span>
                        <span>{choices.apple.label}</span>
                    </button>
                </div>
            )}
        </div>
    );
}
