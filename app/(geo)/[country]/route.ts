import { NextRequest, NextResponse } from "next/server";

const CANONICAL_COUNTRIES = new Set(["us", "ca", "gb", "au", "za", "mx"]);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ country: string }> },
) {
  const { country } = await params;
  const countryCode = country.toLowerCase();

  if (!CANONICAL_COUNTRIES.has(countryCode)) {
    return NextResponse.json({ error: "Country hub not found" }, { status: 404 });
  }

  return NextResponse.redirect(new URL(`/directory/${countryCode}`, request.url), 308);
}
