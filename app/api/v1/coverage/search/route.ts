import { NextRequest, NextResponse } from "next/server";
import { successResponse, errorResponse } from "@/lib/contracts/mobile";
import { createPublicClient } from "@/lib/supabase/server";
import {
  buildCoverageSearchFilters,
  searchCoverageOperators,
} from "@/lib/coverage/search";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filters = buildCoverageSearchFilters(body);
    const client = createPublicClient();
    const results = await searchCoverageOperators(client, filters);

    return NextResponse.json(successResponse(results.data, {
      paging: { limit: filters.limit, offset: filters.offset, total: results.total }
    }));
  } catch (error) {
    return NextResponse.json(
      errorResponse("search_failed", "Coverage search encountered an error"),
      { status: 500 }
    );
  }
}
