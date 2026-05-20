import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  fetchText,
  insertRawObservations,
  isAuthorized,
  json,
  optionsResponse,
  parseRequest,
  resolveImport,
  stripHtml,
  updateImport,
} from "../_shared/authority-parser.ts";

function parseXmlObservations(xml: string, sourceUrl: string) {
  const itemPattern = /<(item|entry|record|row|operator|carrier|company)[^>]*>([\s\S]*?)<\/\1>/gi;
  return Array.from(xml.matchAll(itemPattern)).map((match, index) => ({
    name: stripHtml(match[2]).slice(0, 120) || `xml_record_${index + 1}`,
    source_url: sourceUrl,
    payload: {
      extraction: "xml_record",
      raw_xml: match[0].slice(0, 8000),
    },
  }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });
  if (!isAuthorized(req)) return json(401, { ok: false, error: "unauthorized" });

  const body = await parseRequest(req);
  const importRecord = await resolveImport({ ...body, source_format: "xml" });
  const sourceUrl = String(importRecord.source_url ?? body.source_url ?? "");
  if (!sourceUrl) return json(400, { ok: false, error: "source_url required" });

  try {
    await updateImport(importRecord.id as string | null, { status: "running", last_error: null });
    const observations = parseXmlObservations(await fetchText(sourceUrl), sourceUrl);
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
      result_summary: { parser: "authority-xml-parser", observations: observations.length, stored },
    });

    return json(200, { ok: true, parser: "authority-xml-parser", observations: observations.length, stored });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateImport(importRecord.id as string | null, { status: "failed", last_error: message });
    return json(500, { ok: false, parser: "authority-xml-parser", error: message });
  }
});
