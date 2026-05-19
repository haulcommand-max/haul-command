import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function resolveCookieStore(options?: any) {
  try {
    const candidate = options?.cookies ? options.cookies() : cookies();
    if (candidate && typeof candidate.then === "function") {
      return await candidate;
    }
    return candidate;
  } catch {
    return null;
  }
}

export function createServerComponentClient(options?: any) {
  const cookieStorePromise = resolveCookieStore(options);
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async getAll() {
          try {
            const cookieStore: any = await cookieStorePromise;
            return cookieStore?.getAll?.() ?? [];
          } catch {
            return [];
          }
        },
        async setAll(cookiesToSet) {
          try {
            const cookieStore: any = await cookieStorePromise;
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore?.set?.(name, value, options);
            });
          } catch (error) {
            // The `setAll` method was called from a Server Component or
            // the request cookie store is not writable/available. This can
            // be ignored when middleware refreshes user sessions.
          }
        },
      },
    }
  );
}
