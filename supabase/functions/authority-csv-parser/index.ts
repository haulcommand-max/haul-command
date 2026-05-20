import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  fetchText,
  insertRawObservations,
  isAuthorized,
  json,
  optionsResponse,
  parseCsvRows,
  parseRequest,
  resolveImport,
  rowsToObservations,
  updateImport,
} from "../_shared/authority-parser.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });
  if (!isAuthorized(req)) return json(401, { ok: false, error: "unauthorized" });

  const body = await parseRequest(req);
  const importRecord = await resolveImport({ ...body, source_format: "csv" });
  const sourceUrl = String(importRecord.source_url ?? body.source_url ?? "");
  if (!sourceUrl && !body.rows?.length) return json(400, { ok: false, error: "source_url or rows[] required" });

  try {
    await updateImport(importRecord.id as string | null, { status: "running", last_error: null });
    const rows = body.rows ?? parseCsvRows(await fetchText(sourceUrl));
    const observations = rowsToObservations(rows, sourceUrl);
    const stored = await insertRawObservations({
      importRecord,
      observations,
      dryRun: body.dry_run === true,
      maxRows: body.max_rows,
    });

    await updateImport(importRecord.id as string | null, {
      status: "completed",
      last_imported_at: new Date().toISOString(),
      last_import_row_count: observations.length,
      result_summary: { parser: "authority-csv-parser", observations: observations.length, stored },
    });

    return json(200, { ok: true, parser: "authority-csv-parser", observations: observations.length, stored });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateImport(importRecord.id as string | null, { status: "failed", last_error: message });
    return json(500, { ok: false, parser: "authority-csv-parser", error: message });
  }
});
