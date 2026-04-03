'use client';

import React from 'react';
import Link from 'next/link';

/**
 * TakeoverSponsorBanner — Premium geo-territory ad surface
 * 
 * For country, state/province, and city-level takeover sponsors.
 * One exclusive sponsor per territory.
 * Premium native placement with scarcity signal.
 */

interface TakeoverSponsor {
  sponsor_name: string;
  tagline: string;
  cta_text: string;
  cta_url: string;
  logo_url?: string;
}

interface Props {
  level: 'country' | 'state' | 'city';
  territory: string;
  sponsor?: TakeoverSponsor | null;
  pricePerMonth?: number;
}

export function TakeoverSponsorBanner({ level, territory, sponsor, pricePerMonth = 499 }: Props) {
  // If no sponsor, show "available" slot (self-serve hook)
  if (!sponsor) {
    return (
      <div className="tsb tsb--available">
        <div className="tsb-avail-content">
          <div className="tsb-avail-badge">
            {level === 'country' ? '🌍' : level === 'state' ? '🗺️' : '📍'} EXCLUSIVE SPONSORSHIP AVAILABLE
          </div>
          <h4 className="tsb-avail-title">
            Own {territory} — Be the exclusive {level} sponsor
          </h4>
          <p className="tsb-avail-sub">
            Your business appears first on every search, directory listing, and page in {territory}.
            Only 1 sponsor per {level}. ${pricePerMonth}/mo.
          </p>
          <Link href={`/advertise/territory?level=${level}&territory=${encodeURIComponent(territory)}`} className="tsb-avail-cta">
            Claim This Territory →
          </Link>
        </div>

        <style jsx>{`${STYLES}
          .tsb--available {
            border-color: rgba(198,146,58,0.15);
            background: linear-gradient(135deg, rgba(198,146,58,0.04), rgba(198,146,58,0.01));
          }
          .tsb-avail-content { padding: 16px; text-align: center; }
          .tsb-avail-badge {
            display: inline-block;
            font-size: 9px; font-weight: 800; color: #C6923A;
            text-transform: uppercase; letter-spacing: 0.08em;
            padding: 3px 10px;
            background: rgba(198,146,58,0.08);
            border: 1px solid rgba(198,146,58,0.2);
            border-radius: 20px;
            margin-bottom: 10px;
          }
          .tsb-avail-title {
            margin: 0 0 6px; font-size: 15px; font-weight: 700; color: #F0F0F0;
          }
          .tsb-avail-sub {
            margin: 0 0 12px; font-size: 12px; color: #888; max-width: 400px; margin-left: auto; margin-right: auto; line-height: 1.5;
          }
          .tsb-avail-cta {
            display: inline-block;
            padding: 8px 20px;
            background: linear-gradient(135deg, #C6923A, #8A6428);
            border-radius: 8px;
            color: #000; font-size: 12px; font-weight: 700;
            text-decoration: none;
            transition: all 0.15s;
          }
          .tsb-avail-cta:hover { box-shadow: 0 4px 16px rgba(198,146,58,0.3); }
        `}</style>
      </div>
    );
  }

  // Active sponsor
  return (
    <div className="tsb tsb--active">
      <div className="tsb-content">
        <div className="tsb-sponsor-row">
          {sponsor.logo_url && <img src={sponsor.logo_url} alt="" className="tsb-logo" />}
          <div>
            <div className="tsb-tag">⚡ {territory} Exclusive Sponsor</div>
            <h4 className="tsb-name">{sponsor.sponsor_name}</h4>
            <p className="tsb-tagline">{sponsor.tagline}</p>
          </div>
        </div>
        <Link href={sponsor.cta_url} className="tsb-cta">
          {sponsor.cta_text}
        </Link>
      </div>
      <div className="tsb-label">Sponsored • AdGrid</div>

      <style jsx>{`${STYLES}
        .tsb--active {
          border-color: rgba(198,146,58,0.3);
          background: linear-gradient(135deg, rgba(198,146,58,0.06), rgba(198,146,58,0.02));
        }
        .tsb-content {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px; gap: 12px; flex-wrap: wrap;
        }
        .tsb-sponsor-row { display: flex; align-items: center; gap: 12px; }
        .tsb-logo { width: 40px; height: 40px; border-radius: 10px; object-fit: cover; border: 1px solid rgba(255,255,255,0.1); }
        .tsb-tag { font-size: 9px; font-weight: 700; color: #C6923A; text-transform: uppercase; letter-spacing: 0.06em; }
        .tsb-name { margin: 2px 0 0; font-size: 15px; font-weight: 700; color: #F0F0F0; }
        .tsb-tagline { margin: 2px 0 0; font-size: 12px; color: #888; }
        .tsb-cta {
          padding: 8px 18px;
          background: linear-gradient(135deg, #C6923A, #8A6428);
          border-radius: 8px; color: #000; font-size: 12px; font-weight: 700;
          text-decoration: none; white-space: nowrap; transition: all 0.15s;
        }
        .tsb-cta:hover { box-shadow: 0 4px 16px rgba(198,146,58,0.3); }
        .tsb-label { text-align: center; padding: 6px; font-size: 9px; color: #444; letter-spacing: 0.04em; }
      `}</style>
    </div>
  );
}

const STYLES = `
  .tsb {
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 14px;
    overflow: hidden;
  }
`;
