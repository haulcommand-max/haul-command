import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { supabaseMiddleware } from './lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // First, run the existing supabase auth middleware to sync cookies
  const { res, user, supabase } = await supabaseMiddleware(request);

  // Check if this is a Command /hq route
  if (request.nextUrl.pathname.startsWith('/hq')) {
    // If no user is logged in, redirect to login
    if (!user) {
      return NextResponse.redirect(new URL('/login?next=/hq', request.url));
    }

    // Role-based verification (must be a system administrator or explicit HQ team)
    // Verify the user's role against your profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // If profile doesn't exist or isn't a system_admin
    if (!profile || profile.role !== 'system_admin') {
      // Force redirect non-administrative users away from the Command Layer
      return NextResponse.redirect(new URL('/next-moves?error=unauthorized_hq', request.url));
    }
  }

  return res;
}

// Only match /hq routes for strict execution context.
export const config = {
  matcher: [
    '/hq/:path*',
  ],
}
