import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getReturnToParam } from "@/lib/auth/redirect";

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const returnTo = getReturnToParam(url.searchParams.get("returnTo"));

    if (!code) {
        return NextResponse.redirect(
            new URL(`/login?error=missing_code`, url.origin)
        );
    }

    // Server-side client for code exchange
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        console.error("[auth/callback] Exchange failed:", error.message);
        return NextResponse.redirect(
            new URL(`/login?error=oauth_exchange_failed`, url.origin)
        );
    }

    // Successful exchange → send user where they intended
    return NextResponse.redirect(new URL(returnTo, url.origin));
}
