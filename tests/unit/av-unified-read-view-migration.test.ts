import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const migrationPath = "supabase/migrations/20260515203000_av_unified_read_views_private.sql";

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("private AV unified read view migration", () => {
  it("creates the two unified views with security_invoker", () => {
    const sql = read(migrationPath);

    expect(sql).toContain("create or replace view public.v_av_operator_universe");
    expect(sql).toContain("create or replace view public.v_av_corridor_readiness_unified");
    expect(sql.match(/with \(security_invoker = true\)/g)).toHaveLength(2);
  });

  it("does not grant new anon or authenticated read access", () => {
    const sql = read(migrationPath).toLowerCase();
    const grantLines = sql
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.startsWith("grant "));

    expect(grantLines).not.toEqual(expect.arrayContaining([expect.stringMatching(/\bto\s+anon\b/)]));
    expect(grantLines).not.toEqual(expect.arrayContaining([expect.stringMatching(/\bto\s+authenticated\b/)]));
    expect(sql).toContain("revoke all on public.v_av_operator_universe from anon, authenticated");
    expect(sql).toContain("revoke all on public.v_av_corridor_readiness_unified from anon, authenticated");
    expect(sql).toContain("revoke all on function public.read_av_operator_universe() from public, anon, authenticated");
    expect(sql).toContain("grant select on public.v_av_operator_universe to service_role");
    expect(sql).toContain("grant select on public.v_av_corridor_readiness_unified to service_role");
    expect(sql).toContain("grant execute on function public.read_av_operator_universe() to service_role");
  });

  it("provides a private server-side operator read helper with materialized-view fallback", () => {
    const sql = read(migrationPath);
    const lowerSql = sql.toLowerCase();

    expect(lowerSql).toContain("create or replace function public.read_av_operator_universe()");
    expect(lowerSql).toContain("if to_regclass('public.mv_av_operator_universe') is not null then");
    expect(lowerSql).toContain("from public.mv_av_operator_universe");
    expect(lowerSql).toContain("from public.v_av_operator_universe v");
    expect(lowerSql.indexOf("from public.mv_av_operator_universe")).toBeLessThan(
      lowerSql.indexOf("from public.v_av_operator_universe v")
    );
  });

  it("documents the canonical read paths in hc_policy without public exposure language", () => {
    const sql = read(migrationPath);

    expect(sql).toContain("canonical.operators.unified_av_read_view");
    expect(sql).toContain("canonical.corridors.unified_av_read_view");
    expect(sql).toContain("read_av_operator_universe");
    expect(sql).toContain("mv_av_operator_universe");
    expect(sql).toContain("private-by-default");
  });
});
