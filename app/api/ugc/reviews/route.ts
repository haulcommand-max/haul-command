import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Haul Command: UGC Reviews API
// Handles crowdsourced reviews (Broker grading, Operator grading)

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      reviewer_id,
      target_user_id,
      load_id,
      rating,
      review_text,
    } = body;

    if (!reviewer_id || !target_user_id || !rating) {
      return NextResponse.json(
        { error: "Missing required fields (reviewer_id, target_user_id, rating)" },
        { status: 400 }
      );
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1.0 and 5.0" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("reviews")
      .insert([
        {
          reviewer_id,
          target_user_id,
          load_id,
          rating,
          review_text,
          verified: load_id ? true : false, // Autoverify if tied to a processed load
          weight: 1.0,
        },
      ])
      .select();

    if (error) {
      console.error("Review UGC Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Review successfully posted to entity report card.",
        data,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
