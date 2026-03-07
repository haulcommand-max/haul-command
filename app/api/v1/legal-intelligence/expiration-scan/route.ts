// app/api/v1/legal-intelligence/expiration-scan/route.ts
//
// POST /api/v1/legal-intelligence/expiration-scan
// Cron job: scan for expiring certifications and generate notifications.

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

export const runtime = "nodejs";

const WARNING_WINDOWS_DAYS = [90, 60, 30, 14, 7];

export async function POST() {
    const supabase = getSupabaseAdmin();
    const now = new Date();
    const alerts: any[] = [];

    for (const windowDays of WARNING_WINDOWS_DAYS) {
        const threshold = new Date(now.getTime() + windowDays * 86400 * 1000);
        const windowStart = new Date(threshold.getTime() - 86400 * 1000); // 1 day window

        // Find certs expiring within this window that haven't been alerted yet
        const { data: expiringCerts, error } = await supabase
            .from("operator_certifications")
            .select("id,operator_id,cert_type,issuing_authority,expires_at")
            .eq("verification_status", "verified")
            .gte("expires_at", windowStart.toISOString())
            .lte("expires_at", threshold.toISOString());

        if (error) continue;

        for (const cert of (expiringCerts ?? []) as any[]) {
            const daysLeft = Math.ceil(
                (new Date(cert.expires_at).getTime() - now.getTime()) / (86400 * 1000)
            );

            const riskLevel = daysLeft <= 7 ? "critical" : daysLeft <= 30 ? "warning" : "notice";

            // Create notification for operator
            await supabase.from("notifications").insert({
                user_id: cert.operator_id,
                type: "cert_expiration_warning",
                title: `⚠️ ${cert.cert_type.toUpperCase()} certification expires in ${daysLeft} days`,
                body: `Your ${cert.cert_type} from ${cert.issuing_authority ?? "issuing authority"} expires on ${cert.expires_at.slice(0, 10)}. Renew now to maintain your operating status.`,
                data: {
                    type: "cert_expiration",
                    cert_id: cert.id,
                    cert_type: cert.cert_type,
                    days_remaining: daysLeft,
                    risk_level: riskLevel,
                },
                read: false,
                created_at: now.toISOString(),
            });

            alerts.push({
                operator_id: cert.operator_id,
                cert_type: cert.cert_type,
                days_remaining: daysLeft,
                risk_level: riskLevel,
            });
        }
    }

    // Auto-expire certs that have passed their expiration date
    const { data: expiredCount } = await supabase
        .from("operator_certifications")
        .update({ verification_status: "expired", updated_at: now.toISOString() })
        .eq("verification_status", "verified")
        .lt("expires_at", now.toISOString())
        .select("id");

    return NextResponse.json({
        ok: true,
        alerts_generated: alerts.length,
        certs_auto_expired: (expiredCount ?? []).length,
        alerts,
    });
}
