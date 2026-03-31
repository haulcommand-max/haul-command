/**
 * POST /api/leads/resource-download
 *
 * Unified lead capture + Listmonk subscription for Resource Hub downloads.
 * 
 * Flow:
 *  1. Validate email
 *  2. Upsert into lead_captures (Supabase) with source=resource_hub_download
 *  3. Subscribe to Listmonk "Resource Downloads" list (list ID 2 — create in Listmonk if needed)
 *  4. Redirect to /resources?download=success
 *
 * UPGRADE: Uses existing lib/email/listmonk-client.ts instead of Resend
 *          (Listmonk is self-hosted — zero marginal cost, full control)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addSubscriber } from '@/lib/email/listmonk-client';

export const dynamic = 'force-dynamic';

// Listmonk list IDs — verify/create in Listmonk dashboard
// hc-listmonk.fly.dev → Lists → New List
const LISTMONK_RESOURCE_LIST_ID = parseInt(process.env.LISTMONK_RESOURCE_LIST_ID || '2', 10);

export async function POST(req: NextRequest) {
  try {
    // Handle both JSON and form submissions
    let email = '';
    let name = '';
    let source = 'resource_hub_download';

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      email = (body.email || '').trim().toLowerCase();
      name = body.name || '';
      source = body.source || source;
    } else {
      const formData = await req.formData();
      email = ((formData.get('email') as string) || '').trim().toLowerCase();
      name = (formData.get('name') as string) || '';
      source = (formData.get('source') as string) || source;
    }

    if (!email || !email.includes('@')) {
      const isJson = contentType.includes('application/json');
      if (isJson) {
        return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
      }
      return NextResponse.redirect(new URL('/resources?error=invalid_email', req.url));
    }

    const referrer = req.headers.get('referer') ?? null;

    // ── Step 1: Upsert into Supabase lead_captures ──────────────────────────
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    await supabase.from('lead_captures').upsert(
      {
        email,
        name: name || null,
        source,
        status: 'new',
        metadata: {
          referrer,
          timestamp: new Date().toISOString(),
          user_agent: req.headers.get('user-agent') ?? null,
        },
      },
      { onConflict: 'email,source', ignoreDuplicates: true }
    );

    // ── Step 2: Subscribe to Listmonk ───────────────────────────────────────
    let listmonkId: number | null = null;
    try {
      const subscriber = await addSubscriber(
        email,
        name || email.split('@')[0],
        [LISTMONK_RESOURCE_LIST_ID],
        {
          source,
          referrer,
          subscribed_at: new Date().toISOString(),
        }
      );
      listmonkId = subscriber.id ?? null;

      // Update lead record with Listmonk subscriber ID
      if (listmonkId) {
        await supabase
          .from('lead_captures')
          .update({ listmonk_id: listmonkId, status: 'subscribed' })
          .eq('email', email)
          .eq('source', source);
      }
    } catch (emailErr: any) {
      // Email failure is non-fatal — lead is still captured in Supabase
      console.warn('[resource-download] Listmonk subscribe failed:', emailErr.message);
    }

    // ── Step 3: Respond ─────────────────────────────────────────────────────
    const isJsonRequest = req.headers.get('accept')?.includes('application/json') ||
      contentType.includes('application/json');

    if (isJsonRequest) {
      return NextResponse.json({
        ok: true,
        message: 'Subscribed — check your email for the download bundle.',
        listmonk_id: listmonkId,
      });
    }

    return NextResponse.redirect(
      new URL('/resources?download=success', req.url),
      { status: 302 }
    );

  } catch (err: any) {
    console.error('[resource-download]', err);
    const isJson = req.headers.get('content-type')?.includes('application/json');
    if (isJson) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.redirect(new URL('/resources?error=server', req.url));
  }
}

// GET — health check
export async function GET() {
  return NextResponse.json({ ok: true, route: 'resource-download', provider: 'listmonk' });
}
