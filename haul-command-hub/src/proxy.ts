import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Haul Command — Global Route Guard Middleware
 * 
 * Eliminates 404s by redirecting known broken patterns to working alternatives.
 * Implements the "No Dead End" rule from the dominance audit.
 * 
 * Pattern: intercept → redirect → preserve intent
 */

// Known broken patterns → working destination
const ROUTE_FALLBACKS: [RegExp, string][] = [
  // Legacy profile URLs → directory with claim prompt
  [/^\/directory\/profile\/(.+)$/, '/directory?claim=1'],
  
  // Old onboarding start → claim page (catch-all)
  [/^\/onboarding(\/start)?$/, '/claim'],
  
  // Legacy rate detail pages → rates hub
  [/^\/rates\/([a-z]{2})\/pilot-car-cost$/, '/rates'],
  [/^\/rates\/([a-z]{2})\/(.+)$/, '/rates'],
  
  // Legacy requirement pages → canonical requirements
  [/^\/requirements\/([a-z]{2})\/escort-vehicle-rules$/, '/requirements/us/$1'],
  
  // Legacy jobs page → loads
  [/^\/jobs$/, '/loads'],
  
  // Old tool routes → current tool routes
  [/^\/tools\/compliance-copilot$/, '/tools/escort-calculator'],
  [/^\/tools\/permit-checker$/, '/tools/escort-calculator'],
  [/^\/tools\/permit-calculator$/, '/tools/escort-calculator'],
  [/^\/tools\/route-complexity$/, '/tools/superload-meter'],
  [/^\/tools\/route-iq$/, '/tools/load-analyzer'],
  [/^\/tools\/state-requirements$/, '/requirements'],
  [/^\/tools\/heavy-haul-index$/, '/corridors'],
  [/^\/tools\/rate-lookup$/, '/tools/rate-advisor'],
  [/^\/tools\/wind-turbine$/, '/tools/wind-turbine-planner'],
  [/^\/tools\/bridge$/, '/tools/bridge-formula'],
  [/^\/tools\/av-escort$/, '/tools/av-readiness'],
  [/^\/tools\/hotel$/, '/tools/hotel-finder'],
  [/^\/tools\/lodging$/, '/tools/hotel-finder'],
  [/^\/tools\/trucker-hotel$/, '/tools/hotel-finder'],
  [/^\/find-a-hotel$/, '/tools/hotel-finder'],
  [/^\/hotels$/, '/tools/hotel-finder'],
  [/^\/truck-stops$/, '/tools/hotel-finder'],
  [/^\/truck-stop$/, '/tools/hotel-finder'],
  [/^\/truckstops$/, '/tools/hotel-finder'],
  [/^\/tools\/truck-stops$/, '/tools/hotel-finder'],
  [/^\/tools\/truck-stop$/, '/tools/hotel-finder'],
  
  // Old services marketplace → services hub
  [/^\/services\/marketplace$/, '/services'],
  
  // Old map jurisdiction → map
  [/^\/map\/jurisdiction$/, '/map'],
  
  // Legacy home route
  [/^\/home$/, '/'],
  
  // Old start page → claim
  [/^\/start$/, '/claim'],

  // Escrow standalone → pricing
  [/^\/escrow\/checkout$/, '/pricing'],

  // Pilot car regulations → requirements (SEO capture from competitor URLs)
  [/^\/pilot-car-regulations$/, '/requirements/us'],
  [/^\/state-pilot-car-guidelines$/, '/requirements/us'],
  [/^\/pilot-car-regulations\/([a-z-]+)$/, '/requirements/us'],
  [/^\/escort-regulations$/, '/requirements/us'],
  [/^\/regulations$/, '/requirements'],

  // Certifications SEO capture
  [/^\/certifications$/, '/tools/certifications'],
  [/^\/certification$/, '/tools/certifications'],
  [/^\/witpac$/, '/tools/certifications'],
  [/^\/flagger$/, '/tools/certifications'],
  [/^\/pilot-car-certification$/, '/tools/certifications'],

  // Competitor Capture (ODSNA, HeavyHaulers, WideloadShipping, WCS Permits, Truckstop, Oversize.io)
  [/^\/heavy-haul-load-board$/, '/loads'],
  [/^\/heavy-haulers$/, '/loads'],
  [/^\/oversize-load-directory$/, '/directory'],
  [/^\/managed-pilot-cars$/, '/pricing'],
  [/^\/pilot-car-services$/, '/services'],
  [/^\/buy-oversize-permits$/, '/tools/permit-cost'],
  [/^\/wcs-permits$/, '/tools/permit-cost'],
  [/^\/oversize-routing$/, '/tools/route-planner'],
  [/^\/superload-routing$/, '/tools/route-planner'],
  [/^\/oversize-io$/, '/alternatives/oversize-io'],
  [/^\/oversize\.io$/, '/alternatives/oversize-io'],
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  for (const [pattern, destination] of ROUTE_FALLBACKS) {
    const match = pathname.match(pattern);
    if (match) {
      // Replace capture groups in destination
      let finalDest = destination;
      for (let i = 1; i < match.length; i++) {
        if (match[i]) finalDest = finalDest.replace(`$${i}`, match[i]);
      }
      
      const url = request.nextUrl.clone();
      url.pathname = finalDest;
      
      // Preserve any existing query params
      return NextResponse.redirect(url, { status: 301 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files, API routes, and Next.js internals
    '/((?!api|_next/static|_next/image|favicon.ico|icons|images|manifest|robots|sitemap).*)',
  ],
};
