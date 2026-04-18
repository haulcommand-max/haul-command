import { redirect } from 'next/navigation';
import { stateFullName, US_STATES } from '@/lib/geo/state-names';

// ═══════════════════════════════════════════════════════════════
// /regulations/[country]/[region] — Region regulation redirect
// P1 FIX: This directory was empty. Visiting /regulations/us/texas
// crashed or fell through to a catch-all.
//
// Strategy: Redirect to /escort-requirements/[state_code] for
// US states (since that's where the actual requirement data lives).
// For non-US regions, redirect to /regulations/[country].
// ═══════════════════════════════════════════════════════════════

interface PageProps {
  params: Promise<{ country: string; region: string }>;
}

// Build reverse lookup: full name → state code
const STATE_NAME_TO_CODE: Record<string, string> = {};
for (const [code, name] of Object.entries(US_STATES)) {
  STATE_NAME_TO_CODE[name.toLowerCase().replace(/\s+/g, '-')] = code.toLowerCase();
  STATE_NAME_TO_CODE[name.toLowerCase()] = code.toLowerCase();
  STATE_NAME_TO_CODE[code.toLowerCase()] = code.toLowerCase();
}

export default async function RegulationRegionPage({ params }: PageProps) {
  const { country, region } = await params;
  const countryLower = country.toLowerCase();

  if (countryLower === 'us') {
    // Try to resolve region to a state code
    const stateCode = STATE_NAME_TO_CODE[region.toLowerCase()];
    if (stateCode) {
      redirect(`/escort-requirements/${stateCode}`);
    }
    // Unknown region — redirect to US regulation hub
    redirect('/regulations/us');
  }

  // Non-US: redirect to country regulation hub
  redirect(`/regulations/${countryLower}`);
}
