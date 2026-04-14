import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// ══════════════════════════════════════════════════════════════
// POST /api/push/register — Store FCM device token
// DELETE /api/push/register — Remove FCM device token (logout)
//
// Writes to hc_device_tokens table.
// Per role-lock.ts: Supabase stores ALL data. Firebase = push only.
// ══════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token, platform, role_key, country_code } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    // Upsert — same token for same user = update, new token = insert
    const { error } = await supabase.from("hc_device_tokens").upsert(
      {
        user_id: user.id,
        token,
        platform: platform || "web",
        role_key: role_key || null,
        country_code: country_code || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,token",
      }
    );

    if (error) {
      console.error("[push/register] Upsert failed:", error);
      return NextResponse.json({ error: "Failed to store token" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[push/register] Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await supabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    // Deactivate rather than delete — preserves audit trail
    await supabase
      .from("hc_device_tokens")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("token", token);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[push/register] Delete error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
