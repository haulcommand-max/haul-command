/**
 * lib/email/bulk.ts — Resend-native bulk email sender
 * 
 * Replaces Listmonk dependency entirely. Uses RESEND_API_KEY (already configured).
 * Sends in batches of 100 (Resend batch limit).
 * 
 * Usage:
 *   import { sendBulkEmail, sendSequenceEmail } from '@/lib/email/bulk';
 *   await sendBulkEmail(recipients, { subject, html, from });
 */

const RESEND_KEY = process.env.RESEND_API_KEY ?? '';
const BATCH_SIZE = 100;
const FROM_DEFAULT = 'Haul Command <noreply@haulcommand.com>';

interface EmailRecipient {
  email: string;
  name?: string;
}

interface BulkEmailOptions {
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
}

interface BulkResult {
  total: number;
  sent: number;
  failed: number;
  errors: string[];
}

/**
 * Send bulk email via Resend API in batches of 100.
 * Returns summary of sent/failed counts.
 */
export async function sendBulkEmail(
  recipients: EmailRecipient[],
  options: BulkEmailOptions
): Promise<BulkResult> {
  if (!RESEND_KEY) {
    return {
      total: recipients.length,
      sent: 0,
      failed: recipients.length,
      errors: ['RESEND_API_KEY not configured'],
    };
  }

  const result: BulkResult = {
    total: recipients.length,
    sent: 0,
    failed: 0,
    errors: [],
  };

  // Process in batches
  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);

    // Resend batch API
    const emails = batch.map(r => ({
      from: options.from ?? FROM_DEFAULT,
      to: r.email,
      subject: options.subject,
      html: options.html,
      reply_to: options.replyTo,
      tags: options.tags,
    }));

    try {
      const res = await fetch('https://api.resend.com/emails/batch', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emails),
      });

      if (res.ok) {
        result.sent += batch.length;
      } else {
        const errText = await res.text().catch(() => '');
        result.failed += batch.length;
        result.errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${res.status} ${errText.slice(0, 100)}`);
      }
    } catch (err: any) {
      result.failed += batch.length;
      result.errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${err.message?.slice(0, 100)}`);
    }

    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < recipients.length) {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  return result;
}

/**
 * Send a single personalized email via Resend.
 * Used by the drip sequence for individual operator emails.
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  options?: { from?: string; replyTo?: string; tags?: { name: string; value: string }[] }
): Promise<{ ok: boolean; id?: string; error?: string }> {
  if (!RESEND_KEY) {
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options?.from ?? FROM_DEFAULT,
        to,
        subject,
        html,
        reply_to: options?.replyTo,
        tags: options?.tags,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return { ok: true, id: data.id };
    } else {
      const text = await res.text().catch(() => '');
      return { ok: false, error: `${res.status}: ${text.slice(0, 100)}` };
    }
  } catch (err: any) {
    return { ok: false, error: err.message?.slice(0, 100) };
  }
}

/**
 * Check if Resend is configured and ready.
 */
export function isResendConfigured(): boolean {
  return !!RESEND_KEY;
}
