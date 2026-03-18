import Link from 'next/link';
import type { HCBreadcrumb } from '@/lib/hc-types';

export function HCBreadcrumbs({ crumbs }: { crumbs: HCBreadcrumb[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href && !c.isCurrent ? { item: `https://haulcommand.com${c.href}` } : {}),
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-gray-500 mb-6 flex-wrap">
        <Link href="/" className="hover:text-accent transition-colors">Home</Link>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-1.5">
            <span className="text-gray-700">/</span>
            {c.isCurrent || !c.href ? (
              <span className="text-gray-300 font-medium truncate max-w-[200px]">{c.label}</span>
            ) : (
              <Link href={c.href} className="hover:text-accent transition-colors truncate max-w-[200px]">{c.label}</Link>
            )}
          </span>
        ))}
      </nav>
    </>
  );
}
