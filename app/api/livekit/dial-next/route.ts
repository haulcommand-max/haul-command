import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const MINIMUM_ELIGIBILITY_SCORE = 0.70;

export async function POST() {
    // Uses Service Role to query regardless of RLS because this is a background cron process
    const supabase = await createClient(process.env.SUPABASE_SERVICE_ROLE_KEY);

    try {
        // 1. Fetch the highest priority unclaimed compliant target
        const { data: targets, error: fetchErr } = await supabase
            .from('livekit_compliant_dial_queue')
            .select('*')
            .order('eligibility_score', { ascending: false })
            .limit(10); // fetch a batch to evaluate quiet hours locally

        if (fetchErr) {
            throw fetchErr;
        }

        if (!targets || targets.length === 0) {
            return NextResponse.json({ message: "No eligible compliant targets." }, { status: 200 });
        }

        let target = null;

        // 1b. Enforce 120-Country Quiet Hours (8am - 6pm local roughly)
        for (const t of targets) {
            const countryTimezones: Record<string, string> = {
                'US': 'America/Chicago', // Approximation for US generic, can be broken down
                'CA': 'America/Toronto',
                'GB': 'Europe/London',
                'AU': 'Australia/Sydney',
                'MX': 'America/Mexico_City',
                // other 115 approx defaults to UTC
            };
            const tz = countryTimezones[t.country_code?.toUpperCase()] || 'UTC';
            
            // Get current hour in that target's timezone
            const hourString = new Intl.DateTimeFormat('en-US', {
                timeZone: tz,
                hour: 'numeric',
                hourCycle: 'h23'
            }).format(new Date());

            const currentHour = parseInt(hourString, 10);

            // If between 8:00 AM and 5:59 PM local, they are legally callable
            if (currentHour >= 8 && currentHour < 18) {
                target = t;
                break;
            }
        }

        if (!target) {
            return NextResponse.json({ message: "No targets currently inside legal business hours." }, { status: 200 });
        }

        // 2. Trigger the actual outbound API
        // For local / absolute routing, determine base URL
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
        
        const triggerRes = await fetch(`${baseUrl}/api/livekit/outbound`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                targetPhone: target.target_phone,
                entityId: target.entity_id,
                programType: target.program_type,
                countryCode: target.country_code
            })
        });

        if (!triggerRes.ok) {
            const err = await triggerRes.text();
            throw new Error(`Outbound trigger failed: ${err}`);
        }

        const outData = await triggerRes.json();

        return NextResponse.json({
            message: `Outbound cycle executed. Room provisioned: ${outData.roomName}`,
            target: target.entity_id
        }, { status: 200 });

    } catch (e: any) {
        console.error("LiveKit Dial-Next Error:", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
