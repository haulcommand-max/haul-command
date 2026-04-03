// app/api/swarm/market-mode/route.ts
// Market Mode API — read or evaluate market modes

import { NextRequest, NextResponse } from "next/server";
import { getMarketState, getMarketPolicy, batchEvaluateMarketModes } from "@/lib/swarm/market-mode-governor";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const marketKey = searchParams.get("market_key");

  if (!marketKey) {
    return NextResponse.json({ error: "market_key required" }, { status: 400 });
  }

  const state = await getMarketState(marketKey);
  const policy = await getMarketPolicy(marketKey);

  return NextResponse.json({ state, policy });
}

export async function POST() {
  // Trigger batch evaluation of all market modes
  const result = await batchEvaluateMarketModes();
  return NextResponse.json(result);
}
