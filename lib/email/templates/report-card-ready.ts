/**
 * Report Card Ready Email Template
 * 
 * Sent when a new driver/corridor report card is generated.
 * Goal: engagement + authority positioning.
 */

export interface ReportCardReadyData {
    userName: string;
    reportType: 'driver' | 'corridor' | 'broker';
    entityName: string; // e.g. "I-95 Southeast" or "APEX ESCORT"
    highlights: { label: string; value: string; trend?: 'up' | 'down' | 'flat' }[];
    reportUrl: string;
}

export function reportCardReadyEmail(data: ReportCardReadyData) {
    const { userName, reportType, entityName, highlights, reportUrl } = data;

    const trendIcon = (t?: string) => t === 'up' ? '📈' : t === 'down' ? '📉' : '➡️';
    const trendColor = (t?: string) => t === 'up' ? '#4ade80' : t === 'down' ? '#ef4444' : '#9ca3af';

    const highlightRows = highlights
        .map(h => `
        <tr>
            <td style="padding:8px 12px;color:#9ca3af;font-size:13px;border-bottom:1px solid #1a1c14;">${h.label}</td>
            <td style="padding:8px 12px;color:${trendColor(h.trend)};font-size:14px;font-weight:700;text-align:right;border-bottom:1px solid #1a1c14;">
                ${trendIcon(h.trend)} ${h.value}
            </td>
        </tr>`)
        .join('');

    const typeLabel = reportType === 'driver' ? 'Operator' : reportType === 'corridor' ? 'Corridor' : 'Broker';

    return {
        subject: `📊 Your ${typeLabel} Report Card is ready — ${entityName}`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0b07;font-family:'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0b07;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#111210;border:1px solid #1a1c14;border-radius:12px;">

<tr><td style="padding:30px 40px 15px;text-align:center;">
    <div style="font-size:20px;font-weight:800;color:#C6923A;">HAUL COMMAND</div>
</td></tr>

<tr><td style="padding:0 40px;"><div style="height:1px;background:linear-gradient(90deg,transparent,#C6923A,transparent);"></div></td></tr>

<tr><td style="padding:30px 40px;">
    <h1 style="color:#fff;font-size:20px;margin:0 0 8px;">${typeLabel} Report Card</h1>
    <p style="color:#C6923A;font-size:16px;font-weight:700;margin:0 0 20px;">${entityName}</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0b07;border-radius:8px;overflow:hidden;">
        ${highlightRows}
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:24px 0 8px;">
        <a href="${reportUrl}" style="display:inline-block;background:#C6923A;color:#0a0b07;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;">
            View Full Report →
        </a>
    </td></tr>
    </table>
</td></tr>

<tr><td style="padding:20px 40px 30px;">
    <div style="height:1px;background:#1a1c14;margin-bottom:20px;"></div>
    <p style="color:#4b5563;font-size:11px;line-height:1.6;margin:0;text-align:center;">
        Haul Command Intelligence<br>
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
