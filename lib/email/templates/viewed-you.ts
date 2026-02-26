/**
 * "You Were Viewed" Email
 * 
 * Dopamine hit + simple CTA. Batched (not instant). Quiet hours respected.
 * DR copy: short, punchy, pattern-break, high status.
 */

export interface ViewedYouData {
    viewCount: number;
    profileUrl: string;
    timeWindow?: string;
}

export function viewedYouEmail(data: ViewedYouData) {
    const { viewCount, profileUrl, timeWindow } = data;
    const window = timeWindow || 'today';

    return {
        subject: viewCount > 5 ? `${viewCount} people looked you up ${window}` : `someone checked your profile`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0b07;font-family:'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0b07;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#111210;border:1px solid #1a1c14;border-radius:12px;">

<tr><td style="padding:36px 36px 0;">
    <p style="color:#C6923A;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 20px;">HAUL COMMAND</p>
</td></tr>

<tr><td style="padding:0 36px;">
    <div style="text-align:center;padding:20px 0;">
        <div style="font-size:64px;font-weight:900;color:#4ade80;line-height:1;">${viewCount}</div>
        <div style="font-size:14px;color:#6b7280;margin-top:6px;">profile views ${window}</div>
    </div>

    <p style="color:#9ca3af;font-size:15px;line-height:1.7;margin:0 0 16px;">
        People are looking you up.
        <br>That means someone's vetting you for a job right now.
    </p>
    <p style="color:#fff;font-size:14px;line-height:1.6;margin:0 0 8px;">
        <strong>Operators with updated profiles get 3x more matches.</strong>
    </p>
    <p style="color:#6b7280;font-size:13px;margin:0 0 24px;">
        Recent photos. Current equipment. Correct service area. That's it.
    </p>
</td></tr>

<tr><td align="center" style="padding:0 36px 28px;">
    <a href="${profileUrl}" style="display:inline-block;background:#C6923A;color:#0a0b07;font-weight:800;font-size:15px;padding:14px 36px;border-radius:12px;text-decoration:none;">
        See Who's Looking →
    </a>
</td></tr>

<tr><td style="padding:0 36px 24px;">
    <div style="height:1px;background:#1a1c14;margin-bottom:16px;"></div>
    <p style="color:#4b5563;font-size:11px;text-align:center;margin:0;">
        <a href="{{unsubscribe_url}}" style="color:#4b5563;text-decoration:underline;">Unsubscribe</a> • <a href="{{preferences_url}}" style="color:#4b5563;text-decoration:underline;">Preferences</a>
    </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`.trim(),
    };
}
