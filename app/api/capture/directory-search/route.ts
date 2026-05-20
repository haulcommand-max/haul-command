import { NextRequest, NextResponse } from "next/server";
import { buildDirectorySearchSignal } from "@/lib/directory/search-demand-signal";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signal = buildDirectorySearchSignal({
      query: body.query,
      filters: body.filters,
      resultCount: body.result_count,
      source: body.source || "directory",
      visitorId: body.visitor_id,
    });

    if (!signal.raw_query && !signal.parsed_role && !signal.parsed_state && !signal.parsed_country) {
      return NextResponse.json({ ok: false, error: "Missing searchable signal" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("directory_search_logs")
      .insert(signal)
      .select("id")
      .single();

    if (error) {
      console.error("[directory-search-capture] insert failed", error.message);
      return NextResponse.json({ ok: false, persisted: false, error: "Directory search signal was not stored" }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      persisted: true,
      search_log_id: data?.id,
      no_results: signal.no_results,
    });
  } catch (error) {
    console.error("[directory-search-capture] request failed", error);
    return NextResponse.json({ ok: false, error: "Invalid directory search capture payload" }, { status: 400 });
  }
}
