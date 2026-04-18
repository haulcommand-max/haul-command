/**
 * Haul Command AdGrid Engine
 * Dynamically pairs vendor solutions to an Operator's diagnostic failures.
 */
export async function getTargetedAdGridOffer(diagnostics: any[], supabase: any) {
    // Determine the highest priority pain point
    const hasCommsFailure = diagnostics.some(d => d.likely_reason.includes('Comms') || d.likely_reason.includes('Signal'));
    
    let targetCategory = hasCommsFailure ? 'telecom' : 'insurance';

    const { data: vendor } = await supabase
        .from('hc_vendors')
        .select('*')
        .eq('category', targetCategory)
        .limit(1)
        .single();
        
    return vendor || null;
}
