import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { computeEligibilityScore, getActiveSlots, MINIMUM_ELIGIBILITY_SCORE, type ThroughputSlot } from "@/lib/vapi/eligibility";

/**
 * POST /api/vapi/dial-next
 * 
 * Called by the Vapi throughput scheduler (cron) to determine the next
 * entity to call. Queries eligible entities above the 0.72 threshold,
 * checks calling windows, country compliance, and returns the call target.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { programType = 'unclaimed_place_claim' } = body;

        const supabase = getSupabaseAdmin();

        // 1. Get active throughput slots based on current time
        const { data: slots } = await supabase
            .from('vapi_throughput_allocations')
            .select('*');

        if (!slots || slots.length === 0) {
            return NextResponse.json({ action: 'idle', reason: 'No throughput slots configured' });
        }

        const now = new Date();
        const activeSlots = getActiveSlots(
            slots.map((s: any): ThroughputSlot => ({
                countryCode: s.country_code,
                timezone: s.timezone,
                windowStart: s.time_window_start,
                windowEnd: s.time_window_end,
                weight: s.weight,
                maxConcurrency: s.max_concurrency,
                dailyBudgetCap: s.daily_budget_cap,
            })),
            now
        );

        if (activeSlots.length === 0) {
            return NextResponse.json({ action: 'idle', reason: 'No calling windows currently active (quiet hours)' });
        }

        // 2. Pick top-weight country
        const targetCountry = activeSlots[0].countryCode;

        // 3. Compliance check
        const { data: compliance } = await supabase
            .from('country_compliance_profiles')
            .select('outbound_allowed')
            .eq('country_code', targetCountry)
            .single();

        if (!compliance?.outbound_allowed) {
            return NextResponse.json({
                action: 'skip',
                reason: `Outbound disabled for ${targetCountry}`,
                country: targetCountry,
            });
        }

        // 4. Get top eligible entity
        const { data: candidates } = await supabase
            .from('vapi_outbound_eligibility')
            .select('*')
            .eq('country_code', targetCountry)
            .eq('program_type', programType)
            .gte('eligibility_score', MINIMUM_ELIGIBILITY_SCORE)
            .eq('phone_valid', true)
            .order('eligibility_score', { ascending: false })
            .limit(1);

        if (!candidates || candidates.length === 0) {
            return NextResponse.json({
                action: 'idle',
                reason: `No eligible entities for ${programType} in ${targetCountry}`,
                country: targetCountry,
            });
        }

        const target = candidates[0];

        // 5. Get entity details
        let entityDetails: any = null;
        if (target.entity_type === 'place') {
            const { data: place } = await supabase
                .from('places')
                .select('name, phone, place_type, city, region')
                .eq('place_id', target.entity_id)
                .single();
            entityDetails = place;
        }

        // 6. Increment contact attempts
        await supabase
            .from('vapi_outbound_eligibility')
            .update({
                prior_contact_attempts: target.prior_contact_attempts + 1,
                last_contact_at: now.toISOString(),
            })
            .eq('id', target.id);

        return NextResponse.json({
            action: 'dial',
            country: targetCountry,
            entityType: target.entity_type,
            entityId: target.entity_id,
            score: target.eligibility_score,
            programType,
            phone: entityDetails?.phone,
            context: {
                name: entityDetails?.name,
                type: entityDetails?.place_type,
                city: entityDetails?.city,
                region: entityDetails?.region,
            },
            concurrencyLimit: activeSlots[0].maxConcurrency,
        });

    } catch (e: any) {
        console.error("Vapi Dial-Next Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
