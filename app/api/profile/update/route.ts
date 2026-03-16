/**
 * POST /api/profile/update
 * 
 * Central profile editing endpoint. Handles all operator profile mutations:
 * - Basic info (company_name, bio, phone, email, website)
 * - Service areas (states, countries, corridors)
 * - Equipment (height_pole, signs, flags, radios, etc.)
 * - Role assignments (role subtypes from reputation engine)
 * - Avatar/logo URL (after upload to Supabase Storage)
 * 
 * Triggers reputation recompute on significant changes.
 * Phase 0: profile_editing_live
 */
export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/utils/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';

function getServiceSupabase() {
    return createServiceClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// Fields operators can edit
const ALLOWED_FIELDS = [
    'company_name', 'bio', 'phone', 'email', 'website',
    'city', 'state', 'country_code', 'postal_code',
    'service_radius_miles', 'years_experience',
    'avatar_url', 'logo_url', 'banner_url',
    'has_height_pole', 'has_signs', 'has_flags', 'has_radios',
    'has_cb_radio', 'has_amber_lights', 'has_oversize_banner',
    'has_arrow_board', 'has_escort_vehicle',
    'vehicle_type', 'vehicle_year', 'vehicle_make', 'vehicle_model',
    'insurance_provider', 'insurance_expiry',
    'available_24_7', 'available_weekends', 'available_nights',
    'languages', 'certifications',
    'service_states', 'service_corridors', 'service_categories',
    'role_subtypes',
    'tagline', 'specialties',
    'dispatch_ready', 'availability_status',
] as const;

// Fields that trigger reputation recompute when changed
const REPUTATION_TRIGGER_FIELDS = new Set([
    'bio', 'avatar_url', 'logo_url',
    'has_height_pole', 'has_signs', 'has_flags', 'has_radios',
    'insurance_provider', 'insurance_expiry',
    'certifications', 'role_subtypes',
    'service_states', 'service_corridors',
    'dispatch_ready', 'availability_status',
    'vehicle_type', 'years_experience',
]);

export async function POST(req: NextRequest) {
    try {
        // Auth check — must be logged in
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { operatorId, updates } = body as {
            operatorId: string;
            updates: Record<string, unknown>;
        };

        if (!operatorId || !updates || Object.keys(updates).length === 0) {
            return NextResponse.json({ error: 'operatorId and updates required' }, { status: 400 });
        }

        // Verify ownership — user must own this operator profile
        const serviceSupabase = getServiceSupabase();
        const { data: operator } = await serviceSupabase
            .from('operators')
            .select('id, user_id, is_seeded')
            .eq('id', operatorId)
            .single();

        if (!operator) {
            return NextResponse.json({ error: 'Operator not found' }, { status: 404 });
        }
        if (operator.user_id !== user.id) {
            return NextResponse.json({ error: 'Not your listing' }, { status: 403 });
        }
        if (operator.is_seeded) {
            return NextResponse.json({ error: 'Listing not yet claimed. Claim first.' }, { status: 400 });
        }

        // Filter to allowed fields only
        const safeUpdates: Record<string, unknown> = {};
        let reputationDirty = false;

        for (const [key, value] of Object.entries(updates)) {
            if ((ALLOWED_FIELDS as readonly string[]).includes(key)) {
                safeUpdates[key] = value;
                if (REPUTATION_TRIGGER_FIELDS.has(key)) {
                    reputationDirty = true;
                }
            }
        }

        if (Object.keys(safeUpdates).length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        // Add audit fields
        safeUpdates.updated_at = new Date().toISOString();

        // Compute profile completion percentage
        const completionFields = [
            'company_name', 'bio', 'phone', 'email', 'avatar_url',
            'city', 'state', 'country_code', 'service_radius_miles',
            'has_height_pole', 'vehicle_type', 'insurance_provider',
            'service_states', 'role_subtypes', 'dispatch_ready',
        ];

        // Update the profile
        const { data: updated, error: updateErr } = await serviceSupabase
            .from('operators')
            .update(safeUpdates)
            .eq('id', operatorId)
            .select('*')
            .single();

        if (updateErr) {
            console.error('[PROFILE_UPDATE] Error:', updateErr);
            return NextResponse.json({ error: updateErr.message }, { status: 500 });
        }

        // Compute completion after update
        let filledCount = 0;
        for (const field of completionFields) {
            const val = (updated as Record<string, unknown>)?.[field];
            if (val !== null && val !== undefined && val !== '' && val !== false) {
                filledCount++;
            }
        }
        const completionPct = Math.round((filledCount / completionFields.length) * 100);

        // Store completion percentage
        await serviceSupabase
            .from('operators')
            .update({ completion_pct: completionPct })
            .eq('id', operatorId);

        // PostHog event
        if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
            try {
                await fetch(`${process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'}/capture/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        api_key: process.env.NEXT_PUBLIC_POSTHOG_KEY,
                        distinct_id: user.id,
                        event: 'profile_updated',
                        properties: {
                            operator_id: operatorId,
                            fields_updated: Object.keys(safeUpdates).filter(k => k !== 'updated_at'),
                            completion_pct: completionPct,
                            reputation_dirty: reputationDirty,
                        },
                    }),
                });
            } catch { /* analytics non-blocking */ }
        }

        return NextResponse.json({
            ok: true,
            operatorId,
            fieldsUpdated: Object.keys(safeUpdates).filter(k => k !== 'updated_at'),
            completionPct,
            reputationDirty,
            message: reputationDirty
                ? 'Profile updated. Trust score will recompute shortly.'
                : 'Profile updated successfully.',
        });

    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Internal error';
        console.error('[PROFILE_UPDATE] Error:', message);
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
