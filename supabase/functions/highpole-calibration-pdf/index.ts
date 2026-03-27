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
    const pdfPath = `artifacts/high_pole/${cal.profile_id}/${cal.id}.pdf`;

    try {
        const { PDFDocument, rgb, StandardFonts } = await import("npm:pdf-lib");
        const doc = await PDFDocument.create();
        const page = doc.addPage([595.28, 841.89]); // A4
        const font = await doc.embedFont(StandardFonts.Helvetica);
        const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
        
        // Header
        page.drawText('HAUL COMMAND', { x: 50, y: 780, size: 24, font: boldFont, color: rgb(0.776, 0.573, 0.227) });
        page.drawText('HIGH POLE CALIBRATION CERTIFICATE', { x: 50, y: 750, size: 16, font: boldFont });
        page.drawText(`Calibration ID: ${cal.id.split('-')[0].toUpperCase()}`, { x: 50, y: 720, size: 12, font });
        page.drawText(`Date: ${new Date(cal.created_at || Date.now()).toLocaleString()}`, { x: 50, y: 700, size: 12, font });
        
        // Data Details
        page.drawText('MEASUREMENT DATA:', { x: 50, y: 660, size: 14, font: boldFont });
        
        let y = 630;
        const details = [
            `Load Height: ${cal.load_height_inches || 0} inches`,
            `Pole Set Height: ${cal.pole_height_inches || 0} inches`,
            `Safety Buffer: ${cal.buffer_inches || 0} inches`
        ];
        
        for (const line of details) {
            page.drawText(line, { x: 70, y, size: 12, font });
            y -= 25;
        }

        // Digital Signature / Attestation
        y -= 30;
        page.drawText('ATTESTATION & COMPLIANCE:', { x: 50, y, size: 14, font: boldFont });
        y -= 25;
        const complianceText = "By this certificate, it is attested that the pilot car height pole was " +
                               "physically unspooled, measured with a rigid tape, and calibrated " +
                               "to the exact pole set height specified above, inclusive of the safety buffer.";
        page.drawText(complianceText, { x: 70, y, size: 10, font, maxWidth: 450 });
        y -= 50;

        page.drawLine({ start: { x: 70, y: y + 10 }, end: { x: 270, y: y + 10 }, thickness: 1 });
        page.drawText('Electronic Signature / Profile ID', { x: 70, y: y - 10, size: 10, font: boldFont });
        page.drawText(cal.profile_id, { x: 70, y: y - 25, size: 9, font, color: rgb(0.3, 0.3, 0.3) });

        // Footer
        page.drawText('Haul Command Escort Management System. This is an electronically generated valid certificate.', { x: 50, y: 50, size: 9, font, color: rgb(0.5, 0.5, 0.5) });

        const pdfBytes = await doc.save();
        const { error: uploadErr } = await supabase.storage
            .from("artifacts")
            .upload(pdfPath, pdfBytes, { contentType: "application/pdf", upsert: true });
            
        if (uploadErr) {
            console.error("Highpole PDF upload error:", uploadErr);
        }
    } catch (e) {
        console.error("Failed to generate Highpole PDF:", e);
    }

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
