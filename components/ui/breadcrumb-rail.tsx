import * as React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

// ══════════════════════════════════════════════════════════════
// HAUL COMMAND — Breadcrumb Rail
// Per Master Prompt §15: Every important page must have a clear
// parent path. Crawlable HTML links. BreadcrumbList schema.
// ══════════════════════════════════════════════════════════════

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbRailProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function BreadcrumbRail({ items, className }: BreadcrumbRailProps) {
  // Build full chain with Home at root
  const chain: BreadcrumbItem[] = [
    { label: "Home", href: "/" },
    ...items,
  ];

  // JSON-LD for Google structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: chain
      .filter((item) => item.href)
      .map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        item: item.href
          ? `https://www.haulcommand.com${item.href}`
          : undefined,
      })),
  };

  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Visible breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className={cn(
          "flex items-center gap-1.5 text-sm overflow-x-auto scrollbar-hide",
          "py-3 px-4 md:px-0",
          className
        )}
      >
        <ol className="flex items-center gap-1.5 min-w-0">
          {chain.map((item, index) => {
            const isLast = index === chain.length - 1;
            const isHome = index === 0;

            return (
              <li key={index} className="flex items-center gap-1.5 min-w-0">
                {index > 0 && (
                  <ChevronRight className="h-3 w-3 text-hc-subtle shrink-0" />
                )}

                {isLast ? (
                  // Current page — no link, gold text
                  <span className="text-hc-gold-400 font-semibold truncate">
                    {item.label}
                  </span>
                ) : item.href ? (
                  // Navigable ancestor — crawlable link
                  <Link
                    href={item.href}
                    className="text-hc-subtle hover:text-hc-text transition-colors truncate flex items-center gap-1"
                  >
                    {isHome && <Home className="h-3.5 w-3.5 shrink-0" />}
                    <span className={isHome ? "sr-only sm:not-sr-only" : ""}>
                      {item.label}
                    </span>
                  </Link>
                ) : (
                  // Non-navigable label
                  <span className="text-hc-subtle truncate">{item.label}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
