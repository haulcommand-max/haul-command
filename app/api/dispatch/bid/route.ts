import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Novu } from '@novu/node';

/**
 * ════════════════════════════════════════════════════════════════
 * HAUL COMMAND: DISPATCH LOGIC (BIDDING)
 * ════════════════════════════════════════════════════════════════
 * Processes Pilot Car Operator bids on active oversize loads.
 * Utilizes Novu Brain to fire Push Notifications to the Broker.
 */

// Initialize Novu with safe fallback for local/dev
const novuApiKey = process.env.NOVU_API_KEY || "YOUR_NOVU_API_KEY";
const novu = new Novu(novuApiKey);

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const payload = await req.json();

    const { load_id, operator_id, bid_amount } = payload;

    if (!load_id || !operator_id || !bid_amount) {
      return NextResponse.json({ error: "Missing dispatch protocol identifiers" }, { status: 400 });
    }

    // 1. Fetch the Load to assure it exists and get the Broker ID to ping them later
    const { data: load, error: loadError } = await supabase
      .from('loads')
      .select('status, broker_id, origin_city, destination_city')
      .eq('id', load_id)
      .single();

    if (loadError || !load || load.status !== 'OPEN') {
      return NextResponse.json({ error: "Load is no longer available for bidding." }, { status: 400 });
    }

    // 2. Insert the Operator's Bid into the ledger
    const { data: bid, error: insertError } = await supabase
      .from('load_bids')
      .insert([{
        load_id,
        operator_id,
        bid_amount: Number(bid_amount),
        status: 'SUBMITTED',
        message: 'Standard Escort Dispatch Bid' 
      }])
      .select('id')
      .single();

    if (insertError) {
      console.error("Bid Insert Error", insertError);
      return NextResponse.json({ error: "Failed to submit bid into Ledger." }, { status: 500 });
    }

    // 3. Trigger Novu Push Notification / Dispatch Alert to the Broker
    try {
      await novu.trigger('operator-bid-received', {
        to: {
          subscriberId: load.broker_id, // Novu recognizes the user by their ID
        },
        payload: {
          loadId: load_id,
          origin: load.origin_city,
          destination: load.destination_city,
          bidAmount: `$${bid_amount}`
        }
      });
      console.log(`[Novu Dispatch] Pinged Broker ${load.broker_id} regarding new $${bid_amount} bid.`);
    } catch (novuError) {
      console.error("Novu Dispatch Ping Failed. Continuing anyway.", novuError);
      // We don't fail the API call if the notification ping drops
    }

    return NextResponse.json({ 
      success: true, 
      bid_id: bid.id,
      message: "Bid accepted. Novu dispatch pinged the origin Broker." 
    }, { status: 201 });

  } catch (error: any) {
    console.error("Dispatch Engine Error:", error);
    return NextResponse.json({ error: error.message || "Dispatch Fatal Error" }, { status: 500 });
  }
}
