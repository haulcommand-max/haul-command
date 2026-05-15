'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  buildHouseAdTrackingTags,
  pickHouseAd,
  type HouseAdGoal,
  type HouseAdIntent,
} from '@/lib/ads/house-ads';

type HouseAdSlotVariant = 'banner' | 'card' | 'compact';

type HouseAdSlotProps = {
  surface: string;
  placementId?: string;
  intent?: HouseAdIntent;
  role?: string;
  country?: string;
  region?: string;
  city?: string;
  corridor?: string;
  topic?: string;
  pageType?: string;
  slotType?: string;
  userIntent?: string;
  funnelStage?: string;
  variant?: HouseAdSlotVariant;
  className?: string;
};

const FREQUENCY_CAP_PER_SESSION = 3;

function readSessionId() {
  try {
    const existing = sessionStorage.getItem('hc_session_id');
    if (existing) return existing;
    const next = crypto.randomUUID();
    sessionStorage.setItem('hc_session_id', next);
    return next;
  } catch {
    return 'session-unavailable';
  }
}

function readRole(explicitRole?: string) {
  if (explicitRole) return explicitRole;
  try {
    return localStorage.getItem('hc_role') || undefined;
  } catch {
    return undefined;
  }
}

function readCompletedGoals(): HouseAdGoal[] {
  const goals: HouseAdGoal[] = [];
  try {
    if (localStorage.getItem('hc_profile_claimed') === 'true') goals.push('claim');
    if (localStorage.getItem('hc_sponsor_lead_submitted') === 'true') goals.push('sponsor_sales');
    if (localStorage.getItem('hc_training_started') === 'true') goals.push('training');
    if (localStorage.getItem('hc_load_post_started') === 'true') goals.push('load_board');
  } catch {
    // Storage can be unavailable; ads should still render.
  }
  return goals;
}

function readCreativeExclusions() {
  try {
    const raw = sessionStorage.getItem('hc_house_ad_counts');
    const counts = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    return Object.entries(counts)
      .filter(([, count]) => count >= FREQUENCY_CAP_PER_SESSION)
      .map(([creativeId]) => creativeId);
  } catch {
    return [];
  }
}

function bumpCreativeCount(creativeId: string) {
  try {
    const raw = sessionStorage.getItem('hc_house_ad_counts');
    const counts = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    counts[creativeId] = (counts[creativeId] ?? 0) + 1;
    sessionStorage.setItem('hc_house_ad_counts', JSON.stringify(counts));
  } catch {
    // Frequency protection is helpful, not mission-critical.
  }
}

function trackHouseAdEvent(params: {
  eventType: 'impression' | 'click';
  slotId: string;
  sessionId: string;
  campaignId: string;
  pageType?: string;
  meta: Record<string, unknown>;
}) {
  fetch('/api/adgrid/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      slot_id: params.slotId,
      event_type: params.eventType,
      session_id: params.sessionId,
      campaign_id: params.campaignId,
      page_type: params.pageType,
      meta: params.meta,
    }),
  }).catch(() => {});
}

export function HouseAdSlot({
  surface,
  placementId = 'house-slot',
  intent,
  role,
  country,
  region,
  city,
  corridor,
  topic,
  pageType,
  slotType,
  userIntent,
  funnelStage,
  variant = 'banner',
  className = '',
}: HouseAdSlotProps) {
  const [sessionState, setSessionState] = useState({
    sessionId: 'session-unavailable',
    role: role,
    excludeCreativeIds: [] as string[],
    completedGoals: [] as HouseAdGoal[],
  });
  const impressionKeyRef = useRef('');

  useEffect(() => {
    setSessionState({
      sessionId: readSessionId(),
      role: readRole(role),
      excludeCreativeIds: readCreativeExclusions(),
      completedGoals: readCompletedGoals(),
    });
  }, [role]);

  const ad = useMemo(
    () =>
      pickHouseAd({
        surface,
        placementId,
        intent,
        role: sessionState.role,
        country,
        region,
        city,
        corridor,
        topic,
        pageType,
        slotType,
        userIntent,
        funnelStage,
        excludeCreativeIds: sessionState.excludeCreativeIds,
        completedGoals: sessionState.completedGoals,
      }),
    [
      city,
      corridor,
      country,
      funnelStage,
      intent,
      pageType,
      placementId,
      region,
      sessionState.completedGoals,
      sessionState.excludeCreativeIds,
      sessionState.role,
      slotType,
      surface,
      topic,
      userIntent,
    ],
  );
  const compact = variant === 'compact';
  const card = variant === 'card';
  const effectivePageType = pageType ?? surface.split(/[._-]/)[0] ?? 'house';
  const trackingTags = useMemo(
    () =>
      buildHouseAdTrackingTags(ad, {
        surface,
        placementId,
        pageType: effectivePageType,
        role: sessionState.role,
        country,
        region,
        city,
        corridor,
        topic,
        slotType,
      }),
    [ad, city, corridor, country, effectivePageType, placementId, region, sessionState.role, slotType, surface, topic],
  );

  useEffect(() => {
    if (sessionState.sessionId === 'session-unavailable') return;
    const impressionKey = `${placementId}:${ad.creative_id}:${ad.impression_token}`;
    if (impressionKeyRef.current === impressionKey) return;
    impressionKeyRef.current = impressionKey;
    bumpCreativeCount(ad.creative_id);
    trackHouseAdEvent({
      eventType: 'impression',
      slotId: placementId,
      sessionId: sessionState.sessionId,
      campaignId: ad.campaign_id,
      pageType: effectivePageType,
      meta: {
        source: 'house',
        ...trackingTags,
        visualAlt: ad.visual_alt,
        proofLabel: ad.proof_label,
        secondaryCta: ad.secondary_cta_text,
      },
    });
  }, [ad, effectivePageType, placementId, sessionState.sessionId, trackingTags]);

  function handleClick() {
    trackHouseAdEvent({
      eventType: 'click',
      slotId: placementId,
      sessionId: sessionState.sessionId,
      campaignId: ad.campaign_id,
      pageType: effectivePageType,
      meta: {
        source: 'house',
        ...trackingTags,
        destination: ad.cta_url,
      },
    });
  }

  return (
    <Link
      href={ad.cta_url}
      onClick={handleClick}
      className={[
        'group relative block overflow-hidden rounded-xl border border-[#C6923A]/25 bg-[#0d0f13] text-left no-underline shadow-[0_18px_55px_rgba(0,0,0,0.36)]',
        compact ? 'p-4' : card ? 'p-5' : 'p-5 md:p-6',
        className,
      ].join(' ')}
      data-adgrid-house="true"
      data-adgrid-zone={surface}
      data-adgrid-creative={ad.creative_id}
      data-adgrid-intent={ad.intent}
      data-adgrid-goal={ad.goal}
      data-adgrid-page-type={effectivePageType}
      data-adgrid-country={country ?? 'global'}
    >
      {ad.image_url && (
        <img
          src={ad.image_url}
          alt={ad.visual_alt}
          className="absolute inset-0 h-full w-full object-cover opacity-30 transition-transform duration-500 group-hover:scale-[1.03]"
        />
      )}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,6,8,0.96),rgba(7,8,10,0.82)_48%,rgba(9,9,9,0.55))]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F5A812] to-transparent opacity-80" />

      <div className={['relative z-10 flex gap-5', compact ? 'items-center' : 'items-center justify-between'].join(' ')}>
        <div className="min-w-0 max-w-3xl">
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#F2B84B]">
            Haul Command House Ad - {ad.proof_label}
          </p>
          <h3 className={compact ? 'text-base font-black text-white' : 'text-2xl font-black leading-tight text-white'}>
            {ad.headline}
          </h3>
          {!compact && ad.body && (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              {ad.body}
            </p>
          )}
          {!compact && ad.secondary_cta_text && (
            <p className="mt-3 text-xs font-bold uppercase tracking-[0.1em] text-slate-500">
              Secondary path: {ad.secondary_cta_text}
            </p>
          )}
        </div>
        <span
          className={[
            'shrink-0 rounded-md bg-[#F5A812] font-black text-black shadow-[0_0_24px_rgba(245,168,18,0.24)] transition-transform group-hover:-translate-y-0.5',
            compact ? 'px-3 py-2 text-xs' : 'px-5 py-3 text-xs uppercase tracking-[0.08em]',
          ].join(' ')}
        >
          {ad.cta_text}
        </span>
      </div>
    </Link>
  );
}
