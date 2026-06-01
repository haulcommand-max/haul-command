import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { finalizeClaimOwnership } from "../../lib/claims/finalize-claim-ownership";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

function makeSupabaseMock(errors: Record<string, { message: string; code?: string }> = {}) {
  const updates: Array<{ table: string; values: Record<string, unknown>; column: string; value: string }> = [];
  const inserts: Array<{ table: string; values: Record<string, unknown> }> = [];

  return {
    updates,
    inserts,
    client: {
      from(table: string) {
        return {
          update(values: Record<string, unknown>) {
            return {
              async eq(column: string, value: string) {
                updates.push({ table, values, column, value });
                return { error: errors[table] ?? null };
              },
            };
          },
          async insert(values: Record<string, unknown>) {
            inserts.push({ table, values });
            return { error: errors[table] ?? null };
          },
        };
      },
    },
  };
}

describe("claim ownership finalization", () => {
  it("updates all layered operator/directory ownership tables from one helper", async () => {
    const mock = makeSupabaseMock();

    const result = await finalizeClaimOwnership(mock.client, {
      entityId: "operator-123",
      userId: "user-123",
      source: "Supabase Email OTP",
      primaryTable: "hc_global_operators",
    });

    expect(result.results.map((item) => item.table)).toEqual([
      "hc_global_operators",
      "hc_operators",
      "directory_entities",
    ]);
    expect(mock.updates).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table: "hc_global_operators",
          column: "id",
          value: "operator-123",
          values: expect.objectContaining({
            user_id: "user-123",
            claim_status: "verified",
            primary_trust_source: "Supabase Email OTP",
          }),
        }),
        expect.objectContaining({
          table: "directory_entities",
          values: expect.objectContaining({
            owner_user_id: "user-123",
            claim_status: "claimed",
          }),
        }),
        expect.objectContaining({
          table: "hc_trust_profiles",
          column: "entity_id",
          value: "operator-123",
          values: expect.objectContaining({
            claimed: true,
            claim_pending: false,
            claim_user_id: "user-123",
          }),
        }),
      ]),
    );
    expect(mock.inserts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          table: "hc_command_money_events",
          values: expect.objectContaining({
            event_type: "claim_conversion",
            amount_cents: 0,
            entity_type: "hc_global_operators",
            entity_id: "operator-123",
            metadata: expect.objectContaining({
              source: "Supabase Email OTP",
              user_id: "user-123",
            }),
          }),
        }),
      ]),
    );
  });

  it("uses the finalization helper in the verified identity claim route", () => {
    const route = read("app/api/identity/claim/route.ts");

    expect(route).toContain("import { finalizeClaimOwnership }");
    expect(route).toContain("await finalizeClaimOwnership(sb");
    expect(route).toContain("primaryTable: 'hc_global_operators'");
    expect(route).not.toContain("const { error: updateError } = await sb");
  });

  it("uses the finalization helper in token-based listing claim verification", () => {
    const route = read("app/api/claims/verify/route.ts");

    expect(route).toContain("import { finalizeClaimOwnership }");
    expect(route).toContain("await finalizeClaimOwnership(supabase");
    expect(route).toContain("source: 'listing_claims token verification'");
    expect(route).toContain("route: '/api/claims/verify'");
    expect(route).not.toContain(".update({\n        claimed: true");
    expect(route).not.toContain("claimed_by: claim.user_id");
  });
});
