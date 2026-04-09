import React from "react";

/**
 * SponsoredLink — Enforces rel="sponsored" on all paid/compensated links.
 * UGCLink — Enforces rel="ugc" on all user-generated content links.
 * 
 * Google requires:
 * - rel="sponsored" for ads, AdGrid placements, sponsor cards, affiliate links
 * - rel="ugc" for user reviews, corridor discussion boards, community posts
 * - rel="nofollow" is acceptable as a fallback but rel="sponsored" is preferred
 * 
 * MASTER PROMPT §12 COMPLIANCE:
 * "Google recommends rel='sponsored' for ads and compensated placements,
 *  and rel='ugc' for user-generated content."
 */

interface SponsoredLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  target?: string;
  onClick?: () => void;
}

export function SponsoredLink({ href, children, className, style, target, onClick }: SponsoredLinkProps) {
  return (
    <a
      href={href}
      rel="sponsored noopener"
      className={className}
      style={style}
      target={target || "_blank"}
      onClick={onClick}
    >
      {children}
    </a>
  );
}

interface UGCLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function UGCLink({ href, children, className, style }: UGCLinkProps) {
  return (
    <a
      href={href}
      rel="ugc noopener"
      className={className}
      style={style}
    >
      {children}
    </a>
  );
}

/**
 * AdGridCreative — Wrapper component for AdGrid-served content.
 * Automatically applies rel="sponsored" to the CTA link,
 * and tracks impressions via the /api/adgrid/event endpoint.
 */
interface AdGridCreativeProps {
  headline: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  advertiserName: string;
  inventoryId?: string;
  zone?: string;
}

export function AdGridCreative({ headline, body, ctaLabel, ctaUrl, advertiserName, inventoryId, zone }: AdGridCreativeProps) {
  const handleClick = () => {
    // Fire click event asynchronously
    if (inventoryId) {
      fetch('/api/adgrid/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inventory_id: inventoryId, event_type: 'click', zone }),
      }).catch(() => {});
    }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-3">Sponsored · {advertiserName}</div>
      <h4 className="text-lg font-bold text-white mb-2">{headline}</h4>
      <p className="text-sm text-gray-400 mb-4">{body}</p>
      <SponsoredLink href={ctaUrl} onClick={handleClick} className="bg-yellow-500 text-black font-bold text-sm px-6 py-2 rounded hover:bg-yellow-400 transition inline-block">
        {ctaLabel}
      </SponsoredLink>
    </div>
  );
}
