import { createAdminClient } from '../supabase/admin';

export async function generateSearchKeywordsForRegion(countryCode: string) {
    // Phase 1 (FASTEST SCALE)
    return [
        `pilot car escort services ${countryCode}`,
        `oversize load escort ${countryCode}`,
        `transport escort vehicle ${countryCode}`,
        `high pole car service ${countryCode}`,
        `heavy haul escort company ${countryCode}`,
        `route survey transport ${countryCode}`,
        // Phase 4 (SCARCITY HUNT)
        `steersman ${countryCode}`,
        `steerman specialized ${countryCode}`,
        `police escort contractor ${countryCode}`,
        // Phase 2 (AUTHORITY SOURCES) - looking for generic directory hits
        `transport permit authorities ${countryCode}`,
        `certified escort list ${countryCode}`
    ];
}

export async function queueGlobalExpansionTasks(countryCodes: string[]) {
    const supabase = createAdminClient();

    const tasks = [];

    for (const code of countryCodes) {
        const keywords = await generateSearchKeywordsForRegion(code);
        
        // Translates Google Maps / Local Directories searches into queue URLs representing search endpoints
        // In a real system you'd hook these to SerpApi or similar Google Maps scraping APIs
        for (const kw of keywords) {
            const encoded = encodeURIComponent(kw);
            tasks.push({
                url: `https://google.com/search?q=${encoded}&tbm=lcl`, // Local maps
                status: 'pending',
                depth: 0,
                discovered_from: 'global-expansion-engine',
                priority: 10 // Highest priority for map discovery
            });
        }
    }

    // Insert search queue jobs into the crawl\_queue for execution
    const { error } = await supabase.from('crawl_queue').upsert(tasks, { onConflict: 'url', ignoreDuplicates: true });
    
    if (error) {
        console.error('Failed to trigger global expansion jobs:', error.message);
        return false;
    }
    
    return true;
}

export async function phaseThreeGraphExpansion(entityId: string) {
    const supabase = createAdminClient();

    // Pull from entities
    const { data: operator } = await supabase
        .from('entities')
        .select('*')
        .eq('id', entityId)
        .single();
    
    if (!operator) return;

    const urlsToCrawl = [];

    // Crawl social followers / tagged companies
    if (operator.metadata?.facebook) {
        // e.g., facebook.com/company/followers or likes
        urlsToCrawl.push(`https://facebook.com/${operator.metadata.facebook_url}/followers`);
    }

    // Crawl partners listed on their website
    if (operator.website) {
        urlsToCrawl.push(`${operator.website}/partners`);
        urlsToCrawl.push(`${operator.website}/equipment`);
    }

    if (urlsToCrawl.length === 0) return;

    const tasks = urlsToCrawl.map(url => ({
        url,
        depth: 0,
        status: 'pending',
        discovered_from: `entity_graph_${entityId}`,
        priority: 5 // medium priority for specific partner graph discovery
    }));

    await supabase.from('crawl_queue').upsert(tasks, { onConflict: 'url', ignoreDuplicates: true });
}
