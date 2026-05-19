import { NextRequest, NextResponse } from "next/server";
import { getHomepageRoleChips } from "@/lib/homepage/role-chips";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const countryCode = searchParams.get("country") ?? "US";
  const limitParam = Number(searchParams.get("limit") ?? "0");
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : 500;

  const result = await getHomepageRoleChips(countryCode);

  return NextResponse.json(
    {
      ...result,
      chips: result.chips.slice(0, limit),
      returnedCount: Math.min(result.chips.length, limit),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
      },
    },
  );
}
