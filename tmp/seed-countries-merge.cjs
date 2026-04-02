const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Canonical 120-country list — exactly as specified by the user
const COUNTRIES = {
  gold: ['US','CA','AU','GB','NZ','ZA','DE','NL','AE','BR'],
  blue: ['IE','SE','NO','DK','FI','BE','AT','CH','ES','FR','IT','PT','SA','QA','MX','IN','ID','TH'],
  silver: ['PL','CZ','SK','HU','SI','EE','LV','LT','HR','RO','BG','GR','TR','KW','OM','BH','SG','MY','JP','KR','CL','AR','CO','PE','VN','PH'],
  slate: ['UY','PA','CR','IL','NG','EG','KE','MA','RS','UA','KZ','TW','PK','BD','MN','TT','JO','GH','TZ','GE','AZ','CY','IS','LU','EC'],
  copper: ['BO','PY','GT','DO','HN','SV','NI','JM','GY','SR','BA','ME','MK','AL','MD','IQ','NA','AO','MZ','ET','CI','SN','BW','ZM','UG','CM','KH','LK','UZ','LA','NP','DZ','TN','MT','BN','RW','MG','PG','TM','KG','MW']
};

// Country names lookup
const NAMES = {
  US:'United States',CA:'Canada',AU:'Australia',GB:'United Kingdom',NZ:'New Zealand',
  ZA:'South Africa',DE:'Germany',NL:'Netherlands',AE:'United Arab Emirates',BR:'Brazil',
  IE:'Ireland',SE:'Sweden',NO:'Norway',DK:'Denmark',FI:'Finland',BE:'Belgium',AT:'Austria',
  CH:'Switzerland',ES:'Spain',FR:'France',IT:'Italy',PT:'Portugal',SA:'Saudi Arabia',
  QA:'Qatar',MX:'Mexico',IN:'India',ID:'Indonesia',TH:'Thailand',
  PL:'Poland',CZ:'Czech Republic',SK:'Slovakia',HU:'Hungary',SI:'Slovenia',EE:'Estonia',
  LV:'Latvia',LT:'Lithuania',HR:'Croatia',RO:'Romania',BG:'Bulgaria',GR:'Greece',TR:'Turkey',
  KW:'Kuwait',OM:'Oman',BH:'Bahrain',SG:'Singapore',MY:'Malaysia',JP:'Japan',KR:'South Korea',
  CL:'Chile',AR:'Argentina',CO:'Colombia',PE:'Peru',VN:'Vietnam',PH:'Philippines',
  UY:'Uruguay',PA:'Panama',CR:'Costa Rica',IL:'Israel',NG:'Nigeria',EG:'Egypt',KE:'Kenya',
  MA:'Morocco',RS:'Serbia',UA:'Ukraine',KZ:'Kazakhstan',TW:'Taiwan',PK:'Pakistan',BD:'Bangladesh',
  MN:'Mongolia',TT:'Trinidad and Tobago',JO:'Jordan',GH:'Ghana',TZ:'Tanzania',GE:'Georgia',
  AZ:'Azerbaijan',CY:'Cyprus',IS:'Iceland',LU:'Luxembourg',EC:'Ecuador',
  BO:'Bolivia',PY:'Paraguay',GT:'Guatemala',DO:'Dominican Republic',HN:'Honduras',SV:'El Salvador',
  NI:'Nicaragua',JM:'Jamaica',GY:'Guyana',SR:'Suriname',BA:'Bosnia and Herzegovina',
  ME:'Montenegro',MK:'North Macedonia',AL:'Albania',MD:'Moldova',IQ:'Iraq',NA:'Namibia',
  AO:'Angola',MZ:'Mozambique',ET:'Ethiopia',CI:"Cote d'Ivoire",SN:'Senegal',BW:'Botswana',
  ZM:'Zambia',UG:'Uganda',CM:'Cameroon',KH:'Cambodia',LK:'Sri Lanka',UZ:'Uzbekistan',
  LA:'Laos',NP:'Nepal',DZ:'Algeria',TN:'Tunisia',MT:'Malta',BN:'Brunei',RW:'Rwanda',
  MG:'Madagascar',PG:'Papua New Guinea',TM:'Turkmenistan',KG:'Kyrgyzstan',MW:'Malawi'
};

function slugify(name) {
  return name.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function seed() {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL });
  await c.connect();
  console.log('Connected. Seeding 120 countries...\n');

  // Step 1: Update existing 25 countries with tier + code
  const r1 = await c.query(`
    UPDATE public.countries c
    SET 
      code = COALESCE(c.code, c.iso_code),
      tier = ct.tier,
      market_status = ct.market_status
    FROM public.country_tiers ct
    WHERE (c.iso_code = ct.country_code OR c.code = ct.country_code)
    RETURNING c.id, c.name, c.code
  `);
  console.log(`Updated ${r1.rowCount} existing countries with tier data`);

  // Step 1b: Backfill code from iso_code
  await c.query(`UPDATE public.countries SET code = iso_code WHERE code IS NULL AND iso_code IS NOT NULL`);

  // Step 2: Enrich existing countries with locale data from hc_countries
  const r2 = await c.query(`
    UPDATE public.countries c
    SET metadata = jsonb_build_object(
      'currency', hcc.currency, 'currency_symbol', hcc.currency_symbol,
      'distance_unit', hcc.distance_unit, 'phone_prefix', hcc.phone_prefix,
      'locale_default', hcc.locale_default, 'rtl', hcc.rtl, 'name_local', hcc.name_local
    ) || COALESCE(c.metadata, '{}'::jsonb),
    languages = CASE WHEN c.languages IS NULL OR c.languages = '[]'::jsonb 
      THEN jsonb_build_array(hcc.locale_default) ELSE c.languages END
    FROM public.hc_countries hcc
    WHERE (c.iso_code = hcc.code OR c.code = hcc.code) AND (c.metadata IS NULL OR NOT c.metadata ? 'currency')
    RETURNING c.id
  `);
  console.log(`Enriched ${r2.rowCount} countries with locale/currency data`);

  // Step 3: Get existing country codes
  const existing = await c.query(`SELECT COALESCE(code, iso_code) as code FROM public.countries`);
  const existingCodes = new Set(existing.rows.map(r => r.code));
  console.log(`Existing country codes: ${existingCodes.size}`);

  // Step 4: Insert missing countries with ALL required fields
  let inserted = 0;
  for (const [tier, codes] of Object.entries(COUNTRIES)) {
    for (const code of codes) {
      if (existingCodes.has(code)) continue;
      const name = NAMES[code] || code;
      const slug = slugify(name);
      const priority = tier === 'gold' ? 'high' : tier === 'blue' ? 'high' : tier === 'silver' ? 'medium' : 'low';
      const marketStatus = tier === 'gold' ? 'active' : tier === 'blue' ? 'planned' : 'research';
      
      try {
        await c.query(
          `INSERT INTO public.countries (name, code, iso_code, slug, tier, market_status, validation_priority, archetype_profile)
           VALUES ($1, $2::char(2), $3::text, $4, $5, $6, $7, $8)
           ON CONFLICT DO NOTHING`,
          [name, code, code, slug, tier, marketStatus, priority, 'standard']
        );
        inserted++;
      } catch (e) {
        console.error(`  ❌ ${code} (${name}): ${e.message.split('\n')[0]}`);
      }
    }
  }
  console.log(`Inserted ${inserted} new countries`);

  // Step 5: Set archetype profiles for all
  const r5 = await c.query(`
    UPDATE public.countries SET archetype_profile = 
      CASE 
        WHEN code IN ('US','CA','AU','GB','NZ','DE','NL') THEN 'mature_regulated'
        WHEN code IN ('AE','SA','QA','KW','BH','OM') THEN 'oil_infrastructure'
        WHEN code IN ('JP','KR','SG','TW') THEN 'dense_industrial'
        WHEN code IN ('IN','PH','ID','VN','TH','MY','KH','LK','LA','NP','BD','PK','BN') THEN 'emerging_growth'
        WHEN code IN ('BR','MX','AR','CL','CO','PE','UY','PA','CR','EC','BO','PY','GT','DO','HN','SV','NI','JM','GY','SR') THEN 'latam_resource'
        WHEN code IN ('ZA','NG','KE','GH','EG','MA','TZ','NA','AO','MZ','ET','CI','SN','BW','ZM','UG','CM','RW','MG','MW') THEN 'africa_frontier'
        WHEN code IN ('PL','CZ','SK','HU','SI','EE','LV','LT','HR','RO','BG','GR','RS','BA','ME','MK','AL','MD','UA','CY') THEN 'eu_expansion'
        WHEN code IN ('NO','SE','FI','DK','IS') THEN 'nordic_premium'
        WHEN code IN ('KZ','UZ','TM','KG','MN','GE','AZ') THEN 'central_asia'
        WHEN code IN ('FR','BE','AT','CH','ES','IT','PT','IE','LU','MT') THEN 'western_europe'
        WHEN code IN ('TR','IL','JO','IQ') THEN 'crossroads_market'
        WHEN code IN ('TT','DZ','TN','PG') THEN 'resource_extraction'
        ELSE 'standard'
      END
    WHERE archetype_profile IS NULL OR archetype_profile = 'standard'
    RETURNING id
  `);
  console.log(`Set archetype profiles for ${r5.rowCount} countries`);

  // Step 6: Enrich newly-inserted countries from hc_countries
  const r6 = await c.query(`
    UPDATE public.countries c
    SET metadata = jsonb_build_object(
      'currency', hcc.currency, 'currency_symbol', hcc.currency_symbol,
      'distance_unit', hcc.distance_unit, 'phone_prefix', hcc.phone_prefix,
      'locale_default', hcc.locale_default, 'rtl', hcc.rtl, 'name_local', hcc.name_local
    ) || COALESCE(c.metadata, '{}'::jsonb)
    FROM public.hc_countries hcc
    WHERE c.code = hcc.code AND (c.metadata IS NULL OR c.metadata = '{}'::jsonb)
    RETURNING c.id
  `);
  console.log(`Enriched ${r6.rowCount} more countries with hc_countries data`);

  // VERIFICATION
  const verify = await c.query(`
    SELECT count(*) as total,
      count(*) FILTER (WHERE code IS NOT NULL) as has_code,
      count(*) FILTER (WHERE tier IS NOT NULL) as has_tier,
      count(*) FILTER (WHERE archetype_profile IS NOT NULL AND archetype_profile != 'standard') as has_arch,
      count(*) FILTER (WHERE metadata IS NOT NULL AND metadata != '{}'::jsonb) as has_meta
    FROM public.countries
  `);
  const v = verify.rows[0];
  
  const byTier = await c.query(`SELECT tier, count(*) as cnt FROM public.countries WHERE tier IS NOT NULL GROUP BY tier ORDER BY CASE tier WHEN 'gold' THEN 1 WHEN 'blue' THEN 2 WHEN 'silver' THEN 3 WHEN 'slate' THEN 4 WHEN 'copper' THEN 5 END`);

  console.log(`\n${'═'.repeat(50)}`);
  console.log('COUNTRIES TABLE — FINAL STATE');
  console.log(`${'═'.repeat(50)}`);
  console.log(`Total:      ${v.total}`);
  console.log(`Has code:   ${v.has_code}`);
  console.log(`Has tier:   ${v.has_tier}`);
  console.log(`Archetype:  ${v.has_arch}`);
  console.log(`Has meta:   ${v.has_meta}`);
  console.log('\nBy tier:');
  byTier.rows.forEach(r => console.log(`  ${r.tier}: ${r.cnt}`));

  await c.end();
}
seed().catch(e => { console.error(e); process.exit(1); });
