'use client';

import { useState } from 'react';
import { Smartphone, Lock, MapPin, Phone, FileText, ChevronRight } from 'lucide-react';
import { track } from '@/lib/telemetry';

/* ──────────────────────────────────────────────────── */
/*  AppGate — "Open in App" overlay for premium content  */
/*  Shows blurred preview of gated content + install CTA */
/* ──────────────────────────────────────────────────── */

interface AppGateProps {
    /** What content is being gated */
    gatedContent: 'contact_info' | 'route_details' | 'documents' | 'full_listing';
    /** Entity ID for deep link */
    entityId: string;
    /** Entity type */
    entityType: 'load' | 'profile' | 'corridor';
    /** App store URLs */
    appStoreUrl?: string;
    playStoreUrl?: string;
    /** Allow auth bypass (logged-in users skip gate) */
    isAuthenticated?: boolean;
}

const GATE_LABELS: Record<string, { icon: typeof MapPin; title: string; description: string }> = {
    contact_info: {
        icon: Phone,
        title: 'Contact Info Available in App',
        description: 'Phone number, email, and direct messaging available in the Haul Command app.',
    },
    route_details: {
        icon: MapPin,
        title: 'Full Route Details in App',
        description: 'Turn-by-turn route, escort positioning, and bridge clearances in the app.',
    },
    documents: {
        icon: FileText,
        title: 'Documents Available in App',
        description: 'Permits, insurance certificates, and compliance docs viewable in the app.',
    },
    full_listing: {
        icon: Lock,
        title: 'Full Details in App',
        description: 'Get the complete listing with all details in the Haul Command app.',
    },
};

function isIOS(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function getStoreUrl(appStoreUrl?: string, playStoreUrl?: string): string {
    if (isIOS()) {
        return appStoreUrl || 'https://apps.apple.com/app/haul-command/id000000000';
    }
    return playStoreUrl || 'https://play.google.com/store/apps/details?id=com.haulcommand.app';
}

export default function AppGate({
    gatedContent,
    entityId,
    entityType,
    appStoreUrl,
    playStoreUrl,
    isAuthenticated = false,
}: AppGateProps) {
    const [expanded, setExpanded] = useState(false);

    // Authenticated users see content (no gate)
    if (isAuthenticated) return null;

    const gate = GATE_LABELS[gatedContent] || GATE_LABELS.full_listing;
    const Icon = gate.icon;
    const storeUrl = getStoreUrl(appStoreUrl, playStoreUrl);
    const deepLink = `haulcommand://${entityType}/${entityId}`;

    const handleOpenInApp = () => {
        track('open_in_app_clicked' as any, {
            entity_type: entityType,
            entity_id: entityId,
            metadata: { gated_content: gatedContent },
        });

        // Try deep link first, fall back to store
        const timeout = setTimeout(() => {
            window.location.href = storeUrl;
        }, 1500);

        window.location.href = deepLink;

        // Clear timeout if app opens
        window.addEventListener('blur', () => clearTimeout(timeout), { once: true });
    };

    return (
        <div className="relative">
            {/* Blurred preview placeholder */}
            <div className="absolute inset-0 bg-slate-800/40 rounded-xl overflow-hidden pointer-events-none">
                <div className="p-6 space-y-3 blur-sm opacity-30 select-none">
                    <div className="h-4 bg-slate-600 rounded w-3/4" />
                    <div className="h-4 bg-slate-600 rounded w-1/2" />
                    <div className="h-4 bg-slate-600 rounded w-2/3" />
                    <div className="h-8 bg-slate-600 rounded w-1/3 mt-4" />
                </div>
            </div>

            {/* Gate overlay */}
            <div className="relative bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-xl p-8 text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/20 flex items-center justify-center mx-auto">
                    <Icon className="w-7 h-7 text-amber-400" />
                </div>

                <div>
                    <h3 className="text-lg font-bold text-white mb-1">{gate.title}</h3>
                    <p className="text-sm text-slate-400">{gate.description}</p>
                </div>

                <button
                    onClick={handleOpenInApp}
                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold px-6 py-3 rounded-lg transition-colors text-sm group mx-auto"
                >
                    <Smartphone className="w-4 h-4" />
                    Open in App
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>

                {/* Expand for web fallback (de-emphasized) */}
                {!expanded ? (
                    <button
                        onClick={() => {
                            setExpanded(true);
                            track('open_in_app_shown' as any, {
                                entity_type: entityType,
                                entity_id: entityId,
                                metadata: { action: 'expand_web_fallback' },
                            });
                        }}
                        className="block text-xs text-slate-500 hover:text-slate-400 transition-colors mx-auto mt-2"
                    >
                        or continue on web →
                    </button>
                ) : (
                    <p className="text-xs text-slate-500 mt-2">
                        Sign in to view this content on web.{' '}
                        <a href="/login" className="text-amber-400 hover:text-amber-300 transition-colors">
                            Log in →
                        </a>
                    </p>
                )}
            </div>
        </div>
    );
}
