import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Novu } from '@novu/node';

/**
 * ════════════════════════════════════════════════════════════════
 * HAUL COMMAND: DISPATCH BROADCAST ENGINE
 * ════════════════════════════════════════════════════════════════
 * When a Broker posts an oversize load, this sweeps the database 
 * for targeted Pilot Cars and utilizes Novu to broadcast the route.
 */

const novuApiKey = process.env.NOVU_API_KEY || "YOUR_NOVU_API_KEY";
const novu = new Novu(novuApiKey);

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const payload = await req.json();

    const { load_id } = payload;

    if (!load_id) return NextResponse.json({ error: "Missing Load Target" }, { status: 400 });

    // 1. Fetch Load details
    const { data: load, error: loadError } = await supabase
      .from('loads')
      .select('*')
      .eq('id', load_id)
      .single();

    if (loadError || !load) {
      return NextResponse.json({ error: "Load Not Found" }, { status: 404 });
    }

    // 2. Intelligence Layer: Find Pilot Cars in the target region (Origin State)
    const { data: escorts, error: escortsError } = await supabase
      .from('directory_listings')
      .select('id')
      .eq('entity_type', 'pilot_car_operator')
      .eq('region_code', load.origin_state)
      .limit(50); // Hard throttle to 50 active drivers for immediate fast-ping

    if (escortsError || !escorts || escorts.length === 0) {
      console.warn("Dispatch: No target cars found in ", load.origin_state);
      return NextResponse.json({ success: true, message: "No drivers available for Novu dispatch in origin zone." }, { status: 200 });
    }

    // 3. Dispatch Blast via Novu Topic / Individual Ping
    const subscriberIds = escorts.map(e => e.id); // Assuming listing IDs correspond to Operator auth.users
    
    // Convert array of IDs into Novu's Subscriber Object shape for mass trigger
    const targetedSubscribers = subscriberIds.map(id => ({ subscriberId: id }));

    try {
      await novu.trigger('operator-new-load-dispatch', {
        to: targetedSubscribers,
        payload: {
          loadId: load.id,
          origin: `${load.origin_city}, ${load.origin_state}`,
          destination: `${load.destination_city}, ${load.destination_state}`,
          requirements: load.equipment_type || 'Standard Escort'
        }
      });
      console.log(`[Novu Dispatch Broadcast] Pushed load ${load.id} to ${targetedSubscribers.length} operators.`);
    } catch (novuError) {
      console.error("Novu Broadcast Failed.", novuError);
    }

    return NextResponse.json({ 
      success: true, 
      pinged_count: targetedSubscribers.length,
      message: "Novu broadcast dispatched to region." 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Broadcast Engine Error:", error);
    return NextResponse.json({ error: error.message || "Broadcast Fatal Error" }, { status: 500 });
  }
}
