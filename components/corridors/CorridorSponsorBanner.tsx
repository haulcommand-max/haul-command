'use client';

import Link from 'next/link';

interface Props {
  corridorSlug: string;
  corridorName: string;
  countryCode: string;
  tier?: string;
  compositeScore?: number | null;
  /** Override to show a live sponsor ad instead of the house ad */
  sponsorAd?: {
    headline: string;
    subline: string;
    ctaLabel: string;
    ctaHref: string;
    badgeLabel?: string;
  } | null;
}

/**
 * CorridorSponsorBanner
 * AdGrid surface for individual corridor pages.
 * Shows a live sponsor creative when one is booked;
 * falls back to a house "sponsor this corridor" CTA that drives
 * the operator to /advertise with corridor + geo context.
 */
export function CorridorSponsorBanner({
  corridorSlug,
  corridorName,
  countryCode,
  tier = 'national',
  compositeScore,
  sponsorAd,
}: Props) {
  const advertiseHref = `/advertise?surface=corridor&corridor=${encodeURIComponent(corridorSlug)}&country=${countryCode}`;

  // Flagship corridors get a larger banner
  const isFlagship = tier === 'flagship' || (compositeScore != null && compositeScore >= 85);

  if (sponsorAd) {
    // Live sponsored creative
    return (
      <div
        className={`group relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-6 ${
          isFlagship ? 'sm:p-8' : ''
        }`}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            {sponsorAd.badgeLabel && (
              <span className="mb-2 inline-flex rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-amber-400">
                {sponsorAd.badgeLabel}
              </span>
            )}
            <p className="text-base font-bold text-white">{sponsorAd.headline}</p>
            <p className="mt-1 text-sm text-white/50">{sponsorAd.subline}</p>
          </div>
          <Link
            href={sponsorAd.ctaHref}
            className="shrink-0 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-black hover:bg-amber-400 transition-colors"
          >
            {sponsorAd.ctaLabel}
          </Link>
        </div>
        {/* Sponsor disclosure */}
        <p className="mt-3 text-right text-[10px] uppercase tracking-widest text-white/20">Sponsored</p>
      </div>
    );
  }

  // House ad — invite sponsor
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-dashed border-white/15 bg-white/3 p-6 ${
        isFlagship ? 'sm:p-8' : ''
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-white/30">AdGrid · Corridor Sponsor Slot</span>
          <p className="mt-1 text-sm font-semibold text-white/70">
            Reach every operator, broker, and buyer researching the{' '}
            <span className="text-white">{corridorName}</span>.
          </p>
          {isFlagship && (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-xs text-amber-300">
                🔥 High-traffic corridor
              </span>
              {compositeScore && (
                <span className="rounded-md bg-white/8 px-2 py-0.5 text-xs text-white/50">
                  Intelligence score: {Math.round(compositeScore)}
                </span>
              )}
            </div>
          )}
        </div>
        <Link
          href={advertiseHref}
          className="shrink-0 rounded-xl border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/70 hover:border-amber-500/40 hover:text-amber-300 transition-colors"
        >
          Sponsor this corridor →
        </Link>
      </div>
    </div>
  );
}

export default CorridorSponsorBanner;
