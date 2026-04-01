// DEPRECATED: This route handler conflicts with Next.js App Router.
// robots.txt is now served from public/robots.txt (static file, always wins).
// This file is intentionally a no-op redirect to avoid the naming conflict.
import { NextResponse } from 'next/server';

export async function GET() {
    // Redirect to the canonical static robots.txt served from /public
    // This handler should never fire in practice — public/robots.txt takes precedence.
    return NextResponse.redirect('https://www.haulcommand.com/robots.txt', {
        status: 301,
    });
}
