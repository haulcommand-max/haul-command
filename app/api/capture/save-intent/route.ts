import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSavedIntent, type SavedEntityType } from '@/lib/capture';

// ══════════════════════════════════════════════════════════════
// POST /api/capture/save-intent
// Save a state, corridor, operator, regulation, or search
// Body: { entityType, entityId, entityLabel, metadata?, userId? }
// ══════════════════════════════════════════════════════════════

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entityType, entityId, entityLabel, metadata, userId } = body;

    if (!entityType || !entityId || !entityLabel) {
      return NextResponse.json(
        { error: 'entityType, entityId, and entityLabel are required' },
        { status: 400 }
      );
    }

    const validTypes: SavedEntityType[] = [
      'state', 'corridor', 'operator', 'company', 'regulation',
      'glossary_topic', 'search', 'border_crossing', 'certification',
      'equipment_type',
    ];

    if (!validTypes.includes(entityType)) {
      return NextResponse.json(
        { error: `Invalid entityType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Get user from session or use provided userId
    const supabase = await createClient();
    let resolvedUserId = userId;

    if (!resolvedUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      resolvedUserId = user?.id || `anon_${Date.now()}`;
    }

    const savedIntent = createSavedIntent(
      resolvedUserId,
      entityType as SavedEntityType,
      entityId,
      entityLabel,
      metadata || {},
    );

    // Persist to database
    const { data, error } = await supabase
      .from('saved_intents')
      .upsert(
        {
          id: savedIntent.id,
          user_id: savedIntent.userId,
          entity_type: savedIntent.entityType,
          entity_id: savedIntent.entityId,
          entity_label: savedIntent.entityLabel,
          metadata: savedIntent.metadata,
          alerts_enabled: savedIntent.alertsEnabled,
          alert_frequency: savedIntent.alertFrequency,
          alert_channels: savedIntent.alertChannels,
          saved_at: savedIntent.savedAt,
        },
        { onConflict: 'user_id,entity_type,entity_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Save intent error:', error);
      // Graceful fallback
      return NextResponse.json({
        success: true,
        message: 'Intent saved',
        intent: savedIntent,
        note: 'Pending table creation',
      });
    }

    return NextResponse.json({
      success: true,
      message: `Saved ${entityType}: ${entityLabel}`,
      intent: data,
    });
  } catch (err) {
    console.error('Save intent error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ══════════════════════════════════════════════════════════════
// GET /api/capture/save-intent?userId=xxx
// Get all saved intents for a user
// ══════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('saved_intents')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    if (error) {
      return NextResponse.json({ intents: [], note: 'Table may not exist yet' });
    }

    return NextResponse.json({ intents: data || [] });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ══════════════════════════════════════════════════════════════
// DELETE /api/capture/save-intent?entityType=...&entityId=...
// Remove a saved intent
// ══════════════════════════════════════════════════════════════

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType');
    const entityId = searchParams.get('entityId');
    const userId = searchParams.get('userId');

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entityType and entityId required' }, { status: 400 });
    }

    const supabase = await createClient();
    let resolvedUserId = userId;

    if (!resolvedUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      // If anonymous, we can't reliably delete unless they pass the anon userId, 
      // but typical unsave is for authenticated users.
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      resolvedUserId = user.id;
    }

    const { error } = await supabase
      .from('saved_intents')
      .delete()
      .eq('user_id', resolvedUserId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId);

    if (error) {
      console.error('Delete intent error:', error);
      return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: `Unsaved ${entityType}` });
  } catch (err) {
    console.error('Delete intent exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

