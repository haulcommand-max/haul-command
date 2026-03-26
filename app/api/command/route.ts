/**
 * /api/command — Central Command Execution Endpoint
 * 
 * Receives slash commands from CommandBar and routes to agents.
 */

import { NextRequest, NextResponse } from 'next/server';
import { strictRateLimit, resolveApiKeyTier } from '@/lib/security/anti-scrape-middleware';
import { calculateDispatchPrice, type DispatchPriceInputs } from '@/lib/pricing/dispatch-pricing-engine';

export async function POST(req: NextRequest) {
  const rl = strictRateLimit(req);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
  }

  const tier = resolveApiKeyTier(req);
  if (tier === 'public') {
    return NextResponse.json({ error: 'Authentication required for commands' }, { status: 401 });
  }

  const body = await req.json();
  const command = (body.command || '').trim();
  if (!command) {
    return NextResponse.json({ error: 'No command provided' }, { status: 400 });
  }

  // Parse command
  const [cmd, ...args] = command.split(/\s+/);
  const argStr = args.join(' ');

  switch (cmd.toLowerCase()) {
    case '/price': {
      // Quick price estimate: /price 120000lbs SE corridor superload
      const weightMatch = argStr.match(/(\d+)\s*(?:lbs?|pounds?)/i);
      const weight = weightMatch ? parseInt(weightMatch[1]) : 80000;
      const isSuperload = argStr.toLowerCase().includes('superload');
      const regionMatch = argStr.match(/\b(southeast|midwest|northeast|southwest|west_coast|national|SE|MW|NE|SW|WC)\b/i);
      
      const regionMap: Record<string, string> = {
        se: 'southeast', mw: 'midwest', ne: 'northeast',
        sw: 'southwest', wc: 'west_coast',
      };
      const region = regionMatch 
        ? (regionMap[regionMatch[1].toLowerCase()] || regionMatch[1].toLowerCase())
        : 'national';

      const result = calculateDispatchPrice({
        origin: 'Estimate',
        destination: 'Estimate',
        distance_miles: 500,
        states_crossed: ['TX', 'LA'],
        weight_lbs: weight,
        height_ft: 14,
        width_ft: 12,
        length_ft: 80,
        escorts_required: isSuperload ? 2 : 1,
        police_required: isSuperload,
        permits_required: 2,
        night_move: false,
        superload: isSuperload,
        corridor_demand_score: 55,
        operator_supply_score: 45,
        urgency: 'standard',
        country_code: 'US',
        region_key: region,
      });

      return NextResponse.json({
        message: `💰 Price Estimate: $${result.recommended_price.toLocaleString()} (${result.label.replace('_', ' ')})
Floor: $${result.price_floor.toLocaleString()} | Ceiling: $${result.price_ceiling.toLocaleString()}
Base: $${result.base_rate_per_mile.toFixed(2)}/mi | Weight: ${result.weight_factor}x | Market: ${result.market_multiplier.toFixed(2)}x
Confidence: ${result.confidence}%`,
        result,
      });
    }

    case '/help': {
      return NextResponse.json({
        message: `Available commands:
/dispatch [origin] → [destination]   Dispatch a load
/price [weight] [region] [flags]     Get instant pricing  
/status [load-id]                    Check load status
/operator find [state] [filters]     Find operators
/corridor [route] [metric]           Corridor intelligence
/boost [load-id] [tier]              Boost a listing
/recruit [state] [filters]           Recruiter blast
/weather route [origin] → [dest]     Weather impact check
/rate [corridor] [type]              Rate spy
/help                                Show this help`,
      });
    }

    default: {
      return NextResponse.json({
        message: `Unknown command: ${cmd}. Type /help for available commands.`,
      }, { status: 400 });
    }
  }
}
