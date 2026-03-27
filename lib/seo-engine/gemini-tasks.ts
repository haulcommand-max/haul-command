import { gemini } from '../ai/brain';
import { getSupabaseAdmin } from '../supabase/admin';

export async function runGReg01_RegulatoryAudit() {
    const supabase = getSupabaseAdmin();
    // 1. Fetch countries and regulatory notes
    const { data: countries } = await supabase.from('countries').select('*');
    if (!countries) return;

    for (const country of countries) {
        console.log(`[G-REG-01] Auditing ${country.iso2}...`);
        
        // Use Gemini to audit the specific country based on the 8 dimensions
        const prompt = `
            Perform a regulatory completeness audit for ${country.name} (${country.iso2}).
            We need to evaluate 8 dimensions:
            1. Escort Vehicle Legal Definition
            2. Permit Authority Identified
            3. Cross-Border Rules Documented
            4. Escort Requirement Thresholds
            5. Operator Certification Requirements
            6. Seasonal/Time Restrictions
            7. Police Escort Triggers
            8. Digital vs Paper Permit System

            Return a structured JSON output with the exact specified format.
            If you lack full data on this country, make an educated estimation on the gaps and list them as missing_dimensions so we know what needs human research.
        `;

        const { data: dbNotes } = await supabase.from('country_regulatory_notes').select('*').eq('country_code', country.iso2);
        
        const contents = [{ role: 'user', parts: [{ text: prompt + '\n\nExisting Data:\n' + JSON.stringify(dbNotes || {}) }] }];

        try {
            const res = await gemini().models.generateContent({
                model: 'gemini-2.5-flash',
                contents: contents as any,
                config: {
                    temperature: 0.1,
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: 'object',
                        properties: {
                            country_code: { type: 'string' },
                            tier: { type: 'string' },
                            regulatory_score: { type: 'number' },
                            status: { type: 'string' },
                            missing_dimensions: { type: 'array', items: { type: 'string' } },
                            launch_blocker: { type: 'boolean' },
                            estimated_research_hours_to_fix: { type: 'number' },
                            priority_rank: { type: 'number' },
                            notes: { type: 'string' }
                        },
                        required: ['country_code', 'tier', 'regulatory_score', 'status', 'missing_dimensions', 'launch_blocker', 'estimated_research_hours_to_fix', 'priority_rank', 'notes']
                    }
                }
            });

            const result = JSON.parse(res.text ?? '{}');
            
            await supabase.from('seo_regulatory_audits').upsert({
                id: undefined, // Let DB generate
                country_code: country.iso2,
                tier: result.tier,
                regulatory_score: result.regulatory_score,
                status: result.status,
                missing_dimensions: result.missing_dimensions,
                launch_blocker: result.launch_blocker,
                estimated_research_hours_to_fix: result.estimated_research_hours_to_fix,
                priority_rank: result.priority_rank,
                notes: result.notes
            });
            console.log(`[G-REG-01] Saved audit for ${country.iso2}`);
        } catch (e) {
            console.error(`[G-REG-01] Failed to process ${country.iso2}`, e);
        }
    }
}

export async function runGReg02_CityNodes(countryCode: string, tier: string) {
    const supabase = getSupabaseAdmin();
    console.log(`[G-REG-02] Generating hyper-local data for ${countryCode}...`);
    
    let instructions = '';
    if (countryCode === 'US') instructions = "US: top 50 cities + top 20 industrial corridors";
    else if (countryCode === 'CA') instructions = "CA: top 20 cities + oil sands region";
    else if (countryCode === 'AU') instructions = "AU: top 15 cities + mining regions (Pilbara, Hunter Valley, Bowen Basin)";
    else if (countryCode === 'GB') instructions = "GB: top 20 cities + offshore wind staging ports";
    else instructions = "Generate top 5-10 cities plus major ports, industrial corridors, and gigaprojects if applicable.";

    const prompt = `
        TASK G-REG-02: Generate hyper-local coverage data structure for ${countryCode} (Tier: ${tier}).
        Target instructions: ${instructions}
        Output a structured JSON array of cities containing:
        { "city_name", "city_name_local", "region_code", "lat", "lng", "demand_category", "demand_score", "primary_industries", "key_routes_from", "is_port_city", "port_name", "seo_slug", "page_title_en", "h1_en", "search_volume_estimate", "local_search_terms" }
    `;

    try {
        const res = await gemini().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }] as any,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            city_name: { type: 'string' },
                            city_name_local: { type: 'string' },
                            region_code: { type: 'string' },
                            lat: { type: 'number' },
                            lng: { type: 'number' },
                            demand_category: { type: 'string' },
                            demand_score: { type: 'number' },
                            primary_industries: { type: 'array', items: { type: 'string' } },
                            key_routes_from: { type: 'array', items: { type: 'string' } },
                            is_port_city: { type: 'boolean' },
                            port_name: { type: 'string' },
                            seo_slug: { type: 'string' },
                            page_title_en: { type: 'string' },
                            h1_en: { type: 'string' },
                            search_volume_estimate: { type: 'string' },
                            local_search_terms: { type: 'array', items: { type: 'string' } },
                        },
                        required: ['city_name', 'region_code', 'lat', 'lng', 'seo_slug', 'demand_score']
                    }
                }
            }
        });

        const cities = JSON.parse(res.text ?? '[]');
        console.log(`[G-REG-02] Generated ${cities.length} cities for ${countryCode}`);
        
        for (const city of cities) {
            await supabase.from('city_nodes').upsert({
                country_code: countryCode,
                ...city
            }, { onConflict: 'seo_slug' });
        }
    } catch (e) {
        console.error(`[G-REG-02] Failed for ${countryCode}`, e);
    }
}

export async function runGSeo01_KeywordTaxonomy(countryCode: string) {
    const supabase = getSupabaseAdmin();
    console.log(`[G-SEO-01] Generating 4-tier SEO Keyword Taxonomy for ${countryCode}...`);
    
    const prompt = `
        TASK G-SEO-01: Generate SEO keyword taxonomy for ${countryCode}. 
        Build a 4-tier keyword structure targeting pilot car, oversize load escort, escort vehicle, wide load escort combinations.
        You MUST provide the exact translated terms for Tier 1, 2, 3, and 4 keywords along with conversational AI search questions.
    `;

    try {
        const res = await gemini().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }] as any,
            config: { responseMimeType: 'application/json' }
        });

        const taxonomy = JSON.parse(res.text ?? '{}');
        await supabase.from('seo_taxonomies').upsert({
            country_code: countryCode,
            tier_1_keywords: taxonomy.tier_1_keywords || [],
            tier_2_keywords: taxonomy.tier_2_keywords || [],
            tier_3_keywords: taxonomy.tier_3_keywords || [],
            tier_4_keywords: taxonomy.tier_4_keywords || [],
            ai_search_keywords: taxonomy.ai_search_keywords || []
        }, { onConflict: 'country_code' });
        console.log(`[G-SEO-01] Saved taxonomy for ${countryCode}.`);
    } catch (e) {
        console.error(`[G-SEO-01] Failed for ${countryCode}`, e);
    }
}

export async function runGSeo02_CityPageStructures() {
    console.log(`[G-SEO-02] Generating City Page Structures...`);
    const supabase = getSupabaseAdmin();
    const { data: cities } = await supabase.from('city_nodes').select('*').limit(50);
    if (!cities) return;

    for (const city of cities) {
        const prompt = `
            TASK G-SEO-02: Generate city page data structure for ${city.city_name}, ${city.region_code} (${city.country_code}).
            Target search terms: ${JSON.stringify(city.local_search_terms)}
            Output a JSON containing: url_slug, canonical_url, page_meta (title, description), schema_org, faq_schema, breadcrumb_schema, internal_links, content_sections, dynamic_data_required.
        `;

        try {
            const res = await gemini().models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }] as any,
                config: { responseMimeType: 'application/json' }
            });

            const page = JSON.parse(res.text ?? '{}');
            await supabase.from('seo_city_pages').upsert(page, { onConflict: 'url_slug' });
            console.log(`[G-SEO-02] Generated page structure for ${city.city_name}`);
        } catch (e) {
            console.error(`[G-SEO-02] Failed for ${city.city_name}`, e);
        }
    }
}

export async function runGSeo03_AiSearchAudit(countryCode: string) {
    console.log(`[G-SEO-03] AI Search Engine Optimization Audit for ${countryCode}...`);
    const supabase = getSupabaseAdmin();
    const prompt = `
        TASK G-SEO-03: Audit Haul Command's positioning for AI-powered search in ${countryCode}.
        Output a structured JSON evaluating AI Search Readiness Score (0-1), Entity Clarity, Structured Data, Question Coverage, Freshness, and Authority Signals. Provide 'gaps', 'quick_wins', and 'strategic_improvements'.
    `;

    try {
        const res = await gemini().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }] as any,
            config: { responseMimeType: 'application/json' }
        });

        const audit = JSON.parse(res.text ?? '{}');
        await supabase.from('seo_ai_search_audits').upsert({
            country_code: countryCode,
            ...audit
        }, { onConflict: 'country_code' });
        console.log(`[G-SEO-03] Audit complete for ${countryCode}`);
    } catch (e) {
        console.error(`[G-SEO-03] Failed for ${countryCode}`);
    }
}

export async function runGSeo04_MoneyLeftOnTable() {
    console.log(`[G-SEO-04] Money Left on Table Audit...`);
    const supabase = getSupabaseAdmin();
    const prompt = `
        TASK G-SEO-04: Identify all revenue opportunities not currently captured via keyword gaps, corridor gaps, capability-specific gaps, industry verticals, and operator acquisition SEO.
        Output a structured JSON array of opportunities with gap_category, estimated_pages_missing, estimated_monthly_searches_uncaptured, estimated_conversion_rate, estimated_monthly_revenue_opportunity, effort_to_capture, priority, and action.
    `;

    try {
        const res = await gemini().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }] as any,
            config: { responseMimeType: 'application/json' }
        });

        const audits = JSON.parse(res.text ?? '[]');
        for (const audit of audits) {
            await supabase.from('seo_money_left_audits').insert(audit);
        }
        console.log(`[G-SEO-04] Opportunities identified and saved.`);
    } catch (e) {
        console.error(`[G-SEO-04] Failed to audit opportunities`);
    }
}

export async function runGSeo05_SchemaGenerator() {
    console.log(`[G-SEO-05] Bulk Schema.org Templates...`);
    const supabase = getSupabaseAdmin();
    const types = ["City Service Page", "Country/State Regulation Page", "Operator Profile Page", "Corridor Page", "Industry Vertical Page", "How-To Page"];
    
    for (const t of types) {
        const prompt = `TASK G-SEO-05: Generate schema.org markup (LocalBusiness, FAQPage, Article, etc) for page type: ${t}. Return a JSON containing generic full JSON-LD schema blocks ready to inject into the <head>. Return a JSON object with 'page_type' and 'schema_jsonld'.`;
        try {
            const res = await gemini().models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ role: 'user', parts: [{ text: prompt }] }] as any,
                config: { responseMimeType: 'application/json' }
            });

            const template = JSON.parse(res.text ?? '{}');
            await supabase.from('seo_schema_templates').upsert({
                page_type: t,
                schema_jsonld: template.schema_jsonld || template
            }, { onConflict: 'page_type' });
        } catch (e) { }
    }
    console.log(`[G-SEO-05] Schemas ready.`);
}

export async function runGAuditFinal() {
    console.log(`[G-AUDIT-FINAL] Creating Final Scorecard...`);
    const supabase = getSupabaseAdmin();
    const prompt = `
        TASK G-AUDIT-FINAL: Are we future-proof for all 120 countries? Are we hyper-local? Are we positioned for best SEO and AI search?
        Evaluate and output a structured JSON with 'future_proof_score', 'hyper_local_score', 'seo_readiness_score', 'ai_search_readiness_score', 'revenue_capture_score', 'overall_score', 'top_3_fixes_this_week', 'top_3_fixes_this_month', 'estimated_revenue_unlocked_if_all_fixed'.
    `;

    try {
        const res = await gemini().models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }] as any,
            config: { responseMimeType: 'application/json' }
        });

        const scorecard = JSON.parse(res.text ?? '{}');
        await supabase.from('seo_scorecards').insert(scorecard);
        console.log(`[G-AUDIT-FINAL] Executive scorecard saved!`);
    } catch (e) { }
}
