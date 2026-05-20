import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

describe("admin competitor intel dashboard authority", () => {
  it("uses the existing admin-gated route group dashboard instead of a duplicate public admin page", () => {
    const page = read("app/(admin)/admin/competitors/page.tsx");
    const layout = read("app/(admin)/admin/layout.tsx");

    expect(page).toContain("Competitor Intel Dashboard");
    expect(page).toContain(".from(\"competitor_intel\")");
    expect(page).toContain(".from(\"operators\")");
    expect(page).toContain("competitor_sourced");
    expect(page).toContain("claim_value_score");
    expect(layout).toContain("profile.role !== \"system_admin\"");
    expect(layout).toContain("Competitor Intel");
  });

  it("owns competitor intel schema in the root migration path with RLS and no public grants", () => {
    const migration = read("supabase/migrations/20260324060000_competitor_tracking_intel.sql");

    expect(migration).toContain("create table if not exists public.competitor_intel");
    expect(migration).toContain("create table if not exists public.competitor_operator_overlap");
    expect(migration).toContain("alter table public.competitor_intel enable row level security");
    expect(migration).toContain("revoke all on table public.competitor_intel from anon, authenticated");
    expect(migration).toContain("create or replace function public.refresh_competitor_intel()");
    expect(migration).toContain("competitor_sourced boolean");
    expect(migration).toContain("claim_value_score numeric");
    expect(migration).toContain("is_mocked boolean not null default false");
    expect(migration).not.toMatch(/insert into public\.competitor_intel/i);
    expect(migration).not.toMatch(/mocked ingestion results/i);
  });
});
