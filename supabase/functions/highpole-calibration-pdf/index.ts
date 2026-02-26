// Setup type definitions for built-in Deno APIs
/// <reference lib="deno.ns" />

import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

type Req = { calibration_id: string };
type Res =
  | { ok: true; calibration_id: string; pdf_path: string }
  | { ok: false; error: string };

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    const supabase = getServiceClient();

    let body: Req;
    try {
        body = await req.json();
    } catch {
        const res: Res = { ok: false, error: "invalid json" };
        return new Response(JSON.stringify(res), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    const { data: cal, error } = await supabase
        .from("high_pole_calibrations")
        .select("*")
        .eq("id", body.calibration_id)
        .single();

    if (error || !cal) {
        const res: Res = { ok: false, error: "calibration not found" };
        return new Response(JSON.stringify(res), { status: 404, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    // ── PDF generation ────────────────────────────────────────────────────
    // Replace with your PDF provider (e.g., Puppeteer, jsPDF, or an HTML→PDF service).
    // The PDF should include: profile_id, load height, pole set height, buffer,
    // photos, timestamp, digital signature block.
    const pdfPath = `artifacts/high_pole/${cal.profile_id}/${cal.id}.pdf`;

    // TODO: generate bytes and upload to Supabase Storage at pdfPath:
    // const pdfBytes = await generateHighPolePdf(cal);
    // await supabase.storage.from("artifacts").upload(pdfPath, pdfBytes, { contentType: "application/pdf" });

    await supabase
        .from("high_pole_calibrations")
        .update({ artifact_pdf_path: pdfPath, status: "approved" })
        .eq("id", cal.id);

    await supabase.from("event_log").insert({
        actor_profile_id: cal.profile_id,
        actor_role:       "driver",
        event_type:       "highpole.pdf_generated",
        entity_type:      "high_pole_calibrations",
        entity_id:        cal.id,
        payload:          { pdf_path: pdfPath, load_height_inches: cal.load_height_inches },
    });

    const res: Res = { ok: true, calibration_id: cal.id, pdf_path: pdfPath };
    return new Response(JSON.stringify(res), { headers: { ...corsHeaders, "content-type": "application/json" } });
});
