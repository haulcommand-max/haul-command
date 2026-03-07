/**
 * Performance guards for hero video playback.
 * Returns false if we should show a static poster instead.
 *
 * Guards:
 * - prefers-reduced-motion
 * - Save-Data header
 * - Slow connections (2G / slow-2G)
 * - Low device memory (< 4GB)
 */
export function shouldPlayVideo(): boolean {
    if (typeof window === "undefined") return false;

    // 1. Reduced motion preference
    const rm = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (rm?.matches) return false;

    // 2. Network + data saver hints
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navAny = navigator as any;
    const conn =
        navAny?.connection ?? navAny?.mozConnection ?? navAny?.webkitConnection;

    if (conn?.saveData) return false;

    const effectiveType = conn?.effectiveType as string | undefined;
    if (
        effectiveType &&
        (effectiveType === "slow-2g" || effectiveType === "2g")
    )
        return false;

    // 3. Device memory hint (not supported everywhere — default allow)
    const dm = navAny?.deviceMemory as number | undefined;
    if (typeof dm === "number" && dm > 0 && dm < 4) return false;

    return true;
}
