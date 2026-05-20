import { NextRequest, NextResponse } from 'next/server';
import { requireInternalRequest } from '@/lib/security/internal-request-auth';

// Legacy Elai article-to-video has been retired from new generation.
// Use the governed Media Command Center path instead:
// existing page -> HyperFrames, structured data -> Remotion, premium avatar -> HeyGen.
export async function POST(req: NextRequest) {
  const authFailure = requireInternalRequest(req);
  if (authFailure) return authFailure;

  return NextResponse.json(
    {
      ok: false,
      error: 'Legacy Elai article-to-video generation is retired.',
      replacement: {
        existing_page: 'HyperFrames',
        structured_data: 'Remotion',
        premium_avatar: 'HeyGen through Media Cost Governor',
      },
    },
    { status: 410 },
  );
}
