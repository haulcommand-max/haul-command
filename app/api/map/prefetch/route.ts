export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Adjacency map for US + Canada to fulfill 'neighbor logic'
const NEIGHBORS: Record<string, string[]> = {
    // US
    "US-AL": ["US-TN", "US-GA", "US-FL", "US-MS"],
    "US-AK": [],
    "US-AZ": ["US-CA", "US-NV", "US-UT", "US-NM"],
    "US-AR": ["US-MO", "US-TN", "US-MS", "US-LA", "US-TX", "US-OK"],
    "US-CA": ["US-OR", "US-NV", "US-AZ"],
    "US-CO": ["US-WY", "US-NE", "US-KS", "US-OK", "US-NM", "US-UT"],
    "US-CT": ["US-NY", "US-MA", "US-RI"],
    "US-DE": ["US-MD", "US-PA", "US-NJ"],
    "US-FL": ["US-AL", "US-GA"],
    "US-GA": ["US-FL", "US-AL", "US-TN", "US-NC", "US-SC"],
    "US-ID": ["US-WA", "US-OR", "US-NV", "US-UT", "US-WY", "US-MT"],
    "US-IL": ["US-WI", "US-IA", "US-MO", "US-KY", "US-IN"],
    "US-IN": ["US-MI", "US-IL", "US-KY", "US-OH"],
    "US-IA": ["US-MN", "US-SD", "US-NE", "US-MO", "US-IL", "US-WI"],
    "US-KS": ["US-NE", "US-CO", "US-OK", "US-MO"],
    "US-KY": ["US-IL", "US-IN", "US-OH", "US-WV", "US-VA", "US-TN", "US-MO"],
    "US-LA": ["US-AR", "US-MS", "US-TX"],
    "US-ME": ["US-NH"],
    "US-MD": ["US-VA", "US-WV", "US-PA", "US-DE"],
    "US-MA": ["US-NY", "US-VT", "US-NH", "US-RI", "US-CT"],
    "US-MI": ["US-WI", "US-IN", "US-OH"],
    "US-MN": ["US-ND", "US-SD", "US-IA", "US-WI"],
    "US-MS": ["US-TN", "US-AL", "US-LA", "US-AR"],
    "US-MO": ["US-IA", "US-NE", "US-KS", "US-OK", "US-AR", "US-TN", "US-KY", "US-IL"],
    "US-MT": ["US-ID", "US-WY", "US-ND", "US-SD"],
    "US-NE": ["US-SD", "US-WY", "US-CO", "US-KS", "US-MO", "US-IA"],
    "US-NV": ["US-OR", "US-ID", "US-UT", "US-AZ", "US-CA"],
    "US-NH": ["US-VT", "US-ME", "US-MA"],
    "US-NJ": ["US-NY", "US-PA", "US-DE"],
    "US-NM": ["US-AZ", "US-UT", "US-CO", "US-OK", "US-TX"],
    "US-NY": ["US-PA", "US-NJ", "US-CT", "US-MA", "US-VT"],
    "US-NC": ["US-VA", "US-TN", "US-GA", "US-SC"],
    "US-ND": ["US-MT", "US-SD", "US-MN"],
    "US-OH": ["US-MI", "US-IN", "US-KY", "US-WV", "US-PA"],
    "US-OK": ["US-KS", "US-CO", "US-NM", "US-TX", "US-AR", "US-MO"],
    "US-OR": ["US-WA", "US-ID", "US-NV", "US-CA"],
    "US-PA": ["US-NY", "US-NJ", "US-DE", "US-MD", "US-WV", "US-OH"],
    "US-RI": ["US-CT", "US-MA"],
    "US-SC": ["US-NC", "US-GA"],
    "US-SD": ["US-ND", "US-MT", "US-WY", "US-NE", "US-IA", "US-MN"],
    "US-TN": ["US-KY", "US-VA", "US-NC", "US-GA", "US-AL", "US-MS", "US-AR", "US-MO"],
    "US-TX": ["US-NM", "US-OK", "US-AR", "US-LA"],
    "US-UT": ["US-ID", "US-WY", "US-CO", "US-NM", "US-AZ", "US-NV"],
    "US-VT": ["US-NY", "US-NH", "US-MA"],
    "US-VA": ["US-MD", "US-WV", "US-KY", "US-TN", "US-NC"],
    "US-WA": ["US-OR", "US-ID"],
    "US-WV": ["US-OH", "US-PA", "US-MD", "US-VA", "US-KY"],
    "US-WI": ["US-MN", "US-IA", "US-IL", "US-MI"],
    "US-WY": ["US-MT", "US-SD", "US-NE", "US-CO", "US-UT", "US-ID"],

    // CA
    "CA-AB": ["CA-BC", "CA-SK", "CA-NT"],
    "CA-BC": ["CA-AB", "CA-YT", "CA-NT"],
    "CA-MB": ["CA-SK", "CA-ON", "CA-NU"],
    "CA-NB": ["CA-QC", "CA-NS", "CA-PE"],
    "CA-NL": [],
    "CA-NS": ["CA-NB"],
    "CA-NT": ["CA-YT", "CA-NU", "CA-BC", "CA-AB", "CA-SK"],
    "CA-NU": ["CA-NT", "CA-MB"],
    "CA-ON": ["CA-MB", "CA-QC"],
    "CA-PE": ["CA-NB", "CA-NS"],
    "CA-QC": ["CA-ON", "CA-NB", "CA-NL"],
    "CA-SK": ["CA-AB", "CA-MB", "CA-NT"],
    "CA-YT": ["CA-BC", "CA-NT"]
};

// Fallback if no home state provided (Top 5 heavily hauled corridors)
const FALLBACK_JURISDICTIONS = ["US-TX", "US-FL", "US-GA", "US-PA", "US-CA"];

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const homeCode = searchParams.get("home_jurisdiction_code");
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        // We use service role to execute RPC without user context limitations for public static cache
        const supabase = createClient(supabaseUrl, supabaseKey);

        let targets = [];
        if (homeCode && NEIGHBORS[homeCode]) {
            targets.push(homeCode, ...NEIGHBORS[homeCode]);
        } else {
            targets = [...FALLBACK_JURISDICTIONS];
        }

        const payloadObj: Record<string, any> = {};

        // Parallel fetch via RPC
        await Promise.all(
            targets.map(async (code) => {
                const { data, error } = await supabase.rpc("get_jurisdiction_drawer", { p_jurisdiction_code: code });
                if (!error && data) {
                    payloadObj[code] = data;

                    // Fire and forget caching for 24 hours to jurisdiction_content_cache
                    const expiresAt = new Date();
                    expiresAt.setHours(expiresAt.getHours() + 24);
                    supabase.from("jurisdiction_content_cache").upsert({
                        cache_key: `${code}:drawer:v1`,
                        jurisdiction_code: code,
                        payload_json: data,
                        expires_at: expiresAt.toISOString()
                    }).then();
                }
            })
        );

        return NextResponse.json({
            success: true,
            targets,
            payloads: payloadObj,
            strategy: "stale_while_revalidate"
        }, {
            status: 200,
            headers: {
                "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=43200",
            }
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
