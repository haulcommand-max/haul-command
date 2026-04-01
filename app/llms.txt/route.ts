import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'public', 'llms.txt');
        const fileContents = fs.readFileSync(filePath, 'utf8');
        return new NextResponse(fileContents, {
            headers: {
                'Content-Type': 'text/plain',
                'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
            },
        });
    } catch (e) {
        return new NextResponse('llms.txt not found', { status: 404 });
    }
}
