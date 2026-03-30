'use client';

/**
 * Lazy-loaded NativeAdCard wrapper.
 *
 * NativeAdCard uses @supabase/supabase-js .rpc() which returns a PromiseLike
 * (has .then() but NOT .catch()). When webpack bundles this for SSR, Next.js's
 * RSC serializer calls .catch() on the PromiseLike, causing:
 *   TypeError: a.rpc(...).catch is not a function
 *
 * Fix: dynamic import with ssr: false ensures the Supabase client code is
 * never included in server-side bundles.
 */
import dynamic from 'next/dynamic';

export const NativeAdCard = dynamic(
    () => import('@/components/ads/NativeAdCard').then((m) => m.NativeAdCard),
    { ssr: false }
);
