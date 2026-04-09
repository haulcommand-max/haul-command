/**
 * POST /api/training/revalidate
 * On-demand revalidation for training pages.
 * Clears ISR cache for training hub, level pages, and geo pages.
 */
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const secret = process.env.REVALIDATE_SECRET ?? process.env.INTERNAL_API_SECRET;

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const { scope, path } = body;
  // scope: 'all' | 'hub' | 'level' | 'module' | 'geo'

  const revalidated: string[] = [];

  try {
    if (!scope || scope === 'all' || scope === 'hub') {
      revalidatePath('/training');
      revalidated.push('/training');
    }

    if (!scope || scope === 'all' || scope === 'level') {
      const levelSlugs = ['road-ready', 'certified', 'elite', 'av-ready'];
      for (const s of levelSlugs) {
        revalidatePath(`/training/levels/${s}`);
        revalidated.push(`/training/levels/${s}`);
      }
    }

    if (!scope || scope === 'all' || scope === 'enterprise') {
      revalidatePath('/training/enterprise');
      revalidated.push('/training/enterprise');
    }

    if (path) {
      revalidatePath(path);
      revalidated.push(path);
    }

    return NextResponse.json({ success: true, revalidated });
  } catch (err) {
    console.error('[Training Revalidate] Error:', err);
    return NextResponse.json({ error: 'Revalidation failed', revalidated }, { status: 500 });
  }
}
