import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Haul Command: UGC Corridor Alerts API
// Handles the ingestion of crowdsourced hazards, which automatically triggers
// the SQL leaderboard +10 Trust Points reward built in our migration.

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      corridor_name,
      alert_type, // weather | construction | curfew | detour
      severity, // low | medium | high
      message,
      lat,
      lon,
      country_code,
      author_id, // Who submitted it (ties to Trust Points)
    } = body;

    if (!message || !alert_type || !author_id) {
      return NextResponse.json(
        { error: "Missing required fields (message, alert_type, author_id)" },
        { status: 400 }
      );
    }

    // Insert the UGC record. Security: The backend DB Trigger we wrote 
    // will intercept this insert and automatically apply +10 to leaderboard.
    const { data, error } = await supabase
      .from("corridor_alerts")
      .insert([
        {
          corridor_name,
          alert_type,
          severity: severity || "medium",
          message,
          lat,
          lon,
          country_code: country_code || "US",
          author_id,
        },
      ])
      .select();

    if (error) {
      console.error("Corridor Alert UGC Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Hazard reported successfully. +10 Trust Points awarded.",
        data,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
