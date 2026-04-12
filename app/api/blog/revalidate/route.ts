import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { indexBlogPost, triggerIndexNow } from '@/lib/seo/indexnow';

/**
 * POST /api/blog/revalidate
 * Triggers ISR cache purge for blog pages.
 * Body: { slug?: string, secret: string }
 * If slug is provided, revalidates that specific article.
 * If no slug, revalidates the entire /blog hub.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { slug, secret } = body;

        if (secret !== process.env.REVALIDATION_SECRET) {
            return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
        }

        if (slug) {
            revalidatePath(`/blog/${slug}`);
            // S3-04: Ping IndexNow on publish — async, non-blocking
            indexBlogPost(slug).catch(() => {});
            return NextResponse.json({ revalidated: true, path: `/blog/${slug}` });
        }

        revalidatePath('/blog');
        // Revalidate hub — no specific slug to index
        triggerIndexNow(['/intelligence']).catch(() => {});
        return NextResponse.json({ revalidated: true, path: '/blog' });
    } catch (err) {
        return NextResponse.json({ error: 'Revalidation failed' }, { status: 500 });
    }
}
