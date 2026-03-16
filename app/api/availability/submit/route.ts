import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * POST /api/availability/submit
 * 
 * The Global Capacity Exchange entry point.
 * Accepts availability submissions and auto-creates:
 * - Operator profile (if new)
 * - Directory listing (claimable)
 * - Availability signal (for matching)
 * - Listmonk outbox record (for claim activation)
 * - Behavioral event (for intelligence)
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            name,
            phone,
            email,
            current_city,
            current_region,
            current_country = "US",
            heading_direction,
            escort_type,
            equipment_tags = [],
            certifications = [],
            available_hours = 6,
            provider_key,
            source = "web_form",
        } = body;

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        if (!phone && !email) {
            return NextResponse.json({ error: "Phone or email required" }, { status: 400 });
        }

        const sb = getSupabaseAdmin();

        const { data, error } = await sb.rpc("hc_submit_availability", {
            p_name: name,
            p_phone: phone || null,
            p_email: email || null,
            p_current_city: current_city || null,
            p_current_region: current_region || null,
            p_current_country: current_country,
            p_heading_direction: heading_direction || null,
            p_escort_type: escort_type || null,
            p_equipment_tags: equipment_tags,
            p_certifications: certifications,
            p_available_hours: available_hours,
            p_provider_key: provider_key || null,
            p_source: source,
        });

        if (error) {
            console.error("Availability submit error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("Availability API error:", err);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
