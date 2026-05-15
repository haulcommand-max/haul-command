import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const OPEN_STATUS = new Set(['open', 'closed', 'seasonal', 'unknown']);
const SECURITY_PRESENCE = new Set(['none_seen', 'occasional', 'active_security', 'law_enforcement_nearby', 'unknown']);

function text(form: FormData, key: string) {
  const value = form.get(key);
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function bool(form: FormData, key: string) {
  const value = text(form, key);
  if (!value) return null;
  if (['true', '1', 'yes', 'on'].includes(value.toLowerCase())) return true;
  if (['false', '0', 'no', 'off'].includes(value.toLowerCase())) return false;
  return null;
}

function rating(form: FormData, key: string) {
  const value = Number(text(form, key));
  return Number.isInteger(value) && value >= 1 && value <= 5 ? value : null;
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Sign in to submit a field condition report.' }, { status: 401 });
  }

  const form = await req.formData();
  const entityId = text(form, 'entity_id');
  if (!entityId) {
    return NextResponse.json({ error: 'entity_id is required' }, { status: 400 });
  }

  const openStatus = text(form, 'open_status') ?? 'unknown';
  const securityPresence = text(form, 'security_presence') ?? 'unknown';
  if (!OPEN_STATUS.has(openStatus) || !SECURITY_PRESENCE.has(securityPresence)) {
    return NextResponse.json({ error: 'Invalid condition value.' }, { status: 400 });
  }

  const { error } = await supabase.from('hc_public_infrastructure_condition_reports').insert({
    entity_id: entityId,
    reporter_user_id: user.id,
    report_status: 'pending',
    source_type: text(form, 'source_type') === 'steward_report' ? 'steward_report' : 'community_report',
    open_status: openStatus,
    safety_rating: rating(form, 'safety_rating'),
    cleanliness_rating: rating(form, 'cleanliness_rating'),
    lighting_rating: rating(form, 'lighting_rating'),
    security_presence: securityPresence,
    wifi_available: bool(form, 'wifi_available'),
    restrooms_available: bool(form, 'restrooms_available'),
    overnight_allowed: bool(form, 'overnight_allowed'),
    oversized_access_notes: text(form, 'oversized_access_notes'),
    hazard_notes: text(form, 'hazard_notes'),
    amenity_notes: text(form, 'amenity_notes'),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, status: 'pending_review' });
}
