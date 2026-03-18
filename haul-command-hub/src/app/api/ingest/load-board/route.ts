/**
 * POST /api/ingest/load-board
 *
 * Accepts raw load-board alert text and runs the full v3 ingestion pipeline.
 * Returns a BatchOutputSummary with all counts, mixes, and intelligence.
 * Persists to Supabase concurrently.
 *
 * Auth: requires authenticated user (admin tooling).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ingestLoadBoardBatch } from '@/lib/ingestion/load-board';
import type { SourceType } from '@/lib/ingestion/load-board';

// Simple auth check — verifies JWT from Supabase auth
async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data: { user }, error } = await sb.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function POST(request: NextRequest) {
  try {
    // Auth gate — skip in development for testing
    const isDev = process.env.NODE_ENV === 'development';
    if (!isDev) {
      const user = await getAuthUser(request);
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required. Pass a valid Bearer token.' },
          { status: 401 }
        );
      }
    }

    const body = await request.json();

    const {
      raw_text,
      source_name = null,
      source_type = 'load_alert_board',
      country_hint = null,
      supplied_date = null,
    } = body as {
      raw_text: string;
      source_name?: string | null;
      source_type?: SourceType;
      country_hint?: string | null;
      supplied_date?: string | null;
    };

    if (!raw_text || typeof raw_text !== 'string' || raw_text.trim().length === 0) {
      return NextResponse.json(
        { error: 'raw_text is required and must be a non-empty string.' },
        { status: 400 }
      );
    }

    const summary = await ingestLoadBoardBatch(raw_text, {
      source_name,
      source_type,
      country_hint,
      supplied_date,
    });

    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    console.error('[load-board-ingest] Error:', error);
    return NextResponse.json(
      { error: 'Ingestion failed. Check server logs.' },
      { status: 500 }
    );
  }
}
