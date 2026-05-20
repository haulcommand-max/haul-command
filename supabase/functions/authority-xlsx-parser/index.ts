import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import {
  isAuthorized,
  json,
  optionsResponse,
  parseRequest,
  resolveImport,
  updateImport,
} from "../_shared/authority-parser.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });
  if (!isAuthorized(req)) return json(401, { ok: false, error: "unauthorized" });

  const body = await parseRequest(req);
  const importRecord = await resolveImport({ ...body, source_format: "xlsx" });
  const message = "XLSX authority parsing is scaffolded but intentionally quarantined until an audited spreadsheet parser is bundled.";

  await updateImport(importRecord.id as string | null, {
    status: "quarantined",
    last_error: message,
    result_summary: { parser: "authority-xlsx-parser", supported: false, reason: message },
  });

  return json(202, { ok: true, parser: "authority-xlsx-parser", quarantined: true, reason: message });
});
