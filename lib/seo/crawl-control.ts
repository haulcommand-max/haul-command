
import { calculateUniquenessScore } from './content-engine';

/**
 * Module 4: Crawl Budget & Indexing Control
 * Purpose: Guide Googlebot to high-value pages; prune low-value via 'noindex'.
 */

export type RobotsDirective =
    | 'index, follow'
    | 'noindex, follow'
    | 'noindex, nofollow';

export type IndexingContext = {
    pageType: 'CITY_SERVICE' | 'PROVIDER' | 'LOAD' | 'SEARCH' | 'RADIUS';
    providersCount?: number;
    isVerified?: boolean;
    loadPostedDate?: string; // ISO
    radiusMiles?: number;
    uniquenessMetrics?: {
        introVariant: number;
        nearbyCityCount: number;
        providerCount: number;
        hasFaq: boolean;
    };
};

export function getRobotsDirective(ctx: IndexingContext): RobotsDirective {
    // 1. Global No-Index Rules
    if (ctx.pageType === 'SEARCH') return 'noindex, follow'; // Search results are always noindex

    // 2. Provider Profile Logic
    if (ctx.pageType === 'PROVIDER') {
        // Index only if verified OR has enough data to be useful?
        // Strategy: Index all for breadth, but maybe prune empty ones later?
        // User spec: "duplicate provider detection" -> handled in Module 2/7
        return 'index, follow';
    }

    // 3. Load Detail Logic (Expiration)
    if (ctx.pageType === 'LOAD') {
        if (!ctx.loadPostedDate) return 'noindex, follow';

        const posted = new Date(ctx.loadPostedDate);
        const now = new Date();
        const ageDays = (now.getTime() - posted.getTime()) / (1000 * 3600 * 24);

        // Expire after 21 days
        if (ageDays > 21) {
            return 'noindex, follow';
        }
        return 'index, follow';
    }

    // 4. City Service Page Logic (Thin Content Gate)
    if (ctx.pageType === 'CITY_SERVICE') {
        if (ctx.uniquenessMetrics) {
            const score = calculateUniquenessScore(ctx.uniquenessMetrics);
            // Threshold: 0.50 (User Spec: < 0.50 -> noindex)
            if (score < 0.50) {
                return 'noindex, follow';
            }
        }
        return 'index, follow';
    }

    // 5. Radius Page Logic
    if (ctx.pageType === 'RADIUS') {
        // Prune "thin" radius pages
        if ((ctx.providersCount || 0) < 3) {
            return 'noindex, follow';
        }
        return 'index, follow';
    }

    // Default High Value
    return 'index, follow';
}
