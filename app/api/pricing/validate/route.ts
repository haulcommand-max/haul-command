// ═══════════════════════════════════════════════════════════════════════════════
// PRICING SANITY VALIDATION API
// POST /api/pricing/validate — Validate a proposed price before charging
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { PricingSanityGuard } from '@/lib/pricing/global-pricing-sanity-guard';
import type { PricingActionType } from '@/lib/pricing/global-pricing-sanity-guard';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const {
            action_type, currency, proposed_price, usd_reference,
            country_code, corridor_id,
        } = body;

        if (!action_type || !currency || proposed_price == null || usd_reference == null || !country_code) {
            return NextResponse.json({
                error: 'Missing required fields: action_type, currency, proposed_price, usd_reference, country_code',
            }, { status: 400 });
        }

        const validActions: PricingActionType[] = [
            'subscription', 'match_fee', 'load_boost',
            'featured_slot', 'data_product', 'place_premium', 'adgrid_bid',
        ];
        if (!validActions.includes(action_type)) {
            return NextResponse.json({
                error: `Invalid action_type. Valid: ${validActions.join(', ')}`,
            }, { status: 400 });
        }

        const result = PricingSanityGuard.validate({
            actionType: action_type,
            localCurrency: currency,
            proposedPriceLocal: proposed_price,
            usdReference: usd_reference,
            countryCode: country_code.toUpperCase(),
            corridorId: corridor_id,
        });

        // Persist to audit log
        const supabase = getSupabaseAdmin();

        await supabase.from('pricing_sanity_audit').insert({
            action_type,
            country_code: country_code.toUpperCase(),
            original_price: result.originalPrice,
            safe_price: result.safePrice,
            safe_price_usd: result.safePriceUsd,
            currency,
            adjustment_made: result.adjustmentMade,
            adjustment_reason: result.adjustmentReason,
            risk_flag_type: result.riskFlag?.type,
            risk_flag_severity: result.riskFlag?.severity,
            margin_estimate_pct: result.marginEstimate.grossMarginPct,
            guards_passed: result.guards.filter(g => g.passed).length,
            guards_failed: result.guards.filter(g => !g.passed).length,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error('[pricing/validate] Error:', error);
        return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
    }
}
