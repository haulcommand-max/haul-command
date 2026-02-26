export const dynamic = 'force-dynamic';
import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Export State Packet — API Route
 * 
 * GET /api/export/state-packet?jurisdiction_code=US-FL
 * 
 * Returns a JSON payload containing all jurisdiction data (operators, rulepacks, support contacts).
 * This can be consumed as-is or later upgraded to PDF generation.
 */

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const jurisdictionCode = searchParams.get('jurisdiction_code');

    if (!jurisdictionCode || !/^(US|CA)-[A-Z]{2}$/.test(jurisdictionCode)) {
        return NextResponse.json(
            { error: 'Invalid or missing jurisdiction_code. Format: US-XX or CA-XX' },
            { status: 400 }
        );
    }

    const supabase = createClient();

    const { data, error } = await supabase.rpc('get_jurisdiction_drawer', {
        p_jurisdiction_code: jurisdictionCode,
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const packet = {
        title: `State Packet — ${data?.meta?.name || jurisdictionCode}`,
        jurisdiction_code: jurisdictionCode,
        generated_at: new Date().toISOString(),
        generated_by: 'Haul Command Anti-Gravity Engine',
        ...data,
    };

    return NextResponse.json(packet, {
        headers: {
            'Content-Disposition': `attachment; filename="state-packet-${jurisdictionCode}.json"`,
        },
    });
}
