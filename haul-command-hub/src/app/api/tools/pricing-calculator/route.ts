import { NextResponse } from 'next/server';
import {
  calculateEstimate,
  calculateBrokerMarkup,
  analyzeProfitability,
  STATE_REGION_MAP,
  PROVINCE_REGION_MAP,
  REGION_LABELS,
  SERVICE_LABELS,
  SEASONAL_MULTIPLIERS,
  RUSH_PREMIUMS,
  type PricingInput,
  type Region,
  type ServiceType,
  type Season,
} from '@/lib/pricing-engine';

/**
 * Dynamic Pricing Calculator API
 * 
 * POST /api/tools/pricing-calculator
 * 
 * Exposes the full pricing engine via API for:
 *  - Frontend calculator widgets
 *  - Mobile app integration
 *  - Third-party developer API access
 *  - Broker quoting tools
 * 
 * Request body: PricingInput fields (see schema below)
 * Response: Full estimate, broker markup, profitability analysis
 */

// GET: returns the API schema and available options
export async function GET() {
  return NextResponse.json({
    name: 'Haul Command Dynamic Pricing Calculator',
    version: '2.0',
    description: 'Calculate escort/PEVO service rates across US, Canada, and 120 countries.',
    endpoint: '/api/tools/pricing-calculator',
    method: 'POST',
    schema: {
      required: ['serviceType', 'distanceMiles'],
      properties: {
        serviceType: {
          type: 'string',
          enum: Object.keys(SERVICE_LABELS),
          description: 'Type of escort service',
        },
        region: {
          type: 'string',
          enum: Object.keys(REGION_LABELS),
          description: 'Pricing region. Auto-detected from stateCode if not provided.',
        },
        stateCode: {
          type: 'string',
          description: 'US state or CA province code (e.g. TX, CA, ON). Used to auto-detect region and estimate permits.',
        },
        distanceMiles: { type: 'number', description: 'Total distance in miles' },
        daysEstimate: { type: 'number', description: 'Estimated days for the job (default: 1)' },
        isNightMove: { type: 'boolean', description: 'Night move premium' },
        isWeekend: { type: 'boolean', description: 'Weekend premium' },
        isHoliday: { type: 'boolean', description: 'Holiday premium' },
        isUrban: { type: 'boolean', description: 'Urban/metro surcharge' },
        isSuperwide: { type: 'boolean', description: 'Super-wide load premium' },
        hasAdvancedEquipment: { type: 'boolean', description: 'Advanced visibility equipment addon' },
        deadheadMiles: { type: 'number', description: 'Deadhead repositioning miles' },
        waitHours: { type: 'number', description: 'Detention/wait hours beyond free time' },
        paymentTerms: { type: 'string', enum: ['cod', 'net30', 'net45'] },
        rushLevel: { type: 'string', enum: ['sameDay', 'nextDay', 'standard'] },
        season: { type: 'string', enum: Object.keys(SEASONAL_MULTIPLIERS) },
        isCrossBorder: { type: 'string|false', enum: ['us_canada', 'us_mexico', false] },
        isMountainPass: { type: 'boolean', description: 'Mountain pass elevation premium' },
        currentDieselPrice: { type: 'number', description: 'Current diesel $/gallon for fuel surcharge' },
        numEscorts: { type: 'number', description: 'Number of escorts (convoy pricing if >1)' },
        brokerMarginPct: { type: 'number', description: 'Broker margin % (default: 20). Set to calculate broker markup.' },
        includeProfitability: { type: 'boolean', description: 'Include P&L profitability analysis' },
      },
    },
  });
}

// POST: calculate pricing
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate required fields
    const { serviceType, distanceMiles, stateCode, brokerMarginPct, includeProfitability } = body;

    if (!serviceType || !distanceMiles) {
      return NextResponse.json(
        { error: 'Missing required fields: serviceType, distanceMiles' },
        { status: 400 }
      );
    }

    const validServiceTypes: ServiceType[] = ['lead_chase', 'height_pole', 'bucket_truck', 'route_survey', 'police_escort'];
    if (!validServiceTypes.includes(serviceType)) {
      return NextResponse.json(
        { error: `Invalid serviceType. Must be one of: ${validServiceTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (typeof distanceMiles !== 'number' || distanceMiles <= 0) {
      return NextResponse.json(
        { error: 'distanceMiles must be a positive number' },
        { status: 400 }
      );
    }

    // Auto-detect region from stateCode if region not explicitly provided
    let region: Region = body.region || 'southeast';
    if (stateCode && !body.region) {
      const upper = stateCode.toUpperCase();
      region = STATE_REGION_MAP[upper] ?? PROVINCE_REGION_MAP[upper] ?? 'southeast';
    }

    // Build pricing input
    const pricingInput: PricingInput = {
      serviceType: serviceType as ServiceType,
      region,
      distanceMiles,
      daysEstimate: body.daysEstimate ?? 1,
      isNightMove: body.isNightMove ?? false,
      isWeekend: body.isWeekend ?? false,
      isHoliday: body.isHoliday ?? false,
      isUrban: body.isUrban ?? false,
      isSuperwide: body.isSuperwide ?? false,
      hasAdvancedEquipment: body.hasAdvancedEquipment ?? false,
      deadheadMiles: body.deadheadMiles ?? 0,
      waitHours: body.waitHours ?? 0,
      paymentTerms: body.paymentTerms ?? 'cod',
      rushLevel: body.rushLevel ?? 'standard',
      season: (body.season as Season) ?? 'standard',
      isCrossBorder: body.isCrossBorder ?? false,
      isMountainPass: body.isMountainPass ?? false,
      currentDieselPrice: body.currentDieselPrice ?? 0,
      numEscorts: body.numEscorts ?? 1,
      stateCode: stateCode?.toUpperCase(),
    };

    // Calculate
    const estimate = calculateEstimate(pricingInput);

    // Build response
    const response: Record<string, any> = {
      estimate: {
        low: estimate.low,
        mid: estimate.mid,
        high: estimate.high,
        currency: 'USD',
        lineItems: estimate.lineItems,
        warnings: estimate.warnings,
        upsells: estimate.upsells,
      },
      input: {
        serviceType: SERVICE_LABELS[serviceType as ServiceType],
        region: REGION_LABELS[region],
        distanceMiles,
        ...(stateCode ? { stateCode: stateCode.toUpperCase() } : {}),
      },
      meta: {
        engine: 'haul-command-pricing-engine-v2',
        generatedAt: new Date().toISOString(),
        rushPremiums: RUSH_PREMIUMS,
        seasonalMultipliers: SEASONAL_MULTIPLIERS,
      },
    };

    // Optional: Broker markup
    if (brokerMarginPct !== undefined) {
      const margin = Math.min(Math.max(Number(brokerMarginPct), 5), 50);
      response.brokerMarkup = calculateBrokerMarkup(estimate, margin);
    }

    // Optional: Profitability analysis
    if (includeProfitability) {
      response.profitability = analyzeProfitability(
        estimate.mid,
        distanceMiles,
        pricingInput.daysEstimate,
        {
          fuelCostPerGallon: pricingInput.currentDieselPrice || 3.85,
        }
      );
    }

    return NextResponse.json(response);
  } catch (err: any) {
    console.error('Pricing Calculator API error:', err);
    return NextResponse.json(
      { error: 'Internal pricing engine error', details: err.message },
      { status: 500 }
    );
  }
}
