// Haul Command — NativeAd Feed Interleaving Logic
// Zero-scroll-lag ad insertion into any feed (Directory, Load Board, etc.)

export type FeedRow<T> =
    | { kind: 'item'; item: T }
    | { kind: 'ad'; placement: string; slotIndex: number };

/**
 * Interleaves NativeAdCard slots into a feed of items.
 *
 * @param items       — Array of feed items (escorts, jobs, etc.)
 * @param opts.everyNth    — Insert ad every Nth item (e.g., 5)
 * @param opts.placement   — GA4 placement string (e.g., "directory_inline")
 * @param opts.startAfter  — Insert first ad after this many items (default: everyNth)
 * @param opts.maxAds      — Cap total ads inserted (default: 999)
 *
 * Usage:
 *   const rows = interleaveNativeAds(escorts, { everyNth: 5, placement: 'directory_inline' });
 *   rows.map(row => row.kind === 'ad' ? <NativeAdCard ... /> : <EscortCard ... />)
 */
export function interleaveNativeAds<T>(
    items: T[],
    opts: {
        everyNth: number;
        placement: string;
        startAfter?: number;
        maxAds?: number;
    }
): FeedRow<T>[] {
    const { everyNth, placement, startAfter = everyNth, maxAds = 999 } = opts;

    const out: FeedRow<T>[] = [];
    let adCount = 0;

    for (let i = 0; i < items.length; i++) {
        out.push({ kind: 'item', item: items[i] });

        const itemIndex1 = i + 1; // 1-based
        const shouldInsert =
            itemIndex1 >= startAfter && itemIndex1 % everyNth === 0;

        if (shouldInsert && adCount < maxAds) {
            out.push({ kind: 'ad', placement, slotIndex: adCount });
            adCount++;
        }
    }

    return out;
}

// ─── Placement Constants ───
// Use these across the app for consistent GA4 tracking

export const AD_PLACEMENTS = {
    DIRECTORY_INLINE: 'directory_inline',
    DIRECTORY_SIDEBAR: 'directory_sidebar',
    LEADERBOARD_INLINE: 'leaderboard_inline',
    LOAD_FEED_INLINE: 'load_feed_inline',
    HUB_BANNER: 'hub_banner',
    COUNTRY_HUB: 'country_hub_banner',
    SERVICE_PAGE: 'service_page_banner',
    GUIDE_PAGE: 'guide_page_banner',
} as const;

export const AD_VARIANTS = {
    NATIVE_CARD: 'native_card',
    SLOT_BANNER: 'slot_banner',
} as const;
