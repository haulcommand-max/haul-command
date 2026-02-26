import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
    const url = new URL(req.url);
    const ref = url.searchParams.get("ref") ?? "";
    const path = url.searchParams.get("to") ?? "/";

    // Your public landing page that mirrors app content (directory/leaderboards/loads)
    // Assuming configured site URL or fallback
    const domain = Deno.env.get("SITE_URL") ?? "https://haulcommand.com";
    const webUrl = `${domain}${path}${path.includes("?") ? "&" : "?"}ref=${encodeURIComponent(ref)}`;

    // For now: just redirect. (If you want click logging, add a service-role write here.)
    return Response.redirect(webUrl, 302);
});
