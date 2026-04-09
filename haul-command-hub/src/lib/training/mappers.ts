/**
 * Haul Command — Training Mappers
 * Transforms raw RPC payloads into display-ready view models.
 */
import type {
  TrainingCatalogItem,
  TrainingLevel,
  TrainingModule,
  TrainingPricing,
  TrainingBadgeSlug,
} from './types';
import { BADGE_META } from './types';

// ─── Pricing display ─────────────────────────────────────────
export function formatTrainingPrice(pricing: TrainingPricing): string {
  const sym = pricing.currency === 'usd' ? '$' : pricing.currency?.toUpperCase();
  if (pricing.subscription) {
    return `${sym}${pricing.subscription}/${pricing.period ?? 'mo'}`;
  }
  if (pricing.one_time) {
    return `${sym}${pricing.one_time} one-time`;
  }
  if (pricing.seat_based) {
    return `From ${sym}${pricing.one_time ?? '—'}/seat`;
  }
  return 'Contact us';
}

export function getAnnualRefreshLabel(pricing: TrainingPricing): string | null {
  if (!pricing.annual_refresh) return null;
  const sym = pricing.currency === 'usd' ? '$' : pricing.currency?.toUpperCase();
  return `${sym}${pricing.annual_refresh}/yr refresh`;
}

// ─── Level card view model ────────────────────────────────────
export interface LevelCardVM {
  slug: string;
  name: string;
  description: string;
  badgeSlug: TrainingBadgeSlug;
  badgeLabel: string;
  badgeDescription: string;
  priceLabel: string;
  annualRefreshLabel: string | null;
  rankWeightPct: string;
  trustWeightPct: string;
  href: string;
  isMostPopular: boolean;
}

export function mapLevelToCardVM(
  level: TrainingLevel,
  catalog: TrainingCatalogItem,
): LevelCardVM {
  const meta = BADGE_META[level.badge_slug];
  return {
    slug: level.level_slug,
    name: level.level_name,
    description: level.description ?? '',
    badgeSlug: level.badge_slug,
    badgeLabel: meta?.label ?? level.badge_slug,
    badgeDescription: meta?.description ?? '',
    priceLabel: formatTrainingPrice(level.pricing_json),
    annualRefreshLabel: getAnnualRefreshLabel(level.pricing_json),
    rankWeightPct: `+${(level.rank_weight * 100).toFixed(0)}%`,
    trustWeightPct: `+${(level.trust_weight * 100).toFixed(0)}%`,
    href: `/training/levels/${level.level_slug}`,
    isMostPopular: level.badge_slug === 'certified',
  };
}

// ─── Module card view model ───────────────────────────────────
export interface ModuleCardVM {
  slug: string;
  title: string;
  summary: string;
  hoursLabel: string;
  sortOrder: number;
  href: string;
}

export function mapModuleToCardVM(module: TrainingModule): ModuleCardVM {
  return {
    slug: module.slug,
    title: module.title,
    summary: module.summary ?? '',
    hoursLabel: `${module.hours}h`,
    sortOrder: module.sort_order,
    href: `/training/modules/${module.slug}`,
  };
}

// ─── Upgrade CTA logic ───────────────────────────────────────
export function getUpgradeCTA(currentBadge: TrainingBadgeSlug | null): {
  label: string;
  href: string;
  isUrgent: boolean;
} {
  if (!currentBadge) {
    return { label: 'Start with Road Ready — $49', href: '/training/levels/road-ready', isUrgent: false };
  }
  switch (currentBadge) {
    case 'road_ready':
      return { label: 'Upgrade to Certified — $149', href: '/training/levels/certified', isUrgent: false };
    case 'certified':
      return { label: 'Upgrade to Elite — $29/mo', href: '/training/levels/elite', isUrgent: false };
    case 'elite':
      return { label: 'Explore AV-Ready — $199', href: '/training/levels/av-ready', isUrgent: false };
    case 'av_ready':
      return { label: 'Explore Team Plans', href: '/training/enterprise', isUrgent: false };
  }
}

// ─── Claim pressure training upsell ──────────────────────────
export function getClaimTrainingUpsell(context: 'before_claim' | 'mid_claim' | 'after_claim' | 'profile_completion'): {
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
} {
  switch (context) {
    case 'before_claim':
      return {
        headline: 'Claim your listing to unlock training-linked profile benefits.',
        body: 'Certified and Elite badges are only visible on claimed profiles. Claim first, then get certified.',
        ctaLabel: 'Claim Your Profile',
        ctaHref: '/claim',
      };
    case 'mid_claim':
      return {
        headline: 'Complete training to improve rank and trust visibility.',
        body: 'Operators with Certified or Elite badges rank higher in directory search and are preferred by brokers.',
        ctaLabel: 'Browse Training',
        ctaHref: '/training',
      };
    case 'after_claim':
      return {
        headline: 'Recommended next: Earn your Certified badge.',
        body: 'Your profile is claimed. Now get certified to unlock broker-visible trust signals and improve your search rank.',
        ctaLabel: 'Get Certified — $149',
        ctaHref: '/training/levels/certified',
      };
    case 'profile_completion':
      return {
        headline: 'Add training to boost your visibility.',
        body: 'Profiles with a Certified or Elite badge appear higher in search and are more likely to receive broker inquiries.',
        ctaLabel: 'Start Training',
        ctaHref: '/training',
      };
  }
}
