import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    const authHeader = req.headers.get("authorization");
    const expected = `Bearer ${process.env.REVALIDATE_TOKEN}`;
    if (authHeader !== expected) {
        return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
        .from("hc_page_keys")
        .select("canonical_slug")
        .eq("page_status", "active")
        .order("updated_at", { ascending: false })
        .limit(1000);

    if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    for (const row of data ?? []) {
        revalidatePath(row.canonical_slug);
    }

    return NextResponse.json({ ok: true, count: data?.length ?? 0 });
}
