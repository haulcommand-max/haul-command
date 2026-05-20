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
  const importRecord = await resolveImport({ ...body, source_format: "pdf_scrape" });
  const message = "PDF authority parsing is scaffolded but quarantined until OCR/text extraction is wired through the approved Fly/Hugging Face utility layer.";

  await updateImport(importRecord.id as string | null, {
    status: "quarantined",
    last_error: message,
    result_summary: { parser: "authority-pdf-scrape-parser", supported: false, reason: message },
  });

  return json(202, { ok: true, parser: "authority-pdf-scrape-parser", quarantined: true, reason: message });
});
