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
