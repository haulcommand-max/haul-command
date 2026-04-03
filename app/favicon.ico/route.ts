import { NextResponse } from 'next/server';

export async function GET() {
  // Redirect legacy /favicon.ico requests to the Next.js generated /icon.png
  return NextResponse.redirect(new URL('/icon.png', process.env.NEXT_PUBLIC_SITE_URL || 'https://www.haulcommand.com'), {
    status: 301,
  });
}
