#!/usr/bin/env node
/**
 * FHWA National Bridge Inventory (NBI) → road_restrictions importer
 *
 * Downloads the public NBI CSV (620K+ bridges), parses height/weight/width
 * clearance data, and generates SQL INSERT statements for the
 * road_restrictions table.
 *
 * Usage:
 *   node scripts/import-nbi.js              # generates SQL file
 *   node scripts/import-nbi.js --direct     # inserts via Supabase client
 *
 * Data source: https://www.fhwa.dot.gov/bridge/nbi/ascii.cfm
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');

// NBI fixed-width column positions (1-indexed from NBI spec)
const NBI_COLUMNS = {
  structureNumber:  { start: 0,   end: 15  },
  stateCode:        { start: 15,  end: 18  },
  countyCode:       { start: 18,  end: 21  },
  latitude:         { start: 279, end: 287 },
  longitude:        { start: 287, end: 296 },
  featuresIntersected: { start: 42, end: 66 },
  facilityCarried:  { start: 23,  end: 42  },
  minVertClearOver: { start: 241, end: 245 },  // Item 10 - min vert clearance over bridge (meters*10)
  minVertClearUnder:{ start: 245, end: 249 },  // Item 54A - clearance under (meters*10)
  minLatClearRight: { start: 249, end: 252 },  // Item 54B - lateral clearance right
  minLatClearLeft:  { start: 252, end: 255 },  // Item 55A - lateral clearance left
  operatingRating:  { start: 261, end: 264 },  // Item 64 - operating rating (metric tons*10)
  designLoad:       { start: 258, end: 261 },  // Item 31 - design load
  yearBuilt:        { start: 217, end: 221 },
  structureLength:  { start: 225, end: 231 },  // meters*10
};

// State FIPS to 2-letter code mapping
const FIPS_TO_STATE = {
  '01':'AL','02':'AK','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT',
  '10':'DE','11':'DC','12':'FL','13':'GA','15':'HI','16':'ID','17':'IL',
  '18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME','24':'MD',
  '25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE',
  '32':'NV','33':'NH','34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND',
  '39':'OH','40':'OK','41':'OR','42':'PA','44':'RI','45':'SC','46':'SD',
  '47':'TN','48':'TX','49':'UT','50':'VT','51':'VA','53':'WA','54':'WV',
  '55':'WI','56':'WY','72':'PR','78':'VI',
};

const METERS_TO_FEET = 3.28084;

function parseNBILine(line) {
  const get = (col) => {
    const spec = NBI_COLUMNS[col];
    return line.substring(spec.start, spec.end).trim();
  };

  const stateCode = FIPS_TO_STATE[get('stateCode')] || get('stateCode');
  const rawLat = get('latitude');
  const rawLng = get('longitude');

  // NBI format: DDMMSS.SS
  const lat = parseNBICoord(rawLat);
  const lng = -Math.abs(parseNBICoord(rawLng)); // US longitudes are negative

  if (!lat || !lng || lat === 0 || lng === 0) return null;

  const vertClearUnder = parseFloat(get('minVertClearUnder')) / 10; // meters
  const vertClearOver = parseFloat(get('minVertClearOver')) / 10;
  const latClearRight = parseFloat(get('minLatClearRight')) / 10;
  const operatingRating = parseFloat(get('operatingRating')) / 10; // metric tons

  const restrictions = [];

  // Height restriction (under bridge)
  if (vertClearUnder > 0 && vertClearUnder < 30) {
    const heightFt = +(vertClearUnder * METERS_TO_FEET).toFixed(1);
    restrictions.push({
      lat, lng, stateCode,
      roadName: get('featuresIntersected'),
      restrictionType: 'bridge_height',
      maxHeightFt: heightFt,
      source: 'nbi',
      confidenceScore: 0.9,
      notes: `NBI Structure ${get('structureNumber')} - Carries: ${get('facilityCarried')}`,
    });
  }

  // Weight restriction
  if (operatingRating > 0 && operatingRating < 100) {
    const weightLbs = Math.round(operatingRating * 2204.62); // metric tons to lbs
    restrictions.push({
      lat, lng, stateCode,
      roadName: get('featuresIntersected'),
      restrictionType: 'bridge_weight',
      maxWeightLbs: weightLbs,
      source: 'nbi',
      confidenceScore: 0.85,
      notes: `NBI Structure ${get('structureNumber')} - Operating rating: ${operatingRating}t`,
    });
  }

  // Width restriction (lateral clearance)
  if (latClearRight > 0 && latClearRight < 20) {
    const widthFt = +(latClearRight * METERS_TO_FEET).toFixed(1);
    restrictions.push({
      lat, lng, stateCode,
      roadName: get('featuresIntersected'),
      restrictionType: 'road_width',
      maxWidthFt: widthFt,
      source: 'nbi',
      confidenceScore: 0.8,
      notes: `NBI Structure ${get('structureNumber')} - Lateral clearance`,
    });
  }

  return restrictions.length > 0 ? restrictions : null;
}

function parseNBICoord(raw) {
  if (!raw || raw.length < 6) return 0;
  const dd = parseInt(raw.substring(0, 2), 10);
  const mm = parseInt(raw.substring(2, 4), 10);
  const ss = parseFloat(raw.substring(4));
  return +(dd + mm / 60 + ss / 3600).toFixed(6);
}

function toSQL(r) {
  const esc = (v) => v ? `'${String(v).replace(/'/g, "''")}'` : 'NULL';
  return `INSERT INTO road_restrictions (lat, lng, state_code, road_name, restriction_type, max_height_ft, max_width_ft, max_weight_lbs, source, confidence_score, notes)
VALUES (${r.lat}, ${r.lng}, ${esc(r.stateCode)}, ${esc(r.roadName)}, '${r.restrictionType}', ${r.maxHeightFt||'NULL'}, ${r.maxWidthFt||'NULL'}, ${r.maxWeightLbs||'NULL'}, '${r.source}', ${r.confidenceScore}, ${esc(r.notes)});`;
}

async function downloadNBI(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadNBI(res.headers.location, dest).then(resolve).catch(reject);
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', reject);
  });
}

async function main() {
  const NBI_URL = 'https://www.fhwa.dot.gov/bridge/nbi/2023/delimited/AllRecords_AllStates.zip';
  const CSV_PATH = path.join(__dirname, '..', 'data', 'nbi_raw.csv');
  const SQL_PATH = path.join(__dirname, '..', 'data', 'nbi_import.sql');

  console.log('=== FHWA NBI → road_restrictions Import ===');
  console.log();

  // Check if we have a local CSV
  if (!fs.existsSync(CSV_PATH)) {
    console.log(`NBI CSV not found at ${CSV_PATH}`);
    console.log('Please download from: https://www.fhwa.dot.gov/bridge/nbi/ascii.cfm');
    console.log('Extract the CSV and place it at: data/nbi_raw.csv');
    console.log();
    console.log('Or run: curl -L "https://www.fhwa.dot.gov/bridge/nbi/2023/delimited/AllRecords_AllStates.zip" -o nbi.zip && unzip nbi.zip -d data/');
    process.exit(1);
  }

  console.log(`Reading NBI data from ${CSV_PATH}...`);

  const rl = readline.createInterface({
    input: fs.createReadStream(CSV_PATH),
    crlfDelay: Infinity,
  });

  const sqlStatements = [
    '-- FHWA NBI Bridge Data Import',
    `-- Generated: ${new Date().toISOString()}`,
    '-- Source: https://www.fhwa.dot.gov/bridge/nbi/ascii.cfm',
    '',
    'BEGIN;',
    '',
  ];

  let lineCount = 0;
  let restrictionCount = 0;
  let skipped = 0;

  for await (const line of rl) {
    lineCount++;
    if (lineCount === 1) continue; // skip header

    try {
      const restrictions = parseNBILine(line);
      if (restrictions) {
        for (const r of restrictions) {
          sqlStatements.push(toSQL(r));
          restrictionCount++;
        }
      } else {
        skipped++;
      }
    } catch (err) {
      skipped++;
    }

    if (lineCount % 50000 === 0) {
      console.log(`  Processed ${lineCount.toLocaleString()} bridges, ${restrictionCount.toLocaleString()} restrictions...`);
    }
  }

  sqlStatements.push('');
  sqlStatements.push('COMMIT;');
  sqlStatements.push(`-- Total: ${restrictionCount} restrictions from ${lineCount} bridges (${skipped} skipped)`);

  fs.mkdirSync(path.dirname(SQL_PATH), { recursive: true });
  fs.writeFileSync(SQL_PATH, sqlStatements.join('\n'));

  console.log();
  console.log(`✅ Done!`);
  console.log(`   Bridges processed: ${lineCount.toLocaleString()}`);
  console.log(`   Restrictions generated: ${restrictionCount.toLocaleString()}`);
  console.log(`   Skipped: ${skipped.toLocaleString()}`);
  console.log(`   SQL file: ${SQL_PATH}`);
  console.log();
  console.log('To apply: psql $DATABASE_URL < data/nbi_import.sql');
  console.log('Or paste into Supabase SQL Editor');
}

main().catch(console.error);
