'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FreemiumPressureWidget } from './FreemiumPressureWidget';

// ══════════════════════════════════════════════════════════════
// FreemiumPressureWidgetWithUser
//
// Thin wrapper that reads the logged-in user's id and role
// from the Supabase client-side session, then passes them
// to FreemiumPressureWidget for real pressure decisions.
//
// Usage: drop this anywhere in a Client Component tree.
// It handles its own auth fetch — no props required.
//
// If unauthenticated: renders nothing (no ghost prompts to anons)
// If authenticated free user: renders upgrade prompt per pressure level
// If authenticated paid user: renders nothing (pressure engine returns 'none')
// ══════════════════════════════════════════════════════════════

import { useState } from 'react';
import type { PressureLevel } from '@/lib/platform/freemium-pressure-engine';

interface UserData {
    userId: string;
    role: 'escort' | 'broker';
}

interface FreemiumPressureWidgetWithUserProps {
    placement: 'sidebar' | 'inline' | 'modal' | 'toast';
    minPressure?: PressureLevel;
}

export function FreemiumPressureWidgetWithUser({
    placement,
    minPressure = 'soft',
}: FreemiumPressureWidgetWithUserProps) {
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const fetched = useRef(false);

    useEffect(() => {
        if (fetched.current) return;
        fetched.current = true;

        const supabase = createClient();

        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!session?.user) {
                setLoading(false);
                return;
            }

            const userId = session.user.id;

            // Fetch role from profiles table
            try {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', userId)
                    .single();

                const role: 'escort' | 'broker' =
                    profile?.role === 'broker' ? 'broker' : 'escort';

                setUserData({ userId, role });
            } catch {
                // Fail silently — don't show prompt on auth error
            } finally {
                setLoading(false);
            }
        });
    }, []);

    // Don't render anything while loading or if unauthenticated
    if (loading || !userData) return null;

    return (
        <FreemiumPressureWidget
            userId={userData.userId}
            role={userData.role}
            placement={placement}
            minPressure={minPressure}
        />
    );
}
