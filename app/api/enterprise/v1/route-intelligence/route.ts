import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { evaluateRouteCompliance } from '@/lib/compliance/reciprocity-engine';

/* ═══════════════════════════════════════════════════════════════════
   ENTERPRISE DATA API: ROUTE INTELLIGENCE (v1)
   Provides algorithmic compliance checking, escort requirements, and
   corridor intelligence for Enterprise integrators (TMS / Brokers).
   Authentication via Bearer token representing an Enterprise account.
   ═══════════════════════════════════════════════════════════════════ */

export async function POST(req: Request) {
  try {
    // 1. Authenticate Enterprise Request (Mock auth for demo structure)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer hc_ent_')) {
      return NextResponse.json({ error: 'Unauthorized Enterprise Key' }, { status: 401 });
    }

    const payload = await req.json();
    const { 
      route_states, 
      operator_certifications,
      load_dimensions
    } = payload;

    if (!Array.isArray(route_states) || route_states.length === 0) {
      return NextResponse.json({ error: 'Valid "route_states" array required (e.g. ["TX", "NM", "AZ"])' }, { status: 400 });
    }

    // Initialize Supabase if DB calls are needed (e.g., checking specific state restrictions)
    const supabase = createClient();

    // 2. Execute Reciprocity Engine Check
    const complianceProfile = evaluateRouteCompliance(
      operator_certifications || [],
      route_states
    );

    // 3. Draft Minimum Escort Requirements via Dimensions
    // Simple placeholder logic for the API
    let escortRequirements = '1 Front, 1 Rear';
    let heightPoleRequired = false;
    let policeEscortRequired = false;

    if (load_dimensions) {
      const { width, height } = load_dimensions;
      if (width > 16) {
        policeEscortRequired = true;
      } else if (width < 12) {
        escortRequirements = '1 Front Only';
      }

      if (height > 14.5) {
        heightPoleRequired = true;
      }
    }

    // 4. Determine Curfews or active restrictions across the corridor
    // In production, query the `regulation_pages` or active notices table
    const activeRestrictions = [];
    if (route_states.includes('CO')) {
      activeRestrictions.push({ state: 'CO', warning: 'Winter Chain Laws in Effect. All escorts require chains.' });
    }
    if (route_states.includes('NY')) {
      activeRestrictions.push({ state: 'NY', warning: 'Strict NY Certification Required. No Reciprocity.' });
    }

    // 5. Construct Enterprise Data Response
    const responseData = {
      intelligence_id: `hc_intel_${Date.now()}`,
      route_analysis: {
        corridor: route_states.join(' -> '),
        compliance: complianceProfile,
        requirements: {
          escorts_recommended: escortRequirements,
          height_pole_mandatory: heightPoleRequired,
          law_enforcement_mandatory: policeEscortRequired,
        },
        active_restrictions: activeRestrictions
      },
      cached_at: new Date().toISOString()
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
