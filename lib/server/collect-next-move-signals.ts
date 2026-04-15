/**
 * lib/server/collect-next-move-signals.ts
 * ══════════════════════════════════════════════════════════════
 * Server-side signal collector for the Next Moves Engine.
 *
 * Runs at request time in Server Components or Route Handlers.
 * Fetches market context, user profile state, and demand signals.
 * Returns a Partial<UserSignals> safe to pass to the client.
 *
 * Fast path: if user is anonymous, returns minimal market-only signals.
 * Slow path: if authenticated, fetches full profile + market signals.
 *
 * All DB calls are parallel. Total budget: <150ms (p95 target).
 * ══════════════════════════════════════════════════════════════
 */

import { getSupabaseAdmin } from '@/lib/supabase/admin';
import type { UserSignals } from '@/lib/next-moves-engine';
import type { HCRole } from '@/lib/role-config';

interface CollectSignalsInput {
  userId?: string | null;       // From Supabase auth session
  detectedState?: string | null; // From geo-header (Vercel provides this)
  detectedRegion?: string | null;
}

/**
 * Collect server-side signals for the Next Moves Engine.
 * Always returns something. Never throws — degrades gracefully.
 */
export async function collectNextMoveSignals(
  input: CollectSignalsInput
): Promise<Partial<UserSignals>> {
  const { userId, detectedState } = input;
  const svc = getSupabaseAdmin();

  const signals: Partial<UserSignals> = {
    detectedState: detectedState ?? null,
    detectedRegion: input.detectedRegion ?? null,
  };

  // ── Parallel market signals (always run, even for anon) ────
  const marketPromise = collectMarketSignals(svc, detectedState ?? undefined);

  // ── User profile signals (only if authenticated) ──────────
  const profilePromise = userId
    ? collectProfileSignals(svc, userId)
    : Promise.resolve<Partial<UserSignals>>({});

  const [market, profile] = await Promise.allSettled([marketPromise, profilePromise]);

  Object.assign(
    signals,
    market.status === 'fulfilled' ? market.value : {},
    profile.status === 'fulfilled' ? profile.value : {}
  );

  return signals;
}

// ─── Market Signal Collector ──────────────────────────────────

async function collectMarketSignals(
  svc: ReturnType<typeof getSupabaseAdmin>,
  state?: string
): Promise<Partial<UserSignals>> {
  try {
    const since7d = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    // Load count in region
    let loadsQ = svc
      .from('loads')
      .select('id, origin_state', { count: 'exact', head: false })
      .gte('created_at', since7d)
      .eq('status', 'open')
      .limit(1);

    if (state) {
      loadsQ = loadsQ.or(`origin_state.eq.${state},destination_state.eq.${state}`);
    }

    // Claimed operator count in region
    let claimedQ = svc
      .from('listings')
      .select('id', { count: 'exact', head: true });

    if (state) {
      claimedQ = claimedQ.eq('state_code', state).eq('is_claimed', true);
    }

    const [{ count: loadCount }, { count: claimedCount }] = await Promise.all([
      loadsQ.then(r => ({ count: r.count ?? 0 })),
      claimedQ.then(r => ({ count: r.count ?? 0 })),
    ]);

    const loadsNearby = loadCount ?? 0;
    const claimedOperators = claimedCount ?? 0;

    return {
      loadsNearby,
      // Supply/demand logic: if loads > 2× claimed operators, supply is below demand
      operatorsBelowSupply: loadsNearby > 0 && claimedOperators < loadsNearby * 2,
      // Unclaimed: region has <3 claimed operators
      unclaimedRegion: state ? claimedOperators < 3 : false,
      // Demand score: normalized 0-100
      demandscore: Math.min(100, loadsNearby * 5 + (claimedOperators < 5 ? 20 : 0)),
    };
  } catch (err) {
    // Non-fatal — return zeros
    console.warn('[next-moves] market signal collection failed:', err);
    return { loadsNearby: 0, demandscore: 0, operatorsBelowSupply: false, unclaimedRegion: false };
  }
}

// ─── Profile Signal Collector ─────────────────────────────────

async function collectProfileSignals(
  svc: ReturnType<typeof getSupabaseAdmin>,
  userId: string
): Promise<Partial<UserSignals>> {
  try {
    const [profileResult, loadsResult, intentResult] = await Promise.allSettled([
      // Profile + claim data
      svc
        .from('listings')
        .select('id, is_claimed, completion_pct, has_certifications, role, service_states, corridors_followed')
        .eq('claimed_by', userId)
        .maybeSingle(),

      // Active loads (as broker)
      svc
        .from('loads')
        .select('id, status')
        .eq('posted_by', userId)
        .eq('status', 'open')
        .limit(20),

      // Saved intents (corridors watched)
      svc
        .from('saved_intents')
        .select('entity_label, entity_type')
        .eq('user_id', userId)
        .eq('entity_type', 'corridor')
        .limit(5),
    ]);

    const profile = profileResult.status === 'fulfilled' ? profileResult.value.data : null;
    const loads = loadsResult.status === 'fulfilled' ? (loadsResult.value.data ?? []) : [];
    const intents = intentResult.status === 'fulfilled' ? (intentResult.value.data ?? []) : [];

    // Parse last_active from profile (listings table)
    const hasPostedLoad = loads.length > 0 || ((profile as any)?.has_posted_load_ever ?? false);

    return {
      isAuthenticated: true,
      hasProfile: !!profile,
      hasClaim: profile?.is_claimed ?? false,
      profileComplete: (profile?.completion_pct ?? 0) >= 90,
      profileCompletionPct: profile?.completion_pct ?? 0,
      hasCertifications: profile?.has_certifications ?? false,
      hasPostedLoad,
      activeLoadCount: loads.length,
      savedCorridors: intents.map((i: any) => i.entity_label),
      role: (profile?.role as HCRole) ?? null,
    };
  } catch (err) {
    console.warn('[next-moves] profile signal collection failed:', err);
    return { isAuthenticated: true };
  }
}
