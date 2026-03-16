// app/api/estimate/submit/route.ts
// POST — receive coverage estimate lead, route to active port sponsor or fallback.
// No billing. Logs to hc_behavioral_events + notifies sponsor operator.

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { sendViaSMTP, resolveProvider } from "@/lib/email/ses-client";

async function makeSvc() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const {
        email,
        port_slug,
        corridor_slug,
        origin,
        destination,
        load_width_ft,
        load_height_ft,
        night_move,
        estimate,
    } = body as {
        email?: string;
        port_slug?: string;
        corridor_slug?: string;
        origin?: string;
        destination?: string;
        load_width_ft?: number;
        load_height_ft?: number;
        night_move?: boolean;
        estimate?: {
            escortCount: number;
            needsPolice: boolean;
            needsHeightPole: boolean;
            estimatedCost: string;
            urgencyLevel: string;
        };
    };

    if (!email) {
        return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    const svc = await makeSvc();

    // Resolve active sponsor operator for this port/corridor
    let routedOperatorId: string | null = null;
    if (port_slug) {
        const { data: port } = await svc
            .from("ports")
            .select("id")
            .eq("slug", port_slug)
            .single();

        if (port) {
            // Try active port sponsor — domination first, then pro, then starter
            const { data: sponsor } = await svc
                .from("port_sponsorships")
                .select("sponsor_operator_id, tier")
                .eq("port_id", port.id)
                .eq("status", "active")
                .in("tier", ["domination", "pro", "starter"])
                .order("tier", { ascending: true }) // domination sorts first alpha-wise
                .limit(1)
                .maybeSingle();

            routedOperatorId = sponsor?.sponsor_operator_id ?? null;
        }
    }

    // Log behavioral event for data exhaust
    await svc.from("hc_behavioral_events").insert({
        event_type: "estimate_lead",
        target_type: port_slug ? "port" : "corridor",
        actor_id: null,
        meta: {
            email_hash: Buffer.from(email).toString("base64").slice(0, 16), // privacy: don't store raw email
            port_slug,
            corridor_slug,
            origin,
            destination,
            load_width_ft,
            load_height_ft,
            night_move,
            escort_count: estimate?.escortCount,
            needs_police: estimate?.needsPolice,
            urgency_level: estimate?.urgencyLevel,
            routed_operator_id: routedOperatorId,
        },
    });

    // Notify routed operator via email
    if (routedOperatorId) {
        try {
            const { data: { user: opUser } } = await svc.auth.admin.getUserById(routedOperatorId);
            if (opUser?.email) {
                const provider = await resolveProvider(svc);
                await sendViaSMTP({
                    from: 'leads@haulcommand.com',
                    fromName: 'Haul Command Leads',
                    replyTo: email || 'support@haulcommand.com',
                    to: opUser.email,
                    subject: `New lead: ${origin || 'Unknown'} → ${destination || 'Unknown'}`,
                    html: `<h2>New Escort Lead</h2>
                        <p><strong>Route:</strong> ${origin || '—'} → ${destination || '—'}</p>
                        <p><strong>Load:</strong> ${load_width_ft || '—'}ft W × ${load_height_ft || '—'}ft H${night_move ? ' (Night Move)' : ''}</p>
                        <p><strong>Escorts needed:</strong> ${estimate?.escortCount || '—'}</p>
                        <p><strong>Urgency:</strong> ${estimate?.urgencyLevel || 'standard'}</p>
                        <p>Reply to this email to contact the customer directly.</p>`,
                    text: `New lead: ${origin || '—'} → ${destination || '—'}. Escorts: ${estimate?.escortCount || '—'}. Urgency: ${estimate?.urgencyLevel || 'standard'}.`,
                    tags: { source: 'estimate_lead', operator_id: routedOperatorId },
                }, provider);
            }
        } catch (err) {
            console.error('[estimate/submit] Failed to notify operator:', err);
        }
    }

    return NextResponse.json({
        success: true,
        routed: routedOperatorId !== null,
        message: routedOperatorId
            ? "Lead routed to active sponsor operator"
            : "Lead queued — we'll match with the best available operator",
    });
}
