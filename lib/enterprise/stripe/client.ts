import Stripe from "stripe";

export function getStripe(): Stripe {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("Missing STRIPE_SECRET_KEY");
    return new Stripe(key, {
        apiVersion: "2026-02-25.clover", // keep pinned; change if your project pins differently
        typescript: true,
    });
}
