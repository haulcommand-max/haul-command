'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

/* ══════════════════════════════════════════════════════════════
   CorridorSponsorCard — Native premium monetization unit for
   corridor pages. Reads real inventory from Supabase via
   /api/sponsor/inventory. Falls back to house ad cleanly.

   API response shape (verified):
     { sponsor: { id, sponsor_name, territory_type, territory_value, plan } | null,
       house: boolean, founding_available: boolean }
   ══════════════════════════════════════════════════════════════ */

interface SponsorData {
  sponsor_name: string;
  plan: string;
}

interface CorridorSponsorCardProps {
  corridorName: string;
  corridorSlug: string;
  operatorCount?: number;
}

export function CorridorSponsorCard({ corridorName, corridorSlug, operatorCount }: CorridorSponsorCardProps) {
  const [sponsor, setSponsor] = useState<SponsorData | null>(null);
  const [foundingAvailable, setFoundingAvailable] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!corridorSlug && !corridorName) { setLoaded(true); return; }
    const slug = corridorSlug || corridorName.toLowerCase().replace(/\s+/g, '-');

    fetch(`/api/sponsor/inventory?territory_type=corridor&territory_value=${encodeURIComponent(slug)}`)
      .then(r => r.json())
      .then(data => {
        if (data.sponsor && !data.house) {
          setSponsor({
            sponsor_name: data.sponsor.sponsor_name,
            plan: data.sponsor.plan,
          });
        }
        setFoundingAvailable(data.founding_available ?? true);
        setLoaded(true);
      })
      .catch(() => { setFoundingAvailable(true); setLoaded(true); });
  }, [corridorSlug, corridorName]);

  if (!loaded) return null;

  return (
    <div style={{
      borderRadius: 18,
      border: '1px solid rgba(198, 146, 58, 0.2)',
      background: 'linear-gradient(135deg, rgba(198, 146, 58, 0.06), transparent 60%)',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Premium accent line */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 3,
        background: 'linear-gradient(90deg, var(--hc-gold-400, #D4A844), transparent)',
      }} />

      {/* Label */}
      <div style={{
        fontSize: 9, fontWeight: 800,
        textTransform: 'uppercase',
        letterSpacing: '0.12em',
        color: 'var(--hc-gold-400, #D4A844)',
        opacity: 0.7,
        marginBottom: 12,
      }}>
        {sponsor ? 'Corridor Sponsor' : foundingAvailable ? 'Founding Sponsor Opportunity' : 'Sponsor This Corridor'}
      </div>

      {sponsor ? (
        /* ── Real paid sponsor ── */
        <>
          <div style={{
            fontSize: 15, fontWeight: 800,
            color: 'var(--m-text-primary, #f5f7fb)',
            lineHeight: 1.3, marginBottom: 8,
          }}>
            {sponsor.sponsor_name} — Verified {corridorName} Partner
          </div>
          <div style={{
            fontSize: 13,
            color: 'var(--m-text-secondary, #c7ccd7)',
            lineHeight: 1.5, marginBottom: 16,
          }}>
            {sponsor.sponsor_name} provides specialized services along the {corridorName} corridor.
          </div>
          <Link aria-label="Navigation Link"
            href={`/directory`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', borderRadius: 12,
              background: 'rgba(198, 146, 58, 0.12)',
              border: '1px solid rgba(198, 146, 58, 0.25)',
              color: 'var(--hc-gold-400, #D4A844)',
              fontSize: 13, fontWeight: 800, textDecoration: 'none',
            }}
          >
            View {sponsor.sponsor_name}
            <ChevronRightSmall />
          </Link>
        </>
      ) : (
        /* ── House ad / founding sponsor hook ── */
        <>
          <div style={{
            fontSize: 15, fontWeight: 800,
            color: 'var(--m-text-primary, #f5f7fb)',
            lineHeight: 1.3, marginBottom: 8,
          }}>
            {foundingAvailable
              ? `Be the founding sponsor of ${corridorName}`
              : `Be the featured partner on ${corridorName}`
            }
          </div>
          <div style={{
            fontSize: 13,
            color: 'var(--m-text-secondary, #c7ccd7)',
            lineHeight: 1.5, marginBottom: 16,
          }}>
            {operatorCount
              ? `${operatorCount} operators and brokers see this corridor page weekly. Territory sponsors get featured placement in radar, intelligence, and search results.`
              : `Territory sponsors get featured placement in corridor radar, intelligence cards, and operator search results across this route.`
            }
            {foundingAvailable && ' As the first sponsor, you lock in founding pricing.'}
          </div>

          <Link aria-label="Navigation Link"
            href="/sponsor"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 18px', borderRadius: 12,
              background: 'rgba(198, 146, 58, 0.12)',
              border: '1px solid rgba(198, 146, 58, 0.25)',
              color: 'var(--hc-gold-400, #D4A844)',
              fontSize: 13, fontWeight: 800, textDecoration: 'none',
            }}
          >
            See Sponsorship Plans
            <ChevronRightSmall />
          </Link>
        </>
      )}
    </div>
  );
}

function ChevronRightSmall() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
