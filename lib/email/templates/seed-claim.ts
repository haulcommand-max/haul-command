/**
 * Seed Claim Email Templates — DR Copy (Cole Gordon / Alex Becker style)
 * 3-step escalating sequence for unclaimed seeded profiles
 */

export interface SeedClaimData {
    display_name: string;
    city: string;
    state: string;
    location: string;
    claim_url: string;
    app_download_url: string;
    step: number;
}

/* ──────────────────────────────────────────────────── */
/*  STEP 1: "Your listing is live"                      */
/* ──────────────────────────────────────────────────── */
export function seedClaimStep1(data: SeedClaimData) {
    return {
        subject: `${data.display_name} — Your listing is live in ${data.location}`,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #000000; color: #c0c0c0;">
    <div style="text-align: center; margin-bottom: 32px;">
        <span style="background: #F1A91B; color: #000; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.1em; text-transform: uppercase;">LIVE NOW</span>
    </div>

    <h1 style="color: #ffffff; font-size: 28px; font-weight: 900; margin: 0 0 16px; text-align: center; line-height: 1.2;">
        Brokers in ${data.location} can now find you.
    </h1>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 12px;">
        ${data.display_name},
    </p>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 12px;">
        Your escort profile just went live on Haul Command — the fastest-growing pilot car marketplace in North America.
    </p>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 24px;">
        Right now, brokers posting oversize loads in ${data.location} are searching for escorts.<br>
        <strong style="color: #fff;">They can see your listing. But they can't contact you until you claim it.</strong>
    </p>

    <div style="text-align: center; margin: 32px 0;">
        <a href="${data.claim_url}" style="display: inline-block; background: #F1A91B; color: #000; font-weight: 800; font-size: 14px; padding: 14px 32px; border-radius: 12px; text-decoration: none; letter-spacing: 0.05em;">
            CLAIM YOUR PROFILE →
        </a>
    </div>

    <p style="font-size: 13px; color: #555; margin: 24px 0 0; text-align: center;">
        Takes 30 seconds. No credit card. No commitment.
    </p>

    <hr style="border: none; border-top: 1px solid #1a1a1a; margin: 32px 0;">

    <p style="font-size: 12px; color: #444; text-align: center;">
        📱 Get instant load alerts — <a href="${data.app_download_url}" style="color: #F1A91B; text-decoration: underline;">Install the app</a>
    </p>
</div>`,
        text: `${data.display_name} — Your listing is live in ${data.location}.\n\nBrokers posting oversize loads can see you, but can't contact you until you claim your profile.\n\nClaim now: ${data.claim_url}\n\nTakes 30 seconds. No credit card.`,
    };
}

/* ──────────────────────────────────────────────────── */
/*  STEP 2: "Brokers searched your area"                */
/* ──────────────────────────────────────────────────── */
export function seedClaimStep2(data: SeedClaimData) {
    return {
        subject: `Brokers searched ${data.location} — they can't find you yet`,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #000000; color: #c0c0c0;">
    <h1 style="color: #ffffff; font-size: 26px; font-weight: 900; margin: 0 0 16px; line-height: 1.2;">
        3 broker searches in ${data.location} this week.
    </h1>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 12px;">
        ${data.display_name},
    </p>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 12px;">
        Brokers are actively looking for escort operators in your area.
    </p>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 12px;">
        Your profile is visible — but <strong style="color: #fff;">unclaimed profiles don't show contact info.</strong>
    </p>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 24px;">
        The operators who claimed their profiles are getting the calls.<br>
        <strong style="color: #F1A91B;">You're not. Yet.</strong>
    </p>

    <div style="text-align: center; margin: 32px 0;">
        <a href="${data.claim_url}" style="display: inline-block; background: #F1A91B; color: #000; font-weight: 800; font-size: 14px; padding: 14px 32px; border-radius: 12px; text-decoration: none; letter-spacing: 0.05em;">
            CLAIM & START GETTING CALLS →
        </a>
    </div>

    <div style="background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center;">
        <p style="font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 8px;">What claiming unlocks</p>
        <p style="font-size: 13px; color: #ccc; margin: 0;">✅ Contact info visible &nbsp; ✅ Load alerts &nbsp; ✅ Trust score &nbsp; ✅ Priority ranking</p>
    </div>

    <hr style="border: none; border-top: 1px solid #1a1a1a; margin: 32px 0;">

    <p style="font-size: 12px; color: #444; text-align: center;">
        📱 Get alerts before the competition — <a href="${data.app_download_url}" style="color: #F1A91B; text-decoration: underline;">Install the app</a>
    </p>
</div>`,
        text: `3 broker searches in ${data.location} this week.\n\n${data.display_name}, your profile is visible but unclaimed. Brokers can't contact you.\n\nClaim now to start getting calls: ${data.claim_url}`,
    };
}

/* ──────────────────────────────────────────────────── */
/*  STEP 3: "Last call — claim or lose territory"       */
/* ──────────────────────────────────────────────────── */
export function seedClaimStep3(data: SeedClaimData) {
    return {
        subject: `Last call: Claim your territory in ${data.location}`,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #000000; color: #c0c0c0;">
    <h1 style="color: #ffffff; font-size: 26px; font-weight: 900; margin: 0 0 16px; line-height: 1.2;">
        Your competitors claimed ${data.location}.
    </h1>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 12px;">
        ${data.display_name},
    </p>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 12px;">
        Other escort operators in ${data.location} have already claimed their profiles and are receiving broker inquiries.
    </p>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 12px;">
        <strong style="color: #fff;">This is your last notification.</strong>
    </p>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 24px;">
        After this, your listing stays in the directory — but unclaimed.<br>
        No alerts. No priority. No broker visibility.
    </p>

    <div style="text-align: center; margin: 32px 0;">
        <a href="${data.claim_url}" style="display: inline-block; background: #F1A91B; color: #000; font-weight: 800; font-size: 14px; padding: 14px 32px; border-radius: 12px; text-decoration: none; letter-spacing: 0.05em;">
            CLAIM MY TERRITORY NOW →
        </a>
    </div>

    <p style="font-size: 13px; color: #555; margin: 24px 0 0; text-align: center;">
        PS — Claimed operators in ${data.state || "your state"} are averaging 4 broker inquiries/week.<br>
        <strong style="color: #888;">You're getting zero.</strong>
    </p>

    <hr style="border: none; border-top: 1px solid #1a1a1a; margin: 32px 0;">

    <p style="font-size: 12px; color: #444; text-align: center;">
        📱 Don't miss another load — <a href="${data.app_download_url}" style="color: #F1A91B; text-decoration: underline;">Install the app</a>
    </p>
</div>`,
        text: `Last call, ${data.display_name}.\n\nOther operators in ${data.location} claimed their profiles and are getting broker calls. This is your last notification.\n\nClaim now: ${data.claim_url}`,
    };
}

/* ──────────────────────────────────────────────────── */
/*  CLAIM WELCOME + FACEBOOK GROUP INVITE               */
/* ──────────────────────────────────────────────────── */
export interface ClaimWelcomeData {
    display_name: string;
    location: string;
    facebook_group_url: string;
    app_download_url: string;
    dashboard_url: string;
}

export function claimWelcomeGroupInvite(data: ClaimWelcomeData) {
    return {
        subject: `Welcome to Haul Command, ${data.display_name} 🎯`,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #000000; color: #c0c0c0;">
    <div style="text-align: center; margin-bottom: 32px;">
        <span style="background: #10b981; color: #000; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.1em; text-transform: uppercase;">PROFILE CLAIMED ✓</span>
    </div>

    <h1 style="color: #ffffff; font-size: 28px; font-weight: 900; margin: 0 0 16px; text-align: center; line-height: 1.2;">
        You're in. Let's get you loads.
    </h1>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 12px;">
        ${data.display_name},
    </p>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 24px;">
        Your profile is now claimed and visible to brokers. Here's what that unlocks:
    </p>

    <div style="background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
        <p style="color: #ccc; font-size: 14px; margin: 0 0 8px;">✅ Brokers can see your contact info</p>
        <p style="color: #ccc; font-size: 14px; margin: 0 0 8px;">✅ Load alerts for ${data.location}</p>
        <p style="color: #ccc; font-size: 14px; margin: 0 0 8px;">✅ Trust score tracking starts now</p>
        <p style="color: #ccc; font-size: 14px; margin: 0;">✅ Priority ranking in search results</p>
    </div>

    <div style="text-align: center; margin: 32px 0;">
        <a href="${data.dashboard_url}" style="display: inline-block; background: #F1A91B; color: #000; font-weight: 800; font-size: 14px; padding: 14px 32px; border-radius: 12px; text-decoration: none; letter-spacing: 0.05em;">
            GO TO YOUR DASHBOARD →
        </a>
    </div>

    <hr style="border: none; border-top: 1px solid #1a1a1a; margin: 32px 0;">

    <div style="background: #0a0a0a; border: 1px solid #3b82f6; border-radius: 12px; padding: 20px; text-align: center;">
        <p style="font-size: 11px; color: #3b82f6; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 8px; font-weight: 700;">EXCLUSIVE INVITE</p>
        <h3 style="color: #fff; font-size: 18px; margin: 0 0 8px;">Join the Haul Command Operators Group</h3>
        <p style="font-size: 13px; color: #888; margin: 0 0 16px;">Connect with other verified operators. Lane intel. Rate discussions. Job leads.</p>
        <a href="${data.facebook_group_url}" style="display: inline-block; background: #3b82f6; color: #fff; font-weight: 700; font-size: 13px; padding: 10px 24px; border-radius: 8px; text-decoration: none;">
            JOIN THE GROUP →
        </a>
    </div>

    <hr style="border: none; border-top: 1px solid #1a1a1a; margin: 32px 0;">

    <p style="font-size: 12px; color: #444; text-align: center;">
        📱 Get instant push alerts — <a href="${data.app_download_url}" style="color: #F1A91B; text-decoration: underline;">Install the app</a>
    </p>
</div>`,
        text: `Welcome, ${data.display_name}! Your profile is claimed.\n\nBrokers can now see you. Load alerts active for ${data.location}.\n\nDashboard: ${data.dashboard_url}\n\nJoin the operators group: ${data.facebook_group_url}\n\nInstall the app: ${data.app_download_url}`,
    };
}
