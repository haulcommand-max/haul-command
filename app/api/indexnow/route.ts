import { NextResponse, type NextRequest } from "next/server";
import { google } from "googleapis";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.haulcommand.com";
const INDEXNOW_KEY = process.env.INDEXNOW_API_KEY || "";

/**
 * Universal IndexNow + Google Indexing API Route
 *
 * POST /api/indexnow
 * Body: { urls: string[] }
 *
 * Pings:
 *   1. IndexNow (Bing, Yandex, Naver) — using INDEXNOW_API_KEY env
 *   2. Google Indexing API — using FIREBASE_SERVICE_ACCOUNT (service account JWT)
 *
 * Call from:
 *   - Revalidation webhooks (blog, regs, tools, glossary, training)
 *   - Admin panel "force re-index" button
 *   - pg_cron triggered revalidation events
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const urls: string[] = Array.isArray(body.urls)
      ? body.urls.map((u: string) =>
          u.startsWith("http") ? u : `${SITE_URL}${u.startsWith("/") ? u : `/${u}`}`
        )
      : [];

    if (!urls.length) {
      return NextResponse.json({ ok: false, error: "No URLs provided" }, { status: 400 });
    }

    const results: Record<string, string> = {};

    // ── 1. IndexNow (Bing, Yandex, Naver) ──────────────────────────
    if (INDEXNOW_KEY) {
      const payload = {
        host: new URL(SITE_URL).hostname,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      };

      const endpoints = [
        "https://api.indexnow.org/IndexNow",
        "https://www.bing.com/indexnow",
        "https://yandex.com/indexnow",
      ];

      for (const endpoint of endpoints) {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify(payload),
          });
          results[endpoint] = `${res.status} ${res.statusText}`;
        } catch (err) {
          results[endpoint] = `error: ${(err as Error).message}`;
        }
      }
    } else {
      results["indexnow"] = "skipped — INDEXNOW_API_KEY not set";
    }

    // ── 2. Google Indexing API (using Service Account JWT) ──────────
    const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (saJson && saJson !== "{}") {
      try {
        const sa = JSON.parse(saJson);
        const auth = new google.auth.JWT(
          sa.client_email,
          undefined,
          sa.private_key,
          ["https://www.googleapis.com/auth/indexing"],
          undefined
        );
        const accessToken = await auth.getAccessToken();

        if (accessToken.token) {
          // Batch submit (max 100 URLs per request to stay within quota)
          for (const url of urls.slice(0, 100)) {
            try {
              const res = await fetch(
                "https://indexing.googleapis.com/v3/urlNotifications:publish",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${accessToken.token}`,
                  },
                  body: JSON.stringify({ url, type: "URL_UPDATED" }),
                }
              );
              results[`google:${url}`] = `${res.status}`;
            } catch (err) {
              results[`google:${url}`] = `error: ${(err as Error).message}`;
            }
          }
        } else {
          results["google"] = "skipped — could not obtain access token";
        }
      } catch (err) {
        results["google"] = `auth_error: ${(err as Error).message}`;
      }
    } else {
      results["google"] = "skipped — FIREBASE_SERVICE_ACCOUNT not configured";
    }

    return NextResponse.json({
      ok: true,
      urls_submitted: urls.length,
      results,
    });
  } catch (error) {
    console.error("[indexnow] error:", error);
    return NextResponse.json(
      { ok: false, error: "Indexing submission failed" },
      { status: 500 }
    );
  }
}
