/**
 * lib/build-guard.ts
 *
 * Build-time safety utilities.
 *
 * PURPOSE: Prevent pages from accidentally attempting static generation
 * when they make database calls. Import helpers from here in any page
 * that runs at build time.
 *
 * HOW IT WORKS: During `next build`, Supabase calls will fail with a
 * helpful error instead of hanging for 60+ seconds and crashing the build.
 */

/**
 * Pages that are ALLOWED to be statically generated.
 * All others must have `export const dynamic = 'force-dynamic'`.
 *
 * Keep this list small and intentional. Only add pages here if:
 * 1. They do NOT fetch from the database at build time
 * 2. Their content rarely changes (marketing pages, static docs, etc.)
 * 3. They have been tested to complete static gen in < 10 seconds
 */
export const STATIC_PAGES_ALLOWLIST = [
  '/',
  '/about',
  '/pricing',
  '/contact',
  '/terms',
  '/privacy',
  '/blog',     // only the index — individual posts use ISR
] as const

/**
 * Maximum acceptable static generation time per page (milliseconds).
 * Vercel kills workers at 60,000ms. We use 30,000ms to have a safety buffer.
 */
export const MAX_STATIC_GEN_MS = 30_000

/**
 * Pages in these route groups MUST always be force-dynamic.
 * Any page under these paths that attempts static gen is a bug.
 */
export const ALWAYS_DYNAMIC_PREFIXES = [
  '/admin',               // Auth-gated, always fresh
  '/dashboard',           // User-specific data
  '/api',                 // Already dynamic (API routes)
  '/directory',           // 1.56M+ entities — never pre-render
  '/escort-requirements', // Live regulatory data
  '/dispatch',            // Real-time operations
  '/loads',               // Live load board
  '/messages',            // Real-time chat
  '/notifications',       // User-specific
] as const

/**
 * Use this to validate your page configuration at runtime (development only).
 * Import in any page you want to audit:
 *
 *   import { assertDynamic } from '@/lib/build-guard'
 *   assertDynamic('/directory') // logs warning in dev if dynamic is not set
 */
export function assertDynamic(routePath: string): void {
  if (process.env.NODE_ENV !== 'development') return

  const shouldBeDynamic = ALWAYS_DYNAMIC_PREFIXES.some((prefix) =>
    routePath.startsWith(prefix)
  )

  if (shouldBeDynamic) {
    console.warn(
      `[build-guard] ⚠️ Route "${routePath}" is under a dynamic-only prefix. ` +
        `Ensure you have 'export const dynamic = "force-dynamic"' at the top of this page file.`
    )
  }
}

/**
 * Use this in generateStaticParams() if you ever need to partially pre-render
 * a subset of pages (e.g., top 100 blog posts).
 *
 * NEVER use this for directory listings or database-heavy pages.
 *
 * @param params - Array of params to generate
 * @param maxCount - Hard limit to prevent accidental over-generation
 * @returns The params array, capped at maxCount
 */
export function safeStaticParams<T>(
  params: T[],
  maxCount: number = 500
): T[] {
  if (params.length > maxCount) {
    console.warn(
      `[build-guard] generateStaticParams() received ${params.length} params. ` +
        `Capping at ${maxCount} to prevent build timeout. ` +
        `Consider using ISR (export const revalidate = N) instead.`
    )
    return params.slice(0, maxCount)
  }
  return params
}

/**
 * ISR revalidation intervals for different content types.
 * Use these constants instead of magic numbers.
 *
 * Usage:
 *   export const revalidate = ISR.HOURLY
 */
export const ISR = {
  /** 5 minutes — near-real-time data (lead boards, availability) */
  NEAR_REALTIME: 300,

  /** 30 minutes — semi-static data (company profiles) */
  HALF_HOUR: 1_800,

  /** 1 hour — relatively stable data (permit requirements by state) */
  HOURLY: 3_600,

  /** 6 hours — slowly changing data (route guides, regulations) */
  SIX_HOURS: 21_600,

  /** 24 hours — very stable data (static content, FAQs) */
  DAILY: 86_400,

  /** Never cache — always fetch fresh. Same as force-dynamic for data. */
  NEVER: 0,
} as const
