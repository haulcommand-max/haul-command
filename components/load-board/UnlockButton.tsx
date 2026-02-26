'use client';

import * as React from 'react';
import { createClient } from '@/lib/supabase/client';
import { track } from '@/lib/analytics/track';

type UnlockResult =
    | { ok: true; tier: string; remaining_today: number; contact: { name?: string; phone_e164?: string; email?: string; url?: string; instructions?: string } }
    | { ok: false; code: string; message: string; retry_at?: string; cap?: number };

type ContactInfo = { name?: string; phone_e164?: string; email?: string; url?: string; instructions?: string };

type Props = {
    loadId: string;
    onUnlocked?: (contact: ContactInfo) => void;
};


type State =
    | { status: 'idle' }
    | { status: 'verifying' }
    | { status: 'unlocked'; data: Extract<UnlockResult, { ok: true }> }
    | { status: 'blocked'; data: Extract<UnlockResult, { ok: false }> };

export function UnlockButton({ loadId, onUnlocked }: Props) {
    const [state, setState] = React.useState<State>({ status: 'idle' });
    const supabase = createClient();

    async function handleUnlock() {
        setState({ status: 'verifying' });

        // Fire analytics immediately — never block UI on tracking
        track.holdSlotClicked({
            job_id: loadId,
        });

        try {
            // 1. Get Session
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                setState({ status: 'blocked', data: { ok: false, code: 'AUTH_REQUIRED', message: 'Login required to unlock contact.' } });
                return;
            }

            // 2. Call Edge Function (Preferred for IP hashing)
            // If deployed, use: await fetch('/functions/v1/unlock-contact', ...)
            // Fallback: Direct RPC (Note: IP hashing won't work client-side)

            const { data, error } = await supabase.rpc('request_contact_unlock', {
                p_load_id: loadId,
                p_ip_hash: null, // Client cannot send this securely
                p_ua_hash: null,
                p_session_id: null
            });

            if (error) throw error;

            const result = data as UnlockResult;

            if (!result.ok) {
                setState({ status: 'blocked', data: result });
                return;
            }

            setState({ status: 'unlocked', data: result });
            onUnlocked?.(result.contact);

        } catch (err: any) {
            console.error('Unlock error:', err);
            setState({ status: 'blocked', data: { ok: false, code: 'NETWORK', message: 'System error. Please try again.' } });
        }
    }

    const disabled = state.status === 'verifying' || state.status === 'unlocked';

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={handleUnlock}
                disabled={disabled}
                className={`px-4 py-2 rounded-md font-medium transition-colors ${state.status === 'unlocked'
                    ? 'bg-green-100 text-green-800 border-green-200 cursor-default'
                    : state.status === 'blocked'
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                    }`}
            >
                {state.status === 'verifying' ? 'Verifying...' :
                    state.status === 'unlocked' ? 'Contact Unlocked' :
                        'Unlock Contact Info'}
            </button>

            {state.status === 'blocked' && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
                    <strong>{state.data.code === 'AUTH_REQUIRED' ? 'Account Required' : 'Limit Reached'}:</strong> {state.data.message}
                    {state.data.retry_at && <div className="mt-1">Try again: {new Date(state.data.retry_at).toLocaleTimeString()}</div>}
                </div>
            )}

            {state.status === 'unlocked' && (
                <div className="text-sm bg-gray-50 p-3 rounded border border-gray-200 animate-in fade-in">
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                        <span>Unlocked</span>
                        <span>{state.data.remaining_today} remaining today</span>
                    </div>

                    <div className="space-y-1">
                        <div className="font-semibold text-gray-900">{state.data.contact.name || 'Dispatcher'}</div>
                        {state.data.contact.phone_e164 && (
                            <a href={`tel:${state.data.contact.phone_e164}`} className="block text-blue-600 hover:underline text-lg font-bold">
                                {state.data.contact.phone_e164}
                            </a>
                        )}
                        {state.data.contact.email && (
                            <a href={`mailto:${state.data.contact.email}`} className="block text-gray-600 truncate">
                                {state.data.contact.email}
                            </a>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
