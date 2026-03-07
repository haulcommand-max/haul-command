import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { request_type, business_name, email, phone, details } = body;

        if (!business_name || !email) {
            return NextResponse.json({ error: "business_name and email are required" }, { status: 400 });
        }

        const supabase = await createClient();

        // Create a support ticket for the request
        const { error } = await supabase.from("hc_support_tickets").insert({
            category: `listing_${request_type}`,
            payload: {
                request_type,
                business_name,
                email,
                phone: phone || null,
                details: details || null,
                submitted_at: new Date().toISOString(),
                source: "remove-listing-page",
            },
            status: "open",
        });

        if (error) {
            console.error("Failed to create remove-listing ticket:", error);
            return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
        }

        // If this is an immediate opt-out request and we have a phone, add to suppression
        if (request_type === "remove" && phone) {
            try {
                await supabase.rpc("hc_add_to_suppression", {
                    p_phone_e164: phone,
                    p_reason: `Self-service removal: ${business_name}`,
                    p_scope: "global",
                });
            } catch {
                // Non-blocking - suppression is best-effort
            }
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error("remove-listing API error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
