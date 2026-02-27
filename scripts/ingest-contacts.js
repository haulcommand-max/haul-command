/**
 * Parse pipe-delimited operator contact data and seed into Supabase.
 * Format: ROW# | Contact Name | Company | Phone | Email | Services | Regions
 * 
 * This is the HIGHEST VALUE dataset — has emails for March 26 campaign.
 * Confidence scores are boosted because we have verified emails.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// ── Load env ──
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
for (const line of envContent.split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx > 0) env[trimmed.substring(0, eqIdx).trim()] = trimmed.substring(eqIdx + 1).trim();
}
const SUPABASE_URL = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

// ── Parse raw contacts ──
const filePaths = ['raw_contacts_part2.txt', 'raw_contacts_part2b.txt', 'raw_contacts_part3.txt'].map(p => path.join(__dirname, p));
const lines = filePaths.flatMap(file => {
  try {
    const raw = fs.readFileSync(file, 'utf8');
    return raw.split(/\r?\n/).filter(l => l.trim());
  } catch (err) {
    if (err.code !== 'ENOENT') console.warn(`Error reading ${file}`);
    return [];
  }
});

console.log(`📋 Parsing ${lines.length} raw lines...`);

const SERVICE_MAP = {
  'hp': 'height_pole',
  'route survey': 'route_survey',
  'lead/chase': 'lead_chase',
  'steer': 'steering',
  'twic': 'twic',
  'pilot driver': 'pilot_driver',
};

function normalizePhone(raw) {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits[0] === '1') return `+${digits}`;
  return null;
}

function normalizePhoneDisplay(raw) {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits[0] === '1') return `${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`;
  return raw;
}

function parseServices(svcStr) {
  if (!svcStr || svcStr.trim() === '—' || svcStr.trim() === '-') return [];
  return svcStr.split(',')
    .map(s => s.trim().toLowerCase())
    .filter(s => s && s !== '—')
    .map(s => SERVICE_MAP[s] || s);
}

function parseRegions(regionStr) {
  if (!regionStr || regionStr.trim() === '—' || regionStr.trim() === '-') return [];
  const STATE_NAMES = { 'ALASKA': 'AK', 'CANADA': 'CA_COUNTRY' };
  return regionStr.split(',')
    .map(r => r.trim().toUpperCase())
    .filter(r => r && r !== '—' && r !== 'US' && r !== 'USA')
    .map(r => {
      if (r === 'CANADA') return { code: 'CA', country: 'CA' };
      if (STATE_NAMES[r]) return { code: STATE_NAMES[r], country: 'US' };
      return { code: r, country: 'US' };
    });
}

function titleCase(str) {
  if (!str || str === '—') return null;
  return str.trim()
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\bLlc\b/g, 'LLC')
    .replace(/\bInc\b/g, 'Inc.')
    .replace(/\bPcs\b/g, 'PCS');
}

const operators = [];
const seen = new Map(); // dedup by phone_e164

for (const line of lines) {
  const parts = line.split('|').map(p => p.trim());
  if (parts.length < 5) continue;

  const [rowNum, contactName, company, phoneRaw, email, servicesRaw, regionsRaw] = parts;

  // Skip header-like lines
  if (!rowNum || isNaN(parseInt(rowNum))) continue;

  const phoneE164 = normalizePhone(phoneRaw);
  if (!phoneE164) continue; // must have valid phone

  const phoneDisplay = normalizePhoneDisplay(phoneRaw);
  const emailClean = (email && email !== '—') ? email.trim().toLowerCase() : null;
  const companyClean = (company && company !== '—') ? company.trim() : null;
  const contactClean = (contactName && contactName !== '—') ? contactName.trim() : null;
  const services = parseServices(servicesRaw || '');
  const regions = parseRegions(regionsRaw || '');

  // Primary region
  const primaryRegion = regions[0] || { code: null, country: 'US' };
  const additionalRegions = regions.slice(1).map(r => r.code);

  // Dedup by phone
  if (seen.has(phoneE164)) {
    const existing = seen.get(phoneE164);
    // Merge emails
    if (emailClean && !existing.emails.includes(emailClean)) {
      existing.emails.push(emailClean);
    }
    // Merge additional phones
    if (phoneDisplay && !existing.phones.includes(phoneDisplay)) {
      existing.phones.push(phoneDisplay);
    }
    // Merge regions
    for (const r of regions) {
      if (!existing.all_regions.find(er => er.code === r.code)) {
        existing.all_regions.push(r);
      }
    }
    // Merge services
    for (const s of services) {
      if (!existing.services.includes(s)) existing.services.push(s);
    }
    continue;
  }

  const entry = {
    row_num: parseInt(rowNum),
    contact_name: contactClean,
    company_name: companyClean,
    display_name: companyClean || contactClean || 'Unknown',
    phone_e164: phoneE164,
    phone_display: phoneDisplay,
    phones: [phoneDisplay],
    email: emailClean,
    emails: emailClean ? [emailClean] : [],
    services,
    primary_region: primaryRegion.code,
    country_code: primaryRegion.country,
    all_regions: regions,
    additional_regions: additionalRegions,
    source: 'brokers_grid_pdf',
    is_pilot_driver: services.includes('pilot_driver'),
  };

  seen.set(phoneE164, entry);
  operators.push(entry);
}

console.log(`📊 Parsed: ${lines.length} lines → ${operators.length} unique operators`);
console.log(`📊 With email: ${operators.filter(o => o.emails.length > 0).length}`);
console.log(`📊 With company: ${operators.filter(o => o.company_name).length}`);
console.log(`📊 With services: ${operators.filter(o => o.services.length > 0 && !o.is_pilot_driver).length}`);
console.log(`📊 Pilot drivers: ${operators.filter(o => o.is_pilot_driver).length}`);
console.log(`📊 Multi-region: ${operators.filter(o => o.additional_regions.length > 0).length}`);

// By region
const byRegion = {};
for (const op of operators) {
  const r = op.primary_region || 'UNKNOWN';
  byRegion[r] = (byRegion[r] || 0) + 1;
}
console.log('\n📊 By Region:');
Object.entries(byRegion).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`   ${k}: ${v}`));

// ── Build Supabase rows ──
function makeSlug(name) {
  const uid = crypto.randomUUID().substring(0, 8);
  return name.toLowerCase().replace(/['']/g, '').replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 50) + '-' + uid;
}

function generateClaimHash(name, phone) {
  return crypto.createHash('sha256').update(`${name}::${phone}::haulcommand2026`).digest('hex').substring(0, 16);
}

const rows = operators.map(op => {
  const uuid = crypto.randomUUID();
  const name = op.display_name;
  const slug = makeSlug(name);
  const claimHash = generateClaimHash(name, op.phone_e164);

  // Higher confidence because we have emails
  let conf = 0.60; // base higher for verified contact data
  if (op.email) conf += 0.15;
  if (op.company_name) conf += 0.10;
  if (op.services.length > 0) conf += 0.05;
  if (op.primary_region) conf += 0.05;
  conf = Math.min(conf, 0.95);

  let completeness = 0.30; // has name + phone + email = strong start
  if (op.email) completeness += 0.20;
  if (op.company_name) completeness += 0.15;
  if (op.services.length > 0) completeness += 0.15;
  if (op.primary_region) completeness += 0.10;
  completeness = Math.min(completeness, 0.95);

  let claimPri = 0.70; // high priority — we have email for outreach
  if (op.email) claimPri += 0.15;
  if (op.services.length > 0) claimPri += 0.05;
  claimPri = Math.min(claimPri, 0.95);

  return {
    entity_type: op.is_pilot_driver ? 'pilot_driver' : 'pilot_car_operator',
    entity_id: uuid,
    name,
    slug,
    city: null, // not in this dataset
    city_slug: null,
    region_code: op.primary_region,
    country_code: op.country_code,
    source: 'brokers_grid_pdf',
    claim_status: 'unclaimed',
    claim_hash: claimHash,
    rank_score: 15, // higher than scrape data because these are active contacts
    is_visible: true,
    entity_confidence_score: parseFloat(conf.toFixed(2)),
    profile_completeness: parseFloat(completeness.toFixed(2)),
    claim_priority_score: parseFloat(claimPri.toFixed(2)),
    metadata: {
      contact_name: op.contact_name,
      company_name: op.company_name,
      phone: op.phone_display,
      phone_e164: op.phone_e164,
      phones: op.phones,
      email: op.email,
      emails: op.emails,
      services: op.services.filter(s => s !== 'pilot_driver'),
      claim_hash: claimHash,
      source: 'brokers_grid_pdf',
      additional_regions: op.additional_regions,
      is_pilot_driver: op.is_pilot_driver,
    },
  };
});

// ── Save JSON ──
const jsonPath = path.join(__dirname, 'contacts_parsed.json');
fs.writeFileSync(jsonPath, JSON.stringify({ total: rows.length, operators: rows, parsed_at: new Date().toISOString() }, null, 2));
console.log(`\n💾 JSON: ${jsonPath}`);

// ── Seed to Supabase ──
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.log('⚠️  No Supabase credentials — skipping seed. Run in seed mode later.');
  process.exit(0);
}

function post(body) {
  return new Promise((resolve, reject) => {
    const url = new URL('/rest/v1/directory_listings', SUPABASE_URL);
    const postData = JSON.stringify(body);
    const req = https.request({
      hostname: url.hostname, path: url.pathname, method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=ignore-duplicates,return=minimal',
        'Content-Length': Buffer.byteLength(postData),
      },
      timeout: 30000
    }, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => res.statusCode < 300 ? resolve(res.statusCode) : reject(new Error(`HTTP ${res.statusCode}: ${d.substring(0, 200)}`)));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(postData); req.end();
  });
}

async function seedSupabase() {
  console.log(`\n🚀 Seeding ${rows.length} contacts to Supabase...`);
  const BATCH = 50;
  let inserted = 0, errors = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const bn = Math.floor(i / BATCH) + 1;
    const tb = Math.ceil(rows.length / BATCH);
    process.stdout.write(`[${bn}/${tb}] ${batch.length} rows... `);
    try {
      await post(batch);
      inserted += batch.length;
      console.log('✅');
    } catch (err) {
      console.log(`❌ ${err.message.substring(0, 80)}`);
      errors++;
      // Try individually
      let rec = 0;
      for (const row of batch) {
        try { await post([row]); rec++; inserted++; } catch (e) { }
      }
      if (rec) console.log(`   ↳ Recovered ${rec}/${batch.length}`);
    }
  }

  console.log(`\n📊 Contacts seeded: ${inserted}`);
  if (errors) console.log(`⚠️  ${errors} batch errors (individually recovered where possible)`);
  console.log('✅ Contact seed complete!');
}

seedSupabase().catch(err => console.error('Fatal:', err));
