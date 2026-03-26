import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import Stripe from "stripe";

/**
 * ════════════════════════════════════════════════════════════════
 * HAUL COMMAND ESCROW ENGINE - STRIPE INTENT CREATION
 * ════════════════════════════════════════════════════════════════
 * When a Broker accepts a bid, this engine triggers.
 * 
 * 1. Checks if the bid is valid and load is open.
 * 2. Calculates the 4% Network Escrow Fee.
 * 3. Creates a Stripe PaymentIntent with CaptureMethod=Manual 
 *    (Holds the funds until the operator completes the route).
 * 4. Logs the escrow record into Postgres.
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover", // Upgrading to the latest robust API
});

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const payload = await req.json();

    const { load_id, bid_id, broker_id } = payload;

    if (!load_id || !bid_id || !broker_id) {
      return NextResponse.json({ error: "Missing required identifiers" }, { status: 400 });
    }

    // 1. Validate Bid and Load
    const { data: bid, error: bidError } = await supabase
      .from('load_bids')
      .select('bid_amount, operator_id, load_id')
      .eq('id', bid_id)
      .eq('load_id', load_id)
      .single();

    if (bidError || !bid) {
      return NextResponse.json({ error: "Invalid Bid" }, { status: 404 });
    }

    const { data: load, error: loadError } = await supabase
      .from('loads')
      .select('status')
      .eq('id', load_id)
      .eq('broker_id', broker_id)
      .single();

    if (loadError || !load || load.status !== 'OPEN') {
      return NextResponse.json({ error: "Load is not available for assignment" }, { status: 400 });
    }

    // 2. Escrow Mathematics (Stripe utilizes cents, so multiply by 100)
    // Broker pays: Bid amount + 4% Platform Hold Fee.
    const ESCROW_FEE_MULTIPLIER = 0.04;
    const bidAmountBase = bid.bid_amount;
    const platformFee = Math.round(bidAmountBase * ESCROW_FEE_MULTIPLIER * 100);
    const totalAmountToCharge = Math.round(bidAmountBase * 100) + platformFee;

    // 3. Create the Stripe Payment Intent (MANUAL CAPTURE)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmountToCharge,
      currency: "usd",
      capture_method: "manual", // STRATEGIC: Funds are held/authorized, not captured until delivery
      metadata: {
        load_id,
        bid_id,
        broker_id,
        operator_id: bid.operator_id,
        type: "haul_command_escrow"
      },
      description: `Haul Command Escrow: Route assignment for Load #${load_id.substring(0,6).toUpperCase()}`
    });

    if (!paymentIntent.client_secret) {
      throw new Error("Stripe Failed to generate secret");
    }

    // 4. Record Escrow Transaction deeply into Supabase
    // We update the bid state to PENDING_ESCROW
    await supabase.from('load_bids').update({ status: 'PENDING_ESCROW' }).eq('id', bid_id);
    await supabase.from('loads').update({ status: 'PENDING_ESCROW' }).eq('id', load_id);

    await supabase.from('escrow_payments').insert([{
      load_id,
      bid_id,
      amount: totalAmountToCharge / 100, // DB stores standard format
      status: 'AUTHORIZATION_REQUIRED',
      stripe_pi_id: paymentIntent.id
    }]);

    // 5. Provide the client with the secret to render the Stripe Elements UI
    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      escrowSummary: {
        bidTotal: bidAmountBase,
        platformFee: platformFee / 100,
        totalCharge: totalAmountToCharge / 100
      }
    });

  } catch (error: any) {
    console.error("Escrow Engine Error:", error);
    return NextResponse.json({ error: error.message || "Internal Engine Error" }, { status: 500 });
  }
}
