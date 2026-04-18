import { NextResponse } from 'next/server';
import { AutonomousContentEngine } from '@/lib/ai/content-engine';

export async function POST(req: Request) {
    try {
        const { topic, trackSlug, moduleSlug } = await req.json();
        
        // This triggers the internal Model execution Loop
        const result = await AutonomousContentEngine.generateLessonNode(topic, trackSlug, moduleSlug);
        
        return NextResponse.json({ success: true, result });
    } catch (e) {
        return NextResponse.json({ error: 'AI Generator Failed' }, { status: 400 });
    }
}
