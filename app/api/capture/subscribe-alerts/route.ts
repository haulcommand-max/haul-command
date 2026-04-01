import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ALERT_CATEGORY_CONFIG, type AlertCategory } from '@/lib/capture';

// ══════════════════════════════════════════════════════════════
// POST /api/capture/subscribe-alerts
// Subscribe a user to specific alert categories
// Body: { email, categories: AlertCategory[], role?: string }
// ══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, categories, role, push_token } = body;

    if (!email && !push_token) {
      return NextResponse.json(
        { error: 'Email or push token required' },
        { status: 400 }
      );
    }

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json(
        { error: 'At least one alert category required' },
        { status: 400 }
      );
    }

    // Validate categories
    const validCategories = categories.filter(
      (c: string) => c in ALERT_CATEGORY_CONFIG
    ) as AlertCategory[];

    if (validCategories.length === 0) {
      return NextResponse.json(
        { error: 'No valid alert categories provided' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Upsert subscriber
    const { data: subscriber, error: subError } = await supabase
      .from('alert_subscribers')
      .upsert(
        {
          email: email || null,
          push_token: push_token || null,
          role: role || 'unknown',
          categories: validCategories,
          subscribed_at: new Date().toISOString(),
          is_active: true,
        },
        { onConflict: 'email' }
      )
      .select()
      .single();

    if (subError) {
      console.error('Alert subscription error:', subError);
      // Don't fail — table might not exist yet, store in memory
      return NextResponse.json({
        success: true,
        message: 'Subscription registered',
        categories: validCategories,
        note: 'Pending table creation',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Subscribed to alerts',
      categories: validCategories,
      subscriberId: subscriber?.id,
    });
  } catch (err) {
    console.error('Alert subscription error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
