// app/api/photos/upload/route.ts
// POST — upload an operator photo to Supabase Storage and register in operator_photos
//
// Tier limits (free account):
//   profile:              max 6 photos
//   job_gallery:          max 3 photos
//   terminal_experience:  max 2 photos
//
// Returns: { photo_id, public_url, alt_text, image_title, geo_caption }

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const BUCKET = "operator-photos";

const FREE_LIMITS: Record<string, number> = {
    profile: 6,
    job_gallery: 3,
    terminal_experience: 2,
};

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic"]);
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

async function makeServiceSupabase() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );
}

async function makeAnonSupabase() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );
}

export async function POST(req: NextRequest) {
    const supabase = await makeAnonSupabase();
    const svc = await makeServiceSupabase();

    // ── Auth ─────────────────────────────────────────────────
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── Parse multipart form ─────────────────────────────────
    let formData: FormData;
    try {
        formData = await req.formData();
    } catch {
        return NextResponse.json({ error: "Invalid multipart form data" }, { status: 400 });
    }

    const file = formData.get("file") as File | null;
    if (!file) {
        return NextResponse.json({ error: "file field required" }, { status: 400 });
    }

    // ── Validate file ─────────────────────────────────────────
    if (!ALLOWED_TYPES.has(file.type)) {
        return NextResponse.json(
            { error: "Invalid file type. Allowed: jpeg, png, webp, heic" },
            { status: 400 }
        );
    }
    if (file.size > MAX_BYTES) {
        return NextResponse.json({ error: "File too large (max 15 MB)" }, { status: 413 });
    }

    // ── Photo metadata from form ──────────────────────────────
    const photoType = (formData.get("photo_type") as string | null) ?? "profile";
    const loadType = formData.get("load_type") as string | null;
    const city = formData.get("city") as string | null;
    const state = formData.get("state") as string | null;
    const terminalName = formData.get("terminal_name") as string | null;
    const corridor = formData.get("corridor") as string | null;
    const equipmentType = formData.get("equipment_type") as string | null;
    const notes = formData.get("notes") as string | null;

    if (!["profile", "job_gallery", "terminal_experience"].includes(photoType)) {
        return NextResponse.json(
            { error: "photo_type must be profile | job_gallery | terminal_experience" },
            { status: 400 }
        );
    }

    // ── Check tier limit ────────────────────────────────────
    const { count, error: countErr } = await svc
        .from("operator_photos")
        .select("id", { count: "exact", head: true })
        .eq("operator_id", user.id)
        .eq("photo_type", photoType);

    if (countErr) {
        console.error("[photos/upload] count error", countErr);
        return NextResponse.json({ error: "Failed to check photo limit" }, { status: 500 });
    }

    const limit = FREE_LIMITS[photoType] ?? 3;
    if ((count ?? 0) >= limit) {
        return NextResponse.json(
            { error: `Photo limit reached for ${photoType} (max ${limit})` },
            { status: 429 }
        );
    }

    // ── Upload to Storage ────────────────────────────────────
    const ext = file.type === "image/webp" ? "webp"
        : file.type === "image/png" ? "png"
            : file.type === "image/heic" ? "heic"
                : "jpg";

    const photoId = crypto.randomUUID();
    const storagePath = `${user.id}/${photoId}.${ext}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadErr } = await svc
        .storage
        .from(BUCKET)
        .upload(storagePath, fileBuffer, {
            contentType: file.type,
            upsert: false,
        });

    if (uploadErr) {
        // If bucket doesn't exist, return helpful error
        if (uploadErr.message?.includes("Bucket not found")) {
            return NextResponse.json(
                { error: `Storage bucket '${BUCKET}' not found. Create it in Supabase Storage.` },
                { status: 500 }
            );
        }
        console.error("[photos/upload] storage error", uploadErr);
        return NextResponse.json({ error: "Upload failed: " + uploadErr.message }, { status: 500 });
    }

    // ── Get public URL ───────────────────────────────────────
    const { data: { publicUrl } } = svc
        .storage
        .from(BUCKET)
        .getPublicUrl(storagePath);

    // ── Insert into operator_photos ──────────────────────────
    const { data: photo, error: insertErr } = await svc
        .from("operator_photos")
        .insert({
            id: photoId,
            operator_id: user.id,
            storage_path: storagePath,
            public_url: publicUrl,
            photo_type: photoType,
            load_type: loadType,
            city,
            state,
            terminal_name: terminalName,
            corridor,
            equipment_type: equipmentType,
            notes,
        })
        .select("id")
        .single();

    if (insertErr || !photo) {
        // Clean up the uploaded file on insert failure
        await svc.storage.from(BUCKET).remove([storagePath]);
        console.error("[photos/upload] insert error", insertErr);
        return NextResponse.json({ error: "Failed to save photo record" }, { status: 500 });
    }

    // ── Generate SEO metadata async (fire-and-forget) ────────
    svc.rpc("generate_photo_seo_metadata", { p_photo_id: photoId }).then();

    // ── Record trust edge for photo upload ───────────────────
    svc.rpc("record_trust_edge", {
        p_from_user_id: user.id,
        p_from_type: "operator",
        p_to_entity_str: "photo_upload",
        p_to_type: "corridor",
        p_edge_type: "photo_verified_event",
        p_strength: 1.0,
        p_meta: { photo_id: photoId, photo_type: photoType },
    }).then();

    // ── Add to activity feed ─────────────────────────────────
    svc.from("hc_activity_feed").insert({
        operator_id: user.id,
        event_type: "photo_uploaded",
        region_code: state,
        title: `Added a new ${photoType.replace("_", " ")} photo`,
        description: city && state ? `${city}, ${state}` : state ?? undefined,
        meta: { photo_id: photoId, photo_type: photoType },
    }).then();

    return NextResponse.json(
        {
            photo_id: photoId,
            public_url: publicUrl,
        },
        { status: 201 }
    );
}

// GET — list photos for an operator
export async function GET(req: NextRequest) {
    const supabase = await makeAnonSupabase();
    const { searchParams } = new URL(req.url);

    const operatorId = searchParams.get("operator_id");
    const photoType = searchParams.get("photo_type");
    const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50);

    if (!operatorId) {
        return NextResponse.json({ error: "operator_id required" }, { status: 400 });
    }

    let query = supabase
        .from("operator_photos")
        .select(`
            id,
            public_url,
            photo_type,
            load_type,
            city,
            state,
            terminal_name,
            corridor,
            alt_text,
            image_title,
            geo_caption,
            is_verified,
            is_primary,
            created_at
        `)
        .eq("operator_id", operatorId)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);

    if (photoType) {
        query = query.eq("photo_type", photoType);
    }

    const { data, error } = await query;

    if (error) {
        console.error("[photos GET]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ photos: data ?? [] });
}
