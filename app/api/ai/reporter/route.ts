// AI Reporter — Stub until @ai-sdk/openai, ai, and zod are installed.
// Run: npm install @ai-sdk/openai ai zod
// Then restore the full implementation from git history.

import { NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: Request) {
    return NextResponse.json(
        { error: "AI Reporter not yet configured. Install @ai-sdk/openai, ai, and zod to enable." },
        { status: 501 }
    );
}
