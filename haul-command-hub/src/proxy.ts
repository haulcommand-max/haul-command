import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Haul Command — Global Route Guard Proxy (Next.js 16+)
 *
 * Renamed from middleware.ts → proxy.ts per Next.js 16 convention.
 * Eliminates 404s by redirecting known broken patterns to working alternatives.
 * Implements the "No Dead End" rule — every URL resolves to value.
 */

const ROUTE_FALLBACKS: [RegExp, string][] = [
  // Legacy profile URLs → directory with claim prompt
  [/^\/directory\/profile\/(.+)$/, '/directory?claim=1'],
  // Old onboarding → claim
  [/^\/onboarding(\/start)?$/, '/claim'],
  // Legacy rate detail pages → rates hub
  [/^\/rates\/[a-z]{2}\/(.+)$/, '/rates'],
  // Legacy requirement crash pages → working equivalents
  [/^\/requirements\/([a-z]{2})\/escort-vehicle-rules$/, '/requirements/us/$1'],
  // /jobs → /loads
  [/^\/jobs$/, '/loads'],
  // Old tool names → current names
  [/^\/tools\/compliance-copilot$/, '/tools/escort-calculator'],
  [/^\/tools\/permit-checker$/, '/tools/escort-calculator'],
  [/^\/tools\/permit-calculator$/, '/tools/escort-calculator'],
  [/^\/tools\/route-complexity$/, '/tools/superload-meter'],
  [/^\/tools\/route-iq$/, '/tools/load-analyzer'],
  [/^\/tools\/state-requirements$/, '/requirements'],
  [/^\/tools\/heavy-haul-index$/, '/corridors'],
  [/^\/tools\/rate-lookup$/, '/tools/rate-advisor'],
  // Legacy shell pages
  [/^\/services\/marketplace$/, '/services'],
  [/^\/map\/jurisdiction$/, '/map'],
  [/^\/home$/, '/'],
  [/^\/start$/, '/claim'],
  // Old escrow standalone link
  [/^\/escrow\/checkout$/, '/pricing'],
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  for (const [pattern, destination] of ROUTE_FALLBACKS) {
    const match = pathname.match(pattern);
    if (match) {
      let finalDest = destination;
      for (let i = 1; i < match.length; i++) {
        if (match[i]) finalDest = finalDest.replace(`$${i}`, match[i]);
      }
      const url = request.nextUrl.clone();
      url.pathname = finalDest;
      return NextResponse.redirect(url, { status: 301 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|icons|images|manifest|robots|sitemap).*)',
  ],
};
