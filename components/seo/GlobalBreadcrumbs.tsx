'use client';
/**
 * components/seo/GlobalBreadcrumbs.tsx
 * Recursive breadcrumb component that:
 *  1. Parses the current URL path into segments
 *  2. Maps each segment to a human-readable label (from registry or title-case)
 *  3. Renders schema.org BreadcrumbList JSON-LD automatically
 *  4. Provides a mobile-safe clickable trail
 *
 * Usage:
 *   <GlobalBreadcrumbs />                        ← auto-parse from URL
 *   <GlobalBreadcrumbs crumbs={customCrumbs} />  ← explicit override
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface Crumb {
  label: string;
  href: string;
}

// Human-readable overrides for known path segments
const SEGMENT_LABELS: Record<string, string> = {
  '': 'Home',
  directory: 'Directory',
  rates: 'Rate Guides',
  corridors: 'Corridors',
  loads: 'Load Types',
  glossary: 'Glossary',
  regulations: 'Regulations',
  tools: 'Tools',
  training: 'Training',
  compliance: 'Compliance',
  'compliance-kit': 'Compliance Kit',
  gear: 'Gear Store',
  dashboard: 'Dashboard',
  operator: 'Operator',
  broker: 'Broker',
  claims: 'Claims',
  'available-now': 'Available Now',
  compare: 'Compare',
  insurance: 'Insurance',
  'fuel-cards': 'Fuel Cards',
  equipment: 'Equipment',
  quickpay: 'QuickPay',
  sponsor: 'Sponsor',
  community: 'Community',
  upgrade: 'Go Pro',
  // Country codes → display names
  us: 'United States',
  ca: 'Canada',
  au: 'Australia',
  gb: 'United Kingdom',
  za: 'South Africa',
  de: 'Germany',
  // Load types
  'wind-energy': 'Wind Energy',
  transformers: 'Power Transformers',
  'mining-equipment': 'Mining Equipment',
  aerospace: 'Aerospace',
  // Locale prefixes
  es: 'Español',
  fr: 'Français',
};

function toTitleCase(str: string): string {
  return str
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function buildCrumbs(pathname: string): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [{ label: 'Home', href: '/' }];

  let accumulatedPath = '';
  for (const segment of segments) {
    accumulatedPath += `/${segment}`;
    const label =
      SEGMENT_LABELS[segment.toLowerCase()] ?? toTitleCase(segment);
    crumbs.push({ label, href: accumulatedPath });
  }

  return crumbs;
}

interface Props {
  /** Override with explicit crumbs — useful for dynamic [slug] routes */
  crumbs?: Crumb[];
  /** Add a final non-linked label (current page) */
  currentLabel?: string;
  className?: string;
}

export default function GlobalBreadcrumbs({ crumbs: overrideCrumbs, currentLabel, className }: Props) {
  const pathname = usePathname();
  const crumbs = overrideCrumbs ?? buildCrumbs(pathname);

  // Optionally append a non-linked current page label
  const allCrumbs: (Crumb & { isCurrent?: boolean })[] = currentLabel
    ? [...crumbs, { label: currentLabel, href: pathname, isCurrent: true }]
    : crumbs.map((c, i) => ({ ...c, isCurrent: i === crumbs.length - 1 }));

  // Schema.org BreadcrumbList JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: allCrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.label,
      item: `https://haulcommand.com${crumb.href}`,
    })),
  };

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Visual breadcrumb trail */}
      <nav
        aria-label="Breadcrumb"
        className={className ?? 'py-2 px-0'}
      >
        <ol
          className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-gray-400"
          itemScope
          itemType="https://schema.org/BreadcrumbList"
        >
          {allCrumbs.map((crumb, index) => {
            const isLast = index === allCrumbs.length - 1;
            return (
              <li
                key={crumb.href}
                className="flex items-center gap-x-1.5"
                itemProp="itemListElement"
                itemScope
                itemType="https://schema.org/ListItem"
              >
                {index > 0 && (
                  <span className="text-gray-600 select-none" aria-hidden>
                    /
                  </span>
                )}
                {isLast || crumb.isCurrent ? (
                  <span
                    className="text-gray-200 font-medium truncate max-w-[160px]"
                    itemProp="name"
                    aria-current="page"
                  >
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="hover:text-amber-400 transition-colors truncate max-w-[120px]"
                    itemProp="item"
                  >
                    <span itemProp="name">{crumb.label}</span>
                  </Link>
                )}
                <meta itemProp="position" content={String(index + 1)} />
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
