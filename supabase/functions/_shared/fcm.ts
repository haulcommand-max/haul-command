/**
 * _shared/fcm.ts — Haul Command Firebase Cloud Messaging Helper
 *
 * Pattern: Firebase HTTP v1 API with Service Account JWT
 *  - Generates a short-lived OAuth2 Bearer token from a service account JSON key
 *  - Sends one message per FCM device token
 *  - Returns per-token result array for audit logging
 *
 * Required env vars:
 *   FIREBASE_PROJECT_ID       — GCP project ID (e.g. "haul-command-prod")
 *   FIREBASE_SERVICE_ACCOUNT  — Full service account JSON (stringified)
 *
 * Usage:
 *   import { sendFcmPush } from "../_shared/fcm.ts";
 *   const results = await sendFcmPush({ tokens, title, body, data, deepLink });
 */

const FCM_V1_URL = (projectId: string) =>
  `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

// ─── JWT helpers (no library dependency) ─────────────────────────────────────

function base64urlEncode(data: string): string {
  return btoa(data).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function signRSA(privateKeyPem: string, data: string): Promise<string> {
  // Strip PEM headers
  const stripped = privateKeyPem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");

  const binaryKey = Uint8Array.from(atob(stripped), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const encoder = new TextEncoder();
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(data)
  );

  return base64urlEncode(String.fromCharCode(...new Uint8Array(signature)));
}

async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson);
  const now = Math.floor(Date.now() / 1000);

  const header = base64urlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64urlEncode(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/firebase.messaging",
      aud: GOOGLE_TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  );

  const unsigned = `${header}.${claim}`;
  const signature = await signRSA(sa.private_key, unsigned);
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FCM token error ${res.status}: ${text}`);
  }

  const json = await res.json();
  return json.access_token as string;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export interface FcmSendInput {
  tokens: string[];                   // FCM device tokens to send to
  title: string;
  body: string;
  data?: Record<string, string>;      // Must be string→string for FCM data payload
  deepLink?: string;                  // Appended to data.deepLink
}

export interface FcmSendResult {
  token: string;
  success: boolean;
  messageId?: string;
  error?: string;
}

export async function sendFcmPush(input: FcmSendInput): Promise<FcmSendResult[]> {
  const projectId = Deno.env.get("FIREBASE_PROJECT_ID");
  const serviceAccountJson = Deno.env.get("FIREBASE_SERVICE_ACCOUNT");

  if (!projectId || !serviceAccountJson) {
    console.warn("[fcm] Missing FIREBASE_PROJECT_ID or FIREBASE_SERVICE_ACCOUNT — skipping FCM send");
    return input.tokens.map((t) => ({ token: t, success: false, error: "missing_config" }));
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken(serviceAccountJson);
  } catch (e: any) {
    console.error("[fcm] Failed to get access token:", e.message);
    return input.tokens.map((t) => ({ token: t, success: false, error: "token_error" }));
  }

  const url = FCM_V1_URL(projectId);
  const results: FcmSendResult[] = [];

  const dataPayload: Record<string, string> = {
    ...(input.data || {}),
    ...(input.deepLink ? { deepLink: input.deepLink } : {}),
  };

  for (const token of input.tokens) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: {
            token,
            notification: { title: input.title, body: input.body },
            ...(Object.keys(dataPayload).length > 0 ? { data: dataPayload } : {}),
            android: { priority: "high" },
            apns: {
              headers: { "apns-priority": "10" },
              payload: { aps: { sound: "default", badge: 1 } },
            },
          },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        results.push({ token, success: true, messageId: json.name });
      } else {
        const text = await res.text();
        // Mark token as stale if FCM rejects it permanently
        const isInvalidToken =
          text.includes("registration-token-not-registered") ||
          text.includes("invalid-registration-token") ||
          res.status === 404;
        results.push({
          token,
          success: false,
          error: isInvalidToken ? "invalid_token" : `fcm_${res.status}`,
        });
      }
    } catch (e: any) {
      results.push({ token, success: false, error: e.message });
    }
  }

  return results;
}
