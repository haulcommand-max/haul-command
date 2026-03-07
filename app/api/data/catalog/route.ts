// ═══════════════════════════════════════════════════════════════════════════════
// DATA MARKETPLACE API — Product Catalog Endpoint
// GET /api/data/catalog — Returns product catalog (no auth required)
// ═══════════════════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import { getCatalog } from '@/lib/enterprise/self-serve-marketplace';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const countryCode = searchParams.get('country') || 'US';

    try {
        const catalog = getCatalog(countryCode.toUpperCase());

        return NextResponse.json({
            products: catalog,
            country: countryCode.toUpperCase(),
            totalProducts: catalog.length,
        }, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to load catalog' },
            { status: 500 },
        );
    }
}
