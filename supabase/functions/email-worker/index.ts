import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { SmtpClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

/**
 * email-worker — Drains email_jobs queue, sends via SMTP, retries with backoff.
 * 
 * Called by pg_cron every 1 minute.
 * max_attempts=5, exponential_backoff: 5m, 15m, 1h, 6h, 24h
 * hard_fail → suppression if repeated bounces
 */

const BACKOFF_MINUTES = [5, 15, 60, 360, 1440]; // 5m, 15m, 1h, 6h, 24h
const MAX_ATTEMPTS = 5;
const BATCH_SIZE = 50;

serve(async (_req) => {
    const headers = { "Content-Type": "application/json" };

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // ── 1. Resolve SMTP provider ──
        const { data: providerSetting } = await supabase
            .from("app_settings")
            .select("value")
            .eq("key", "email.provider")
            .single();

        const provider = providerSetting?.value || "brevo_smtp";

        // ── 2. Get SMTP config ──
        const smtpHost = Deno.env.get("SMTP_HOST") || "smtp-relay.brevo.com";
        const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "587", 10);
        const smtpUser = Deno.env.get("SMTP_USER") || "";
        const smtpPass = Deno.env.get("SMTP_PASS") || "";

        // ── 3. Get from address ──
        const { data: fromNameSetting } = await supabase.from("app_settings").select("value").eq("key", "email.from_name").single();
        const { data: fromEmailSetting } = await supabase.from("app_settings").select("value").eq("key", "email.from_email").single();
        const { data: replyToSetting } = await supabase.from("app_settings").select("value").eq("key", "email.reply_to").single();

        const fromName = fromNameSetting?.value || "Haul Command";
        const fromEmail = fromEmailSetting?.value || "dispatch@haulcommand.com";
        const replyTo = replyToSetting?.value || "support@haulcommand.com";

        // ── 4. Fetch pending jobs ready to send ──
        const { data: jobs, error: fetchErr } = await supabase
            .from("email_jobs")
            .select("*")
            .eq("status", "pending")
            .lte("send_after", new Date().toISOString())
            .order("created_at", { ascending: true })
            .limit(BATCH_SIZE);

        if (fetchErr) throw fetchErr;
        if (!jobs || jobs.length === 0) {
            return new Response(JSON.stringify({ processed: 0 }), { headers });
        }

        console.log(`[email-worker] Processing ${jobs.length} jobs via ${provider}`);

        let sent = 0;
        let failed = 0;

        // ── 5. Connect SMTP ──
        const client = new SmtpClient();
        await client.connectTLS({
            hostname: smtpHost,
            port: smtpPort,
            username: smtpUser,
            password: smtpPass,
        });

        for (const job of jobs) {
            try {
                // Mark as processing
                await supabase.from("email_jobs").update({ status: "processing" }).eq("id", job.id);

                // Resolve template
                const { data: template } = await supabase
                    .from("email_templates")
                    .select("*")
                    .eq("key", job.template_key)
                    .single();

                if (!template || !template.enabled) {
                    await supabase.from("email_jobs").update({ status: "failed", last_error: "Template disabled or missing" }).eq("id", job.id);
                    failed++;
                    continue;
                }

                // Pick subject (A/B rotation)
                const subjects: string[] = template.subject_variants || [];
                const subject = subjects.length > 0
                    ? subjects[Math.floor(Math.random() * subjects.length)]
                    : `Update from Haul Command`;

                // Build HTML (template.html with payload interpolation)
                const html = interpolateTemplate(template.html || template.mjml || "<p>{{body}}</p>", job.payload);

                // Send
                await client.send({
                    from: `${fromName} <${fromEmail}>`,
                    to: job.to_email,
                    subject: interpolateSimple(subject, job.payload),
                    content: "text/html",
                    html,
                });

                // Mark sent
                await supabase.from("email_jobs").update({ status: "sent", attempts: job.attempts + 1 }).eq("id", job.id);

                // Log event
                await supabase.from("email_events").insert({
                    user_id: job.user_id,
                    email: job.to_email,
                    event_type: "sent",
                    template_key: job.template_key,
                    provider,
                    meta: { job_id: job.id },
                });

                sent++;
            } catch (sendErr: any) {
                console.error(`[email-worker] Job ${job.id} failed:`, sendErr.message);

                const newAttempts = job.attempts + 1;

                if (newAttempts >= MAX_ATTEMPTS) {
                    // Hard fail → add to suppression if bounce pattern
                    await supabase.from("email_jobs").update({
                        status: "failed",
                        attempts: newAttempts,
                        last_error: sendErr.message,
                    }).eq("id", job.id);

                    if (sendErr.message.includes("bounce") || sendErr.message.includes("550")) {
                        await supabase.from("email_suppression").upsert({
                            email: job.to_email,
                            reason: "hard_bounce",
                        });
                    }
                } else {
                    // Retry with backoff
                    const backoffMs = (BACKOFF_MINUTES[newAttempts - 1] || 60) * 60 * 1000;
                    const retryAt = new Date(Date.now() + backoffMs);

                    await supabase.from("email_jobs").update({
                        status: "pending",
                        attempts: newAttempts,
                        send_after: retryAt.toISOString(),
                        last_error: sendErr.message,
                    }).eq("id", job.id);
                }

                failed++;
            }
        }

        await client.close();

        return new Response(JSON.stringify({ processed: jobs.length, sent, failed, provider }), { headers });
    } catch (err) {
        console.error("[email-worker] Fatal:", err);
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
    }
});

// ─── Template Interpolation ─────────────────────────────────────

function interpolateTemplate(html: string, payload: Record<string, any>): string {
    let result = html;
    for (const [key, value] of Object.entries(payload)) {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value || ""));
    }
    // Replace unsubscribe/preference placeholders
    const appUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || "https://haulcommand.com";
    result = result.replace(/\{\{unsubscribe_url\}\}/g, `${appUrl}/api/email/unsubscribe?token={{token}}`);
    result = result.replace(/\{\{preferences_url\}\}/g, `${appUrl}/settings/notifications`);
    return result;
}

function interpolateSimple(text: string, payload: Record<string, any>): string {
    let result = text;
    for (const [key, value] of Object.entries(payload)) {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value || ""));
    }
    return result;
}
