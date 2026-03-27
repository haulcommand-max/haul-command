import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { ReviewGatingEngine } from '@/lib/engines/review-gating-engine';

// POST /api/reviews/feedback
// Records user feedback and routes to Google Review or Support
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { rating, feedback, milestoneType } = body;

  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Rating 1-5 required' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const engine = new ReviewGatingEngine(supabase);

  const result = await engine.recordFeedback(
    user.id,
    rating,
    feedback || '',
    { type: milestoneType || 'days_on_platform' }
  );

  // If routed to Google Review, include the review URL
  const response: Record<string, unknown> = { ...result };
  if (result.routedTo === 'google_review') {
    response.reviewUrl = engine.getReviewUrl();
  }

  return NextResponse.json(response);
}
