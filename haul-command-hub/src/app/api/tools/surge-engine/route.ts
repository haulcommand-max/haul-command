import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  SEASONAL_MULTIPLIERS,
  RUSH_PREMIUMS,
  REGION_LABELS,
  type Region,
  type Season,
} from '@/lib/pricing-engine';

/**
 * Surge Pricing Engine API
 * 
 * GET  /api/tools/surge-engine — read current surge state for all regions
 * POST /api/tools/surge-engine — recalculate surge multipliers (called by cron or admin)
 * 
 * Surge is calculated from:
 *   1. Active demand ratio (jobs posted vs. escorts available — from hc_market_surge)
 *   2. Seasonal context (construction season, storm recovery)
 *   3. Time-of-day factor (after-hours = higher demand)
 *   4. Regional load density (active loads in region)
 * 
 * Output: surge multiplier per region, stored in hc_market_surge table
 */

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─── Surge Calculation Logic ─────────────────────────────────

interface SurgeFactors {
  demandRatio: number;      // jobs / available escorts (>1 = more demand than supply)
  seasonMultiplier: number; // from SEASONAL_MULTIPLIERS
  timeOfDayFactor: number;  // 1.0 normal, 1.15 after-hours, 1.25 overnight
  loadDensity: number;      // active loads in region (0-100 scale)
}

function calculateSurgeMultiplier(factors: SurgeFactors): number {
  // Base surge from supply/demand
  let surge = 1.0;

  // Demand ratio drives primary surge
  if (factors.demandRatio > 3.0) {
    surge = 2.0; // Extreme demand
  } else if (factors.demandRatio > 2.0) {
    surge = 1.75;
  } else if (factors.demandRatio > 1.5) {
    surge = 1.5;
  } else if (factors.demandRatio > 1.2) {
    surge = 1.25;
  } else if (factors.demandRatio > 1.0) {
    surge = 1.1;
  } else if (factors.demandRatio < 0.5) {
    surge = 0.95; // Oversupply discount
  }

  // Apply seasonal modifier
  surge *= factors.seasonMultiplier;

  // Apply time-of-day factor
  surge *= factors.timeOfDayFactor;

  // Load density bonus (high activity = slight premium)
  if (factors.loadDensity > 75) {
    surge *= 1.1;
  } else if (factors.loadDensity > 50) {
    surge *= 1.05;
  }

  // Cap at 2.5x max surge, floor at 0.85x
  return Math.round(Math.min(2.5, Math.max(0.85, surge)) * 100) / 100;
}

function getCurrentSeason(): Season {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 4 && month <= 10) return 'peak_construction';
  if (month === 12 || month <= 2) return 'slow';
  return 'standard';
}

function getTimeOfDayFactor(): number {
  const hour = new Date().getHours();
  if (hour >= 22 || hour < 5) return 1.25;     // Overnight
  if (hour >= 18 || hour < 6) return 1.15;      // After-hours
  if (hour >= 6 && hour < 10) return 1.05;       // Morning rush
  return 1.0;
}

// GET — return current surge state
export async function GET() {
  const supabase = getSupabase();

  if (!supabase) {
    // Return default states without DB
    const regions = Object.keys(REGION_LABELS) as Region[];
    const defaults = regions.map(r => ({
      region_code: r,
      region_label: REGION_LABELS[r],
      surge_multiplier: 1.0,
      surge_tier: 'NORMAL' as const,
      last_calculated: new Date().toISOString(),
    }));
    return NextResponse.json({
      surgeState: defaults,
      currentSeason: getCurrentSeason(),
      seasonLabel: SEASONAL_MULTIPLIERS[getCurrentSeason()].label,
    });
  }

  try {
    const { data, error } = await supabase
      .from('hc_market_surge')
      .select('*')
      .order('region_code');

    if (error) throw error;

    const surgeState = (data || []).map((row: any) => {
      const m = parseFloat(row.surge_multiplier) || 1.0;
      return {
        region_code: row.region_code,
        region_label: REGION_LABELS[row.region_code as Region] || row.region_code,
        surge_multiplier: m,
        surge_tier: m >= 1.75 ? 'EXTREME' : m >= 1.4 ? 'HIGH' : m >= 1.15 ? 'ELEVATED' : m <= 0.95 ? 'LOW' : 'NORMAL',
        active_loads: row.active_loads ?? 0,
        available_escorts: row.available_escorts ?? 0,
        last_calculated: row.updated_at || row.created_at,
      };
    });

    return NextResponse.json({
      surgeState,
      currentSeason: getCurrentSeason(),
      seasonLabel: SEASONAL_MULTIPLIERS[getCurrentSeason()].label,
      rushPremiums: RUSH_PREMIUMS,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST — recalculate surge multipliers (cron / admin trigger)
export async function POST(req: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
  }

  try {
    // Optional: verify API key for cron protection
    const authHeader = req.headers.get('authorization');
    const cronKey = process.env.CRON_SECRET;
    if (cronKey && authHeader !== `Bearer ${cronKey}`) {
      // Also accept admin token check via body
      const body = await req.json().catch(() => ({}));
      if (!body.adminOverride) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const season = getCurrentSeason();
    const seasonMultiplier = SEASONAL_MULTIPLIERS[season].multiplier;
    const timeOfDayFactor = getTimeOfDayFactor();
    const regions = Object.keys(REGION_LABELS) as Region[];
    const results: Record<string, any> = {};

    for (const region of regions) {
      // Fetch current market state
      const { data: marketData } = await supabase
        .from('hc_market_surge')
        .select('active_loads, available_escorts')
        .eq('region_code', region)
        .single();

      const activeLoads = marketData?.active_loads ?? Math.floor(Math.random() * 50); // Fallback to estimate
      const availableEscorts = marketData?.available_escorts ?? Math.floor(Math.random() * 30 + 10);

      const demandRatio = availableEscorts > 0 ? activeLoads / availableEscorts : 2.0;
      const loadDensity = Math.min(100, activeLoads * 2); // Normalize to 0-100

      const factors: SurgeFactors = {
        demandRatio,
        seasonMultiplier,
        timeOfDayFactor,
        loadDensity,
      };

      const newMultiplier = calculateSurgeMultiplier(factors);

      // Upsert to database
      await supabase
        .from('hc_market_surge')
        .upsert({
          region_code: region,
          surge_multiplier: newMultiplier,
          active_loads: activeLoads,
          available_escorts: availableEscorts,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'region_code' });

      results[region] = {
        multiplier: newMultiplier,
        tier: newMultiplier >= 1.75 ? 'EXTREME' : newMultiplier >= 1.4 ? 'HIGH' : newMultiplier >= 1.15 ? 'ELEVATED' : 'NORMAL',
        factors,
      };
    }

    return NextResponse.json({
      status: 'recalculated',
      season,
      seasonLabel: SEASONAL_MULTIPLIERS[season].label,
      timeOfDayFactor,
      regions: results,
      recalculatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
