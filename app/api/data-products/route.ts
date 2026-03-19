import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { DataProductEngine, DATA_PRODUCT_CATALOG } from '@/lib/monetization/data-product-engine';

const supabaseAdmin = getSupabaseAdmin();
const engine = new DataProductEngine(supabaseAdmin);

/**
 * GET /api/data-products
 * List available data products, optionally filtered by country
 *
 * Query: ?country=US
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country');

    const products = country
        ? engine.getProductsByCountry(country.toUpperCase())
        : engine.getActiveProducts();

    return NextResponse.json({
        products,
        count: products.length,
    });
}

/**
 * POST /api/data-products
 * Get teaser/preview for a product or initiate purchase
 *
 * Body: {
 *   action: 'teaser' | 'purchase',
 *   product_id: string,
 *   country_code: string,
 *   corridor_code?: string,
 *   user_id?: string,
 *   stripe_session_id?: string,
 * }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { action, product_id, country_code, corridor_code, user_id, stripe_session_id } = body;

        if (!product_id || !country_code) {
            return NextResponse.json({ error: 'product_id and country_code required' }, { status: 400 });
        }

        if (action === 'teaser') {
            const teaser = await engine.getTeaser(product_id, user_id || 'anon', country_code, corridor_code);
            if (!teaser) {
                return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            }
            return NextResponse.json(teaser);
        }

        if (action === 'purchase') {
            if (!user_id) {
                return NextResponse.json({ error: 'user_id required for purchase' }, { status: 401 });
            }

            const result = await engine.purchaseProduct(
                user_id,
                product_id,
                country_code,
                corridor_code,
                stripe_session_id,
            );

            if (!result.ok) {
                return NextResponse.json({ error: result.error }, { status: 400 });
            }

            return NextResponse.json({
                success: true,
                purchase_id: result.purchase_id,
            });
        }

        return NextResponse.json({ error: 'Invalid action. Use teaser or purchase.' }, { status: 400 });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
