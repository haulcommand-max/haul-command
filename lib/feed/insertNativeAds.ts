// lib/feed/insertNativeAds.ts
// ══════════════════════════════════════════════════════════════
// Feed Ad Interleaver — Haul Command
//
// Zero-scroll-jank client-side ad insertion.
// Inserts NativeAdCard slots every Nth item in any feed.
// Used by: LiveLoadFeed, DirectoryResults, EscortFeed.
//
// Usage:
//   const rows = interleaveNativeAds(escorts, {
//     everyNth: 5,
//     placement: "directory_inline",
//     startAfter: 5,
//     maxAds: 6,
//   });
//   rows.map(row =>
//     row.kind === "ad"
//       ? <NativeAdCard placement={row.placement} />
//       : <EscortCard escort={row.item} />
//   )
// ══════════════════════════════════════════════════════════════

export type FeedRow<T> =
    | { kind: "item"; item: T; index: number }
    | { kind: "ad"; placement: string; slotIndex: number };

export interface InterleaveOptions {
    /** Insert an ad every N items. Default 5. */
    everyNth: number;
    /** GA4 placement label: "directory_inline" | "load_feed_inline" | "hub_banner" */
    placement: string;
    /** Start inserting after this many items. Default = everyNth. */
    startAfter?: number;
    /** Hard cap on total ad slots injected. Default 999 (uncapped). */
    maxAds?: number;
}

export function interleaveNativeAds<T>(
    items: T[],
    opts: InterleaveOptions,
): FeedRow<T>[] {
    const { everyNth, placement, startAfter = everyNth, maxAds = 999 } = opts;

    const out: FeedRow<T>[] = [];
    let adCount = 0;

    for (let i = 0; i < items.length; i++) {
        out.push({ kind: "item", item: items[i], index: i });

        const itemIndex1 = i + 1;
        const shouldInsert =
            itemIndex1 >= startAfter && itemIndex1 % everyNth === 0;

        if (shouldInsert && adCount < maxAds) {
            out.push({ kind: "ad", placement, slotIndex: adCount });
            adCount++;
        }
    }

    return out;
}

// ── Placement constants ───────────────────────────────────────
// Keep in sync with GA4 schema (ad_impression event.params.placement)

export const AD_PLACEMENTS = {
    DIRECTORY_INLINE: "directory_inline",
    DIRECTORY_SIDEBAR: "directory_sidebar",
    LOAD_FEED_INLINE: "load_feed_inline",
    LEADERBOARD_INLINE: "leaderboard_inline",
    HUB_BANNER: "hub_banner",
} as const;

export type AdPlacement = typeof AD_PLACEMENTS[keyof typeof AD_PLACEMENTS];
