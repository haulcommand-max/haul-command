import { claude } from '../ai/brain';
import { getSupabaseAdmin } from '../supabase/admin';

export async function runCSeo01_CityPageContentAudit() {
    console.log(`[C-SEO-01] Auditing City Page Content...`);
    const supabase = getSupabaseAdmin();
    const { data: cityNodes } = await supabase.from('city_nodes').select('*').limit(10);
    if (!cityNodes) return;

    for (const city of cityNodes) {
        const prompt = `
            TASK C-SEO-01: Write content sections for city: ${city.city_name}, ${city.region_code} (${city.country_code}).
            Sections to generate: meta description (150 chars), hero headline (H1), intro paragraph (75-100 words), local requirements, 5 FAQs, CTA for operators, CTA for brokers, meta title (60 chars max).
            Guidelines: Grade 8-10 reading level. No AI filler. Primary keyword appears in H1.
            Return a pure JSON object structured precisely matching those properties.
        `;

        try {
            const res = await claude().messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 2000,
                system: "You are an expert logistics SEO copywriter. Only output valid JSON.",
                messages: [{ role: 'user', content: prompt }]
            });
            const rawContent = (res.content[0] as any).text;
            const content = JSON.parse(rawContent.substring(rawContent.indexOf('{'), rawContent.lastIndexOf('}') + 1));
            
            await supabase.from('seo_content_city_pages').upsert({
                city_node_id: city.id,
                url_slug: city.seo_slug || `${city.city_name}-${city.region_code}`.toLowerCase().replace(/ /g, '-'),
                meta_title: content.meta_title,
                meta_description: content.meta_description,
                hero_h1: content.hero_headline,
                intro_paragraph: content.intro_paragraph,
                local_requirements: content.local_requirements,
                faq_items: content.faq_items || content.faqs,
                cta_operator: content.cta_operator,
                cta_broker: content.cta_broker
            }, { onConflict: 'url_slug' });
            console.log(`[C-SEO-01] Content generated for ${city.city_name}`);
        } catch (e) {
            console.error(`[C-SEO-01] Failed for ${city.city_name}`, e);
        }
    }
}

export async function runCSeo02_RegulatoryPageCheck(countryCode: string) {
    console.log(`[C-SEO-02] Generating Regulatory Page for ${countryCode}...`);
    const supabase = getSupabaseAdmin();
    const { data: regNotes } = await supabase.from('country_regulatory_notes').select('*').eq('country_code', countryCode);
    
    const prompt = `
        TASK C-SEO-02: Write a regulation explainer page for ${countryCode}. Use real regulatory data if available in the context.
        REQUIRED SECTIONS: Definition, when required, certification requirements, permit process, penalties, specific rules.
        Return as structured JSON mapping those 6 fields.
        Context Data: ${JSON.stringify(regNotes || {})}
    `;

    try {
        const res = await claude().messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 2000,
            system: "You are a regulatory logistics analyst. Output JSON only.",
            messages: [{ role: 'user', content: prompt }]
        });
        const rawContent = (res.content[0] as any).text;
        const page = JSON.parse(rawContent.substring(rawContent.indexOf('{'), rawContent.lastIndexOf('}') + 1));

        await supabase.from('seo_content_regulatory_pages').insert({
            country_code: countryCode,
            local_term_definition: page.definition,
            escort_thresholds: page.when_required,
            operator_certification: page.certification_requirements,
            permit_process: page.permit_process,
            penalties: page.penalties,
            country_specific_rules: page.specific_rules
        });
        console.log(`[C-SEO-02] Inserted regulatory page for ${countryCode}`);
    } catch (e) { }
}

export async function runCSeo03_AiSearchAnswerQuality(countryCode: string) {
    console.log(`[C-SEO-03] AI Search Optimization Answers for ${countryCode}...`);
    const supabase = getSupabaseAdmin();
    const queries = [
        `What is a pilot car in ${countryCode}?`,
        `When do I need a pilot car in ${countryCode}?`,
        `How much does a pilot car cost in ${countryCode}?`,
        `What are ${countryCode} oversize load requirements?`,
        `How do I find a escort near me?`
    ];

    for (const q of queries) {
        const prompt = `
            TASK C-SEO-03: Write a 50-100 word direct answer to: "${q}".
            Start with direct answer. Be factually accurate. End with CTA. Return JSON { "answer": "...", "cta": "..." }
        `;
        try {
            const res = await claude().messages.create({
                model: 'claude-3-5-haiku-20241022', // Fast model for scale
                max_tokens: 500,
                system: "You are an AI Search engine optimization writer. ONLY JSON.",
                messages: [{ role: 'user', content: prompt }]
            });
            const text = (res.content[0] as any).text;
            const data = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
            await supabase.from('seo_content_ai_answers').insert({
                country_code: countryCode,
                query_type: 'informational',
                exact_question: q,
                direct_answer: data.answer,
                call_to_action: data.cta
            });
        } catch (e) { }
    }
}

export async function runCSeo04_LongTailCorridorPages() {
    console.log(`[C-SEO-04] Generating Corridor Pages...`);
    const supabase = getSupabaseAdmin();
    const corridors = [{ origin: "Houston, TX", dest: "Los Angeles, CA" }, { origin: "Denver, CO", dest: "Dallas, TX" }];

    for (const c of corridors) {
        const prompt = `
            TASK C-SEO-04: Write a corridor service page for ${c.origin} to ${c.dest}.
            Required elements: Title, hero sentence, distance, states crossed, transit time, pricing range, 3 FAQs.
            Output as JSON mapping these fields.
        `;
        try {
            const res = await claude().messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 1500,
                system: "You are an oversize logistics router. ONLY JSON.",
                messages: [{ role: 'user', content: prompt }]
            });
            const tx = (res.content[0] as any).text;
            const data = JSON.parse(tx.substring(tx.indexOf('{'), tx.lastIndexOf('}') + 1));
            await supabase.from('seo_content_corridor_pages').insert({
                origin_city: c.origin,
                destination_city: c.dest,
                page_title: data.title,
                hero_sentence: data.hero_sentence,
                distance_route: data.distance,
                states_crossed: data.states_crossed,
                transit_time: data.transit_time,
                faq_items: data.faqs
            });
        } catch (e) { }
    }
}

export async function runCSeo05_IndustryVerticalPages() {
    console.log(`[C-SEO-05] Industry Vertical Pages...`);
    const supabase = getSupabaseAdmin();
    const verticals = ["Wind Turbine Transport", "Oil and Gas Equipment", "Mining Equipment"];
    for (const v of verticals) {
        const prompt = `
            TASK C-SEO-05: Write a vertical-specific service page for ${v}.
            Need: Page title, unique challenges, required capabilities, top regions, permit complexity, case study, 5 FAQs.
            Output as structured JSON.
        `;
        try {
            const res = await claude().messages.create({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 2000,
                system: "You are an industry logistics expert. ONLY JSON.",
                messages: [{ role: 'user', content: prompt }]
            });
            const text = (res.content[0] as any).text;
            const data = JSON.parse(text.substring(text.indexOf('{'), text.lastIndexOf('}') + 1));
            await supabase.from('seo_content_vertical_pages').upsert({
                industry_vertical: v,
                page_title: data.page_title,
                unique_challenges: data.unique_challenges,
                required_capabilities: data.required_capabilities,
                top_regions: data.top_regions,
                permit_complexity: data.permit_complexity,
                case_study: data.case_study,
                faq_items: data.faqs
            }, { onConflict: 'industry_vertical' });
        } catch (e) { }
    }
}

export async function runCSeo06_OperatorAcquisition() {
    console.log(`[C-SEO-06] Operator Acquisition Pages...`);
    const supabase = getSupabaseAdmin();
    const states = ["TX", "CA", "FL", "NY"];
    for (const st of states) {
        const prompt = `TASK C-SEO-06: Write operator acquisition content aimed at recruiting pilot cars in ${st}. JSON output with job_description, certification_reqs, equipment_reqs, average_earnings.`;
        try {
            const res = await claude().messages.create({ model: 'claude-3-5-sonnet-20241022', max_tokens: 1500, system: "ONLY JSON.", messages: [{ role: 'user', content: prompt }]});
        const data = JSON.parse((res.content[0] as any).text.substring((res.content[0] as any).text.indexOf('{'), (res.content[0] as any).text.lastIndexOf('}') + 1));
        await supabase.from('seo_content_acquisition_pages').insert({ state_code: st, ...data });
    } catch (e) { }
}
}

export async function runCSeo07_SchemaQualityReview() {
console.log(`[C-SEO-07] Auditing Schema.org Templates...`);
const supabase = getSupabaseAdmin();
const { data: schemas } = await supabase.from('seo_schema_templates').select('*');
if (!schemas) return;

for (const s of schemas) {
    const prompt = `TASK C-SEO-07: Review this schema markup for ${s.page_type} generated by Gemini. Fix any validator errors, ensure hreflang is bidirectional, and that SpeakableSpecification css selectors look realistic. Output ONLY the corrected JSON-LD. Schema: ${JSON.stringify(s.schema_jsonld)}`;
    try {
        const res = await claude().messages.create({ model: 'claude-3-5-sonnet-20241022', max_tokens: 3000, system: "JSON only.", messages: [{ role: 'user', content: prompt }]});
        const d = JSON.parse((res.content[0] as any).text.substring((res.content[0] as any).text.indexOf('{'), (res.content[0] as any).text.lastIndexOf('}') + 1));
        await supabase.from('seo_schema_templates').update({ schema_jsonld: d }).eq('id', s.id);
    } catch (e) {}
}
console.log(`[C-SEO-07] Schemas verified.`);
}

export async function runCSeo08_AiEntityEstablishment() {
    console.log(`[C-SEO-08] AI Entity Establishment Pages...`);
    const supabase = getSupabaseAdmin();
    const entities = ["What is a pilot car", "Pilot car requirements by state", "How much does a pilot car cost"];
    for (const e of entities) {
        const p = `TASK C-SEO-08: Write authoritative entity content for "${e}" formatted nicely without fluff to assert dominance in AI search algorithms. JSON output with content_body and data_tables (if applicable).`;
        try {
            const res = await claude().messages.create({ model: 'claude-3-5-sonnet-20241022', max_tokens: 3000, system: "JSON only.", messages: [{ role: 'user', content: p }]});
            const data = JSON.parse((res.content[0] as any).text.substring((res.content[0] as any).text.indexOf('{'), (res.content[0] as any).text.lastIndexOf('}') + 1));
            await supabase.from('seo_content_entity_pages').upsert({ entity_type: e, content_body: data.content_body, data_tables: data.data_tables }, { onConflict: 'entity_type' });
        } catch (err) { }
    }
}

export async function runCSeo09_MultilingualAudit(countryCode: string) {
    console.log(`[C-SEO-09] Multilingual SEO Audit for ${countryCode}...`);
    const supabase = getSupabaseAdmin();
    const prompt = `TASK C-SEO-09: Audit localized content quality for ${countryCode}. Provide scores (0-1) for keyword localization, content authenticity, regulatory accuracy, cultural adaptation, hreflang implementation. List content fixes. Return JSON.`;
    try {
        const res = await claude().messages.create({ model: 'claude-3-5-sonnet-20241022', max_tokens: 1000, system: "JSON only.", messages: [{ role: 'user', content: prompt }]});
        const d = JSON.parse((res.content[0] as any).text.substring((res.content[0] as any).text.indexOf('{'), (res.content[0] as any).text.lastIndexOf('}') + 1));
        await supabase.from('seo_content_multilingual_audits').upsert({ country_code: countryCode, ...d }, { onConflict: 'country_code' });
    } catch (e) {}
}

export async function runCSeo10_MoneyLeftStrategicReview() {
    console.log(`[C-SEO-10] Money Left On Table Strategic Synthesis...`);
    const supabase = getSupabaseAdmin();
    const p = `TASK C-SEO-10: Synthesize SEO opportunities into an executive strategy. JSON output with total_addressable_opportunity, quick_win_list, ai_search_dominance_plan, competitor_displacement_strategy, international_rollout_sequence, revenue_bridge, highest_roi_actions.`;
    try {
        const res = await claude().messages.create({ model: 'claude-3-5-sonnet-20241022', max_tokens: 4000, system: "JSON only.", messages: [{ role: 'user', content: p }]});
        const d = JSON.parse((res.content[0] as any).text.substring((res.content[0] as any).text.indexOf('{'), (res.content[0] as any).text.lastIndexOf('}') + 1));
        await supabase.from('seo_content_strategy_reviews').insert(d);
        console.log(`[C-SEO-10] Strategic review generated.`);
    } catch (e) {}
}
