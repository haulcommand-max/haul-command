export const dynamic = 'force-dynamic';

/**
 * POST /api/map/export-state-packet
 * 
 * Generates a downloadable JSON packet for a given jurisdiction.
 * Contains operators, rules, and support contacts.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
    try {
        const { jurisdiction_code } = await req.json();

        if (!jurisdiction_code || typeof jurisdiction_code !== 'string') {
            return NextResponse.json({ error: 'jurisdiction_code is required' }, { status: 400 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { persistSession: false } }
        );

        const { data, error } = await supabase.rpc('get_jurisdiction_drawer', {
            p_jurisdiction_code: jurisdiction_code,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Add export metadata
        const packet = {
            exported_at: new Date().toISOString(),
            jurisdiction_code,
            source: 'HAUL COMMAND — Jurisdiction Map Control Surface',
            version: '1.0',
            ...data,
        };

        return NextResponse.json(packet, {
            headers: {
                'Content-Disposition': `attachment; filename="${jurisdiction_code}_packet.json"`,
            },
        });
    } catch {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
