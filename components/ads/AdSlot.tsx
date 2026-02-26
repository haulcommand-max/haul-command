"use client";

interface AdSlotProps {
    placement: string; // e.g. 'directory_sidebar' | 'load_board_mid' | 'regulation_bottom'
    size?: 'banner' | 'sidebar' | 'inline' | 'leaderboard';
    className?: string;
    /** If true, renders a sponsor card instead of an ad unit */
    sponsorMode?: boolean;
    sponsorLabel?: string;
    sponsorUrl?: string;
}

const SIZE_DIMS: Record<string, { w: number; h: number; label: string }> = {
    banner: { w: 728, h: 90, label: '728×90' },
    sidebar: { w: 300, h: 250, label: '300×250' },
    inline: { w: 468, h: 60, label: '468×60' },
    leaderboard: { w: 728, h: 90, label: '728×90' },
};

/**
 * AdSlot — renders a programmatic ad unit placeholder.
 *
 * In production:
 *   1. Replace the inner div with your Google AdSense <ins> tag
 *   2. Set NEXT_PUBLIC_ADSENSE_PUBLISHER_ID in .env
 *   3. Include the AdSense script in layout.tsx
 *
 * The `placement` prop maps to a custom channel ID for reporting.
 */
export function AdSlot({
    placement,
    size = 'inline',
    className = '',
    sponsorMode = false,
    sponsorLabel,
    sponsorUrl,
}: AdSlotProps) {
    const dim = SIZE_DIMS[size] ?? SIZE_DIMS.inline;
    const publisherId = process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID ?? null;

    // Sponsor card mode (featured listing)
    if (sponsorMode && sponsorUrl) {
        return (
            <a
                href={sponsorUrl}
                target="_blank"
                rel="noopener sponsored"
                data-placement={placement}
                className={`block w-full bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 hover:bg-amber-500/10 transition-colors ${className}`}
            >
                <div className="text-[9px] font-bold text-amber-500/60 uppercase tracking-widest mb-1">Sponsored</div>
                <p className="text-sm font-semibold text-white">{sponsorLabel ?? 'Sponsored Listing'}</p>
            </a>
        );
    }

    // Production: Google AdSense
    if (publisherId) {
        return (
            <div
                className={`overflow-hidden ${className}`}
                data-placement={placement}
                style={{ minHeight: dim.h }}
            >
                {/* AdSense unit — swap `data-ad-slot` with your real slot ID */}
                <ins
                    className="adsbygoogle"
                    style={{ display: 'block', width: dim.w, height: dim.h }}
                    data-ad-client={publisherId}
                    data-ad-slot="REPLACE_WITH_SLOT_ID"
                    data-ad-format="auto"
                    data-full-width-responsive="true"
                />
            </div>
        );
    }

    // Dev / stub
    return (
        <div
            className={`flex items-center justify-center bg-slate-800/40 border border-dashed border-slate-700/60 rounded-xl text-slate-600 text-[10px] font-mono ${className}`}
            style={{ minHeight: dim.h + 'px' }}
            data-placement={placement}
            aria-hidden="true"
        >
            [{placement} · {dim.label}]
        </div>
    );
}
