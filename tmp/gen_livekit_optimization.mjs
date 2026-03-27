import fs from 'fs';
import path from 'path';

// Load the 120 countries
const { HC_COUNTRIES } = await import('../lib/geo/countries.ts').catch(() => {
    // Fallback if ts can't be imported, but we'll cheat by reading the file and parsing it
    const text = fs.readFileSync(path.resolve('lib/geo/countries.ts'), 'utf8');
    const regex = /iso2:\s*"([A-Z]{2})".*?name:\s*"([^"]+)".*?tier:\s*"([^"]+)".*?currency:\s*"([^"]+)".*?region:\s*"([^"]+)".*?primary_locale:\s*"([^"]+)".*?distance_unit:\s*"([^"]+)"/gs;
    let match;
    const countries = [];
    while ((match = regex.exec(text)) !== null) {
        countries.push({
            iso2: match[1],
            name: match[2],
            tier: match[3],
            currency: match[4],
            region: match[5],
            primary_locale: match[6],
            distance_unit: match[7]
        });
    }
    return { HC_COUNTRIES: countries };
});

if (!HC_COUNTRIES) throw new Error("Could not load countries");

// 1. GENERATE SQL MIGRATION FOR COMPLIANCE (120 COUNTRIES)
let sql = `
-- ============================================================================
-- GLOBAL LIVEKIT AI VOICE COMPLIANCE & INTELLIGENCE (120 COUNTRIES)
-- Upgrading from old Vapi manual mappings to fully automated 120-country 
-- LiveKit Voice Node enforcement.
-- ============================================================================

-- Ensure the table exists
CREATE TABLE IF NOT EXISTS public.country_compliance_profiles (
    country_code VARCHAR(2) PRIMARY KEY,
    region_name TEXT,
    call_recording_consent public.call_recording_consent_type DEFAULT 'two_party',
    outbound_allowed BOOLEAN DEFAULT false,
    required_disclosures JSONB DEFAULT '[]'::jsonb,
    compliance_last_verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    compliance_verified_by_user UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed 120 countries LiveKit Optimization Engine
INSERT INTO public.country_compliance_profiles (country_code, region_name, call_recording_consent, outbound_allowed, required_disclosures) VALUES
`;

const sqlValues = [];

// 2. GENERATE TYPESCRIPT PIPELINE CONFIG (120 COUNTRIES)
let tsConfigStr = `export const COUNTRY_LOCALE_CONFIG: Record<string, {
    primaryLanguage: string;
    measurementSystem: 'metric' | 'imperial';
    currency: string;
    dateFormat: 'MDY' | 'DMY' | 'YMD';
    livekitVoiceNode: string;
}> = {\n`;

for (const c of HC_COUNTRIES) {
    // Determine language from primary_locale
    let langCode = c.primary_locale.split('-')[0] || 'en';

    // Optimize LiveKit voice nodes based on region and language
    let livekitVoiceNode = `nova_${langCode}`; // default openai voice template 
    
    let measurementSystem = c.distance_unit === 'mi' ? 'imperial' : 'metric';
    let dateFormat = ['US', 'CA', 'PH', 'FM'].includes(c.iso2) ? 'MDY' : (langCode === 'en' ? 'DMY' : 'YMD');

    tsConfigStr += `    ${c.iso2}: { primaryLanguage: '${langCode}', measurementSystem: '${measurementSystem}', currency: '${c.currency}', dateFormat: '${dateFormat}', livekitVoiceNode: '${livekitVoiceNode}' },\n`;

    // Determine compliance
    let consentType = 'two_party';
    let outbound = false;
    let disclosures = '[]';
    
    // EU GDPR strict logic
    if (["europe_west", "europe_north", "europe_east", "europe_south"].includes(c.region)) {
        consentType = 'strict_ban';
        outbound = false;
        disclosures = `["LiveKit call recording is disabled due to strict data privacy regulations in ${c.name}."]`;
    } else if (c.region === 'middle_east' || c.region === 'africa') {
        // Some strict bans in ME/Africa, defaulting to safe 
        if (['AE', 'SA', 'ZA'].includes(c.iso2)) {
            consentType = 'strict_ban';
            disclosures = `["LiveKit call recording is disabled (Local compliance override)."]`;
        } else {
            consentType = 'one_party'; // relaxed in emerging logistics markets
            outbound = true; // allow AI outbound
            disclosures = `["Esta llamada puede ser grabada para fines de calidad."]`; 
            if (langCode === 'en') disclosures = `["This call may be recorded for quality purposes."]`;
            if (langCode === 'pt') disclosures = `["Esta chamada pode ser gravada para fins de qualidade."]`;
        }
    } else {
        // Americas & APAC
        outbound = true;
        consentType = 'two_party';
        if (langCode === 'es') {
            disclosures = `["Al continuar en esta llamada de Haul Command, usted acepta la grabación con fines de calidad."]`;
        } else if (langCode === 'en') {
            disclosures = `["By continuing this Haul Command AI dispatch call, you agree to recording for quality purposes."]`;
        }
    }

    // specific strict exceptions
    if (c.iso2 === 'CA' || c.iso2 === 'AU') consentType = 'two_party';
    if (c.iso2 === 'GB') consentType = 'strict_ban';

    // For SQL we format JSON properly
    const safeRegex = /'/g;
    const safeCountryName = c.name.replace(safeRegex, "''");
    
    sqlValues.push(`    ('${c.iso2}', '${safeCountryName}', '${consentType}', ${outbound}, '${disclosures}'::jsonb)`);
}

sql += sqlValues.join(',\n');
sql += `\nON CONFLICT (country_code) DO UPDATE SET
    region_name = EXCLUDED.region_name,
    call_recording_consent = EXCLUDED.call_recording_consent,
    outbound_allowed = EXCLUDED.outbound_allowed,
    required_disclosures = EXCLUDED.required_disclosures,
    compliance_last_verified_at = NOW();\n\n`;

// Also, upgrade the data layer tables for LiveKit instead of Vapi
sql += `
-- Migrate old Vapi logic to Native LiveKit AI Voice
CREATE TABLE IF NOT EXISTS public.livekit_call_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id VARCHAR(255) UNIQUE NOT NULL,
    livekit_agent_id VARCHAR(255),
    direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')),
    country_code VARCHAR(2),
    caller_number VARCHAR(50),
    recipient_number VARCHAR(50),
    call_status VARCHAR(50),
    duration_seconds INTEGER,
    recording_url TEXT,
    cost_usd DECIMAL(10,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.livekit_call_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "livekit_service_all" ON public.livekit_call_events FOR ALL USING (auth.role() = 'service_role');

-- Sync completed.
`;

fs.writeFileSync(path.resolve('supabase/migrations/20260327_livekit_voice_compliance_120_countries.sql'), sql, 'utf8');

tsConfigStr += `};\n`;

// Now let's inject this new TS Config string directly into lib/localization/pipeline.ts!
// We'll read the file, find the block, and replace it.

const pipelinePath = path.resolve('lib/localization/pipeline.ts');
const pipelineContent = fs.readFileSync(pipelinePath, 'utf8');

// Use Regex to replace the COUNTRY_LOCALE_CONFIG block
const replaceRegex = /export const COUNTRY_LOCALE_CONFIG: Record<string, \{[^\}]+\}> = \{[\s\S]*?^\};/m;

if (replaceRegex.test(pipelineContent)) {
    const newContent = pipelineContent.replace(replaceRegex, tsConfigStr);
    
    // Also, we need to rename any vapiPersona usage further down in the file, if any exists.
    // In pipeline.ts there actually wasn't anything touching vapiPersona in the functions, it was just in the config.
    const finalContent = newContent.replace(/vapiPersona/g, 'livekitVoiceNode');
    
    fs.writeFileSync(pipelinePath, finalContent, 'utf8');
    console.log("Successfully injected LiveKit optimization for 120 countries into TS Pipeline.");
} else {
    console.error("Could not find COUNTRY_LOCALE_CONFIG block in pipeline.ts to replace.");
}

console.log("SQL created.");
