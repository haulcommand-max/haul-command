import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = supabaseServer();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("role, display_name")
        .eq("user_id", user.id)
        .single();

    return NextResponse.json({ user: { id: user.id, email: user.email, ...profile } });
}
