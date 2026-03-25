import { getSupabaseAdmin } from '../../supabase/admin';

/**
 * AdGrid Monetization Engine 
 * Analyzes ingested data density and automatically generates 
 * targeted advertising opportunities and market gaps.
 */
export async function generateCoverageHeatmap() {
    const supabase = getSupabaseAdmin();

    // 1. Group entities by Region to find density
    const { data: regions, error } = await supabase
        .from('entities')
        .select('region, type')
        .eq('type', 'operator');

    if (error || !regions) return { error: 'Failed to fetch regional density' };

    const densityMap: Record<string, number> = {};
    regions.forEach(r => {
        if (!r.region) return;
        densityMap[r.region] = (densityMap[r.region] || 0) + 1;
    });

    // 2. Identify Corridors and Gaps
    const gaps = [];
    const highlyCompetitive = [];

    for (const [region, count] of Object.entries(densityMap)) {
        if (count < 5) {
            gaps.push(region);
        } else if (count > 50) {
            highlyCompetitive.push(region);
        }
    }

    return {
        densityMap,
        gaps,
        highlyCompetitive
    };
}

/**
 * Targets operators in highly competitive regions to sell Dominance/AdGrid placements
 */
export async function triggerAdGridUpsell(region: string) {
    const supabase = getSupabaseAdmin();

    // Find all operators in a competitive region who don't have premium
    const { data: operators, error } = await supabase
        .from('entities')
        .select('id, name, primary_email, primary_phone')
        .eq('region', region)
        .eq('type', 'operator');

    if (!operators || operators.length === 0) return { success: false, reason: 'No targets' };

    const upsells = operators.map(op => ({
        entity_id: op.id,
        status: 'pending',
        type: 'ad_upsell',
        target_region: region,
        suggested_price: 199.99, // Undercutting competitor's $285 basic package
        message: `Boost your visibility in ${region}. Take the top Ad Slot on Haul Command.`
    }));

    // Trigger into an outreach queue
    await supabase.from('claims').insert(upsells);

    return { success: true, count: upsells.length };
}
