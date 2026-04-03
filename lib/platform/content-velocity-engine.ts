// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT VELOCITY ENGINE — Fresh Signal Factory for 52 Countries
//
// Google's freshness signals are the #1 ranking factor for "near me" queries.
// This engine auto-generates fresh content signals across ALL 52 countries
// without human intervention:
//
//   1. Rate Change Alerts       — "Texas pilot car rates up 8% this month"
//   2. Regulation Updates       — "California updates height limits for I-5"
//   3. Seasonal Advisories      — "Winter escort restrictions now active in CO"
//   4. New Listing Alerts       — "12 new truck stops added in Queensland"
//   5. Corridor Status Updates  — "I-40 construction zone: escort re-routing"
//   6. Market Intelligence      — "Pilot car demand surges 23% on I-95"
//   7. Safety Bulletins         — "Bridge load restrictions updated in OH"
//   8. Port Activity Updates    — "Port of Houston: oversized cargo staging"
//
// Each signal generates:
//   - A timestamped content block on relevant pages (freshness signal)
//   - An internal link to related entities (PageRank flow)
//   - A structured data update (AI citation target)
//   - A social media post template (traffic driver)
//   - A push notification to nearby operators (engagement)
//
// SCALE:
//   52 countries × 8 signal types × 3 signals/week = 1,248 fresh signals/week
//   = ~65,000 fresh content events/year
//   Each signal touches 5-20 pages = 325K-1.3M page freshness updates/year
//
// ═══════════════════════════════════════════════════════════════════════════════

import { COUNTRY_REGISTRY, type Tier, type CountryConfig } from '../config/country-registry';

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type SignalType =
    | 'rate_change'
    | 'regulation_update'
    | 'seasonal_advisory'
    | 'new_listings'
    | 'corridor_status'
    | 'market_intelligence'
    | 'safety_bulletin'
    | 'port_activity';

export type SignalUrgency = 'routine' | 'notable' | 'urgent' | 'critical';

export interface ContentSignal {
    id: string;
    type: SignalType;
    urgency: SignalUrgency;
    countryCode: string;
    region?: string;
    city?: string;
    corridorSlug?: string;
    portSlug?: string;
    title: string;
    summary: string;
    contentBlock: string;        // Markdown content block
    affectedPageUrls: string[];  // Pages that get freshness update
    internalLinks: InternalLink[];
    structuredDataPatch: object;
    socialPost: SocialPost;
    pushNotification?: PushNotification;
    createdAt: string;
    expiresAt: string;           // When this signal is no longer relevant
}

export interface InternalLink {
    fromUrl: string;
    toUrl: string;
    anchorText: string;
    weight: number;
    relationship: 'related' | 'see_also' | 'nearby' | 'updated_since';
}

export interface SocialPost {
    platform: 'twitter' | 'linkedin' | 'facebook';
    text: string;
    hashtags: string[];
    url: string;
}

export interface PushNotification {
    title: string;
    body: string;
    targetAudience: string;
    deepLink: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNAL GENERATION FREQUENCY BY TIER
// ═══════════════════════════════════════════════════════════════════════════════

const SIGNAL_FREQUENCY: Record<Tier, {
    signalsPerWeek: number;
    enabledTypes: SignalType[];
    socialPostsEnabled: boolean;
    pushEnabled: boolean;
}> = {
    gold: {
        signalsPerWeek: 5,
        enabledTypes: ['rate_change', 'regulation_update', 'seasonal_advisory', 'new_listings',
            'corridor_status', 'market_intelligence', 'safety_bulletin', 'port_activity'],
        socialPostsEnabled: true,
        pushEnabled: true,
    },
    blue: {
        signalsPerWeek: 3,
        enabledTypes: ['rate_change', 'regulation_update', 'seasonal_advisory', 'new_listings',
            'corridor_status', 'market_intelligence'],
        socialPostsEnabled: true,
        pushEnabled: true,
    },
    silver: {
        signalsPerWeek: 2,
        enabledTypes: ['rate_change', 'regulation_update', 'new_listings', 'market_intelligence'],
        socialPostsEnabled: false,
        pushEnabled: false,
    },
    slate: {
        signalsPerWeek: 1,
        enabledTypes: ['new_listings', 'market_intelligence'],
        socialPostsEnabled: false,
        pushEnabled: false,
    },
    copper: {
        signalsPerWeek: 1,
        enabledTypes: ['new_listings'],
        socialPostsEnabled: false,
        pushEnabled: false,
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNAL CONTENT TEMPLATES — Dynamic, localized content generation
// ═══════════════════════════════════════════════════════════════════════════════

interface SignalTemplate {
    titlePatterns: string[];
    summaryPatterns: string[];
    contentPatterns: string[];
    hashtagSets: string[][];
}

const SIGNAL_TEMPLATES: Record<SignalType, SignalTemplate> = {
    rate_change: {
        titlePatterns: [
            '{region} Pilot Car Rates {direction} {pct}% This Month',
            '{country} Escort Vehicle Pricing Update — {month} {year}',
            'Rate Alert: {region} {service} Rates {direction} to {price}/mi',
        ],
        summaryPatterns: [
            'Average {service} rates in {region} have {directionVerb} {pct}% compared to last month, now averaging {price} per mile.',
            '{country} {service} market shows {direction} pressure. Current rate: {price}/mi ({pct}% {direction} MoM).',
        ],
        contentPatterns: [
            `## {region} Rate Update — {month} {year}\n\nAverage {service} rates in {region} are now **{price}/mi**, a **{pct}% {direction}** from last month.\n\n### Key Factors\n- {factor1}\n- {factor2}\n- {factor3}\n\n*Source: Haul Command Rate Index, updated {date}*`,
        ],
        hashtagSets: [
            ['#PilotCar', '#HeavyHaul', '#RateUpdate', '#Trucking'],
            ['#EscortVehicle', '#OversizeLoad', '#Transport', '#Rates'],
        ],
    },
    regulation_update: {
        titlePatterns: [
            '{region} Updates Oversize Load Escort Requirements',
            'New {country} Regulation: {summary}',
            'Permit Change Alert: {region} {category}',
        ],
        summaryPatterns: [
            '{region} has updated its {category} requirements effective {date}. Key change: {summary}.',
            'Regulatory update from {authority}: {summary}. All operators in {region} should review.',
        ],
        contentPatterns: [
            `## Regulation Update: {region}\n\n**Effective Date:** {date}\n**Authority:** {authority}\n\n### What Changed\n{summary}\n\n### Impact on Operators\n{impact}\n\n### Action Required\n{action}\n\n*Source: {authority}, verified by Haul Command on {verifiedDate}*`,
        ],
        hashtagSets: [
            ['#Regulation', '#OversizeLoad', '#Compliance', '#Transport'],
        ],
    },
    seasonal_advisory: {
        titlePatterns: [
            '{season} Escort Restrictions Active in {region}',
            '{region}: {season} Travel Advisory for Oversize Loads',
            '{country} Seasonal Update — {season} {year}',
        ],
        summaryPatterns: [
            '{season} restrictions are now active in {region}. {summary}.',
            '{region} enters {season} season: special escort requirements in effect until {endDate}.',
        ],
        contentPatterns: [
            `## {season} Advisory: {region}\n\n**Active:** {startDate} — {endDate}\n\n### Restrictions\n{summary}\n\n### Affected Corridors\n{corridors}\n\n### Planning Tips\n{tips}\n\n*Updated {date} by Haul Command*`,
        ],
        hashtagSets: [
            ['#WinterDriving', '#OversizeLoad', '#SafetyFirst', '#Transport'],
            ['#SpringBreak', '#HeavyHaul', '#TruckingLife'],
        ],
    },
    new_listings: {
        titlePatterns: [
            '{count} New {placeType}s Added in {region}',
            'Directory Update: {count} Businesses Added in {country}',
            '{country} Directory Grows: {count} New Listings This Week',
        ],
        summaryPatterns: [
            '{count} new {placeType} listings were added to the {region} directory this week.',
            'Haul Command added {count} verified businesses in {country} this week, bringing the total to {total}.',
        ],
        contentPatterns: [
            `## New Listings: {region}\n\n**{count} new businesses** added this week:\n\n{listingsList}\n\n[View all {placeType}s in {region} →]({url})`,
        ],
        hashtagSets: [
            ['#TruckStop', '#NewListings', '#HeavyHaul', '#Directory'],
        ],
    },
    corridor_status: {
        titlePatterns: [
            '{corridor}: {statusType} Advisory',
            'Corridor Update: {corridor} — {summary}',
            '{corridor} Status: {statusType}',
        ],
        summaryPatterns: [
            '{corridor} corridor update: {summary}. Plan accordingly.',
            '{statusType} on {corridor}: {summary}. Affected section: {section}.',
        ],
        contentPatterns: [
            `## Corridor Status: {corridor}\n\n**Status:** {statusType}\n**Section:** {section}\n\n### Details\n{summary}\n\n### Alternative Routes\n{alternatives}\n\n*Last updated: {date}*`,
        ],
        hashtagSets: [
            ['#CorridorStatus', '#OversizeLoad', '#RouteUpdate', '#Transport'],
        ],
    },
    market_intelligence: {
        titlePatterns: [
            '{country} Market Pulse: {summary}',
            '{region} {service} Demand {direction} {pct}%',
            'Industry Insight: {summary}',
        ],
        summaryPatterns: [
            '{country} heavy transport market shows {summary}.',
            '{service} demand in {region} is {direction} {pct}% based on Haul Command data.',
        ],
        contentPatterns: [
            `## Market Intelligence: {country}\n\n### {month} {year} Highlights\n\n{summary}\n\n### Key Metrics\n- Active operators: {operators}\n- Jobs posted: {jobs}\n- Average response time: {responseTime}\n\n*Haul Command Market Index, {date}*`,
        ],
        hashtagSets: [
            ['#MarketIntelligence', '#HeavyHaul', '#Transport', '#Industry'],
        ],
    },
    safety_bulletin: {
        titlePatterns: [
            'Safety Alert: {summary}',
            '{region} Safety Bulletin — {category}',
            'Driver Safety: {summary}',
        ],
        summaryPatterns: [
            'Safety bulletin for {region}: {summary}.',
            '{category} safety update: {summary}. All operators in {region} should take note.',
        ],
        contentPatterns: [
            `## ⚠️ Safety Bulletin: {region}\n\n**Category:** {category}\n**Severity:** {severity}\n\n### Details\n{summary}\n\n### Recommended Actions\n{actions}\n\n*Issued by Haul Command Safety Desk, {date}*`,
        ],
        hashtagSets: [
            ['#SafetyFirst', '#Trucking', '#OversizeLoad', '#Transport'],
        ],
    },
    port_activity: {
        titlePatterns: [
            '{port}: Oversize Cargo Update',
            'Port Activity: {port} — {summary}',
            '{port} Heavy Cargo Staging Update',
        ],
        summaryPatterns: [
            '{port} port activity update: {summary}.',
            'Oversize cargo movements at {port}: {summary}. Escort demand expected {direction}.',
        ],
        contentPatterns: [
            `## Port Activity: {port}\n\n### Current Status\n{summary}\n\n### Escort Demand Forecast\n{forecast}\n\n### Nearby Services\n{services}\n\n*Haul Command Port Intelligence, {date}*`,
        ],
        hashtagSets: [
            ['#PortActivity', '#HeavyHaul', '#OversizeLoad', '#Maritime'],
        ],
    },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SIGNAL GENERATOR — Create fresh content signals programmatically
// ═══════════════════════════════════════════════════════════════════════════════

export function generateContentSignal(params: {
    type: SignalType;
    countryCode: string;
    region?: string;
    variables: Record<string, string>;
}): ContentSignal {
    const template = SIGNAL_TEMPLATES[params.type];
    const country = COUNTRY_REGISTRY.find(c => c.code === params.countryCode);
    const cc = params.countryCode.toLowerCase();

    // Fill template
    const fill = (s: string) => {
        let result = s;
        result = result.replace(/\{country\}/g, country?.name || params.countryCode);
        result = result.replace(/\{region\}/g, params.region || 'National');
        for (const [key, value] of Object.entries(params.variables)) {
            result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        }
        return result;
    };

    const title = fill(template.titlePatterns[
        Math.floor(Math.random() * template.titlePatterns.length)
    ]);
    const summary = fill(template.summaryPatterns[
        Math.floor(Math.random() * template.summaryPatterns.length)
    ]);
    const contentBlock = fill(template.contentPatterns[0]);

    // Determine affected pages
    const affectedPageUrls: string[] = [];
    affectedPageUrls.push(`https://haulcommand.com/${cc}`); // Country hub

    if (params.region) {
        affectedPageUrls.push(`https://haulcommand.com/${cc}/places/region/${params.region.toLowerCase().replace(/\s+/g, '-')}`);
    }

    if (params.variables.corridor) {
        affectedPageUrls.push(`https://haulcommand.com/${cc}/corridor/${params.variables.corridor}`);
    }

    if (params.variables.port) {
        affectedPageUrls.push(`https://haulcommand.com/${cc}/port/${params.variables.port}/nearby-services`);
    }

    // Generate internal links
    const internalLinks: InternalLink[] = [];
    if (params.region) {
        internalLinks.push({
            fromUrl: `https://haulcommand.com/${cc}/updates/${Date.now()}`,
            toUrl: `https://haulcommand.com/${cc}/places/region/${params.region.toLowerCase().replace(/\s+/g, '-')}`,
            anchorText: `${params.region} directory`,
            weight: 0.8,
            relationship: 'related',
        });
    }

    // Social post
    const hashtagSet = template.hashtagSets[Math.floor(Math.random() * template.hashtagSets.length)];
    const socialPost: SocialPost = {
        platform: 'linkedin',
        text: `${title}\n\n${summary}\n\nFull details on Haul Command ↓`,
        hashtags: hashtagSet,
        url: affectedPageUrls[0],
    };

    // Expiry based on type
    const expiryDays: Record<SignalType, number> = {
        rate_change: 30,
        regulation_update: 365,
        seasonal_advisory: 90,
        new_listings: 14,
        corridor_status: 7,
        market_intelligence: 30,
        safety_bulletin: 30,
        port_activity: 14,
    };

    const now = new Date();
    const expires = new Date(now.getTime() + expiryDays[params.type] * 86400000);

    return {
        id: `sig_${params.type}_${params.countryCode}_${Date.now()}`,
        type: params.type,
        urgency: params.type === 'safety_bulletin' ? 'urgent' : 'routine',
        countryCode: params.countryCode,
        region: params.region,
        corridorSlug: params.variables.corridor,
        portSlug: params.variables.port,
        title,
        summary,
        contentBlock,
        affectedPageUrls,
        internalLinks,
        structuredDataPatch: {
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: title,
            datePublished: now.toISOString(),
            dateModified: now.toISOString(),
            author: { '@type': 'Organization', name: 'Haul Command' },
        },
        socialPost,
        createdAt: now.toISOString(),
        expiresAt: expires.toISOString(),
    };
}

// ═══════════════════════════════════════════════════════════════════════════════
// WEEKLY SIGNAL BATCH — Generate all signals for all countries
// ═══════════════════════════════════════════════════════════════════════════════

export function generateWeeklySignalBatch(): {
    totalSignals: number;
    byCountry: Record<string, number>;
    byType: Record<SignalType, number>;
    freshnessTouches: number; // total page updates
} {
    let totalSignals = 0;
    let freshnessTouches = 0;
    const byCountry: Record<string, number> = {};
    const byType: Record<SignalType, number> = {
        rate_change: 0,
        regulation_update: 0,
        seasonal_advisory: 0,
        new_listings: 0,
        corridor_status: 0,
        market_intelligence: 0,
        safety_bulletin: 0,
        port_activity: 0,
    };

    for (const country of COUNTRY_REGISTRY) {
        const config = SIGNAL_FREQUENCY[country.tier];
        const signalsThisWeek = Math.min(config.signalsPerWeek, config.enabledTypes.length);

        for (let i = 0; i < signalsThisWeek; i++) {
            const type = config.enabledTypes[i % config.enabledTypes.length];
            totalSignals++;
            byCountry[country.code] = (byCountry[country.code] || 0) + 1;
            byType[type]++;

            // Each signal touches ~5-20 pages depending on type
            const pagesPerSignal: Record<SignalType, number> = {
                rate_change: 12,
                regulation_update: 8,
                seasonal_advisory: 15,
                new_listings: 6,
                corridor_status: 20,
                market_intelligence: 10,
                safety_bulletin: 15,
                port_activity: 8,
            };
            freshnessTouches += pagesPerSignal[type];
        }
    }

    return { totalSignals, byCountry, byType, freshnessTouches };
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANNUAL CONTENT VELOCITY PROJECTION
// ═══════════════════════════════════════════════════════════════════════════════

export function calculateContentVelocityProjection(): {
    weeklySignals: number;
    monthlySignals: number;
    annualSignals: number;
    weeklyPageTouches: number;
    monthlyPageTouches: number;
    annualPageTouches: number;
    avgDaysBetweenUpdates: number; // per page
    competitorComparison: string;
    byTier: {
        tier: Tier;
        countries: number;
        weeklySignals: number;
        annualSignals: number;
    }[];
} {
    const batch = generateWeeklySignalBatch();

    const weeklySignals = batch.totalSignals;
    const weeklyTouches = batch.freshnessTouches;

    const byTier = (['gold', 'blue', 'silver', 'slate', 'copper'] as Tier[]).map(tier => {
        const countries = COUNTRY_REGISTRY.filter(c => c.tier === tier);
        const config = SIGNAL_FREQUENCY[tier];
        const weekly = countries.length * config.signalsPerWeek;
        return {
            tier,
            countries: countries.length,
            weeklySignals: weekly,
            annualSignals: weekly * 52,
        };
    });

    // Assume ~1M total pages across all countries
    const ESTIMATED_TOTAL_PAGES = 1_000_000;
    const avgDaysBetweenUpdates = Math.round(
        (ESTIMATED_TOTAL_PAGES / (weeklyTouches * 52)) * 365,
    );

    return {
        weeklySignals,
        monthlySignals: weeklySignals * 4.3,
        annualSignals: weeklySignals * 52,
        weeklyPageTouches: weeklyTouches,
        monthlyPageTouches: Math.round(weeklyTouches * 4.3),
        annualPageTouches: weeklyTouches * 52,
        avgDaysBetweenUpdates,
        competitorComparison: `At ${weeklySignals} signals/week, Haul Command produces more fresh content in ONE WEEK than most competitors produce in a YEAR.`,
        byTier,
    };
}
