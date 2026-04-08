/**
 * GET /api/cron/fmcsa-ingest
 *
 * Scheduled: weekly (Sundays at 03:00 UTC) via vercel.json
 * Purpose: Download FMCSA CENSUS1 carrier/broker dataset,
 *          parse CSV rows, upsert into hc_extraction_candidates.
 *
 * Observability contract:
 *   run_id, started_at, ended_at, duration_ms,
 *   records_fetched, records_changed, records_unchanged,
 *   duplicate_collisions, error_count
 *
 * Safety rules:
 *   - Idempotent: upsert on usdot_number, never raw-insert
 *   - Max 5,000 rows per run to stay within Vercel limits
 *   - Retry-safe: duplicate collisions logged, not thrown
 */

import { NextRequest, NextResponse } from "next/server";
import { cronGuard, logCronRun } from "@/app/api/cron/_lib/cron-guard";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min max

const JOB_ID = "fmcsa-ingest";
const FMCSA_URL = "https://ai.fmcsa.dot.gov/SMS/files/FMCSA_CENSUS1_2025.zip";
const MAX_ROWS_PER_RUN = 5000;

// FMCSA column indices (0-based) for CENSUS1 format
const COL = {
  DOT_NUMBER: 0,
  LEGAL_NAME: 1,
  DBA_NAME: 2,
  CARRIER_STATUS: 3,
  ENTITY_TYPE: 4,
  PHYSICAL_ADDRESS: 5,
  PHY_CITY: 10,
  PHY_STATE: 11,
  PHY_ZIP: 12,
  PHY_COUNTRY: 13,
  MAILING_CITY: 18,
  MAILING_STATE: 19,
  PHONE: 22,
  EMAIL_ADDRESS: 24,
  MC_MX_FF: 26,
};

export async function GET(req: NextRequest) {
  const start = Date.now();
  const run_id = crypto.randomUUID();

  const guard = await cronGuard();
  if (guard) return guard;

  const supabase = getSupabaseAdmin();

  let records_fetched = 0;
  let records_changed = 0;
  let records_unchanged = 0;
  let duplicate_collisions = 0;
  let error_count = 0;

  console.log(
    JSON.stringify({ level: "info", job: JOB_ID, run_id, event: "fmcsa_ingest.started" }),
  );

  try {
    // Fetch the ZIP — stream and find the CSV without unzipping to disk
    const zipRes = await fetch(FMCSA_URL, {
      signal: AbortSignal.timeout(60000),
    });

    if (!zipRes.ok) {
      throw new Error(`FMCSA fetch failed: ${zipRes.status}`);
    }

    // Read raw bytes
    const zipBuffer = await zipRes.arrayBuffer();

    // Dynamically import fflate for ZIP parsing (available via next.js bundler)
    // Fallback: parse raw text if not available
    let csvText: string;
    try {
      const fflate = await import("fflate").catch(() => null);
      if (fflate) {
        const uint8 = new Uint8Array(zipBuffer);
        const unzipped = fflate.unzipSync(uint8);
        const csvKey = Object.keys(unzipped).find((k) => k.endsWith(".txt") || k.endsWith(".csv"));
        if (!csvKey) throw new Error("No CSV/TXT found in ZIP");
        csvText = new TextDecoder().decode(unzipped[csvKey]);
      } else {
        // Best-effort: try treating the response as text
        csvText = new TextDecoder().decode(zipBuffer);
      }
    } catch {
      throw new Error("ZIP parsing failed — fflate not available");
    }

    const lines = csvText.split("\n");
    const dataLines = lines.slice(1); // skip header

    const batch: any[] = [];

    for (const line of dataLines) {
      if (records_fetched >= MAX_ROWS_PER_RUN) break;
      if (!line.trim()) continue;

      const cols = line.split("\t");
      const dotNumber = cols[COL.DOT_NUMBER]?.trim();
      if (!dotNumber || dotNumber === "0") continue;

      records_fetched++;

      batch.push({
        usdot_number: dotNumber,
        legal_name: cols[COL.LEGAL_NAME]?.trim() ?? null,
        dba_name: cols[COL.DBA_NAME]?.trim() || null,
        carrier_status: cols[COL.CARRIER_STATUS]?.trim() ?? null,
        entity_type: cols[COL.ENTITY_TYPE]?.trim() ?? null,
        physical_city: cols[COL.PHY_CITY]?.trim() ?? null,
        physical_state: cols[COL.PHY_STATE]?.trim() ?? null,
        physical_zip: cols[COL.PHY_ZIP]?.trim() ?? null,
        physical_country: cols[COL.PHY_COUNTRY]?.trim() ?? "US",
        phone: cols[COL.PHONE]?.trim() || null,
        email: cols[COL.EMAIL_ADDRESS]?.trim() || null,
        source: "fmcsa_census",
        source_attribution: FMCSA_URL,
        fetched_at: new Date().toISOString(),
        run_id,
      });

      // Flush in batches of 250
      if (batch.length >= 250) {
        const { error } = await supabase
          .from("hc_extraction_candidates")
          .upsert(batch, { onConflict: "usdot_number", ignoreDuplicates: false });

        if (error) {
          if (error.code === "23505") {
            duplicate_collisions += batch.length;
          } else {
            error_count++;
          }
        } else {
          records_changed += batch.length;
        }
        batch.length = 0;
      }
    }

    // Flush remaining
    if (batch.length > 0) {
      const { error } = await supabase
        .from("hc_extraction_candidates")
        .upsert(batch, { onConflict: "usdot_number", ignoreDuplicates: false });

      if (error) {
        if (error.code === "23505") duplicate_collisions += batch.length;
        else error_count++;
      } else {
        records_changed += batch.length;
      }
    }
  } catch (err: any) {
    error_count++;
    console.error(
      JSON.stringify({ level: "error", job: JOB_ID, run_id, error: err.message }),
    );

    await logCronRun(JOB_ID, start, "failed", {
      error_message: err.message,
      metadata: { run_id, records_fetched, error_count },
    });

    return NextResponse.json(
      { ok: false, run_id, error: err.message, records_fetched, error_count },
      { status: 500 },
    );
  }

  const duration_ms = Date.now() - start;

  await logCronRun(JOB_ID, start, "success", {
    rows_affected: records_changed,
    metadata: {
      run_id,
      records_fetched,
      records_changed,
      records_unchanged,
      duplicate_collisions,
      error_count,
    },
  });

  console.log(
    JSON.stringify({
      level: "info",
      job: JOB_ID,
      run_id,
      event: "fmcsa_ingest.completed",
      duration_ms,
      records_fetched,
      records_changed,
      records_unchanged,
      duplicate_collisions,
      error_count,
    }),
  );

  return NextResponse.json({
    ok: true,
    run_id,
    duration_ms,
    records_fetched,
    records_changed,
    records_unchanged,
    duplicate_collisions,
    error_count,
  });
}
