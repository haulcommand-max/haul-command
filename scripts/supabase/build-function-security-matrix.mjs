import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const functionsDir = join(root, "supabase", "functions");
const outputPath = join(root, "supabase", "function-security-matrix.json");

const HIGH_RISK = new Set([
  "set-service-role-key",
  "admin-set-setting",
  "payments-capture",
  "payments-preauth",
  "hc-crypto-payments",
  "checkout",
  "stripe-product-sync",
  "email-send",
  "email-worker",
  "livekit-outbound-caller",
  "emergency-dispatch",
  "emergency-vendors",
  "offer-dispatch",
  "offer-accept",
  "booking-confirm",
  "jobs-create-from-offer",
  "availability-toggle",
  "driver-presence-update",
  "gps-breadcrumb-ingest",
  "directory-claim-submit",
  "claim-growth-core",
  "seed-claim-sequence",
  "auto-recruit",
  "recruiter-mission-run",
  "panic-fill-escalation",
  "paperclip-orchestrator",
]);

const WEBHOOK_PATTERNS = ["webhook", "stripe-webhook", "hc_webhook"];
const PUBLIC_READ_PATTERNS = [
  "get-",
  "public",
  "deeplink",
  "rtb-ad-serve",
  "ad-decision-engine",
  "ad-impression-confirm",
  "get-featured-providers",
  "get-providers-near-me",
];
const CRON_WORKER_PATTERNS = [
  "cron",
  "worker",
  "recompute",
  "snapshot",
  "tick",
  "refresh",
  "precompute",
  "rollup",
  "sweep",
  "daily",
];
const AGENT_CANDIDATE = new Set([
  "route-matcher-agent",
  "compliance-match-preview",
  "deadhead-estimate",
  "miles-compute",
  "check-regulations",
  "reciprocity-check",
  "pricing-quote",
  "compute-trust-score",
  "trust-and-ranking-core",
  "market-intelligence",
  "geo-content-gap-filler",
  "claim-growth-core",
  "email-digest-builder",
  "panic-fill-escalation",
]);

function hasAny(value, patterns) {
  return patterns.some((pattern) => value.includes(pattern));
}

function readCurrentVerifyJwt(slug) {
  const configPath = join(functionsDir, slug, "config.toml");
  if (!existsSync(configPath)) return null;

  const config = readFileSync(configPath, "utf8");
  const match = config.match(/verify_jwt\s*=\s*(true|false)/i);
  if (!match) return null;
  return match[1].toLowerCase() === "true";
}

function classify(slug, source) {
  if (slug === "_shared") {
    return {
      category: "shared_library",
      recommended_verify_jwt: null,
      risk_level: "internal_read",
      agent_callable: false,
      requires_signature: false,
      requires_internal_secret: false,
      requires_human_approval: false,
      requires_idempotency_key: false,
      notes: "Shared Edge Function support code; not a directly callable function.",
    };
  }

  const lower = slug.toLowerCase();
  const usesServiceRole = source.includes("SUPABASE_SERVICE_ROLE_KEY");
  const readsAuthHeader = source.includes("Authorization") || source.includes("auth.getUser");
  const verifiesSignature =
    source.toLowerCase().includes("signature") ||
    source.includes("stripe-signature") ||
    source.includes("x-navixy-signature");

  if (lower.includes("admin") || lower.includes("service-role")) {
    return {
      category: "admin",
      recommended_verify_jwt: true,
      risk_level: "admin",
      agent_callable: false,
      requires_signature: false,
      requires_internal_secret: true,
      requires_human_approval: true,
      requires_idempotency_key: true,
      notes: "Admin/service mutation surface; keep behind admin role checks, audit log, and human approval.",
    };
  }

  if (lower.includes("payment") || lower.includes("stripe") || lower.includes("checkout") || lower.includes("invoice")) {
    const webhook = hasAny(lower, WEBHOOK_PATTERNS);
    return {
      category: webhook ? "webhook_financial" : "financial",
      recommended_verify_jwt: webhook ? false : true,
      risk_level: "financial",
      agent_callable: false,
      requires_signature: webhook,
      requires_internal_secret: !webhook,
      requires_human_approval: !webhook,
      requires_idempotency_key: true,
      notes: webhook
        ? "Webhook can remain JWT-free only with verified vendor signature and idempotency."
        : "Money movement must require authenticated user/admin scope, idempotency, and audit logs.",
    };
  }

  if (hasAny(lower, WEBHOOK_PATTERNS) || lower.includes("kyc-webhook")) {
    return {
      category: "webhook",
      recommended_verify_jwt: false,
      risk_level: "external_side_effect",
      agent_callable: false,
      requires_signature: true,
      requires_internal_secret: false,
      requires_human_approval: false,
      requires_idempotency_key: true,
      notes: verifiesSignature
        ? "Webhook code appears to include signature handling; confirm provider-specific validation in review."
        : "Webhook must verify vendor signature/shared secret before processing.",
    };
  }

  if (lower.includes("email") || lower.includes("notify") || lower.includes("notification") || lower.includes("push") || lower.includes("comms")) {
    return {
      category: "communications",
      recommended_verify_jwt: true,
      risk_level: "external_side_effect",
      agent_callable: lower === "email-digest-builder",
      requires_signature: false,
      requires_internal_secret: true,
      requires_human_approval: lower !== "email-digest-builder",
      requires_idempotency_key: true,
      notes: lower === "email-digest-builder"
        ? "Draft/digest preparation can be agent-callable; external send remains approval-gated."
        : "External communication should not be public-callable.",
    };
  }

  if (lower.includes("emergency") || lower.includes("panic")) {
    return {
      category: "emergency_dispatch",
      recommended_verify_jwt: true,
      risk_level: "emergency",
      agent_callable: false,
      requires_signature: false,
      requires_internal_secret: true,
      requires_human_approval: true,
      requires_idempotency_key: true,
      notes: "Emergency/dispatch escalation must stay human-approved unless a verified emergency workflow exists.",
    };
  }

  if (HIGH_RISK.has(lower)) {
    return {
      category: "high_risk_write",
      recommended_verify_jwt: true,
      risk_level: "internal_write",
      agent_callable: false,
      requires_signature: false,
      requires_internal_secret: true,
      requires_human_approval: true,
      requires_idempotency_key: true,
      notes: "Named high-risk function from the security audit; wrap through agent-skill-router before agent use.",
    };
  }

  if (hasAny(lower, PUBLIC_READ_PATTERNS)) {
    return {
      category: "public_read_or_event",
      recommended_verify_jwt: false,
      risk_level: "public_read",
      agent_callable: false,
      requires_signature: false,
      requires_internal_secret: false,
      requires_human_approval: false,
      requires_idempotency_key: lower.includes("track") || lower.includes("impression"),
      notes: "Can be public only with rate limits and no private data leakage.",
    };
  }

  if (hasAny(lower, CRON_WORKER_PATTERNS)) {
    return {
      category: "cron_worker",
      recommended_verify_jwt: true,
      risk_level: "internal_write",
      agent_callable: false,
      requires_signature: false,
      requires_internal_secret: true,
      requires_human_approval: false,
      requires_idempotency_key: true,
      notes: "Worker/cron function should require internal worker secret or service-role caller.",
    };
  }

  const agentCallable = AGENT_CANDIDATE.has(lower);
  const risk = usesServiceRole || lower.includes("claim") || lower.includes("match") ? "internal_write" : "internal_read";

  return {
    category: agentCallable ? "agent_skill_candidate" : "internal_function",
    recommended_verify_jwt: true,
    risk_level: risk,
    agent_callable: agentCallable,
    requires_signature: false,
    requires_internal_secret: !agentCallable,
    requires_human_approval: lower.includes("claim") || lower.includes("accept") || lower.includes("dispatch"),
    requires_idempotency_key: risk === "internal_write",
    notes: agentCallable
      ? "Candidate for controlled agent-skill-router access."
      : readsAuthHeader
        ? "Reads caller auth; confirm role/scope checks and RLS assumptions."
        : "Internal function should not be public-callable unless separately justified.",
  };
}

if (!existsSync(functionsDir)) {
  throw new Error(`Missing Supabase functions directory: ${functionsDir}`);
}

const functions = readdirSync(functionsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const slug = entry.name;
    const indexPath = join(functionsDir, slug, "index.ts");
    const source = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : "";
    const classification = classify(slug, source);
    return {
      slug,
      category: classification.category,
      current_verify_jwt: readCurrentVerifyJwt(slug),
      recommended_verify_jwt: classification.recommended_verify_jwt,
      risk_level: classification.risk_level,
      agent_callable: classification.agent_callable,
      requires_signature: classification.requires_signature,
      requires_internal_secret: classification.requires_internal_secret,
      requires_human_approval: classification.requires_human_approval,
      requires_idempotency_key: classification.requires_idempotency_key,
      uses_service_role_key: source.includes("SUPABASE_SERVICE_ROLE_KEY"),
      reads_authorization_header: source.includes("Authorization") || source.includes("auth.getUser"),
      has_index_ts: existsSync(indexPath),
      notes: classification.notes,
    };
  })
  .sort((a, b) => a.slug.localeCompare(b.slug));

const matrix = {
  generated_at: new Date().toISOString(),
  repo: "haulcommand-max/haul-command",
  source: "local supabase/functions directory",
  caveats: [
    "No per-function config.toml files were present in this repo, so current_verify_jwt is null unless a future config file is added.",
    "Risk classifications are deterministic local heuristics and should be reviewed before applying live Supabase settings.",
    "This matrix does not mutate deployed Supabase Edge Function configuration.",
  ],
  totals: {
    functions: functions.length,
    agent_callable: functions.filter((fn) => fn.agent_callable).length,
    high_risk: functions.filter((fn) =>
      ["external_side_effect", "financial", "admin", "emergency"].includes(fn.risk_level),
    ).length,
    service_role_users: functions.filter((fn) => fn.uses_service_role_key).length,
  },
  functions,
};

mkdirSync(join(root, "supabase"), { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(matrix, null, 2)}\n`);
console.log(`Wrote ${outputPath} (${functions.length} functions).`);
