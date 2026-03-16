import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { supabaseServer } from "@/lib/supabase/server";

/**
 * POST /api/visibility/resolve
 *
 * Resolves visibility access for a viewer on a listing.
 * Returns the full ResolvedVisibility object from the database RPC.
 *
 * Body: { listing_id: string }
 * Returns: ResolvedVisibility JSONB
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { listing_id } = body;

        if (!listing_id || typeof listing_id !== "string") {
            return NextResponse.json(
                { error: "listing_id is required" },
                { status: 400 }
            );
        }

        const supabase = supabaseServer();

        // Get current user (may be null for anonymous)
        const {
            data: { user },
        } = await supabase.auth.getUser();

        const viewerId = user?.id ?? null;

        // Call the resolve_visibility RPC
        const { data, error } = await supabase.rpc("resolve_visibility", {
            p_viewer_id: viewerId,
            p_listing_id: listing_id,
        });

        if (error) {
            console.error("[visibility/resolve] RPC error:", error);
            return NextResponse.json(
                { error: "Failed to resolve visibility" },
                { status: 500 }
            );
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("[visibility/resolve] Error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
