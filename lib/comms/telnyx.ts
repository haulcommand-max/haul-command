// ============================================================
// Telnyx — Phone Numbers, SMS, Voice Routing
// Local presence in 50+ countries. Backbone for Vapi voice.
// Feature flag: TELNYX
// ============================================================

import { isEnabled } from '@/lib/feature-flags';

const TELNYX_API_KEY = () => process.env.TELNYX_API_KEY || '';
const TELNYX_API_URL = 'https://api.telnyx.com/v2';

// ── Types ──

export interface TelnyxNumber {
  id: string;
  phoneNumber: string;
  countryCode: string;
  status: 'active' | 'pending' | 'released';
  capabilities: string[];
}

export interface SMSMessage {
  to: string;
  from: string;
  text: string;
  messagingProfileId?: string;
}

export interface SMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

// ── API Client ──

async function telnyxFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${TELNYX_API_URL}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TELNYX_API_KEY()}`,
      ...(opts?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[Telnyx] ${opts?.method || 'GET'} ${path} failed (${res.status}): ${text}`);
  }
  return res.json();
}

// ── Public API ──

/**
 * Send an SMS message.
 */
export async function sendSMS(msg: SMSMessage): Promise<SMSResult> {
  if (!isEnabled('TELNYX') || !TELNYX_API_KEY()) {
    return { success: false, error: 'Telnyx disabled or no API key' };
  }

  try {
    const result = await telnyxFetch<any>('/messages', {
      method: 'POST',
      body: JSON.stringify({
        to: msg.to,
        from: msg.from,
        text: msg.text,
        messaging_profile_id: msg.messagingProfileId,
      }),
    });
    return { success: true, messageId: result.data?.id };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

/**
 * List phone numbers for a country.
 */
export async function listNumbers(countryCode?: string): Promise<TelnyxNumber[]> {
  if (!isEnabled('TELNYX')) return [];

  const params = new URLSearchParams({ 'page[size]': '50' });
  if (countryCode) params.set('filter[country_code]', countryCode);

  const result = await telnyxFetch<any>(`/phone_numbers?${params}`);
  return (result.data || []).map((n: any) => ({
    id: n.id,
    phoneNumber: n.phone_number,
    countryCode: n.country_code || '',
    status: n.status,
    capabilities: n.capabilities || [],
  }));
}

/**
 * Search available numbers in a country for purchase.
 */
export async function searchAvailableNumbers(
  countryCode: string,
  options?: { locality?: string; features?: string[] }
): Promise<string[]> {
  if (!isEnabled('TELNYX')) return [];

  const params = new URLSearchParams({
    'filter[country_code]': countryCode,
    'filter[limit]': '10',
  });
  if (options?.locality) params.set('filter[locality]', options.locality);
  if (options?.features) {
    for (const f of options.features) params.append('filter[features]', f);
  }

  const result = await telnyxFetch<any>(`/available_phone_numbers?${params}`);
  return (result.data || []).map((n: any) => n.phone_number);
}

/**
 * Get the best local number for a country.
 * Used by Vapi to route calls through local presence.
 */
export async function getLocalNumber(countryCode: string): Promise<string | null> {
  if (!isEnabled('TELNYX')) return null;

  const numbers = await listNumbers(countryCode);
  const active = numbers.find(n => n.status === 'active');
  return active?.phoneNumber || null;
}

/**
 * Health check.
 */
export async function healthCheck(): Promise<boolean> {
  if (!isEnabled('TELNYX')) return false;
  try {
    await telnyxFetch('/phone_numbers?page[size]=1');
    return true;
  } catch {
    return false;
  }
}
