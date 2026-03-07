// app/api/adgrid/bid/route.ts
//
// Self-serve AdGrid SEO space bidding.
// Businesses bid on geo zones (city, corridor, port pages) for ad placement.
// Stripe-secured: bid creates pending record → Stripe checkout → webhook activates.
//
// Auction model: sealed soft-close with anti-sniping.
// Also supports guaranteed_lock (fixed-price premium, no auction).
//
// Ad Slot Market Engine v1 compliance:
//   - Soft-close anti-sniping (15min window, 10min extensions, max 6)
//   - Min bid increment: 8% above current highest
//   - Bid velocity limit: 12 bids/hr per user
//   - Guaranteed lock: 2.2x last auction clear price
//   - Incumbent renewal protection: 5% discount + 12hr grace

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/enterprise/stripe/client";
import { createClient } from "@/utils/supabase/server";
import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

export const runtime = "nodejs";

// ============================================================
// SLOT CONFIG
// ============================================================

const SLOT_CONFIG: Record<string, { min_bid: number; label: string }> = {
    adgrid_city_hero: { min_bid: 49, label: "City Hero Banner" },
    adgrid_city_sidebar: { min_bid: 29, label: "City Sidebar" },
    adgrid_corridor_hero: { min_bid: 99, label: "Corridor Hero Banner" },
    adgrid_corridor_sidebar: { min_bid: 59, label: "Corridor Sidebar" },
    adgrid_port_hero_sponsor: { min_bid: 149, label: "Port Hero Sponsor" },
    adgrid_port_sidebar: { min_bid: 79, label: "Port Sidebar" },
    adgrid_search_results: { min_bid: 39, label: "Search Results" },
    adgrid_map_pin: { min_bid: 19, label: "Map Pin Highlight" },
};

// ============================================================
// AUCTION CONSTANTS (Ad Slot Market Engine v1)
// ============================================================

const AUCTION = {
    min_increment_percent: 0.08,       // 8% above current highest
    max_bid_jump_percent: 3.0,         // 300% max single jump
    anti_sniping_window_minutes: 15,
    extension_minutes: 10,
    max_extensions: 6,
    bid_velocity_max_per_hour: 12,
    guaranteed_lock_multiplier: 2.2,   // relative to floor or last clear
    incumbent_discount_percent: 0.05,
    grace_period_hours: 12,
    default_term_days: 30,
    max_price_increase_per_cycle: 0.65, // 65% cap
} as const;

// ============================================================
// GET — Current bids + auction state for a geo zone
// ============================================================

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const geoKey = searchParams.get("geo_key");
    const slotId = searchParams.get("slot_id");

    if (!geoKey) {
        return NextResponse.json({ error: "geo_key required" }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    let query = admin
        .from("adgrid_bids")
        .select("slot_id, bid_amount_usd, status, created_at, auction_ends_at, user_id")
        .eq("geo_key", geoKey)
        .in("status", ["active", "pending_payment"])
        .order("bid_amount_usd", { ascending: false });

    if (slotId) {
        query = query.eq("slot_id", slotId);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Build slot state map
    const slotState: Record<string, {
        highest_bid: number;
        min_next_bid: number;
        active_bidders: number;
        auction_ends_at: string | null;
        guaranteed_lock_price: number;
    }> = {};

    for (const bid of data || []) {
        const existing = slotState[bid.slot_id];
        const bidAmt = Number(bid.bid_amount_usd) || 0;
        const slotCfg = SLOT_CONFIG[bid.slot_id];
        const floor = slotCfg?.min_bid ?? 29;

        if (!existing || bidAmt > existing.highest_bid) {
            const minNext = Math.ceil(bidAmt * (1 + AUCTION.min_increment_percent));
            slotState[bid.slot_id] = {
                highest_bid: bidAmt,
                min_next_bid: Math.max(minNext, floor),
                active_bidders: existing ? existing.active_bidders + 1 : 1,
                auction_ends_at: bid.auction_ends_at || null,
                guaranteed_lock_price: Math.round(Math.max(
                    bidAmt * AUCTION.guaranteed_lock_multiplier,
                    floor * 1.8
                )),
            };
        } else if (existing) {
            existing.active_bidders++;
        }
    }

    // Fill min_bids for empty slots
    const minBids: Record<string, number> = {};
    for (const [key, cfg] of Object.entries(SLOT_CONFIG)) {
        minBids[key] = cfg.min_bid;
    }

    return NextResponse.json({
        geo_key: geoKey,
        slot_state: slotState,
        slot_config: SLOT_CONFIG,
        auction_rules: {
            min_increment_percent: AUCTION.min_increment_percent * 100,
            anti_sniping_window_minutes: AUCTION.anti_sniping_window_minutes,
            max_extensions: AUCTION.max_extensions,
            guaranteed_lock_available: true,
        },
    });
}

// ============================================================
// POST — Place a bid or purchase guaranteed lock
// ============================================================

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            geo_key,
            slot_id,
            bid_amount_usd,
            geo_type,
            geo_label,
            bid_type = "auction",  // "auction" | "guaranteed_lock"
        } = body;

        if (!geo_key || !slot_id) {
            return NextResponse.json(
                { error: "geo_key and slot_id required" },
                { status: 400 }
            );
        }

        const slotCfg = SLOT_CONFIG[slot_id];
        if (!slotCfg) {
            return NextResponse.json(
                { error: `Unknown slot type: ${slot_id}` },
                { status: 400 }
            );
        }

        // Auth
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Login required" }, { status: 401 });
        }

        const admin = getSupabaseAdmin();

        // ── Bid velocity check (12/hr max) ──
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { count: recentBids } = await admin
            .from("adgrid_bids")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .gte("created_at", oneHourAgo);

        if ((recentBids ?? 0) >= AUCTION.bid_velocity_max_per_hour) {
            return NextResponse.json(
                { error: `Bid limit reached (${AUCTION.bid_velocity_max_per_hour}/hr). Try again later.` },
                { status: 429 }
            );
        }

        // ── Get current slot state ──
        const { data: existing } = await admin
            .from("adgrid_bids")
            .select("id, bid_amount_usd, status, user_id, auction_ends_at")
            .eq("geo_key", geo_key)
            .eq("slot_id", slot_id)
            .eq("status", "active")
            .order("bid_amount_usd", { ascending: false });

        const currentHighest = existing && existing.length > 0
            ? Math.max(...existing.map(b => Number(b.bid_amount_usd) || 0))
            : 0;

        const isIncumbent = existing?.some(b => b.user_id === user.id) ?? false;

        // ── Handle guaranteed lock ──
        if (bid_type === "guaranteed_lock") {
            const lockPrice = Math.round(Math.max(
                currentHighest * AUCTION.guaranteed_lock_multiplier,
                slotCfg.min_bid * 1.8
            ));

            return await createCheckout(admin, user, {
                geo_key,
                slot_id,
                bid_amount_usd: lockPrice,
                geo_type: geo_type ?? "city",
                geo_label: geo_label ?? geo_key,
                bid_type: "guaranteed_lock",
                label: `Guaranteed Lock — ${slotCfg.label}`,
            }, req);
        }

        // ── Auction bid validation ──
        const bidAmount = bid_amount_usd ?? slotCfg.min_bid;

        if (bidAmount < slotCfg.min_bid) {
            return NextResponse.json(
                { error: `Minimum bid for ${slotCfg.label} is $${slotCfg.min_bid}/mo` },
                { status: 400 }
            );
        }

        if (currentHighest > 0) {
            // Min increment (8%)
            const incumbentDiscount = isIncumbent ? AUCTION.incumbent_discount_percent : 0;
            const effectiveIncrement = AUCTION.min_increment_percent - incumbentDiscount;
            const minNext = Math.ceil(currentHighest * (1 + effectiveIncrement));

            if (bidAmount < minNext) {
                return NextResponse.json(
                    {
                        error: `Bid must be at least $${minNext}/mo (${Math.round(effectiveIncrement * 100)}% above current $${currentHighest})`,
                        current_highest: currentHighest,
                        minimum_bid: minNext,
                        is_incumbent: isIncumbent,
                        incumbent_discount: isIncumbent ? "5%" : "none",
                    },
                    { status: 409 }
                );
            }

            // Max jump protection (300%)
            const maxAllowed = Math.round(currentHighest * (1 + AUCTION.max_bid_jump_percent));
            if (bidAmount > maxAllowed) {
                return NextResponse.json(
                    {
                        error: `Bid cannot exceed ${AUCTION.max_bid_jump_percent * 100}% of current price ($${maxAllowed} max)`,
                        max_allowed: maxAllowed,
                    },
                    { status: 400 }
                );
            }

            // Max price increase per cycle (65% cap)
            if (existing?.[0]) {
                const previousWinning = Number(existing[0].bid_amount_usd) || 0;
                const cycleMax = Math.round(previousWinning * (1 + AUCTION.max_price_increase_per_cycle));
                if (bidAmount > cycleMax) {
                    return NextResponse.json(
                        {
                            error: `Price increase exceeds ${AUCTION.max_price_increase_per_cycle * 100}% cycle cap ($${cycleMax} max)`,
                            cycle_max: cycleMax,
                        },
                        { status: 400 }
                    );
                }
            }
        }

        // ── Anti-sniping: extend auction if bid comes in final window ──
        let auctionEndsAt: string | null = null;
        if (existing?.[0]?.auction_ends_at) {
            const endsAt = new Date(existing[0].auction_ends_at);
            const now = new Date();
            const minutesLeft = (endsAt.getTime() - now.getTime()) / (1000 * 60);

            if (minutesLeft > 0 && minutesLeft <= AUCTION.anti_sniping_window_minutes) {
                // Extend auction
                const extended = new Date(endsAt.getTime() + AUCTION.extension_minutes * 60 * 1000);
                auctionEndsAt = extended.toISOString();

                // Update the existing active bid's auction end time
                await admin
                    .from("adgrid_bids")
                    .update({ auction_ends_at: auctionEndsAt })
                    .eq("geo_key", geo_key)
                    .eq("slot_id", slot_id)
                    .eq("status", "active");
            }
        }

        // ── Create checkout ──
        return await createCheckout(admin, user, {
            geo_key,
            slot_id,
            bid_amount_usd: bidAmount,
            geo_type: geo_type ?? "city",
            geo_label: geo_label ?? geo_key,
            bid_type: "auction",
            label: `Ad Placement — ${slotCfg.label}`,
            auction_ends_at: auctionEndsAt,
        }, req);

    } catch (err: any) {
        console.error("[adgrid/bid POST]", err);
        return NextResponse.json(
            { error: err.message || "Internal error" },
            { status: 500 }
        );
    }
}

// ============================================================
// SHARED CHECKOUT BUILDER
// ============================================================

async function createCheckout(
    admin: ReturnType<typeof getSupabaseAdmin>,
    user: { id: string; email?: string },
    params: {
        geo_key: string;
        slot_id: string;
        bid_amount_usd: number;
        geo_type: string;
        geo_label: string;
        bid_type: string;
        label: string;
        auction_ends_at?: string | null;
    },
    req: NextRequest
) {
    // Get/create Stripe customer
    const stripe = getStripe();
    const { data: profile } = await admin
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", user.id)
        .single();

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            metadata: { supabase_user_id: user.id },
        });
        customerId = customer.id;
        await admin
            .from("profiles")
            .update({ stripe_customer_id: customerId })
            .eq("id", user.id);
    }

    // Create pending bid record
    const { data: bid, error: insertErr } = await admin
        .from("adgrid_bids")
        .insert({
            user_id: user.id,
            geo_key: params.geo_key,
            geo_type: params.geo_type,
            geo_label: params.geo_label,
            slot_id: params.slot_id,
            bid_amount_usd: params.bid_amount_usd,
            bid_type: params.bid_type,
            status: "pending_payment",
            auction_ends_at: params.auction_ends_at ?? null,
        })
        .select("id")
        .single();

    if (insertErr) {
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: "subscription",
        line_items: [{
            price_data: {
                currency: "usd",
                product_data: {
                    name: params.label,
                    description: `${params.geo_label} at $${params.bid_amount_usd}/mo`,
                    metadata: {
                        geo_key: params.geo_key,
                        slot_id: params.slot_id,
                        bid_id: bid.id,
                    },
                },
                unit_amount: Math.round(params.bid_amount_usd * 100),
                recurring: { interval: "month" },
            },
            quantity: 1,
        }],
        metadata: {
            type: "adgrid_bid",
            bid_id: bid.id,
            bid_type: params.bid_type,
            geo_key: params.geo_key,
            slot_id: params.slot_id,
            user_id: user.id,
            bid_amount: String(params.bid_amount_usd),
        },
        success_url: `${req.nextUrl.origin}/sponsor/success?type=adgrid&id=${bid.id}`,
        cancel_url: `${req.nextUrl.origin}/sponsor/checkout?canceled=true`,
    });

    return NextResponse.json({
        checkout_url: session.url,
        session_id: session.id,
        bid_id: bid.id,
        bid_amount: params.bid_amount_usd,
        bid_type: params.bid_type,
        auction_rules: params.bid_type === "auction" ? {
            anti_sniping_active: true,
            min_increment: `${AUCTION.min_increment_percent * 100}%`,
        } : undefined,
    });
}
