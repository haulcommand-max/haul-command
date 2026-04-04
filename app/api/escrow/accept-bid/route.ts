import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import Stripe from "stripe";

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any }) 
  : null;

export async function POST(req: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const payload = await req.json();

    const { load_id, bid_id, broker_id } = payload;

    if (!load_id || !broker_id) {
      return NextResponse.json({ error: "Missing required identifiers" }, { status: 400 });
    }

    let bidAmountBase = 450;
    
    if (bid_id && bid_id !== "mock-bid-id") {
      const { data: bid, error: bidError } = await admin
        .from('load_bids')
        .select('bid_amount, operator_id, load_id')
        .eq('id', bid_id)
        .eq('load_id', load_id)
        .single();
      if (bidError || !bid) return NextResponse.json({ error: "Invalid Bid" }, { status: 404 });
      bidAmountBase = bid.bid_amount;
    } else {
      const { data: load } = await admin.from('hc_loads').select('*').eq('id', load_id).single();
      if (load && load.posted_rate) bidAmountBase = load.posted_rate;
    }

    // Escrow Mathematics
    const ESCROW_FEE_MULTIPLIER = 0.04;
    const platformFee = Math.round(bidAmountBase * ESCROW_FEE_MULTIPLIER * 100);
    const totalAmountToCharge = Math.round(bidAmountBase * 100) + platformFee;

    let clientSecret = "mock_client_secret_for_local_development";
    let paymentIntentId = "mock_pi_" + Date.now();

    if (stripe) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmountToCharge,
        currency: "usd",
        capture_method: "manual",
        metadata: { load_id, bid_id, broker_id, type: "haul_command_escrow" },
        description: `Haul Command Escrow: Load #${load_id.substring(0,6)}`
      });
      if (!paymentIntent.client_secret) throw new Error("Stripe Failed to generate secret");
      clientSecret = paymentIntent.client_secret;
      paymentIntentId = paymentIntent.id;
    } else {
      console.warn("[/api/escrow/accept-bid] STRIPE_SECRET_KEY missing. Returning mock secret.");
    }

    // Provide the client with the secret
    return NextResponse.json({
      clientSecret,
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
