import crypto from "crypto";

type FetchResult = { url: string; status: number; text: string };

function sha256(input: string) {
    return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * MODULE E: ToS-Safe Public Fetcher
 * Requirements:
 * - Respect robots.txt (Functionality to be checked externally or via library)
 * - Rate limit globally (Token bucket handled by caller or infrastructure)
 * - Only ingest sources you have rights to fetch (Public Govt Docs, 511 pages)
 */
export async function fetchPublicDoc(url: string): Promise<FetchResult> {
    // Real implementation would check robots.txt here
    console.log(`[Ingest] Fetching: ${url}`);

    const res = await fetch(url, {
        redirect: "follow",
        headers: {
            "User-Agent": "HaulCommandBot/1.0 (Compliance Data Ingest; +https://haulcommand.com/bot)"
        }
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.status} ${res.statusText}`);
    }

    const text = await res.text();
    return { url, status: res.status, text };
}

/**
 * Formats the fetched data into the `raw_ingest_events` schema payload.
 */
export function toRawEvent(url: string, text: string) {
    return {
        content_hash: sha256(text),
        payload: { url, length: text.length, content_snippet: text.substring(0, 200) }, // Storing snippet for logs, full content usually goes to Storage bucket if huge
        provenance: {
            url,
            fetched_at: new Date().toISOString(),
            method: "public_fetch_ts"
        }
    };
}

// Example usage (if run directly)
if (require.main === module) {
    const targetUrl = process.argv[2];
    if (targetUrl) {
        fetchPublicDoc(targetUrl)
            .then(res => console.log(toRawEvent(res.url, res.text)))
            .catch(console.error);
    } else {
        console.log("Usage: ts-node public_fetch.ts <url>");
    }
}
