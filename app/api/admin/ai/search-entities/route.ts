// app/api/admin/ai/search-entities/route.ts
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ENTITY_CONFIG, type HcEntityType } from "@/lib/admin/entity-config";

export const runtime = "nodejs";

function isAllowedAdminRequest(req: Request) {
  const adminSecret = req.headers.get("x-hc-admin-secret");
  return adminSecret && adminSecret === process.env.HC_ADMIN_SECRET;
}

export async function GET(req: Request) {
  if (!isAllowedAdminRequest(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const entityType = url.searchParams.get("entityType") as HcEntityType | null;
  const query = url.searchParams.get("q")?.trim() || "";
  const limit = Math.min(Number(url.searchParams.get("limit") || 20), 100);

  if (!entityType || !ENTITY_CONFIG[entityType]) {
    return Response.json(
      { error: "Invalid entityType. Must be one of: " + Object.keys(ENTITY_CONFIG).join(", ") },
      { status: 400 }
    );
  }

  const config = ENTITY_CONFIG[entityType];

  let qb = supabaseAdmin
    .from(config.table)
    .select(config.selectColumns)
    .limit(limit)
    .order(config.labelColumn, { ascending: true });

  if (query) {
    qb = qb.ilike(config.labelColumn, `%${query}%`);
  }

  const { data, error } = await qb;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    items: (data || []).map((d: any) => ({
      id: d.id,
      label: d[config.labelColumn],
      slug: d[config.slugColumn],
    })),
  });
}
