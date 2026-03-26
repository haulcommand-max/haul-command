import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * HAUL COMMAND - UNIFIED COMMAND MIDDLEWARES (INTENT PARSER)
 * Intercepts text commands (e.g., "/lock corridor I-10") from the client,
 * passes them through the Edge to the DB RPC, evaluating defense risks.
 */
export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized command execution.' }, { status: 401 });
    }

    const { command } = await req.json();

    if (!command || !command.startsWith('/')) {
      return NextResponse.json({ error: 'Invalid command format.' }, { status: 400 });
    }

    // Pass the user's JWT so the RPC's auth.uid() resolves correctly
    const userSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Call the Level 10 Unified Command RPC
    const { data, error } = await userSupabase.rpc('execute_unified_command', {
      p_command: command
    });

    if (error) {
      throw error;
    }

    // The RPC returns a JSON payload detailing what it did (Trap mode, defense elevation, etc.)
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('Command Execution Failure:', error.message);
    return NextResponse.json({ error: 'System failure during command parsing.' }, { status: 500 });
  }
}
