// Setup type definitions for built-in Deno APIs
/// <reference lib="deno.ns" />

import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

type Req = { invoice_id: string };
type Res =
  | { ok: true; invoice_id: string; pdf_path: string }
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

    const { data: inv, error } = await supabase
        .from("invoices")
        .select("*")
        .eq("id", body.invoice_id)
        .single();

    if (error || !inv) {
        const res: Res = { ok: false, error: "invoice not found" };
        return new Response(JSON.stringify(res), { status: 404, headers: { ...corsHeaders, "content-type": "application/json" } });
    }

    // ── PDF generation ────────────────────────────────────────────────────
    const pdfPath = `artifacts/invoices/${inv.profile_id}/${inv.id}.pdf`;

    try {
        const { PDFDocument, rgb, StandardFonts } = await import("npm:pdf-lib");
        const doc = await PDFDocument.create();
        const page = doc.addPage([595.28, 841.89]); // A4
        const font = await doc.embedFont(StandardFonts.Helvetica);
        const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
        
        // Header
        page.drawText('HAUL COMMAND', { x: 50, y: 780, size: 24, font: boldFont, color: rgb(0.776, 0.573, 0.227) });
        page.drawText('INVOICE', { x: 50, y: 750, size: 18, font });
        page.drawText(`Invoice #: ${inv.id.split('-')[0].toUpperCase()}`, { x: 50, y: 730, size: 12, font });
        page.drawText(`Date: ${new Date(inv.created_at || Date.now()).toLocaleDateString()}`, { x: 50, y: 715, size: 12, font });
        page.drawText(`Status: ${inv.status.toUpperCase()}`, { x: 50, y: 700, size: 12, font, color: inv.status === 'paid' ? rgb(0, 0.7, 0) : rgb(0.8, 0, 0) });
        
        // Items
        page.drawText('Description', { x: 50, y: 650, size: 12, font: boldFont });
        page.drawText('Amount', { x: 450, y: 650, size: 12, font: boldFont });
        page.drawLine({ start: { x: 50, y: 640 }, end: { x: 500, y: 640 }, thickness: 1 });
        
        let y = 620;
        const items = inv.line_items || [{ description: 'Escort Services', amount: inv.amount }];
        let total = 0;
        
        for (const item of items) {
            page.drawText(item.description || 'Service', { x: 50, y, size: 11, font });
            const amount = parseFloat(item.amount) || 0;
            total += amount;
            page.drawText(`${inv.currency.toUpperCase()} ${amount.toFixed(2)}`, { x: 450, y, size: 11, font });
            y -= 25;
        }
        
        // Total
        page.drawLine({ start: { x: 50, y }, end: { x: 500, y }, thickness: 1 });
        y -= 20;
        page.drawText('TOTAL', { x: 380, y, size: 14, font: boldFont });
        page.drawText(`${inv.currency.toUpperCase()} ${total.toFixed(2)}`, { x: 450, y, size: 14, font: boldFont });
        
        // Footer
        page.drawText('Thank you for your business. Processed securely via Haul Command.', { x: 50, y: 50, size: 9, font, color: rgb(0.5, 0.5, 0.5) });

        const pdfBytes = await doc.save();
        const { error: uploadErr } = await supabase.storage
            .from("artifacts")
            .upload(pdfPath, pdfBytes, { contentType: "application/pdf", upsert: true });
            
        if (uploadErr) {
            console.error("PDF upload error:", uploadErr);
        }
    } catch (e) {
        console.error("Failed to generate PDF:", e);
    }

    await supabase
        .from("invoices")
        .update({ artifact_pdf_path: pdfPath })
        .eq("id", inv.id);

    await supabase.from("event_log").insert({
        actor_profile_id: inv.profile_id,
        actor_role:       "driver",
        event_type:       "invoice.pdf_generated",
        entity_type:      "invoices",
        entity_id:        inv.id,
        payload:          { pdf_path: pdfPath, status: inv.status, currency: inv.currency },
    });

    const res: Res = { ok: true, invoice_id: inv.id, pdf_path: pdfPath };
    return new Response(JSON.stringify(res), { headers: { ...corsHeaders, "content-type": "application/json" } });
});
