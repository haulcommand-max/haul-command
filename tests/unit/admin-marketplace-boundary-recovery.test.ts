import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("admin and marketplace boundary recovery", () => {
  it("requires internal request tokens on service-role admin and trust mutation routes", () => {
    const guardedRoutes = [
      "app/api/v1/admin/payouts/route.ts",
      "app/api/v1/admin/jobs/route.ts",
      "app/api/v1/admin/reviews/route.ts",
      "app/api/v1/admin/flags/route.ts",
      "app/api/v1/admin/system/route.ts",
      "app/api/claim/approve/route.ts",
      "app/api/surfaces/verify-claim/route.ts",
    ];

    for (const route of guardedRoutes) {
      const source = read(route);
      expect(source, route).toContain("requireInternalRequest");
      expect(source, route).toContain("const authFailure = requireInternalRequest(req)");
      expect(source, route).toContain("if (authFailure) return authFailure");
    }
  });

  it("does not initialize service-role clients at module scope on surface claim routes", () => {
    const claimSurface = read("app/api/surfaces/claim/route.ts");
    const verifySurface = read("app/api/surfaces/verify-claim/route.ts");

    expect(claimSurface).not.toContain("const supabase = getSupabaseAdmin()");
    expect(verifySurface).not.toContain("const supabase = getSupabaseAdmin()");
  });

  it("forces user-owned marketplace and surface claim writes through confirmed auth users", () => {
    const userOwnedRoutes = [
      "app/api/surfaces/claim/route.ts",
      "app/api/v1/marketplace/standby/route.ts",
      "app/api/v1/marketplace/reservations/route.ts",
    ];

    for (const route of userOwnedRoutes) {
      const source = read(route);
      expect(source, route).toContain("createClient");
      expect(source, route).toContain("auth.getUser()");
      expect(source, route).toContain("isEmailConfirmed(user)");
      expect(source, route).toContain("EMAIL_CONFIRMATION_REQUIRED");
    }

    expect(read("app/api/surfaces/claim/route.ts")).toContain("p_user_id: user.id");
    expect(read("app/api/v1/marketplace/standby/route.ts")).toContain("user_id: user.id");
    expect(read("app/api/v1/marketplace/reservations/route.ts")).toContain("broker_id: user.id");
  });

  it("retires the legacy marketplace match writer instead of preserving an unpaid match bypass", () => {
    const route = read("app/api/v1/marketplace/match/route.ts");

    expect(route).toContain("Legacy marketplace match is retired");
    expect(route).toContain("payment_authorized_job_required");
    expect(route).toContain('canonical_route: "/api/loads/create"');
    expect(route).toContain('dispatch_route: "/api/loads/dispatch"');
    expect(route).toContain("status: 410");
    expect(route).not.toContain("createClient");
    expect(route).not.toContain("getSupabaseAdmin");
    expect(route).not.toContain("auth.getUser()");
    expect(route).not.toContain("runMatchPipeline");
    expect(route).not.toContain("load_requests");
    expect(route).not.toContain("broker_id: user.id");
  });

  it("verifies operator profile ownership before premium standby writes mutate operator availability", () => {
    const standby = read("app/api/v1/marketplace/standby/route.ts");
    const helper = read("lib/marketplace/operator-ownership.ts");

    expect(standby).toContain("verifyOperatorProfileOwnership");
    expect(standby).toContain("operatorId: body.operator_id");
    expect(standby).toContain("userId: user.id");
    expect(standby).toContain("ownership.resolvedOperatorId");
    expect(standby).not.toContain('.eq(body.operator_id ? "operator_id" : "user_id"');

    expect(helper).toContain("operator_profiles");
    expect(helper).toContain("escort_profiles");
    expect(helper).toContain("Operator profile ownership could not be verified.");
  });

  it("preserves directory selected-provider context when posting a load", () => {
    const postLoad = read("app/(app)/loads/post/page.tsx");
    const createLoad = read("app/api/loads/create/route.ts");
    const matchGenerate = read("supabase/functions/match-generate/index.ts");

    expect(postLoad).toContain("useSearchParams");
    expect(postLoad).toContain("support_context");
    expect(postLoad).toContain("selected_provider_id");
    expect(postLoad).toContain("requested_support_service");
    expect(postLoad).toContain("Directory context");

    expect(createLoad).toContain("directorySupportContext");
    expect(createLoad).toContain("selected_provider_id: directorySupportContext.provider_id");
    expect(createLoad).toContain("requested_support_service: directorySupportContext.support");
    expect(createLoad).toContain("support_context: hasDirectorySupportContext ? directorySupportContext : null");

    expect(matchGenerate).toContain("const selectedProviderId");
    expect(matchGenerate).toContain("selected_provider_id: selectedProviderId ?? null");
    expect(matchGenerate).toContain("requested_support_service: requestedSupportService ?? null");
  });
});
