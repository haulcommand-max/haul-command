const fs = require('fs');

const sources = fs.readFileSync('data/confirmed_sources_seed.csv', 'utf-8').trim().split('\n').filter(Boolean).slice(1);

let sql = `-- Migration: 20260408_012_global_jurisdictions_seed.sql
-- Seed global training jurisdictions from confirmed sources\n\n`;

const jurisdictions = new Map();

for (const line of sources) {
    // Parse CSV line simply
    const parts = [];
    let cur = "";
    let inQuotes = false;
    for(let i=0; i<line.length; i++) {
        if(line[i] === '"') {
            inQuotes = !inQuotes;
        } else if(line[i] === ',' && !inQuotes) {
            parts.push(cur);
            cur = "";
        } else {
            cur += line[i];
        }
    }
    parts.push(cur);

    const [row_key, country_code, country_name, state_province, jurisdiction_level, source_type, year, off_non_off, score, url, title, authority, lang, notes] = parts;
    const region_code = state_province === 'National' || state_province === 'Federal' ? null : `${country_code}-${state_province.replace(/\\s+/g, '').toUpperCase()}`;
    const slug = state_province === 'National' || state_province === 'Federal' ? country_name.toLowerCase().replace(/\\s+/g, '-') : state_province.toLowerCase().replace(/\\s+/g, '-');
    const key = `${country_code}_${region_code || 'null'}`;
    
    if(!jurisdictions.has(key)){
        jurisdictions.set(key, { country_code, region_code, slug, country_name, state_province, refs: [] });
    }
    jurisdictions.get(key).refs.push({url, title, authority, score, type: source_type});
}

// 1. Create table for regulation sources as requested
sql += `CREATE TABLE IF NOT EXISTS public.training_regulation_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jurisdiction_id UUID REFERENCES public.training_jurisdictions(id) ON DELETE CASCADE,
    source_url TEXT NOT NULL,
    source_title TEXT,
    authority_name TEXT,
    source_type TEXT,
    training_value_score INT
);\n\n`;

sql += `WITH ins_jurisdictions AS (
    INSERT INTO public.training_jurisdictions 
        (country_code, region_code, credential_type, is_mandatory, official_path_url)
    VALUES \n`;

const jList = Array.from(jurisdictions.values());
const jVals = jList.map(j => `        ('${j.country_code}', ${j.region_code ? "'" + j.region_code + "'" : 'NULL'}, 'government', true, '${j.refs[0]?.url || ''}')`).join(',\n');
sql += jVals + `\n    ON CONFLICT (country_code, COALESCE(region_code, '')) DO UPDATE SET official_path_url = EXCLUDED.official_path_url RETURNING id, country_code, region_code
),
ins_tracks AS (
    INSERT INTO public.training_tracks
        (jurisdiction_id, track_slug, title, track_type, official_course_hours_total, hc_estimated_prep_hours_total)
    SELECT id, 'pre-qualification-prep', 'Pre-Certification Prep / Pre-Qualification', 'certification', 8.0, 6.0
    FROM ins_jurisdictions
    ON CONFLICT (track_slug, jurisdiction_id) DO UPDATE SET title = EXCLUDED.title 
    RETURNING id, jurisdiction_id
)
INSERT INTO public.training_modules 
    (track_id, sequence_order, module_slug, module_title, visible_text_ready, structured_data_ready, search_ready)
SELECT
    t.id, 1, 'module-1-regulations-prep', 'Pre-Qualification Prep Module 1', true, true, true
FROM ins_tracks t
ON CONFLICT (module_slug, track_id) DO NOTHING;\n\n`;

// Populate sources
sql += `\n-- Populate Sources\n`;
for (const j of jList) {
    for (const ref of j.refs) {
        const titleSafe = ref.title ? ref.title.replace(/'/g, "''") : '';
        const authSafe = ref.authority ? ref.authority.replace(/'/g, "''") : '';
        sql += `INSERT INTO public.training_regulation_sources (jurisdiction_id, source_url, source_title, authority_name, source_type, training_value_score)
        SELECT id, '${ref.url}', '${titleSafe}', '${authSafe}', '${ref.type}', ${ref.score}
        FROM public.training_jurisdictions WHERE country_code = '${j.country_code}' AND COALESCE(region_code, '') = '${j.region_code || ''}';\n`;
    }
}

fs.writeFileSync('supabase/migrations/20260408_012_global_jurisdictions_seed.sql', sql);
