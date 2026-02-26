/**
 * US State + CA Province Adjacency Maps
 * Used for map prefetch (home + neighbors) and "nearby states" internal linking.
 * Keys are jurisdiction_code format (US-XX / CA-XX).
 */

export const US_ADJACENCY: Record<string, string[]> = {
    'US-AL': ['US-FL', 'US-GA', 'US-MS', 'US-TN'],
    'US-AK': [],
    'US-AZ': ['US-CA', 'US-CO', 'US-NM', 'US-NV', 'US-UT'],
    'US-AR': ['US-LA', 'US-MO', 'US-MS', 'US-OK', 'US-TN', 'US-TX'],
    'US-CA': ['US-AZ', 'US-NV', 'US-OR'],
    'US-CO': ['US-AZ', 'US-KS', 'US-NE', 'US-NM', 'US-OK', 'US-UT', 'US-WY'],
    'US-CT': ['US-MA', 'US-NY', 'US-RI'],
    'US-DE': ['US-MD', 'US-NJ', 'US-PA'],
    'US-FL': ['US-AL', 'US-GA'],
    'US-GA': ['US-AL', 'US-FL', 'US-NC', 'US-SC', 'US-TN'],
    'US-HI': [],
    'US-ID': ['US-MT', 'US-NV', 'US-OR', 'US-UT', 'US-WA', 'US-WY'],
    'US-IL': ['US-IN', 'US-IA', 'US-KY', 'US-MO', 'US-WI'],
    'US-IN': ['US-IL', 'US-KY', 'US-MI', 'US-OH'],
    'US-IA': ['US-IL', 'US-MN', 'US-MO', 'US-NE', 'US-SD', 'US-WI'],
    'US-KS': ['US-CO', 'US-MO', 'US-NE', 'US-OK'],
    'US-KY': ['US-IL', 'US-IN', 'US-MO', 'US-OH', 'US-TN', 'US-VA', 'US-WV'],
    'US-LA': ['US-AR', 'US-MS', 'US-TX'],
    'US-ME': ['US-NH'],
    'US-MD': ['US-DE', 'US-PA', 'US-VA', 'US-WV', 'US-DC'],
    'US-MA': ['US-CT', 'US-NH', 'US-NY', 'US-RI', 'US-VT'],
    'US-MI': ['US-IN', 'US-OH', 'US-WI'],
    'US-MN': ['US-IA', 'US-ND', 'US-SD', 'US-WI'],
    'US-MS': ['US-AL', 'US-AR', 'US-LA', 'US-TN'],
    'US-MO': ['US-AR', 'US-IL', 'US-IA', 'US-KS', 'US-KY', 'US-NE', 'US-OK', 'US-TN'],
    'US-MT': ['US-ID', 'US-ND', 'US-SD', 'US-WY'],
    'US-NE': ['US-CO', 'US-IA', 'US-KS', 'US-MO', 'US-SD', 'US-WY'],
    'US-NV': ['US-AZ', 'US-CA', 'US-ID', 'US-OR', 'US-UT'],
    'US-NH': ['US-MA', 'US-ME', 'US-VT'],
    'US-NJ': ['US-DE', 'US-NY', 'US-PA'],
    'US-NM': ['US-AZ', 'US-CO', 'US-OK', 'US-TX', 'US-UT'],
    'US-NY': ['US-CT', 'US-MA', 'US-NJ', 'US-PA', 'US-VT'],
    'US-NC': ['US-GA', 'US-SC', 'US-TN', 'US-VA'],
    'US-ND': ['US-MN', 'US-MT', 'US-SD'],
    'US-OH': ['US-IN', 'US-KY', 'US-MI', 'US-PA', 'US-WV'],
    'US-OK': ['US-AR', 'US-CO', 'US-KS', 'US-MO', 'US-NM', 'US-TX'],
    'US-OR': ['US-CA', 'US-ID', 'US-NV', 'US-WA'],
    'US-PA': ['US-DE', 'US-MD', 'US-NJ', 'US-NY', 'US-OH', 'US-WV'],
    'US-RI': ['US-CT', 'US-MA'],
    'US-SC': ['US-GA', 'US-NC'],
    'US-SD': ['US-IA', 'US-MN', 'US-MT', 'US-ND', 'US-NE', 'US-WY'],
    'US-TN': ['US-AL', 'US-AR', 'US-GA', 'US-KY', 'US-MO', 'US-MS', 'US-NC', 'US-VA'],
    'US-TX': ['US-AR', 'US-LA', 'US-NM', 'US-OK'],
    'US-UT': ['US-AZ', 'US-CO', 'US-ID', 'US-NV', 'US-NM', 'US-WY'],
    'US-VT': ['US-MA', 'US-NH', 'US-NY'],
    'US-VA': ['US-KY', 'US-MD', 'US-NC', 'US-TN', 'US-WV', 'US-DC'],
    'US-WA': ['US-ID', 'US-OR'],
    'US-WV': ['US-KY', 'US-MD', 'US-OH', 'US-PA', 'US-VA'],
    'US-WI': ['US-IA', 'US-IL', 'US-MI', 'US-MN'],
    'US-WY': ['US-CO', 'US-ID', 'US-MT', 'US-NE', 'US-SD', 'US-UT'],
    'US-DC': ['US-MD', 'US-VA'],
};

export const CA_ADJACENCY: Record<string, string[]> = {
    'CA-AB': ['CA-BC', 'CA-SK', 'CA-NT'],
    'CA-BC': ['CA-AB', 'CA-NT', 'CA-YT'],
    'CA-MB': ['CA-ON', 'CA-SK', 'CA-NU'],
    'CA-NB': ['CA-NS', 'CA-PE', 'CA-QC'],
    'CA-NL': ['CA-QC'],
    'CA-NS': ['CA-NB', 'CA-PE'],
    'CA-NT': ['CA-AB', 'CA-BC', 'CA-SK', 'CA-NU', 'CA-YT'],
    'CA-NU': ['CA-MB', 'CA-NT'],
    'CA-ON': ['CA-MB', 'CA-QC'],
    'CA-PE': ['CA-NB', 'CA-NS'],
    'CA-QC': ['CA-NB', 'CA-NL', 'CA-ON'],
    'CA-SK': ['CA-AB', 'CA-MB', 'CA-NT'],
    'CA-YT': ['CA-BC', 'CA-NT'],
};

/** Get neighbors for any jurisdiction code */
export function getNeighbors(jurisdictionCode: string): string[] {
    return US_ADJACENCY[jurisdictionCode] || CA_ADJACENCY[jurisdictionCode] || [];
}
