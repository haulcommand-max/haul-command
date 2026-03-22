/**
 * POST /api/tools/load-analyzer
 *
 * Analyzes a load and returns profit score, risk score,
 * hidden costs, and recommendation.
 * Free users get profit score only.
 * Pro users get full report.
 */

import { NextRequest, NextResponse } from 'next/server';

// Corridor rate benchmarks (avg $/day) — seeded from industry data
const CORRIDOR_RATES: Record<string, number> = {
  'texas': 380, 'florida': 360, 'california': 420,
  'ohio': 340, 'pennsylvania': 350, 'georgia': 345,
  'north carolina': 355, 'illinois': 365, 'washington': 400,
  'oregon': 395, 'oklahoma': 370, 'new york': 410,
  'default': 375,
};

function getCorridorRate(origin: string, destination: string): number {
  const combined = `${origin} ${destination}`.toLowerCase();
  for (const [state, rate] of Object.entries(CORRIDOR_RATES)) {
    if (combined.includes(state)) return rate;
  }
  return CORRIDOR_RATES.default;
}

function calculateProfitScore(offeredRate: number, corridorAvg: number): number {
  if (corridorAvg === 0) return 50;
  const ratio = offeredRate / corridorAvg;
  if (ratio >= 1.2) return 95;
  if (ratio >= 1.1) return 85;
  if (ratio >= 1.0) return 75;
  if (ratio >= 0.9) return 60;
  if (ratio >= 0.8) return 40;
  if (ratio >= 0.7) return 25;
  return 10;
}

function calculateRiskScore(dims: { width: number; height: number; length: number; weight: number }): number {
  let risk = 10; // baseline

  // Width risk
  if (dims.width > 16) risk += 35;
  else if (dims.width > 14) risk += 25;
  else if (dims.width > 12) risk += 15;
  else if (dims.width > 10) risk += 8;

  // Height risk
  if (dims.height > 16) risk += 30;
  else if (dims.height > 14) risk += 20;
  else if (dims.height > 13) risk += 10;

  // Length risk
  if (dims.length > 150) risk += 25;
  else if (dims.length > 120) risk += 15;
  else if (dims.length > 100) risk += 8;

  // Weight risk
  if (dims.weight > 200000) risk += 20;
  else if (dims.weight > 150000) risk += 12;
  else if (dims.weight > 100000) risk += 5;

  return Math.min(100, Math.max(0, risk));
}

function calculateHiddenCosts(dims: { width: number; height: number; length: number; weight: number }): string[] {
  const costs: string[] = [];

  if (dims.width > 12) costs.push('Front + rear escort vehicles required ($300-600/day additional)');
  if (dims.width > 14) costs.push('Police escort likely required in most jurisdictions ($150-400/day)');
  if (dims.width > 16) costs.push('Multi-lane closure may be needed — additional $500-2,000');
  if (dims.height > 14) costs.push('Height pole operator required ($200-350/day)');
  if (dims.height > 15) costs.push('Route survey needed — overhead obstacles ($500-1,500 one-time)');
  if (dims.length > 120) costs.push('Extended rear escort distance — higher fuel costs');
  if (dims.weight > 150000) costs.push('Bridge engineering analysis potentially required ($1,000-5,000)');
  if (dims.width > 10 || dims.height > 13.5) costs.push('Night travel restrictions may apply — adds hotel/per diem costs');

  return costs;
}

function getRecommendation(profitScore: number, riskScore: number, hiddenCosts: string[]): { recommendation: string; reasoning: string } {
  const hiddenCostCount = hiddenCosts.length;

  if (profitScore >= 75 && riskScore <= 40) {
    return {
      recommendation: 'accept',
      reasoning: `Strong profit potential at ${profitScore}/100 with manageable risk (${riskScore}/100). The offered rate is competitive for this corridor and the load dimensions are within standard escort parameters.`,
    };
  }

  if (profitScore >= 50 && riskScore <= 60 && hiddenCostCount <= 2) {
    return {
      recommendation: 'negotiate',
      reasoning: `Profit score of ${profitScore}/100 could be improved. ${hiddenCostCount > 0 ? `There are ${hiddenCostCount} hidden cost factors that eat into margins.` : ''} Negotiate the rate up 10-15% to account for corridor conditions and complexity. Risk level is ${riskScore}/100.`,
    };
  }

  return {
    recommendation: 'decline',
    reasoning: `Profit score is only ${profitScore}/100 with risk at ${riskScore}/100. ${hiddenCostCount} hidden cost factors identified that will significantly erode margins. At the offered rate, this load is likely to lose money after accounting for escort requirements, permits, and operational overhead.`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pastedText, origin, destination, width, height, length, weight, offeredRate } = body;

    // Parse dimensions
    let dims = {
      width: parseFloat(width) || 10,
      height: parseFloat(height) || 13,
      length: parseFloat(length) || 60,
      weight: parseFloat(weight) || 80000,
    };

    let parsedOrigin = origin || '';
    let parsedDest = destination || '';
    let parsedRate = parseFloat(offeredRate) || 0;

    // If pasted text, try to extract data
    if (pastedText) {
      const text = pastedText.toLowerCase();
      // Simple extraction
      const widthMatch = text.match(/(\d+)[\s']*(ft|feet|')\s*wide/i) || text.match(/width[:\s]*(\d+)/i);
      const heightMatch = text.match(/(\d+)[\s']*(ft|feet|')\s*(tall|high)/i) || text.match(/height[:\s]*(\d+)/i);
      const lengthMatch = text.match(/(\d+)[\s']*(ft|feet|')\s*long/i) || text.match(/length[:\s]*(\d+)/i);
      const weightMatch = text.match(/([\d,]+)\s*(lbs|pounds)/i);
      const rateMatch = text.match(/\$\s*([\d,]+)\s*\/?\s*(day|per day)/i) || text.match(/rate[:\s]*\$?\s*([\d,]+)/i);

      if (widthMatch) dims.width = parseFloat(widthMatch[1]);
      if (heightMatch) dims.height = parseFloat(heightMatch[1]);
      if (lengthMatch) dims.length = parseFloat(lengthMatch[1]);
      if (weightMatch) dims.weight = parseFloat(weightMatch[1].replace(/,/g, ''));
      if (rateMatch) parsedRate = parseFloat(rateMatch[1].replace(/,/g, ''));
    }

    const corridorAvgRate = getCorridorRate(parsedOrigin, parsedDest);
    const profitScore = parsedRate > 0 ? calculateProfitScore(parsedRate, corridorAvgRate) : 50;
    const riskScore = calculateRiskScore(dims);
    const hiddenCosts = calculateHiddenCosts(dims);
    const { recommendation, reasoning } = getRecommendation(profitScore, riskScore, hiddenCosts);

    // For now, all users get full report (Pro gating handled client-side)
    // In production, check auth token for Pro status
    const isPro = false; // Default to free — client shows gate

    return NextResponse.json({
      profitScore,
      riskScore,
      hiddenCosts,
      recommendation,
      reasoning,
      corridorAvgRate,
      isPro,
    });
  } catch (err) {
    console.error('[Load Analyzer] Error:', err);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
