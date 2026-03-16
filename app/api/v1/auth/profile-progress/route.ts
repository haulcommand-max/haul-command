// app/api/v1/auth/profile-progress/route.ts
//
// GET  /api/v1/auth/profile-progress?user_id=...
// POST /api/v1/auth/profile-progress  (complete a step)

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
    getProfileProgress,
    completeProfileStep,
} from "@/lib/identity/social-enrichment";

export const runtime = "nodejs";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");

    if (!userId) {
        return NextResponse.json({ error: "user_id required" }, { status: 400 });
    }

    const progress = await getProfileProgress(userId);
    return NextResponse.json({ ok: true, user_id: userId, ...progress });
}

export async function POST(req: Request) {
    let body: { user_id: string; step: string; role?: string };
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    if (!body.user_id || !body.step) {
        return NextResponse.json({ error: "user_id and step required" }, { status: 400 });
    }

    const result = await completeProfileStep(body.user_id, body.step, body.role ?? "operator");
    return NextResponse.json({ ok: true, user_id: body.user_id, ...result });
}
