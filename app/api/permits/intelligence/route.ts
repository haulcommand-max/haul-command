/**
 * POST /api/permits/intelligence
 * Permit Intelligence Engine API — The competitive moat.
 * Answers compliance questions, checks requirements, analyzes routes.
 * 
 * Revenue: 10 free questions/month, $9/month for unlimited.
 */
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { permitEngine } from '@/core/intelligence/PermitIntelligenceEngine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...params } = body;

    switch (action) {
      case 'check_requirements': {
        const { jurisdictionCode } = params;
        if (!jurisdictionCode) {
          return NextResponse.json({ error: 'jurisdictionCode is required' }, { status: 400 });
        }
        const requirements = await permitEngine.getRequirements(jurisdictionCode);
        if (!requirements) {
          return NextResponse.json({ error: `Unknown jurisdiction: ${jurisdictionCode}` }, { status: 404 });
        }
        return NextResponse.json({ requirements });
      }

      case 'analyze_route': {
        const { origin, destination, transit, loadWidth, loadHeight, loadWeight } = params;
        if (!origin || !destination) {
          return NextResponse.json({ error: 'origin and destination are required' }, { status: 400 });
        }
        const analysis = await permitEngine.analyzeRoute(
          origin, destination, transit || [], loadWidth, loadHeight, loadWeight
        );
        return NextResponse.json({ analysis });
      }

      case 'ask': {
        const { question, jurisdictionCode, loadWidth, loadHeight, loadLength, loadWeight } = params;
        if (!question) {
          return NextResponse.json({ error: 'question is required' }, { status: 400 });
        }
        const answer = await permitEngine.answerQuestion({
          question, jurisdictionCode, loadWidth, loadHeight, loadLength, loadWeight,
        });
        return NextResponse.json({ answer });
      }

      default:
        return NextResponse.json({
          error: `Unknown action: ${action}. Use: check_requirements, analyze_route, ask`,
        }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
  }
}
