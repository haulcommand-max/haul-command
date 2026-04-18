/**
 * lib/novu.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Novu multi-channel notification client.
 * Manages: dispatch alerts, training reminders, QuickPay, compliance deadlines.
 *
 * Free tier: 30K events/month — upgrade at novu.co as needed.
 * Self-host: https://github.com/novuhq/novu
 *
 * Required env vars:
 *   NOVU_API_KEY=your-api-key
 *
 * Required Novu workflow IDs (create in dashboard):
 *   dispatch-assigned  → push + in-app + SMS
 *   training-reminder  → email + in-app
 *   quickpay-available → push + in-app
 *   compliance-deadline → email + push
 *   hold-request       → push + in-app
 */

const NOVU_API_URL = 'https://api.novu.co/v1';

function getNovuKey(): string | null {
  const key = process.env.NOVU_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV !== 'production') return null;
    console.warn('[novu] NOVU_API_KEY not configured — notifications disabled.');
    return null;
  }
  return key;
}

async function novuPost(endpoint: string, body: unknown) {
  const key = getNovuKey();
  if (!key) return null;

  try {
    const res = await fetch(`${NOVU_API_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        Authorization: `ApiKey ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error(`[novu] POST /${endpoint} failed:`, res.status, await res.text());
      return null;
    }
    return res.json();
  } catch (err) {
    console.error('[novu] Request failed:', err);
    return null;
  }
}

// ── Register operator as Novu subscriber ─────────────────────────────────────
export async function registerOperator(operator: {
  id: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  country?: string;
  tier?: string;
}) {
  return novuPost('subscribers', {
    subscriberId: operator.id,
    email:        operator.email,
    phone:        operator.phone,
    firstName:    operator.firstName,
    lastName:     operator.lastName,
    data: {
      country: operator.country,
      tier:    operator.tier,
    },
  });
}

// ── Dispatch assigned ─────────────────────────────────────────────────────────
export async function notifyDispatchAssigned(operatorId: string, load: {
  loadId:          string;
  pickupLocation:  string;
  deliveryLocation: string;
  rate:            number;
  corridor:        string;
  startTime?:      string;
}) {
  return novuPost('events/trigger', {
    name: 'dispatch-assigned',
    to:   { subscriberId: operatorId },
    payload: {
      loadId:    load.loadId,
      pickup:    load.pickupLocation,
      delivery:  load.deliveryLocation,
      rate:      `$${load.rate.toFixed(2)}`,
      corridor:  load.corridor,
      startTime: load.startTime ?? 'TBD',
    },
  });
}

// ── Training reminder ─────────────────────────────────────────────────────────
export async function notifyTrainingReminder(operatorId: string, course: {
  title:    string;
  deadline: string;
  progress: number;
  slug:     string;
}) {
  return novuPost('events/trigger', {
    name: 'training-reminder',
    to:   { subscriberId: operatorId },
    payload: {
      courseTitle:  course.title,
      deadline:     course.deadline,
      progress:     `${Math.round(course.progress)}%`,
      courseUrl:    `https://www.haulcommand.com/training/${course.slug}`,
    },
  });
}

// ── QuickPay available ────────────────────────────────────────────────────────
export async function notifyQuickPay(operatorId: string, amount: number, loadId: string) {
  return novuPost('events/trigger', {
    name: 'quickpay-available',
    to:   { subscriberId: operatorId },
    payload: {
      amount:    `$${amount.toFixed(2)}`,
      loadId,
      claimUrl: `https://www.haulcommand.com/quickpay?load=${loadId}`,
    },
  });
}

// ── Compliance deadline ───────────────────────────────────────────────────────
export async function notifyComplianceDeadline(operatorId: string, item: {
  type:     string;   // e.g., 'insurance_renewal', 'permit_expiry'
  label:    string;
  dueDate:  string;
  actionUrl: string;
}) {
  return novuPost('events/trigger', {
    name: 'compliance-deadline',
    to:   { subscriberId: operatorId },
    payload: item,
  });
}

// ── Hold request ─────────────────────────────────────────────────────────────
export async function notifyHoldRequest(operatorId: string, load: {
  loadId:   string;
  corridor: string;
  rate:     number;
  expiresIn: string; // e.g. '2 hours'
}) {
  return novuPost('events/trigger', {
    name: 'hold-request',
    to:   { subscriberId: operatorId },
    payload: {
      loadId:    load.loadId,
      corridor:  load.corridor,
      rate:      `$${load.rate.toFixed(2)}`,
      expiresIn: load.expiresIn,
      acceptUrl: `https://www.haulcommand.com/loads/${load.loadId}/accept`,
    },
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// Generic event system — NOVU_EVENT_NAMES, emitNotification, emitBatch
// Used by cron/notifications, novu/trigger, recovery/scan routes
// ══════════════════════════════════════════════════════════════════════════════

/** Canonical event name registry */
export const NOVU_EVENT_NAMES = {
  DISPATCH_ASSIGNED: 'dispatch-assigned',
  TRAINING_REMINDER: 'training-reminder',
  QUICKPAY_AVAILABLE: 'quickpay-available',
  COMPLIANCE_DEADLINE: 'compliance-deadline',
  HOLD_REQUEST: 'hold-request',
  BOOST_EXPIRING: 'boost-expiring',
  SPONSORSHIP_EXPIRING: 'sponsorship-expiring',
  CREDENTIAL_EXPIRING: 'credential-expiring',
  TRAINING_RENEWAL_DUE: 'training-renewal-due',
  LEAD_CREDIT_LOW: 'lead-credit-low',
} as const;

export type NovuEventName = (typeof NOVU_EVENT_NAMES)[keyof typeof NOVU_EVENT_NAMES] | string;

export type NovuPayload = Record<string, unknown>;

export interface EmitOptions {
  subscriberId: string;
  email?: string;
  phone?: string;
  actorId?: string;
  tenant?: string;
}

/** Emit a single notification event */
export async function emitNotification(
  eventName: NovuEventName,
  payload: NovuPayload,
  options: EmitOptions,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const result = await novuPost('events/trigger', {
      name: eventName,
      to: {
        subscriberId: options.subscriberId,
        ...(options.email ? { email: options.email } : {}),
        ...(options.phone ? { phone: options.phone } : {}),
      },
      payload,
      ...(options.actorId ? { actor: { subscriberId: options.actorId } } : {}),
      ...(options.tenant ? { tenant: { identifier: options.tenant } } : {}),
    });
    return { ok: !!result };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[novu] emitNotification failed:', msg);
    return { ok: false, error: msg };
  }
}

/** Emit a batch of notification events sequentially */
export async function emitBatch(
  events: Array<{ eventName: NovuEventName; payload: NovuPayload; options: EmitOptions }>,
): Promise<Array<{ ok: boolean; error?: string }>> {
  const results: Array<{ ok: boolean; error?: string }> = [];
  for (const evt of events) {
    const r = await emitNotification(evt.eventName, evt.payload, evt.options);
    results.push(r);
  }
  return results;
}

