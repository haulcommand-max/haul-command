// ═══════════════════════════════════════════════════════════════════════════════
// DATA MARKETPLACE API — API Key Management  
// GET  /api/data/keys       — List customer's API keys
// POST /api/data/keys       — Rotate a key
// DELETE /api/data/keys     — Deactivate a key
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { listApiKeys, rotateApiKey, deactivateApiKey } from '@/lib/enterprise/self-serve-marketplace';
import { createClient } from '@supabase/supabase-js';

async function getAuthenticatedUser(req: NextRequest) {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers: {
                    Authorization: req.headers.get('authorization') || '',
                },
            },
        },
    );

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
}

// List keys
export async function GET(req: NextRequest) {
    const user = await getAuthenticatedUser(req);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const keys = await listApiKeys(user.id);
        return NextResponse.json({ keys });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to list keys' }, { status: 500 });
    }
}

// Rotate key
export async function POST(req: NextRequest) {
    const user = await getAuthenticatedUser(req);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { key_prefix } = await req.json();
        if (!key_prefix) {
            return NextResponse.json({ error: 'Missing key_prefix' }, { status: 400 });
        }

        const result = await rotateApiKey({
            customerId: user.id,
            oldKeyPrefix: key_prefix,
        });

        return NextResponse.json({
            message: 'Key rotated successfully. Old key remains active for 24 hours.',
            new_key: result,
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to rotate key' }, { status: 500 });
    }
}

// Deactivate key
export async function DELETE(req: NextRequest) {
    const user = await getAuthenticatedUser(req);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { key_prefix } = await req.json();
        if (!key_prefix) {
            return NextResponse.json({ error: 'Missing key_prefix' }, { status: 400 });
        }

        const deactivated = await deactivateApiKey({
            customerId: user.id,
            keyPrefix: key_prefix,
        });

        if (!deactivated) {
            return NextResponse.json({ error: 'Key not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Key deactivated' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to deactivate key' }, { status: 500 });
    }
}
