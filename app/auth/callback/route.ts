import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth callback route — handles magic link / OTP redirects.
 * 
 * In Capacitor WebView:
 *   The magic link opens in the system browser by default.
 *   We exchange the auth code server-side and redirect back to the app.
 *   The `haulcommand://` deep link is caught by Capacitor.
 * 
 * On web:
 *   Standard PKCE code exchange, then redirect to /dashboard or /app.
 */
export async function GET(request: NextRequest) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const next = requestUrl.searchParams.get("next") || "/app";
    const error = requestUrl.searchParams.get("error");
    const errorDescription = requestUrl.searchParams.get("error_description");

    // Handle auth errors
    if (error) {
        console.error("[auth/callback] Error:", error, errorDescription);
        return NextResponse.redirect(
            new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, requestUrl.origin)
        );
    }

    if (!code) {
        return NextResponse.redirect(new URL("/login?error=missing_code", requestUrl.origin));
    }

    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                },
            },
        }
    );

    // Exchange the authorization code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
        console.error("[auth/callback] Exchange error:", exchangeError.message);
        return NextResponse.redirect(
            new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
        );
    }

    // Detect if request came from mobile app (Capacitor)
    const userAgent = request.headers.get("user-agent") || "";
    const isCapacitor = userAgent.includes("HaulCommand/");

    if (isCapacitor) {
        // Redirect back into the Capacitor WebView
        // The app loads from haulcommand.com, so just redirect within the same domain
        return NextResponse.redirect(new URL(next, requestUrl.origin));
    }

    // Web: redirect to the requested page (default: /app)
    return NextResponse.redirect(new URL(next, requestUrl.origin));
}
