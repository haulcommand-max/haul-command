// Haul Command — A/B Testing Variant Engine (Edge Middleware Support)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const EXPERIMENTS = {
  HOME_HERO: {
    id: 'exp_home_hero_01',
    variants: ['control', 'action_focused'],
    cookieName: 'hc_exp_home_hero',
  },
  CHECKOUT_FLOW: {
    id: 'exp_checkout_02',
    variants: ['control', 'one_click'],
    cookieName: 'hc_exp_checkout',
  }
};

/**
 * Basic Edge Engine to assign and route variant groups.
 * To be injected into Next.js middleware.js
 */
export function getVariantBucket(experimentId: string, variants: string[]): string {
  // Simple modulo hash (or random assignment for new visitors)
  const hash = Math.random();
  const bucketIndex = Math.floor(hash * variants.length);
  return variants[bucketIndex];
}

/**
 * Middleware handler for A/B testing
 */
export function handleABTesting(req: NextRequest, res: NextResponse): NextResponse {
  // 1. Home Hero Experiment
  if (req.nextUrl.pathname === '/') {
    let variant = req.cookies.get(EXPERIMENTS.HOME_HERO.cookieName)?.value;
    if (!variant || !EXPERIMENTS.HOME_HERO.variants.includes(variant)) {
      variant = getVariantBucket(EXPERIMENTS.HOME_HERO.id, EXPERIMENTS.HOME_HERO.variants);
      
      // Rewrite to the variant page (if using separate files)
      // or simply pass it as a header that the server component reads
      res.cookies.set(EXPERIMENTS.HOME_HERO.cookieName, variant, { maxAge: 60 * 60 * 24 * 30 }); // 30 days
      res.headers.set(`x-hc-variant-${EXPERIMENTS.HOME_HERO.id}`, variant);
    } else {
      res.headers.set(`x-hc-variant-${EXPERIMENTS.HOME_HERO.id}`, variant);
    }
  }

  // Add more paths as the variant engine scales
  return res;
}

/**
 * Server Component Helper to read variant instantly
 */
import { cookies, headers } from 'next/headers';

export async function getActiveVariant(experiment: keyof typeof EXPERIMENTS): Promise<string> {
  const cookieStore = await cookies();
  const exp = EXPERIMENTS[experiment];
  const variant = cookieStore.get(exp.cookieName)?.value;
  return variant || 'control'; // Fallback
}
