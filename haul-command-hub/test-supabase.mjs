import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
    console.log("Fetching facets...");
    let facetQuery = sb
        .from("directory_listings")
        .select("entity_type")
        .eq("is_visible", true)
        .eq("country_code", "US");
    const { data: facetRows, error: facetErr } = await facetQuery;
    console.log("Facet Err:", facetErr);
    console.log("Facet Rows Count:", facetRows?.length);

    console.log("Fetching list...");
    let listQuery = sb
        .from("directory_listings")
        .select("id, slug, name, entity_type, city as locality, region_code as admin1_code, updated_at, surface_category_key", {
            count: "exact",
        })
        .eq("is_visible", true)
        .eq("country_code", "US");
        
    const { data: rawRows, count, error: listErr } = await listQuery
        .order("updated_at", { ascending: false })
        .range(0, 29);

    console.log("List Err:", listErr);
    console.log("List Rows Count:", rawRows?.length);
    console.log("List Count Exact:", count);
}

test();
