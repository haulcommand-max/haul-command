/**
 * vapi-seed.ts — Haul Command Vapi API Seeder (ONE FILE, consolidated)
 *
 * What this does:
 *  1) Creates 4 assistants in Vapi (Claims, Support, Reviews, AdGrid Sales)
 *     - Uses `server.credentialId` for server auth (rotatable, no inline secrets)
 *     - Adds `backgroundSpeechDenoisingPlan` for noisy roadside environments
 *  2) Creates 4 outbound campaigns, each pulling targets from your Supabase Edge endpoint
 *  3) PATCH-updates your outbound phone numbers to also use `server.credentialId`
 *
 * ENV VARS (required):
 *  - VAPI_API_KEY=...
 *  - VAPI_SERVER_BASE=https://hvjyfyzotqobfkakjozp.supabase.co/functions/v1
 *  - VAPI_SERVER_CREDENTIAL_ID=cred_abc123
 *
 *  - CLAIMS_CALLER_ID_POOL_PHONE_NUMBER_ID=pn_...
 *  - REVIEWS_CALLER_ID_POOL_PHONE_NUMBER_ID=pn_...
 *  - SALES_CALLER_ID_POOL_PHONE_NUMBER_ID=pn_...
 *
 * Optional:
 *  - VAPI_DEFAULT_MODEL=gpt-4.1-mini
 *  - VAPI_VOICE_PROVIDER=elevenlabs
 *  - VAPI_VOICE_ID_TIER_A_B=...
 *  - VAPI_VOICE_ID_SUPPORT=...
 *  - VAPI_VOICE_ID_REVIEWS=...
 *  - VAPI_VOICE_ID_SALES=...
 *
 * Dry run:
 *  - DRY_RUN=1 node vapi-seed.ts
 */

type Json = Record<string, any>;

const API_BASE = "https://api.vapi.ai";

const env = (k: string, fallback?: string) => {
    const v = process.env[k] ?? fallback;
    if (v === undefined) throw new Error(`Missing env var: ${k}`);
    return v;
};

const optEnv = (k: string, fallback?: string) => process.env[k] ?? fallback;

const DRY_RUN = optEnv("DRY_RUN") === "1";

async function vapiFetch(path: string, init: RequestInit & { json?: any } = {}) {
    const url = `${API_BASE}${path}`;
    const headers: Record<string, string> = {
        Authorization: `Bearer ${env("VAPI_API_KEY")}`,
        "Content-Type": "application/json",
        ...(init.headers as Record<string, string> | undefined),
    };

    const body = init.json !== undefined ? JSON.stringify(init.json) : init.body;

    if (DRY_RUN) {
        console.log("\n[DRY_RUN]", init.method ?? "GET", url);
        if (init.json !== undefined) console.log(JSON.stringify(init.json, null, 2));
        return { ok: true, status: 200, json: async () => ({ dryRun: true }) } as any;
    }

    const res = await fetch(url, { ...init, headers, body });
    const text = await res.text();

    let parsed: any = null;
    try {
        parsed = text ? JSON.parse(text) : null;
    } catch {
        parsed = { raw: text };
    }

    if (!res.ok) {
        throw new Error(
            `Vapi request failed: ${init.method ?? "GET"} ${path} (${res.status})\n${JSON.stringify(parsed, null, 2)}`,
        );
    }

    return { ok: true, status: res.status, json: async () => parsed };
}

function buildServerConfig(endpointPath: string): Json {
    const serverBase = env("VAPI_SERVER_BASE");
    const credentialId = env("VAPI_SERVER_CREDENTIAL_ID");
    return {
        url: `${serverBase}${endpointPath}`,
        credentialId,
    };
}

function backgroundSpeechDenoisingPlan(): Json {
    return {
        smartDenoisingPlan: {
            enabled: true,
        },
    };
}

function tool(name: string, description: string, properties: Json, required: string[]) {
    return {
        type: "function",
        function: {
            name,
            description,
            parameters: { type: "object", properties, required },
        },
    };
}

function assistantsPayloads(): { key: string; payload: Json }[] {
    const server = buildServerConfig("/vapi-webhook-function-calls");

    const MODEL = optEnv("VAPI_DEFAULT_MODEL", "gpt-4.1-mini");
    const VOICE_PROVIDER = optEnv("VAPI_VOICE_PROVIDER", "elevenlabs");

    const VOICE_ID_A_B = env("VAPI_VOICE_ID_TIER_A_B", "YOUR_ELEVENLABS_VOICE_ID");
    const VOICE_ID_SUPPORT = env("VAPI_VOICE_ID_SUPPORT", "YOUR_ELEVENLABS_VOICE_ID");
    const VOICE_ID_REVIEWS = env("VAPI_VOICE_ID_REVIEWS", "YOUR_ELEVENLABS_VOICE_ID");
    const VOICE_ID_SALES = env("VAPI_VOICE_ID_SALES", "YOUR_ELEVENLABS_VOICE_ID");

    const claimsTools = [
        tool("hc_get_profile_context", "Fetch profile + localization + demand signals.", { profile_id: { type: "string" } }, ["profile_id"]),
        tool("hc_create_claim_invite", "Create secure claim invite; returns token; server builds claim_link.", { profile_id: { type: "string" }, channel: { type: "string", enum: ["sms", "email", "voice"] }, ttl_minutes: { type: "integer" } }, ["profile_id", "channel", "ttl_minutes"]),
        tool("hc_upsert_profile_fields", "Upsert captured profile fields and return completion score.", { profile_id: { type: "string" }, fields_json: { type: "object" } }, ["profile_id", "fields_json"]),
        tool("hc_mark_owner_verified", "Mark owner verified with evidence.", { profile_id: { type: "string" }, evidence: { type: "object" } }, ["profile_id", "evidence"]),
        tool("hc_send_link_sms", "Queue an SMS outbox ticket.", { phone_e164: { type: "string" }, template_id: { type: "string" }, vars: { type: "object" } }, ["phone_e164", "template_id", "vars"]),
        tool("hc_add_to_suppression", "Opt-out/DNC suppression. Must comply immediately.", { phone_e164: { type: "string" }, reason: { type: "string" }, scope: { type: "string", enum: ["global", "department", "country"] }, department: { type: "string" }, country_code: { type: "string" } }, ["phone_e164", "reason", "scope"]),
        tool("hc_schedule_followup", "Schedule followup call.", { profile_id: { type: "string" }, next_at: { type: "string" }, reason: { type: "string" } }, ["profile_id", "next_at", "reason"]),
        tool("hc_create_support_ticket", "Create support/sales ticket.", { profile_id: { type: "string" }, category: { type: "string" }, payload: { type: "object" } }, ["category", "payload"]),
        tool("hc_log_call_disposition", "Log call outcome for QA/follow-ups.", { call_id: { type: "string" }, disposition: { type: "string" }, notes: { type: "string" } }, ["call_id", "disposition"]),
    ];

    const supportTools = [
        tool("hc_create_support_ticket", "Create support ticket.", { profile_id: { type: "string" }, category: { type: "string" }, payload: { type: "object" } }, ["category", "payload"]),
        tool("hc_add_to_suppression", "Opt-out suppression.", { phone_e164: { type: "string" }, reason: { type: "string" }, scope: { type: "string", enum: ["global", "department", "country"] }, department: { type: "string" }, country_code: { type: "string" } }, ["phone_e164", "reason", "scope"]),
        tool("hc_remove_from_public_listing", "Soft-delist a profile.", { profile_id: { type: "string" }, reason: { type: "string" } }, ["profile_id", "reason"]),
    ];

    const reviewsTools = [
        tool("hc_send_link_sms", "Queue review link message.", { phone_e164: { type: "string" }, template_id: { type: "string" }, vars: { type: "object" } }, ["phone_e164", "template_id", "vars"]),
        tool("hc_log_call_disposition", "Log call outcome.", { call_id: { type: "string" }, disposition: { type: "string" }, notes: { type: "string" } }, ["call_id", "disposition"]),
    ];

    const salesTools = [
        tool("hc_get_profile_context", "Fetch business + demand signals for personalization.", { profile_id: { type: "string" } }, ["profile_id"]),
        tool("hc_create_support_ticket", "Create sales lead ticket.", { profile_id: { type: "string" }, category: { type: "string" }, payload: { type: "object" } }, ["category", "payload"]),
    ];

    const denoise = backgroundSpeechDenoisingPlan();

    return [
        {
            key: "claims",
            payload: {
                name: "HC Claims & Verification",
                firstMessage: "hey—quick one. is this {{business_name}} in {{city}}? got 60 seconds?",
                model: { provider: "openai", model: MODEL },
                voice: { provider: VOICE_PROVIDER, voiceId: VOICE_ID_A_B },
                server,
                backgroundSpeechDenoisingPlan: denoise,
                metadata: { department: "claims" },
                tools: claimsTools,
            },
        },
        {
            key: "support",
            payload: {
                name: "HC Support (Listed/Delisted/Opt-Out)",
                firstMessage: "hey—haul command support here. update your listing, remove it, or fix something?",
                model: { provider: "openai", model: MODEL },
                voice: { provider: VOICE_PROVIDER, voiceId: VOICE_ID_SUPPORT },
                server,
                backgroundSpeechDenoisingPlan: denoise,
                metadata: { department: "support" },
                tools: supportTools,
            },
        },
        {
            key: "reviews",
            payload: {
                name: "HC Reviews & Reputation",
                firstMessage: "quick favor—can i send a link to leave a short review? it helps operators get found.",
                model: { provider: "openai", model: MODEL },
                voice: { provider: VOICE_PROVIDER, voiceId: VOICE_ID_REVIEWS },
                server,
                backgroundSpeechDenoisingPlan: denoise,
                metadata: { department: "reviews" },
                tools: reviewsTools,
            },
        },
        {
            key: "sales",
            payload: {
                name: "HC AdGrid Sales",
                firstMessage: "hey—quick question. are you the person who handles marketing for {{business_name}}?",
                model: { provider: "openai", model: MODEL },
                voice: { provider: VOICE_PROVIDER, voiceId: VOICE_ID_SALES },
                server,
                backgroundSpeechDenoisingPlan: denoise,
                metadata: { department: "adgrid_sales" },
                tools: salesTools,
            },
        },
    ];
}

function campaignsPayloads(assistantIds: Record<string, string>) {
    const serverBase = env("VAPI_SERVER_BASE");

    const claimsPhoneNumberId = env("CLAIMS_CALLER_ID_POOL_PHONE_NUMBER_ID");
    const reviewsPhoneNumberId = env("REVIEWS_CALLER_ID_POOL_PHONE_NUMBER_ID");
    const salesPhoneNumberId = env("SALES_CALLER_ID_POOL_PHONE_NUMBER_ID");

    const commonSource = (campaignName: string) => ({
        type: "webhook",
        url: `${serverBase}/campaigns-targets?campaign=${encodeURIComponent(campaignName)}`,
    });

    return [
        {
            key: "claim_activation",
            payload: {
                name: "HC Claim Activation",
                assistantId: assistantIds.claims,
                phoneNumberId: claimsPhoneNumberId,
                source: commonSource("claim_activation"),
                maxConcurrentCalls: Number(optEnv("CLAIMS_MAX_CONCURRENCY", "200")),
                retryPolicy: { maxAttempts: 5, delaysMinutes: [0, 1440, 4320, 10080, 20160] },
                localTimeWindows: {
                    weekday: [["09:30", "12:00"], ["14:00", "17:30"]],
                    saturday: [["10:00", "12:30"]],
                    sunday: [],
                },
            },
        },
        {
            key: "completion_chase",
            payload: {
                name: "HC Completion Chase",
                assistantId: assistantIds.claims,
                phoneNumberId: claimsPhoneNumberId,
                source: commonSource("completion_chase"),
                maxConcurrentCalls: Number(optEnv("COMPLETION_MAX_CONCURRENCY", "150")),
                retryPolicy: { maxAttempts: 4, delaysMinutes: [0, 2880, 10080, 20160] },
            },
        },
        {
            key: "review_boost",
            payload: {
                name: "HC Review Boost",
                assistantId: assistantIds.reviews,
                phoneNumberId: reviewsPhoneNumberId,
                source: commonSource("review_boost"),
                maxConcurrentCalls: Number(optEnv("REVIEWS_MAX_CONCURRENCY", "120")),
                retryPolicy: { maxAttempts: 3, delaysMinutes: [0, 2880, 10080] },
            },
        },
        {
            key: "adgrid_sales_outreach",
            payload: {
                name: "HC AdGrid Sales Outreach",
                assistantId: assistantIds.sales,
                phoneNumberId: salesPhoneNumberId,
                source: commonSource("adgrid_sales_outreach"),
                maxConcurrentCalls: Number(optEnv("SALES_MAX_CONCURRENCY", "60")),
                retryPolicy: { maxAttempts: 3, delaysMinutes: [0, 10080, 20160] },
            },
        },
    ];
}

async function createAssistant(payload: Json) {
    const res = await vapiFetch("/assistant", { method: "POST", json: payload });
    return await res.json();
}

async function createCampaign(payload: Json) {
    const res = await vapiFetch("/campaign", { method: "POST", json: payload });
    return await res.json();
}

async function updatePhoneNumberServer(phoneNumberId: string, endpointPath: string) {
    const server = buildServerConfig(endpointPath);
    const res = await vapiFetch(`/phone-number/${encodeURIComponent(phoneNumberId)}`, {
        method: "PATCH",
        json: { server },
    });
    return await res.json();
}

async function main() {
    console.log("== Haul Command Vapi Seeder ==");

    // 1) Create assistants
    const assistants = assistantsPayloads();
    const assistantIds: Record<string, string> = {};

    for (const a of assistants) {
        console.log(`\n-- Creating assistant: ${a.payload.name}`);
        const created = await createAssistant(a.payload);
        const id = created?.id ?? created?.assistant?.id;
        if (!id) {
            console.log("Created assistant response:", created);
            throw new Error(`Assistant id not found for key=${a.key}`);
        }
        assistantIds[a.key] = id;
        console.log(`✅ assistantId(${a.key}) = ${id}`);
    }

    // 2) PATCH phone numbers with server.credentialId
    const claimsPn = env("CLAIMS_CALLER_ID_POOL_PHONE_NUMBER_ID");
    const reviewsPn = env("REVIEWS_CALLER_ID_POOL_PHONE_NUMBER_ID");
    const salesPn = env("SALES_CALLER_ID_POOL_PHONE_NUMBER_ID");

    console.log("\n-- Updating phone numbers with server.credentialId (call-events) ...");
    await updatePhoneNumberServer(claimsPn, "/vapi-webhook-call-events");
    await updatePhoneNumberServer(reviewsPn, "/vapi-webhook-call-events");
    await updatePhoneNumberServer(salesPn, "/vapi-webhook-call-events");
    console.log("✅ phone numbers patched with credential-based server auth");

    // 3) Create campaigns
    const campaigns = campaignsPayloads(assistantIds);
    const campaignIds: Record<string, string | null> = {};

    for (const c of campaigns) {
        console.log(`\n-- Creating campaign: ${c.payload.name}`);
        const created = await createCampaign(c.payload);
        const id = created?.id ?? created?.campaign?.id ?? null;
        campaignIds[c.key] = id;
        console.log(`✅ campaignId(${c.key}) = ${id ?? "unknown (check response)"}`);
    }

    console.log("\n== Done ==");
    console.log(
        JSON.stringify(
            {
                assistants: assistantIds,
                campaigns: campaignIds,
                phoneNumbersPatched: [claimsPn, reviewsPn, salesPn],
                denoisingEnabled: true,
                serverCredentialAuth: true,
            },
            null,
            2,
        ),
    );
}

main().catch((e) => {
    console.error("\n❌ Seeder failed:\n", e);
    process.exit(1);
});
