// app/api/v1/admin/flags/route.ts
// GET — show all feature flags with status
// System health / diagnostic endpoint for admin
// ============================================================

import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getAllFlags } from '@/lib/feature-flags';

export const runtime = 'nodejs';

export async function GET() {
    const flags = getAllFlags();

    const summary = {
        total: Object.keys(flags).length,
        enabled: 0,
        disabled: 0,
        flags: {} as Record<string, { enabled: boolean; description: string; missing_vars: string[] }>,
    };

    for (const [key, value] of Object.entries(flags)) {
        summary.flags[key] = {
            enabled: value.enabled,
            description: value.config.description,
            missing_vars: value.config.requiredEnvVars.filter(k => !process.env[k]),
        };
        if (value.enabled) summary.enabled++;
        else summary.disabled++;
    }

    return NextResponse.json(summary);
}
