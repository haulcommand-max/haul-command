/**
 * Next.js Instrumentation Hook
 * 
 * Runs once on server startup, BEFORE any routes or pages are evaluated.
 * Used here to patch Supabase's PostgrestBuilder prototype with a .catch()
 * method that webpack's SSR prerenderer expects but doesn't exist natively
 * (PostgrestBuilder only implements .then(), making it PromiseLike not Promise).
 *
 * This fixes: TypeError: a.rpc(...).catch is not a function
 * during Vercel builds with webpack bundler.
 */
export async function register() {
    if (process.env.NEXT_RUNTIME === 'nodejs') {
        try {
            // Dynamically import to get the actual PostgrestBuilder class
            const mod = await import('@supabase/postgrest-js');

            // Find PostgrestBuilder — it may be a named export or nested
            const Builder =
                (mod as any).PostgrestBuilder ??
                (mod as any).default?.PostgrestBuilder;

            if (Builder?.prototype && !Builder.prototype.catch) {
                // Patch .catch() — delegates to .then(undefined, onRejected)
                // This is the standard PromiseLike → Promise bridge
                Builder.prototype.catch = function <T>(
                    this: PromiseLike<T>,
                    onRejected?: ((reason: any) => any) | null,
                ) {
                    return this.then(undefined, onRejected ?? undefined);
                };
                console.log('[instrumentation] Patched PostgrestBuilder.prototype.catch');
            }
        } catch (e) {
            // Non-fatal — if the import fails, the original error will surface
            console.warn('[instrumentation] Could not patch PostgrestBuilder:', e);
        }
    }
}
