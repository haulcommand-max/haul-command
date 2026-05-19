import { NextResponse } from 'next/server';
import { AutonomousContentEngine } from '@/lib/ai/content-engine';
import { isInternalRequest } from '@/lib/auth/internal-request';

export async function POST(req: Request) {
    const adminSecret = req.headers.get('x-admin-secret');
    const isAdmin = Boolean(process.env.HC_ADMIN_SECRET && adminSecret === process.env.HC_ADMIN_SECRET);
    if (!isAdmin && !isInternalRequest(req.headers)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { topic, trackSlug, moduleSlug } = await req.json();
        
        // This triggers the internal Model execution Loop
        const result = await AutonomousContentEngine.generateLessonNode(topic, trackSlug, moduleSlug);
        
        return NextResponse.json({ success: true, result });
    } catch (e) {
        return NextResponse.json({ error: 'AI Generator Failed' }, { status: 400 });
    }
}
