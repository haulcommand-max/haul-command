import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

/**
 * POST /api/loads/create
 * OPUS-02 Guardrail: Pre-Auth Hard-Stop at Post-A-Load.
 * Enforces KYC, Idempotent Stripe Capture (manual), and drafts the load.
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Enforce Session Role & KYC
        const { data: profile } = await supabase
            .from('profiles')
            .select('role, kyc_verified_at, stripe_customer_id')
            .eq('id', session.user.id)
            .single();

        if (!profile || profile.role !== 'broker') {
            return NextResponse.json({ error: 'Forbidden: Broker access only' }, { status: 403 });
        }

        if (!profile.kyc_verified_at) {
            return NextResponse.json({ error: 'Forbidden: KYC verification required to post loads' }, { status: 403 });
        }

        if (!profile.stripe_customer_id) {
            return NextResponse.json({ error: 'Payment setup required', ui_action: 'redirect_billing' }, { status: 400 });
        }

        const body = await req.json();
        const sb = getSupabaseAdmin();

        const {
            origin_address,
            dest_address,
            pickup_at,
            length_ft,
            width_ft,
            height_ft,
            weight_lbs,
            description,
            route_notes,
            permit_notes,
            escort_needs,
            time_flex_hours,
            rate_per_mile,
            quick_pay,
        } = body;

        // Parse origin / destination
        const [originCity, originState] = (origin_address || "").split(",").map((s: string) => s.trim());
        const [destCity, destState] = (dest_address || "").split(",").map((s: string) => s.trim());

        // Estimate miles (simple placeholder — in prod use routing API)
        const estMiles = Math.round(Math.random() * 400 + 100);
        const rateCents = rate_per_mile ? Math.round(rate_per_mile * estMiles * 100) : null;

        if (!rateCents) {
            return NextResponse.json({ error: "Rate per mile is required to secure escrow." }, { status: 400 });
        }

        // Stripe Idempotency Enforcement (5-minute window)
        const stripe = getStripe();
        const timestampBucket = Math.floor(Date.now() / 300000);
        const idempotencyKey = `hc_load_create_${session.user.id}_${timestampBucket}`;

        // Create Stripe PaymentIntent with Pre-Auth (capture_method: 'manual')
        const paymentIntent = await stripe.paymentIntents.create({
            amount: rateCents,
            currency: 'usd',
            customer: profile.stripe_customer_id,
            capture_method: 'manual', // Enforce Pre-auth hard-stop
            metadata: {
                broker_id: session.user.id,
                action: 'load_escrow_preauth'
            }
        }, {
            idempotencyKey
        });

        // Insert load as DRAFT (not visible on board yet)
        const { data: loadData, error: loadError } = await sb
            .from("hc_loads")
            .insert({
                broker_id: session.user.id,
                origin_city: originCity || origin_address,
                origin_state: originState || null,
                origin_country: "US",
                destination_city: destCity || dest_address,
                destination_state: destState || null,
                destination_country: "US",
                equipment_type: "flatbed",
                length_ft: length_ft || null,
                width_ft: width_ft || null,
                height_ft: height_ft || null,
                weight_lbs: weight_lbs || null,
                commodity: description,
                notes: [route_notes, permit_notes].filter(Boolean).join(" | ") || null,
                escorts_needed: escort_needs?.length || 1,
                rate_total_cents: rateCents,
                rate_per_mile_cents: rate_per_mile ? Math.round(rate_per_mile * 100) : null,
                miles: estMiles,
                currency: "USD",
                load_status: "draft", // Stays in DRAFT until Stripe webhook clears it
                urgency: "standard",
                source_type: "manual",
                pickup_date: pickup_at ? new Date(pickup_at).toISOString().split("T")[0] : null,
                pickup_window_start: pickup_at || null,
                quick_pay_available: quick_pay || false,
                country_code: "US",
                posted_at: new Date().toISOString(),
            })
            .select("id")
            .single();

        if (loadError) {
            console.error("[loads/create] Supabase error:", loadError);
            return NextResponse.json({ error: loadError.message }, { status: 500 });
        }

        // Initialize Escrow Leger
        const { error: escrowError } = await sb
            .from("hc_escrow")
            .insert({
                booking_id: loadData.id,
                stripe_payment_intent_id: paymentIntent.id,
                amount_cents: rateCents,
                currency: 'usd',
                status: 'PENDING_FUNDS',
                broker_stripe_account: profile.stripe_customer_id,
                held_at: new Date().toISOString(),
            });

        if (escrowError) {
             console.error("[loads/create] Escrow initialization error:", escrowError);
        }

        return NextResponse.json({ 
            ok: true, 
            load_id: loadData.id, 
            client_secret: paymentIntent.client_secret 
        });
    } catch (err: any) {
        console.error("[loads/create] Error:", err);
        return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
    }
}
