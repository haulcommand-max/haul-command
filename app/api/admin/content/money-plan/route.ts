import { NextRequest, NextResponse } from "next/server";
import { isInternalRequest } from "@/lib/auth/internal-request";
import {
  buildContentMoneyPlan,
  CONTENT_FRANCHISE_LIBRARY,
  type ContentAudience,
  type ContentFranchiseKey,
  type ContentRevenueTag,
} from "@/lib/content-os/content-money-engine";

const franchises = new Set(Object.keys(CONTENT_FRANCHISE_LIBRARY));

export async function POST(req: NextRequest) {
  if (!isInternalRequest(req.headers)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const franchise = typeof body.franchise === "string" ? body.franchise : "";
  if (!franchises.has(franchise)) {
    return NextResponse.json({ error: "valid franchise is required" }, { status: 400 });
  }

  const revenueTags = Array.isArray(body.revenueTags) ? body.revenueTags.filter((tag) => typeof tag === "string") as ContentRevenueTag[] : [];

  const plan = buildContentMoneyPlan({
    franchise: franchise as ContentFranchiseKey,
    role: typeof body.role === "string" ? body.role : "",
    audience: (typeof body.audience === "string" ? body.audience : "broker") as ContentAudience,
    hook: typeof body.hook === "string" ? body.hook : "",
    problem: typeof body.problem === "string" ? body.problem : "",
    story: typeof body.story === "string" ? body.story : "",
    payoff: typeof body.payoff === "string" ? body.payoff : "",
    cta: typeof body.cta === "string" ? body.cta : "",
    targetUrl: typeof body.targetUrl === "string" ? body.targetUrl : "",
    countryCode: typeof body.countryCode === "string" ? body.countryCode : undefined,
    region: typeof body.region === "string" ? body.region : undefined,
    city: typeof body.city === "string" ? body.city : undefined,
    corridor: typeof body.corridor === "string" ? body.corridor : undefined,
    proofSignal: typeof body.proofSignal === "string" ? body.proofSignal : undefined,
    credentialSignal: typeof body.credentialSignal === "string" ? body.credentialSignal : undefined,
    revenueTags,
    claimType: typeof body.claimType === "string" ? body.claimType : "general",
    sourceConfidence: typeof body.sourceConfidence === "string" ? body.sourceConfidence : undefined,
    verifyBeforeDispatchDisclaimer: Boolean(body.verifyBeforeDispatchDisclaimer),
    weakSupplySignal: Boolean(body.weakSupplySignal),
    searchVolumeSignal: typeof body.searchVolumeSignal === "number" ? body.searchVolumeSignal : undefined,
  });

  return NextResponse.json({
    ok: true,
    writesDatabase: false,
    plan,
  });
}
