/**
 * components/seo/RelatedLinks.tsx
 * Drop-in component that renders the internal link strip at the bottom
 * of any page. Wires directly to the interlinking-graph.
 *
 * Usage:
 *   import RelatedLinks from '@/components/seo/RelatedLinks';
 *   <RelatedLinks pageType="tool" context={{ toolSlug: 'escort-calculator' }} />
 */

import Link from 'next/link';
import { getRelatedLinks, type PageType } from '@/lib/seo/interlinking-graph';

interface Props {
  pageType: PageType;
  context?: { state?: string; corridor?: string; toolSlug?: string };
  heading?: string;
  className?: string;
}

export default function RelatedLinks({
  pageType,
  context,
  heading = 'Explore',
  className = '',
}: Props) {
  const links = getRelatedLinks(pageType, context);
  if (links.length === 0) return null;

  return (
    <nav
      aria-label="Related pages"
      className={`border-t border-white/5 pt-6 mt-10 ${className}`}
    >
      <p className="text-xs text-gray-600 uppercase tracking-wider font-semibold mb-3">
        {heading}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm text-gray-400 hover:text-amber-400 transition-colors underline-offset-2 hover:underline"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
