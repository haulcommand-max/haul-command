/**
 * Panic Fill Alert Email Template
 * 
 * Sent INSTANTLY when a load enters panic-fill escalation.
 * Goal: urgency + conversion.
 */

export interface PanicFillAlertData {
    userName: string;
    loadTitle: string;
    corridor: string;
    rate: string;
    urgencyLevel: 'high' | 'critical';
    expiresIn: string; // e.g. "2 hours"
    loadUrl: string;
}

export function panicFillAlertEmail(data: PanicFillAlertData) {
    const { userName, loadTitle, corridor, rate, urgencyLevel, expiresIn, loadUrl } = data;

    const urgencyColor = urgencyLevel === 'critical' ? '#ef4444' : '#f59e0b';
    const urgencyLabel = urgencyLevel === 'critical' ? '🚨 CRITICAL' : '⚡ HIGH PRIORITY';

    return {
        subject: `${urgencyLabel} — ${corridor} load needs escort NOW ($${rate})`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0b07;font-family:'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0b07;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#111210;border:1px solid ${urgencyColor};border-radius:12px;">

<tr><td style="padding:30px 40px 15px;text-align:center;">
    <div style="font-size:20px;font-weight:800;color:#C6923A;">HAUL COMMAND</div>
</td></tr>

<!-- Urgency Bar -->
<tr><td style="padding:0 40px;">
    <div style="background:${urgencyColor};color:#fff;font-weight:800;font-size:13px;text-align:center;padding:10px;border-radius:6px;letter-spacing:1px;">
        ${urgencyLabel} — RESPONDING NOW
    </div>
</td></tr>

<tr><td style="padding:24px 40px;">
    <h1 style="color:#fff;font-size:20px;margin:0 0 16px;">${loadTitle}</h1>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0b07;border-radius:8px;overflow:hidden;">
        <tr>
            <td style="padding:10px 14px;color:#6b7280;font-size:13px;border-bottom:1px solid #1a1c14;">Corridor</td>
            <td style="padding:10px 14px;color:#fff;font-size:14px;font-weight:700;text-align:right;border-bottom:1px solid #1a1c14;">${corridor}</td>
        </tr>
        <tr>
            <td style="padding:10px 14px;color:#6b7280;font-size:13px;border-bottom:1px solid #1a1c14;">Rate</td>
            <td style="padding:10px 14px;color:#4ade80;font-size:16px;font-weight:800;text-align:right;border-bottom:1px solid #1a1c14;">$${rate}</td>
        </tr>
        <tr>
            <td style="padding:10px 14px;color:#6b7280;font-size:13px;">Expires In</td>
            <td style="padding:10px 14px;color:${urgencyColor};font-size:14px;font-weight:700;text-align:right;">${expiresIn}</td>
        </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:24px 0 8px;">
        <a href="${loadUrl}" style="display:inline-block;background:${urgencyColor};color:#fff;font-weight:800;font-size:16px;padding:16px 40px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">
            ACCEPT THIS LOAD →
        </a>
    </td></tr>
    </table>

    <p style="color:#6b7280;font-size:12px;text-align:center;margin:12px 0 0;">
        Responding fast improves your Trust Score and leaderboard position.
    </p>
</td></tr>

<tr><td style="padding:16px 40px 24px;">
    <div style="height:1px;background:#1a1c14;margin-bottom:16px;"></div>
    <p style="color:#4b5563;font-size:11px;line-height:1.6;margin:0;text-align:center;">
        Haul Command Dispatch<br>
        <a href="{{unsubscribe_url}}" style="color:#4b5563;text-decoration:underline;">Unsubscribe</a> • 
        <a href="{{preferences_url}}" style="color:#4b5563;text-decoration:underline;">Preferences</a>
    </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>
        `.trim(),
    };
}
