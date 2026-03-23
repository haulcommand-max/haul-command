/**
 * lib/integrations/resend.ts
 *
 * Shared Resend email utility.
 * Used by: outreach/operators, outreach/sequence, and any future email senders.
 * Eliminates duplicated sendViaResend functions.
 */

const RESEND_FROM = 'Haul Command <hello@haulcommand.com>';

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  resendKey?: string,
): Promise<boolean> {
  const key = resendKey ?? process.env.RESEND_API_KEY;
  if (!key) {
    console.error('[Resend] No API key configured');
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => 'unknown');
      console.error(`[Resend] Failed: ${res.status} — ${err}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[Resend] Network error:', err);
    return false;
  }
}
