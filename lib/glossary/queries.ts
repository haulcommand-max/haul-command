import { createClient } from '@/utils/supabase/server';

export async function getGlossaryHub() {
    const supabase = await createClient();
    const { data } = await supabase.rpc('glo_glossary_hub_payload');
    return data;
}

export async function getGlossaryTerm(slug: string, countryCode?: string, regionCode?: string) {
    const supabase = await createClient();
    const { data } = await supabase.rpc('glo_term_page_payload', {
        p_term_slug: slug,
        p_country_code: countryCode || null,
        p_region_code: regionCode || null,
    });
    return data;
}

export async function getGlossaryTopic(topicSlug: string) {
    const supabase = await createClient();
    const { data } = await supabase.rpc('glo_topic_page_payload', {
        topic_slug: topicSlug
    });
    return data;
}

export async function getGlossaryCountry(countryCode: string) {
    const supabase = await createClient();
    const { data } = await supabase.rpc('glo_country_hub_payload', {
        c_code: countryCode
    });
    return data;
}
