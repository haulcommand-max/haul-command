import { NextResponse, type NextRequest } from "next/server";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.haulcommand.com";
const INDEXNOW_KEY = process.env.INDEXNOW_API_KEY || "";

/**
 * IndexNow API Route — DA 97 Accelerator Hack #1
 *
 * Pings Bing/Yandex/Naver IndexNow endpoints and Google Indexing API
 * instantly when glossary pages are created or updated.
 *
 * POST /api/glossary/indexnow
 * Body: { urls: string[] }
 *
 * Call this from the revalidate webhook, ingestion workers, or
 * admin panels whenever a term/topic/country/overlay is published.
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
      return NextResponse.json(
        { ok: false, error: "No URLs provided" },
        { status: 400 }
      );
    }

    const results: Record<string, string> = {};

    // ── IndexNow (Bing, Yandex, Naver, Seznam, Yep) ────────────────
    if (INDEXNOW_KEY) {
      const indexNowPayload = {
        host: new URL(SITE_URL).hostname,
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      };

      const indexNowEndpoints = [
        "https://api.indexnow.org/IndexNow",
        "https://www.bing.com/indexnow",
        "https://yandex.com/indexnow",
      ];

      for (const endpoint of indexNowEndpoints) {
        try {
          const res = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json; charset=utf-8" },
            body: JSON.stringify(indexNowPayload),
          });
          results[endpoint] = `${res.status} ${res.statusText}`;
        } catch (err) {
          results[endpoint] = `error: ${(err as Error).message}`;
        }
      }
    } else {
      results["indexnow"] = "skipped — INDEXNOW_API_KEY not set";
    }

    // ── Google Indexing API (Web Search / URL Inspection) ───────────
    // Requires a service account with Indexing API enabled.
    // The service account JSON should be stored in GOOGLE_INDEXING_SA env.
    const googleSA = process.env.GOOGLE_INDEXING_SA;
    if (googleSA) {
      try {
        // Use Google's batch endpoint for efficiency
        for (const url of urls.slice(0, 100)) {
          const res = await fetch(
            "https://indexing.googleapis.com/v3/urlNotifications:publish",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${googleSA}`,
              },
              body: JSON.stringify({
                url,
                type: "URL_UPDATED",
              }),
            }
          );
          results[`google:${url}`] = `${res.status}`;
        }
      } catch (err) {
        results["google"] = `error: ${(err as Error).message}`;
      }
    } else {
      results["google"] = "skipped — GOOGLE_INDEXING_SA not set";
    }

    return NextResponse.json({
      ok: true,
      urls_submitted: urls.length,
      results,
    });
  } catch (error) {
    console.error("[indexnow] error:", error);
    return NextResponse.json(
      { ok: false, error: "IndexNow submission failed" },
      { status: 500 }
    );
  }
}
