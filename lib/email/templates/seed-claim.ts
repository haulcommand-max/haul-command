/**
 * Seed Claim Email Templates — DR Copy (Cole Gordon / Alex Becker style)
 * 3-step proof-safe sequence for unclaimed seeded profiles
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
/*  STEP 1: "Review your listing"                       */
/* ──────────────────────────────────────────────────── */
export function seedClaimStep1(data: SeedClaimData) {
    return {
        subject: `${data.display_name} - review your Haul Command listing in ${data.location}`,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #000000; color: #c0c0c0;">
    <div style="text-align: center; margin-bottom: 32px;">
        <span style="background: #F1A91B; color: #000; font-size: 11px; font-weight: 800; padding: 4px 12px; border-radius: 20px; letter-spacing: 0.1em; text-transform: uppercase;">REVIEW NEEDED</span>
    </div>

    <h1 style="color: #ffffff; font-size: 28px; font-weight: 900; margin: 0 0 16px; text-align: center; line-height: 1.2;">
        Your ${data.location} listing is ready to review.
    </h1>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 12px;">
        ${data.display_name},
    </p>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 12px;">
        Haul Command created a directory record from available source data. It may need your corrections before brokers can rely on it.
    </p>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 24px;">
        Claiming lets you add a public contact path, service areas, equipment notes, and proof details.<br>
        <strong style="color: #fff;">Unclaimed records can be incomplete, stale, or missing the safest way to request support.</strong>
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
        Add availability pings and request alerts — <a href="${data.app_download_url}" style="color: #F1A91B; text-decoration: underline;">Install the app</a>
    </p>
</div>`,
        text: `${data.display_name} - your Haul Command listing is ready to review in ${data.location}.\n\nClaiming lets you correct the record, add a public contact path, and add proof details before brokers rely on it.\n\nClaim now: ${data.claim_url}\n\nTakes 30 seconds. No credit card.`,
    };
}

/* ──────────────────────────────────────────────────── */
/*  STEP 2: "Brokers check these fields"                */
/* ──────────────────────────────────────────────────── */
export function seedClaimStep2(data: SeedClaimData) {
    return {
        subject: `Brokers check these fields in ${data.location}`,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #000000; color: #c0c0c0;">
    <h1 style="color: #ffffff; font-size: 26px; font-weight: 900; margin: 0 0 16px; line-height: 1.2;">
        Brokers check profile proof before they request support.
    </h1>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 12px;">
        ${data.display_name},
    </p>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 12px;">
        Brokers comparing escort operators need clean service areas, contact paths, and proof notes.
    </p>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 12px;">
        Your profile may be visible — but <strong style="color: #fff;">unclaimed profiles can be incomplete or missing current contact context.</strong>
    </p>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 24px;">
        Claiming starts with corrections and proof context.<br>
        <strong style="color: #F1A91B;">It makes the record more useful and easier to evaluate.</strong>
    </p>

    <div style="text-align: center; margin: 32px 0;">
        <a href="${data.claim_url}" style="display: inline-block; background: #F1A91B; color: #000; font-weight: 800; font-size: 14px; padding: 14px 32px; border-radius: 12px; text-decoration: none; letter-spacing: 0.05em;">
            CLAIM AND CORRECT PROFILE →
        </a>
    </div>

    <div style="background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 12px; padding: 16px; margin: 24px 0; text-align: center;">
        <p style="font-size: 11px; color: #555; text-transform: uppercase; letter-spacing: 0.15em; margin: 0 0 8px;">What claiming unlocks</p>
        <p style="font-size: 13px; color: #ccc; margin: 0;">Contact path &nbsp; Services &nbsp; Service areas &nbsp; Proof notes</p>
    </div>

    <hr style="border: none; border-top: 1px solid #1a1a1a; margin: 32px 0;">

    <p style="font-size: 12px; color: #444; text-align: center;">
        Add availability pings and request alerts — <a href="${data.app_download_url}" style="color: #F1A91B; text-decoration: underline;">Install the app</a>
    </p>
</div>`,
        text: `${data.display_name}, brokers check service areas, proof notes, and contact paths before requesting support in ${data.location}.\n\nClaim now to correct your record: ${data.claim_url}`,
    };
}

/* ──────────────────────────────────────────────────── */
/*  STEP 3: "Last reminder"                             */
/* ──────────────────────────────────────────────────── */
export function seedClaimStep3(data: SeedClaimData) {
    return {
        subject: `Last reminder: review your ${data.location} Haul Command listing`,
        html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #000000; color: #c0c0c0;">
    <h1 style="color: #ffffff; font-size: 26px; font-weight: 900; margin: 0 0 16px; line-height: 1.2;">
        Your ${data.location} listing still needs review.
    </h1>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 12px;">
        ${data.display_name},
    </p>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 12px;">
        If the record is outdated, brokers may see incomplete services, stale contact paths, or missing proof context.
    </p>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 12px;">
        <strong style="color: #fff;">This is your last notification.</strong>
    </p>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 24px;">
        After this, the listing can remain in the directory, but unclaimed.<br>
        You can still claim later to correct details and add a safer request path.
    </p>

    <div style="text-align: center; margin: 32px 0;">
        <a href="${data.claim_url}" style="display: inline-block; background: #F1A91B; color: #000; font-weight: 800; font-size: 14px; padding: 14px 32px; border-radius: 12px; text-decoration: none; letter-spacing: 0.05em;">
            REVIEW MY PROFILE →
        </a>
    </div>

    <p style="font-size: 13px; color: #555; margin: 24px 0 0; text-align: center;">
        PS - a complete profile is easier to evaluate than a scraped or stale record.<br>
        <strong style="color: #888;">Claiming starts with corrections, not hype.</strong>
    </p>

    <hr style="border: none; border-top: 1px solid #1a1a1a; margin: 32px 0;">

    <p style="font-size: 12px; color: #444; text-align: center;">
        Add availability pings and request alerts — <a href="${data.app_download_url}" style="color: #F1A91B; text-decoration: underline;">Install the app</a>
    </p>
</div>`,
        text: `Last reminder, ${data.display_name}.\n\nYour ${data.location} listing may need service-area, proof, or contact corrections.\n\nReview it here: ${data.claim_url}`,
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
        You're in. Now make the profile useful.
    </h1>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 12px;">
        ${data.display_name},
    </p>

    <p style="font-size: 15px; line-height: 1.6; color: #999; margin: 0 0 24px;">
        Your profile is now claimed. Here is what you can control:
    </p>

    <div style="background: #0a0a0a; border: 1px solid #1a1a1a; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
        <p style="color: #ccc; font-size: 14px; margin: 0 0 8px;">Brokers can see your public contact path</p>
        <p style="color: #ccc; font-size: 14px; margin: 0 0 8px;">Availability pings and request alerts for ${data.location}</p>
        <p style="color: #ccc; font-size: 14px; margin: 0 0 8px;">✅ Trust score tracking starts now</p>
        <p style="color: #ccc; font-size: 14px; margin: 0;">Service-area and proof corrections you control</p>
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
        <p style="font-size: 13px; color: #888; margin: 0 0 16px;">Connect with operators. Lane intel. Rate discussions. Field notes.</p>
        <a href="${data.facebook_group_url}" style="display: inline-block; background: #3b82f6; color: #fff; font-weight: 700; font-size: 13px; padding: 10px 24px; border-radius: 8px; text-decoration: none;">
            JOIN THE GROUP →
        </a>
    </div>

    <hr style="border: none; border-top: 1px solid #1a1a1a; margin: 32px 0;">

    <p style="font-size: 12px; color: #444; text-align: center;">
        📱 Get instant push alerts — <a href="${data.app_download_url}" style="color: #F1A91B; text-decoration: underline;">Install the app</a>
    </p>
</div>`,
        text: `Welcome, ${data.display_name}! Your profile is claimed.\n\nYour public contact path and request-alert settings can now be managed for ${data.location}.\n\nDashboard: ${data.dashboard_url}\n\nJoin the operators group: ${data.facebook_group_url}\n\nInstall the app: ${data.app_download_url}`,
    };
}
