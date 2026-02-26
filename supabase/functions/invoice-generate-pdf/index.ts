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
    // Replace with your PDF provider.
    // The PDF should include: invoice number, line items, totals, broker details,
    // driver contact (from profile), Haul Command branding, legal footer.
    const pdfPath = `artifacts/invoices/${inv.profile_id}/${inv.id}.pdf`;

    // TODO: generate + upload to Supabase Storage:
    // const pdfBytes = await generateInvoicePdf(inv);
    // await supabase.storage.from("artifacts").upload(pdfPath, pdfBytes, { contentType: "application/pdf" });

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
