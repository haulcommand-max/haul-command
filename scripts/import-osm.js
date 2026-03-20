#!/usr/bin/env node
/**
 * OpenStreetMap Truck Restriction Tags → road_restrictions importer
 *
 * Queries the Overpass API for all US roads with truck-relevant tags:
 * - maxheight, maxweight, maxwidth, maxlength
 * - hgv (heavy goods vehicle restrictions)
 * - maxaxleload, maxspeed:hgv
 *
 * Usage:
 *   node scripts/import-osm.js              # generates SQL file
 *   node scripts/import-osm.js --state TX   # single state
 *
 * Data source: OpenStreetMap via Overpass API (free, no key needed)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// US state bounding boxes for chunked queries
const STATE_BOUNDS = {
  AL: [30.14,-88.47,35.01,-84.89], AK: [51.21,-179.15,71.39,-129.98],
  AZ: [31.33,-114.82,37.00,-109.04], AR: [33.00,-94.62,36.50,-89.64],
  CA: [32.53,-124.48,42.01,-114.13], CO: [36.99,-109.06,41.00,-102.04],
  CT: [40.95,-73.73,42.05,-71.79], DE: [38.45,-75.79,39.84,-75.05],
  FL: [24.40,-87.63,31.00,-80.03], GA: [30.36,-85.61,35.00,-80.84],
  HI: [18.91,-160.24,22.24,-154.81], ID: [41.99,-117.24,49.00,-111.04],
  IL: [36.97,-91.51,42.51,-87.02], IN: [37.77,-88.10,41.76,-84.78],
  IA: [40.37,-96.64,43.50,-90.14], KS: [36.99,-102.05,40.00,-94.59],
  KY: [36.50,-89.57,39.15,-81.96], LA: [28.93,-94.04,33.02,-88.82],
  ME: [42.98,-71.08,47.46,-66.95], MD: [37.91,-79.49,39.72,-75.05],
  MA: [41.24,-73.51,42.89,-69.93], MI: [41.70,-90.42,48.26,-82.12],
  MN: [43.50,-97.24,49.38,-89.49], MS: [30.17,-91.66,34.99,-88.10],
  MO: [35.99,-95.77,40.61,-89.10], MT: [44.36,-116.05,49.00,-104.04],
  NE: [39.99,-104.05,43.00,-95.31], NV: [35.00,-120.00,42.00,-114.04],
  NH: [42.70,-72.56,45.31,-70.70], NJ: [38.93,-75.56,41.36,-73.89],
  NM: [31.33,-109.05,37.00,-103.00], NY: [40.50,-79.76,45.02,-71.86],
  NC: [33.84,-84.32,36.59,-75.46], ND: [45.94,-104.05,49.00,-96.55],
  OH: [38.40,-84.82,41.98,-80.52], OK: [33.62,-103.00,37.00,-94.43],
  OR: [41.99,-124.57,46.29,-116.46], PA: [39.72,-80.52,42.27,-74.69],
  RI: [41.15,-71.86,42.02,-71.12], SC: [32.03,-83.35,35.22,-78.54],
  SD: [42.48,-104.06,45.95,-96.44], TN: [34.98,-90.31,36.68,-81.65],
  TX: [25.84,-106.65,36.50,-93.51], UT: [36.99,-114.05,42.00,-109.04],
  VT: [42.73,-73.44,45.02,-71.47], VA: [36.54,-83.68,39.47,-75.24],
  WA: [45.54,-124.85,49.00,-116.92], WV: [37.20,-82.64,40.64,-77.72],
  WI: [42.49,-92.89,47.08,-86.25], WY: [40.99,-111.06,45.00,-104.05],
};

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

function buildOverpassQuery(bbox) {
  const [s, w, n, e] = bbox;
  return `[out:json][timeout:300];
(
  way["maxheight"](${s},${w},${n},${e});
  way["maxweight"](${s},${w},${n},${e});
  way["maxwidth"](${s},${w},${n},${e});
  way["maxlength"](${s},${w},${n},${e});
  way["maxaxleload"](${s},${w},${n},${e});
  way["hgv"="no"](${s},${w},${n},${e});
  way["hgv"="designated"](${s},${w},${n},${e});
);
out center tags;`;
}

function queryOverpass(query) {
  return new Promise((resolve, reject) => {
    const data = `data=${encodeURIComponent(query)}`;
    const options = {
      hostname: 'overpass-api.de',
      port: 443,
      path: '/api/interpreter',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch (e) { reject(new Error(`Parse error: ${body.substring(0, 200)}`)); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function parseOSMValue(val, unit = 'metric') {
  if (!val) return null;
  const num = parseFloat(val.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return null;
  if (val.includes('ft') || val.includes("'")) return num;
  if (val.includes('st') || val.includes('ton')) return num * 2240; // UK short tons to lbs
  if (val.includes('t')) return num * 2204.62; // metric tons to lbs
  if (unit === 'height' || unit === 'width' || unit === 'length') return +(num * 3.28084).toFixed(1); // m to ft
  if (unit === 'weight') return Math.round(num * 2204.62); // metric tons to lbs
  return num;
}

function osmElementToRestrictions(el) {
  const tags = el.tags || {};
  const lat = el.center ? el.center.lat : null;
  const lng = el.center ? el.center.lon : null;
  if (!lat || !lng) return [];

  const restrictions = [];
  const roadName = tags.name || tags.ref || null;

  if (tags.maxheight) {
    const h = parseOSMValue(tags.maxheight, 'height');
    if (h && h > 0 && h < 100) {
      restrictions.push({ lat, lng, osmWayId: el.id, roadName, restrictionType: 'bridge_height', maxHeightFt: h, source: 'osm', confidenceScore: 0.75, notes: `OSM maxheight=${tags.maxheight}` });
    }
  }
  if (tags.maxweight) {
    const w = parseOSMValue(tags.maxweight, 'weight');
    if (w && w > 0) {
      restrictions.push({ lat, lng, osmWayId: el.id, roadName, restrictionType: 'road_weight', maxWeightLbs: w, source: 'osm', confidenceScore: 0.7, notes: `OSM maxweight=${tags.maxweight}` });
    }
  }
  if (tags.maxwidth) {
    const w = parseOSMValue(tags.maxwidth, 'width');
    if (w && w > 0 && w < 100) {
      restrictions.push({ lat, lng, osmWayId: el.id, roadName, restrictionType: 'road_width', maxWidthFt: w, source: 'osm', confidenceScore: 0.7, notes: `OSM maxwidth=${tags.maxwidth}` });
    }
  }
  if (tags.hgv === 'no') {
    restrictions.push({ lat, lng, osmWayId: el.id, roadName, restrictionType: 'no_oversize', source: 'osm', confidenceScore: 0.8, notes: `OSM hgv=no` });
  }

  return restrictions;
}

function toSQL(r) {
  const esc = (v) => v ? `'${String(v).replace(/'/g, "''")}'` : 'NULL';
  return `INSERT INTO road_restrictions (lat, lng, osm_way_id, road_name, restriction_type, max_height_ft, max_width_ft, max_weight_lbs, source, confidence_score, notes)
VALUES (${r.lat}, ${r.lng}, ${r.osmWayId||'NULL'}, ${esc(r.roadName)}, '${r.restrictionType}', ${r.maxHeightFt||'NULL'}, ${r.maxWidthFt||'NULL'}, ${r.maxWeightLbs||'NULL'}, '${r.source}', ${r.confidenceScore}, ${esc(r.notes)})
ON CONFLICT DO NOTHING;`;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const args = process.argv.slice(2);
  const stateFlag = args.indexOf('--state');
  const targetStates = stateFlag >= 0 ? [args[stateFlag + 1]] : Object.keys(STATE_BOUNDS);

  const SQL_PATH = path.join(__dirname, '..', 'data', 'osm_import.sql');
  console.log('=== OSM Truck Restrictions → road_restrictions Import ===');
  console.log(`States: ${targetStates.join(', ')}`);

  const sqlStatements = [
    '-- OpenStreetMap Truck Restriction Import',
    `-- Generated: ${new Date().toISOString()}`,
    '-- Tags: maxheight, maxweight, maxwidth, maxlength, hgv',
    '', 'BEGIN;', '',
  ];

  let totalRestrictions = 0;

  for (const state of targetStates) {
    const bbox = STATE_BOUNDS[state];
    if (!bbox) { console.log(`  ⚠ No bbox for ${state}, skipping`); continue; }

    console.log(`  Querying ${state}...`);
    try {
      const query = buildOverpassQuery(bbox);
      const result = await queryOverpass(query);
      const elements = result.elements || [];

      let stateCount = 0;
      for (const el of elements) {
        const restrictions = osmElementToRestrictions(el);
        for (const r of restrictions) {
          r.stateCode = state;
          sqlStatements.push(toSQL(r));
          stateCount++;
        }
      }
      totalRestrictions += stateCount;
      console.log(`    ✅ ${state}: ${elements.length} ways → ${stateCount} restrictions`);
    } catch (err) {
      console.log(`    ❌ ${state}: ${err.message}`);
    }

    await sleep(2000); // Rate limit: 2s between queries
  }

  sqlStatements.push('', 'COMMIT;', `-- Total: ${totalRestrictions} restrictions`);
  fs.mkdirSync(path.dirname(SQL_PATH), { recursive: true });
  fs.writeFileSync(SQL_PATH, sqlStatements.join('\n'));

  console.log(`\n✅ Done! ${totalRestrictions} restrictions → ${SQL_PATH}`);
  console.log('To apply: psql $DATABASE_URL < data/osm_import.sql');
}

main().catch(console.error);
