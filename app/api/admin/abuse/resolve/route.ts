export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";


export async function POST(req: Request) {
    // Auth check — admin/staff only
    const cookieStore = await cookies();
    const authClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
        .from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile || !["admin", "staff"].includes(profile.role)) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const { error } = await supabaseAdmin
        .from("abuse_flags")
        .update({ resolved_at: new Date().toISOString() })
        .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
