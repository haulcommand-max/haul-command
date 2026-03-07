import crypto from "crypto";

export function sha256Hex(input: string): string {
    return crypto.createHash("sha256").update(input).digest("hex");
}

export function usageIdempotencyKey(args: {
    accountId: string;
    metricKey: string;
    usageDay: string; // YYYY-MM-DD
    rollupHash: string;
}): string {
    // Deterministic; safe to retry forever.
    const raw = `hc_usage:${args.accountId}:${args.metricKey}:${args.usageDay}:${args.rollupHash}`;
    // Keep keys short-ish; Stripe supports long keys but proxy layers sometimes don’t.
    return `hc_${sha256Hex(raw).slice(0, 48)}`;
}
