import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Haul Command: UGC Operator Rate Data API
// Crowdsourced route pricing, tolls, and duration for deep market data indexing

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      operator_id,
      corridor_name,
      date,
      load_type, // e.g. "Overweight", "Standard Pilot"
      gross_rate,
      miles,
      hours,
      fuel_cost,
      tolls,
    } = body;

    if (!operator_id || !gross_rate || !miles) {
      return NextResponse.json(
        { error: "Missing required fields (operator_id, gross_rate, miles)" },
        { status: 400 }
      );
    }

    // Auto-calculate performance margins
    const profit_per_mile = gross_rate / miles;
    const profit_per_hour = hours ? (gross_rate / hours) : null;
    const net_profit = gross_rate - (fuel_cost || 0) - (tolls || 0);

    const { data, error } = await supabase
      .from("operator_runs")
      .insert([
        {
          operator_id,
          corridor_name,
          date: date || new Date().toISOString().split('T')[0],
          load_type,
          gross_rate,
          miles,
          hours,
          fuel_cost: fuel_cost || 0,
          tolls: tolls || 0,
          net_profit,
          profit_per_mile,
          profit_per_hour,
        },
      ])
      .select();

    if (error) {
      console.error("Operator Run UGC Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Route data successfully recorded.",
        data,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
