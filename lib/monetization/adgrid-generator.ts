import { getSupabaseAdmin } from '../supabase/admin';
import { getPPPMultiplier, getCountryName } from '../geo/countries';

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
 * 120-Country Adapted: PPP dynamic pricing + Topography/Environment-aware Pitching
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

    // Extract country to apply PPP and environmental awareness
    const iso2 = region.substring(0, 2).toUpperCase();
    const ppp = getPPPMultiplier(iso2);
    const countryName = getCountryName(iso2);

    // Baseline undercut price is $199.99 for US (1.00 PPP)
    let suggestedPrice = 199.99 * ppp;
    
    // Environment aware pitching
    let environmentPitch = `Boost your visibility in ${region}.`;
    
    if (["CH", "AT", "NO", "CL", "BO", "NP", "AF", "IT", "FR"].includes(iso2)) {
        environmentPitch = `Capitalize on high-margin mountain escorts in ${countryName}. Secure the #1 AdGrid slot for challenging terrain moves.`;
        suggestedPrice *= 1.15; // Mountain routes command a premium
    } else if (["JP", "GB", "DE", "KR", "SG"].includes(iso2)) {
        environmentPitch = `Stand out in extreme high-density corridors. Dominate the ${countryName} AdGrid where competition is fierce.`;
        suggestedPrice *= 1.25; // High competition commands a premium
    } else if (["FL", "NL", "DK", "UY", "AE"].includes(iso2)) {
        environmentPitch = `Lock in flatland/coastal transport contracts. Claim the top AdGrid slot across ${countryName} for high-volume open routing.`;
    }

    const upsells = operators.map(op => ({
        entity_id: op.id,
        status: 'pending',
        type: 'ad_upsell',
        target_region: region,
        suggested_price: Math.round(suggestedPrice * 100) / 100,
        message: environmentPitch
    }));

    // Trigger into an outreach queue
    await supabase.from('claims').insert(upsells);

    return { success: true, count: upsells.length };
}
