/**
 * HAUL COMMAND — Resend Transactional Email
 * Beautiful emails for dispatch, invoices, compliance alerts, and onboarding.
 */
import { Resend } from 'resend';

export const resend = new Resend(process.env.RESEND_API_KEY || '');

const FROM = 'HAUL COMMAND <dispatch@haulcommand.com>';

export async function sendDispatchConfirmation(to: string, data: {
    operator_name: string;
    load_description: string;
    origin: string;
    destination: string;
    pickup_date: string;
    rate: string;
}) {
    return resend.emails.send({
        from: FROM, to, subject: `🚀 Dispatch Confirmed: ${data.origin} → ${data.destination}`,
        html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0B1120;color:#E5E7EB;padding:32px;border-radius:12px">
            <div style="text-align:center;margin-bottom:24px"><span style="font-size:12px;font-weight:800;letter-spacing:0.2em;color:#F59E0B">HAUL COMMAND</span></div>
            <h2 style="color:#F9FAFB;margin:0 0 16px">Dispatch Confirmed ✅</h2>
            <p>Hey <strong>${data.operator_name}</strong>, your assignment is locked in:</p>
            <div style="background:rgba(255,255,255,0.05);padding:16px;border-radius:8px;margin:16px 0">
                <p style="margin:4px 0"><strong>Load:</strong> ${data.load_description}</p>
                <p style="margin:4px 0"><strong>Route:</strong> ${data.origin} → ${data.destination}</p>
                <p style="margin:4px 0"><strong>Pickup:</strong> ${data.pickup_date}</p>
                <p style="margin:4px 0"><strong>Rate:</strong> ${data.rate}</p>
            </div>
            <a href="https://haulcommand.com/loads" style="display:inline-block;background:#F59E0B;color:#030712;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:8px">View Assignment</a>
            <p style="font-size:12px;color:#6B7280;margin-top:24px">HAUL COMMAND — The Heavy Haul Operating System</p>
        </div>`,
    });
}

export async function sendInsuranceExpiryAlert(to: string, data: {
    operator_name: string;
    days_remaining: number;
    expiry_date: string;
}) {
    const urgency = data.days_remaining <= 3 ? '🚨' : data.days_remaining <= 7 ? '⚠️' : '📋';
    return resend.emails.send({
        from: FROM, to, subject: `${urgency} Insurance expires in ${data.days_remaining} days`,
        html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0B1120;color:#E5E7EB;padding:32px;border-radius:12px">
            <div style="text-align:center;margin-bottom:24px"><span style="font-size:12px;font-weight:800;letter-spacing:0.2em;color:#F59E0B">HAUL COMMAND</span></div>
            <h2 style="color:#F9FAFB;margin:0 0 16px">Insurance Expiry Alert ${urgency}</h2>
            <p>Hey <strong>${data.operator_name}</strong>,</p>
            <p>Your insurance expires on <strong style="color:#EF4444">${data.expiry_date}</strong> (${data.days_remaining} days).</p>
            <p>⚠️ Your Trust Score and ranking will drop if insurance lapses. Upload your renewal now:</p>
            <a href="https://haulcommand.com/settings" style="display:inline-block;background:#F59E0B;color:#030712;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:8px">Update Insurance</a>
        </div>`,
    });
}

export async function sendWelcomeEmail(to: string, name: string) {
    return resend.emails.send({
        from: FROM, to, subject: '🎉 Welcome to HAUL COMMAND',
        html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0B1120;color:#E5E7EB;padding:32px;border-radius:12px">
            <div style="text-align:center;margin-bottom:24px"><span style="font-size:12px;font-weight:800;letter-spacing:0.2em;color:#F59E0B">HAUL COMMAND</span></div>
            <h2 style="color:#F9FAFB;margin:0 0 16px">Welcome to HAUL COMMAND, ${name}! 🎉</h2>
            <p>You just joined the world's largest network of heavy haul escort operators across 57 countries.</p>
            <h3 style="color:#F59E0B;margin:20px 0 8px">Complete your profile to start getting loads:</h3>
            <ul style="padding-left:20px">
                <li>✅ Add your service areas</li>
                <li>✅ Upload insurance & license</li>
                <li>✅ Set your equipment</li>
                <li>✅ Toggle availability</li>
            </ul>
            <a href="https://haulcommand.com/settings" style="display:inline-block;background:#F59E0B;color:#030712;font-weight:700;padding:12px 24px;border-radius:8px;text-decoration:none;margin-top:12px">Complete Profile →</a>
            <p style="font-size:12px;color:#6B7280;margin-top:24px">The Heavy Haul Operating System — 57 Countries. 358K Surfaces. One Platform.</p>
        </div>`,
    });
}

export async function sendPaymentReceipt(to: string, data: {
    name: string;
    amount: string;
    currency: string;
    method: 'stripe' | 'crypto';
    load_reference?: string;
    date: string;
}) {
    return resend.emails.send({
        from: FROM, to, subject: `💰 Payment received: ${data.amount} ${data.currency}`,
        html: `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0B1120;color:#E5E7EB;padding:32px;border-radius:12px">
            <div style="text-align:center;margin-bottom:24px"><span style="font-size:12px;font-weight:800;letter-spacing:0.2em;color:#F59E0B">HAUL COMMAND</span></div>
            <h2 style="color:#10B981;margin:0 0 16px">Payment Received ✅</h2>
            <div style="background:rgba(255,255,255,0.05);padding:16px;border-radius:8px">
                <p style="margin:4px 0"><strong>Amount:</strong> ${data.amount} ${data.currency}</p>
                <p style="margin:4px 0"><strong>Method:</strong> ${data.method === 'crypto' ? '₿ Crypto' : '💳 Card'}</p>
                <p style="margin:4px 0"><strong>Date:</strong> ${data.date}</p>
                ${data.load_reference ? `<p style="margin:4px 0"><strong>Load:</strong> ${data.load_reference}</p>` : ''}
            </div>
        </div>`,
    });
}

// ════════════════════════════════════════════════════════════
// CLAIM OUTREACH SEQUENCE — Web-First Seeded Listing Activation
// 6 emails: ownership → proof → trust → competition → urgency → close
// Rule: NO SMS, NO voice, NO push. Email + web UX only.
// ════════════════════════════════════════════════════════════

const CLAIM_HEADER = `<div style="text-align:center;margin-bottom:24px"><span style="font-size:12px;font-weight:800;letter-spacing:0.2em;color:#F59E0B">HAUL COMMAND</span></div>`;
const CLAIM_FOOTER = `<p style="font-size:12px;color:#6B7280;margin-top:24px;border-top:1px solid rgba(255,255,255,0.1);padding-top:16px">HAUL COMMAND — The Heavy Haul Operating System<br/>57 Countries. 358,000+ Surfaces. One Platform.</p>`;
const CLAIM_CTA = (url: string, text: string) =>
    `<a href="${url}" style="display:inline-block;background:#F59E0B;color:#030712;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none;margin-top:16px;font-size:15px">${text}</a>`;
const EMAIL_WRAP = (inner: string) =>
    `<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#0B1120;color:#E5E7EB;padding:32px;border-radius:12px">${CLAIM_HEADER}${inner}${CLAIM_FOOTER}</div>`;

interface ClaimOutreachData {
    business_name: string;
    city: string;
    state: string;
    country: string;
    category?: string;
    claim_url: string;
    corridors?: string[];
}

/** Email 1: Ownership Notice — "Your business is already listed." */
export async function sendClaimOwnershipNotice(to: string, data: ClaimOutreachData) {
    return resend.emails.send({
        from: FROM, to,
        subject: `📍 ${data.business_name} is now listed on HAUL COMMAND`,
        html: EMAIL_WRAP(`
            <h2 style="color:#F9FAFB;margin:0 0 16px">Your business is now listed on HAUL COMMAND</h2>
            <p>Hey there,</p>
            <p>We've created a directory listing for <strong style="color:#F59E0B">${data.business_name}</strong> in ${data.city}, ${data.state}, ${data.country}.</p>
            <p>Your listing is already live and part of the HAUL COMMAND network — the world's largest heavy haul directory.</p>
            <div style="background:rgba(255,255,255,0.05);padding:16px;border-radius:8px;margin:16px 0">
                <p style="margin:4px 0;color:#F59E0B;font-weight:600">Why claim it?</p>
                <p style="margin:4px 0">✅ Control how your business appears</p>
                <p style="margin:4px 0">✅ Activate your Trust Report Card</p>
                <p style="margin:4px 0">✅ Rank higher in broker searches</p>
                <p style="margin:4px 0">✅ Become eligible for load matching</p>
            </div>
            <p>Claiming takes about 2 minutes.</p>
            ${CLAIM_CTA(data.claim_url, 'Claim Your Listing →')}
            <p style="font-size:13px;color:#9CA3AF;margin-top:16px">Not your business? <a href="${data.claim_url}?action=suggest" style="color:#F59E0B">Suggest an edit</a></p>
        `),
    });
}

/** Email 2: Proof of Presence — "Your listing is live in [city/corridor]." */
export async function sendClaimProofOfPresence(to: string, data: ClaimOutreachData) {
    const corridorLine = data.corridors?.length
        ? `<p style="margin:4px 0">🛣️ <strong>Corridors:</strong> ${data.corridors.join(', ')}</p>`
        : '';
    return resend.emails.send({
        from: FROM, to,
        subject: `🗺️ ${data.business_name} is live in ${data.city} — claim to improve visibility`,
        html: EMAIL_WRAP(`
            <h2 style="color:#F9FAFB;margin:0 0 16px">Your listing is live across the network</h2>
            <p>Your business is now visible in:</p>
            <div style="background:rgba(255,255,255,0.05);padding:16px;border-radius:8px;margin:16px 0">
                <p style="margin:4px 0">📍 <strong>Location:</strong> ${data.city}, ${data.state}</p>
                <p style="margin:4px 0">🏷️ <strong>Category:</strong> ${data.category || 'Escort Services'}</p>
                ${corridorLine}
                <p style="margin:4px 0">🌍 <strong>Network:</strong> HAUL COMMAND Directory</p>
            </div>
            <p>Brokers and carriers search this directory to find operators. <strong>Claimed profiles rank higher</strong> and appear stronger in side-by-side comparisons.</p>
            ${CLAIM_CTA(data.claim_url, 'Claim and Activate Your Profile →')}
        `),
    });
}

/** Email 3: Report Card Activation — "Your Trust Report Card is waiting." */
export async function sendClaimReportCardActivation(to: string, data: ClaimOutreachData) {
    return resend.emails.send({
        from: FROM, to,
        subject: `📊 ${data.business_name} — Your Trust Report Card is not active yet`,
        html: EMAIL_WRAP(`
            <h2 style="color:#F9FAFB;margin:0 0 16px">Your Report Card is waiting to be activated</h2>
            <p>Every operator on HAUL COMMAND has a <strong>Trust Report Card</strong> — and yours is still locked:</p>
            <div style="background:rgba(255,255,255,0.05);padding:16px;border-radius:8px;margin:16px 0">
                <table style="width:100%;border-collapse:collapse">
                    <tr><td style="padding:6px 0;color:#6B7280">Trust Score</td><td style="padding:6px 0;text-align:right;color:#EF4444">🔒 Locked</td></tr>
                    <tr><td style="padding:6px 0;color:#6B7280">Compliance</td><td style="padding:6px 0;text-align:right;color:#EF4444">⚠️ Incomplete</td></tr>
                    <tr><td style="padding:6px 0;color:#6B7280">Reliability</td><td style="padding:6px 0;text-align:right;color:#EF4444">🔒 Locked</td></tr>
                    <tr><td style="padding:6px 0;color:#6B7280">Profile Strength</td><td style="padding:6px 0;text-align:right;color:#EF4444">Low</td></tr>
                    <tr><td style="padding:6px 0;color:#6B7280">Dispatch Readiness</td><td style="padding:6px 0;text-align:right;color:#EF4444">Not Eligible</td></tr>
                </table>
            </div>
            <p>Brokers trust operators with <strong>completed, verified profiles</strong>. Claim and complete your listing to activate your score and start ranking.</p>
            ${CLAIM_CTA(data.claim_url, 'Activate Your Report Card →')}
        `),
    });
}

/** Email 4: Competitor Pressure — "Operators in your area are building stronger profiles." */
export async function sendClaimCompetitorPressure(to: string, data: ClaimOutreachData) {
    return resend.emails.send({
        from: FROM, to,
        subject: `⚡ Operators near ${data.city} are building stronger profiles`,
        html: EMAIL_WRAP(`
            <h2 style="color:#F9FAFB;margin:0 0 16px">Don't let competitors outrank you</h2>
            <p>Operators in <strong>${data.city}, ${data.state}</strong> are:</p>
            <div style="background:rgba(255,255,255,0.05);padding:16px;border-radius:8px;margin:16px 0">
                <p style="margin:6px 0">📈 Completing profiles to rank higher</p>
                <p style="margin:6px 0">✅ Uploading insurance and credentials</p>
                <p style="margin:6px 0">🏆 Activating Trust Report Cards</p>
                <p style="margin:6px 0">🎯 Becoming eligible for dispatch matching</p>
            </div>
            <p><strong>Unclaimed listings stay weaker.</strong> They have no verified badges, no trust score, and no competitive advantage.</p>
            <p>Claim your listing now to control your ranking and stay competitive in your territory.</p>
            ${CLAIM_CTA(data.claim_url, 'Claim Before Competitors Pull Ahead →')}
        `),
    });
}

/** Email 5: Missed Opportunity — "Your territory presence is unmanaged." */
export async function sendClaimMissedOpportunity(to: string, data: ClaimOutreachData) {
    return resend.emails.send({
        from: FROM, to,
        subject: `🔓 ${data.business_name} — unclaimed listing = missed opportunities`,
        html: EMAIL_WRAP(`
            <h2 style="color:#F9FAFB;margin:0 0 16px">Your listing is still unclaimed</h2>
            <p><strong>${data.business_name}</strong> is listed in the HAUL COMMAND directory, but your profile is still unclaimed.</p>
            <p>That means:</p>
            <div style="background:rgba(255,255,255,0.05);padding:16px;border-radius:8px;margin:16px 0">
                <p style="margin:6px 0;color:#EF4444">❌ No control over how your business appears</p>
                <p style="margin:6px 0;color:#EF4444">❌ No Trust Report Card</p>
                <p style="margin:6px 0;color:#EF4444">❌ No verified badges</p>
                <p style="margin:6px 0;color:#EF4444">❌ Not eligible for load matching</p>
                <p style="margin:6px 0;color:#EF4444">❌ Invisible to premium broker searches</p>
            </div>
            <p>Claimed operators unlock <strong>visibility, trust, and future matching tools</strong>. Don't leave your territory presence unmanaged.</p>
            ${CLAIM_CTA(data.claim_url, 'Claim Your Listing Now →')}
        `),
    });
}

/** Email 6: Final Reminder — "Last reminder. 2 minutes to claim." */
export async function sendClaimFinalReminder(to: string, data: ClaimOutreachData) {
    return resend.emails.send({
        from: FROM, to,
        subject: `⏰ Final reminder: ${data.business_name} is still unclaimed`,
        html: EMAIL_WRAP(`
            <h2 style="color:#F9FAFB;margin:0 0 16px">Final reminder</h2>
            <p>This is our last email about your unclaimed listing.</p>
            <p><strong>${data.business_name}</strong> in ${data.city}, ${data.state} remains limited until you claim it.</p>
            <div style="background:rgba(16,185,129,0.1);padding:16px;border-radius:8px;margin:16px 0;border:1px solid rgba(16,185,129,0.3)">
                <p style="margin:0;color:#10B981;font-weight:600">Claiming takes about 2 minutes and unlocks:</p>
                <p style="margin:8px 0 0">Profile control • Trust score • Verified badges • Search ranking • Dispatch eligibility</p>
            </div>
            ${CLAIM_CTA(data.claim_url, 'Complete Your Claim →')}
            <p style="font-size:13px;color:#6B7280;margin-top:16px">After this, we won't email again about this listing. You can always claim at any time by visiting your profile page.</p>
        `),
    });
}
