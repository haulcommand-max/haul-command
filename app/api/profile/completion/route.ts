export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getFullCompletionData,
  onProfileFieldUpdated,
  onProfileClaimed,
  onAvailabilityToggled,
  onBrokerProfileView,
} from "@/lib/profile/profile-triggers";

async function getAuthId(): Promise<string | null> {
  const cookieStore = await cookies();
  const client = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } },
  );
  const { data: { user } } = await client.auth.getUser();
  return user?.id ?? null;
}

// GET /api/profile/completion
// Returns full completion data for the authenticated user
export async function GET() {
  const userId = await getAuthId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const data = await getFullCompletionData(userId);
    return NextResponse.json(data);
  } catch (err) {
    console.error("[profile/completion] GET error:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

// POST /api/profile/completion
// Triggers score recomputation after a profile event
// Body: { trigger: 'field_updated' | 'claimed' | 'availability_toggled' | 'broker_view', field?: string, operator_id?: string }
export async function POST(req: Request) {
  const userId = await getAuthId();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { trigger, field, operator_id } = body;

    switch (trigger) {
      case 'claimed': {
        const result = await onProfileClaimed(userId);
        return NextResponse.json(result);
      }
      case 'field_updated': {
        const result = await onProfileFieldUpdated(userId, field ?? 'unknown');
        return NextResponse.json(result);
      }
      case 'availability_toggled': {
        const result = await onAvailabilityToggled(userId, field ?? 'available');
        return NextResponse.json(result);
      }
      case 'broker_view': {
        if (operator_id) {
          await onBrokerProfileView(operator_id, userId);
        }
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: "unknown trigger" }, { status: 400 });
    }
  } catch (err) {
    console.error("[profile/completion] POST error:", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
