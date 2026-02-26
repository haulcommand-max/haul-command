import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        // Call the RPC defined in the database migration
        const { data, error } = await supabaseClient.rpc("execute_email_inventory_audit");

        if (error) {
            console.error("RPC Error:", error);
            throw error;
        }

        console.log("Email Audit Result:", JSON.stringify(data));

        // Optionally: if data.status === "critical", trigger an external alert (e.g., Slack)
        if (data.status === "critical") {
            console.warn("CRITICAL: Email inventory is dangerously low.");
            // Webhook trigger to ops channel would go here.
        }

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
        });
    }
});
