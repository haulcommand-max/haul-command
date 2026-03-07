import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = getSupabaseServerClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://haulcommand.com";
    const limit = 50000;

    const { data, error } = await supabase
        .from("hc_page_keys")
        .select("canonical_slug,updated_at")
        .eq("indexable", true)
        .eq("page_status", "active")
        .order("updated_at", { ascending: false })
        .limit(limit);

    if (error) throw error;

    return (data ?? []).map((row) => ({
        url: `${siteUrl}${row.canonical_slug}`,
        lastModified: row.updated_at,
    }));
}
