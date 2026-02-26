/**
 * Welcome / Claim Profile Email
 * 
 * Cole Gordon DR style: pattern-break opener, 1-line value, single CTA, PS credibility hook.
 * Target: unclaimed directory listings → profile claim.
 */

export interface WelcomeClaimData {
    claimUrl: string;
    listingName?: string;
    viewCount?: number;
}

export function welcomeClaimEmail(data: WelcomeClaimData) {
    const { claimUrl, listingName, viewCount } = data;
    const name = listingName || 'your operation';

    return {
        subject: "quick one — is this you?",
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
    <p style="color:#fff;font-size:17px;line-height:1.7;margin:0 0 16px;">
        We found <strong>${name}</strong> in our directory.
    </p>
    <p style="color:#9ca3af;font-size:15px;line-height:1.7;margin:0 0 16px;">
        ${viewCount ? `${viewCount} people have already looked you up.` : 'Brokers and carriers are already searching.'}
        <br>But nobody's driving the page yet.
    </p>
    <p style="color:#fff;font-size:15px;line-height:1.7;margin:0 0 24px;">
        <strong>Claim it → get a trust score → show up first when loads match your lane.</strong>
    </p>
    <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin:0 0 4px;">Takes about 60 seconds. No credit card.</p>
</td></tr>

<tr><td align="center" style="padding:24px 36px;">
    <a href="${claimUrl}" style="display:inline-block;background:#C6923A;color:#0a0b07;font-weight:800;font-size:16px;padding:16px 40px;border-radius:12px;text-decoration:none;letter-spacing:0.3px;">
        Claim My Profile →
    </a>
</td></tr>

<tr><td style="padding:0 36px 32px;">
    <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0;">
        <strong style="color:#9ca3af;">PS.</strong> This is the same platform top operators use to get matched with high-rate loads before they hit the boards. Your profile is already live — you just need to take the wheel.
    </p>
</td></tr>

<tr><td style="padding:0 36px 24px;">
    <div style="height:1px;background:#1a1c14;margin-bottom:16px;"></div>
    <p style="color:#4b5563;font-size:11px;text-align:center;margin:0;">
        Haul Command • <a href="{{unsubscribe_url}}" style="color:#4b5563;text-decoration:underline;">Unsubscribe</a> • <a href="{{preferences_url}}" style="color:#4b5563;text-decoration:underline;">Preferences</a>
    </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`.trim(),
    };
}
