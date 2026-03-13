// components/admin/HcVariantGroupReviewServer.tsx
// Server component: fetches variant groups and passes to client
import { supabaseAdmin } from "@/lib/supabase/admin";
import { HcVariantGroupReview } from "./HcVariantGroupReview";

interface HcVariantGroupReviewServerProps {
  adminSecret: string;
  entityType?: string;
  entityId?: string;
}

export async function HcVariantGroupReviewServer({
  adminSecret,
  entityType,
  entityId,
}: HcVariantGroupReviewServerProps) {
  let qb = supabaseAdmin
    .from("hc_generated_assets")
    .select("*")
    .not("variant_group_id", "is", null)
    .eq("is_archived", false)
    .order("variant_index", { ascending: true })
    .limit(200);

  if (entityType) qb = qb.eq("entity_type", entityType);
  if (entityId) qb = qb.eq("entity_id", entityId);

  const { data } = await qb;

  const groups: Record<string, any[]> = {};
  for (const asset of data || []) {
    const gid = asset.variant_group_id;
    if (!groups[gid]) groups[gid] = [];
    groups[gid].push(asset);
  }

  return <HcVariantGroupReview adminSecret={adminSecret} groups={groups} />;
}
