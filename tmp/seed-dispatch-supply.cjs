const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

/**
 * Seed dispatch_supply with test operators for Gold-tier countries.
 * Creates 5 test operators per gold country × 3 key roles = 150 supply entries.
 */

// Gold tier countries
const GOLD = ['US','CA','AU','GB','NZ','ZA','DE','NL','AE','BR'];

// Key roles to seed supply for
const KEY_ROLES = ['pilot_car_operator', 'heavy_haul_carrier', 'route_surveyor'];

// Test operator data per country
const TEST_OPERATORS = {
  US: [
    { name: 'Texas Heavy Escort LLC', lat: 32.7767, lng: -96.7970 },
    { name: 'Pacific Coast Pilot Cars', lat: 34.0522, lng: -118.2437 },
    { name: 'Midwest Oversize Escorts', lat: 41.8781, lng: -87.6298 },
    { name: 'Florida Wide Load Services', lat: 25.7617, lng: -80.1918 },
    { name: 'Northeast Escort Group', lat: 40.7128, lng: -74.0060 },
  ],
  CA: [
    { name: 'Alberta Heavy Haul Escorts', lat: 51.0447, lng: -114.0719 },
    { name: 'Ontario Pilot Car Services', lat: 43.6532, lng: -79.3832 },
    { name: 'BC Oversize Load Pilots', lat: 49.2827, lng: -123.1207 },
    { name: 'Saskatchewan Transport Escorts', lat: 50.4452, lng: -104.6189 },
    { name: 'Quebec Convoi Exceptionnel', lat: 45.5017, lng: -73.5673 },
  ],
  AU: [
    { name: 'NSW Pilot Vehicle Services', lat: -33.8688, lng: 151.2093 },
    { name: 'Queensland OSOM Escorts', lat: -27.4698, lng: 153.0251 },
    { name: 'WA Heavy Haulage Pilots', lat: -31.9505, lng: 115.8605 },
    { name: 'Victoria Escort Vehicles', lat: -37.8136, lng: 144.9631 },
    { name: 'NT Wide Load Escorts', lat: -12.4634, lng: 130.8456 },
  ],
  GB: [
    { name: 'M1 Abnormal Load Escorts', lat: 51.5074, lng: -0.1278 },
    { name: 'Scottish Heavy Haulage', lat: 55.9533, lng: -3.1883 },
    { name: 'Midlands Escort Services', lat: 52.4862, lng: -1.8904 },
    { name: 'Welsh Transport Escorts', lat: 51.4816, lng: -3.1791 },
    { name: 'North England Wide Loads', lat: 53.4808, lng: -2.2426 },
  ],
  NZ: [
    { name: 'Auckland Pilot Vehicles', lat: -36.8485, lng: 174.7633 },
    { name: 'Canterbury Over-dimension', lat: -43.5321, lng: 172.6362 },
    { name: 'Wellington Escort Services', lat: -41.2865, lng: 174.7762 },
    { name: 'Waikato Heavy Transport', lat: -37.7870, lng: 175.2793 },
    { name: 'Otago Pilot Car Services', lat: -45.8788, lng: 170.5028 },
  ],
  ZA: [
    { name: 'Gauteng Abnormal Load Escorts', lat: -26.2041, lng: 28.0473 },
    { name: 'Cape Town Heavy Haulage', lat: -33.9249, lng: 18.4241 },
    { name: 'Durban Pilot Vehicles', lat: -29.8587, lng: 31.0218 },
    { name: 'Free State Escort Services', lat: -29.0852, lng: 26.1596 },
    { name: 'Mpumalanga Transport Pilots', lat: -25.4753, lng: 30.9694 },
  ],
  DE: [
    { name: 'Bayern Begleitfahrzeuge GmbH', lat: 48.1351, lng: 11.5820 },
    { name: 'NRW Schwertransport-Begleitung', lat: 51.2277, lng: 6.7735 },
    { name: 'Hamburg Schwerlast-Escort', lat: 53.5511, lng: 9.9937 },
    { name: 'Sachsen Begleitservice', lat: 51.3397, lng: 12.3731 },
    { name: 'Baden-Württemberg BF3/BF4', lat: 48.7758, lng: 9.1829 },
  ],
  NL: [
    { name: 'Rotterdam Exceptioneel Transport', lat: 51.9244, lng: 4.4777 },
    { name: 'Amsterdam Begeleiding', lat: 52.3676, lng: 4.9041 },
    { name: 'Eindhoven Zwaar Transport', lat: 51.4416, lng: 5.4697 },
    { name: 'Utrecht Begeleidingsvoertuig', lat: 52.0907, lng: 5.1214 },
    { name: 'Groningen Transport Escort', lat: 53.2194, lng: 6.5665 },
  ],
  AE: [
    { name: 'Dubai Heavy Load Escorts', lat: 25.2048, lng: 55.2708 },
    { name: 'Abu Dhabi Transport Pilots', lat: 24.4539, lng: 54.3773 },
    { name: 'Sharjah Escort Services', lat: 25.3573, lng: 55.4033 },
    { name: 'Jebel Ali Project Cargo', lat: 25.0077, lng: 55.0830 },
    { name: 'RAK Industrial Escorts', lat: 25.7895, lng: 55.9432 },
  ],
  BR: [
    { name: 'São Paulo Cargas Especiais', lat: -23.5505, lng: -46.6333 },
    { name: 'Rio Escolta de Cargas', lat: -22.9068, lng: -43.1729 },
    { name: 'Minas Gerais Transporte Pesado', lat: -19.9167, lng: -43.9345 },
    { name: 'Paraná Carro Batedor', lat: -25.4284, lng: -49.2733 },
    { name: 'Bahia Escolta Rodoviária', lat: -12.9714, lng: -38.5124 },
  ],
};

async function seed() {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL });
  await c.connect();
  console.log('Connected. Seeding dispatch_supply for Gold-tier countries...\n');

  // Get country IDs
  const { rows: countries } = await c.query(
    `SELECT id, code FROM public.countries WHERE code = ANY($1)`,
    [GOLD]
  );
  const countryMap = {};
  countries.forEach(co => { countryMap[co.code] = co.id; });
  console.log(`Countries found: ${Object.keys(countryMap).join(', ')}`);

  // Get role IDs for key roles
  const { rows: roles } = await c.query(
    `SELECT id, role_key FROM public.canonical_roles WHERE role_key = ANY($1)`,
    [KEY_ROLES]
  );
  const roleMap = {};
  roles.forEach(r => { roleMap[r.role_key] = r.id; });
  console.log(`Roles found: ${Object.keys(roleMap).join(', ')}`);

  // Get country_role IDs
  const { rows: countryRoles } = await c.query(
    `SELECT cr.id, c.code as country_code, r.role_key
     FROM public.country_roles cr
     JOIN public.countries c ON c.id = cr.country_id
     JOIN public.canonical_roles r ON r.id = cr.canonical_role_id
     WHERE c.code = ANY($1) AND r.role_key = ANY($2)`,
    [GOLD, KEY_ROLES]
  );
  // Build lookup: countryCode_roleKey -> country_role_id
  const crMap = {};
  countryRoles.forEach(cr => { crMap[`${cr.country_code}_${cr.role_key}`] = cr.id; });
  console.log(`Country_roles mapped: ${countryRoles.length}`);

  let inserted = 0;
  let entityInserted = 0;

  for (const countryCode of GOLD) {
    const operators = TEST_OPERATORS[countryCode] || [];
    const countryId = countryMap[countryCode];
    if (!countryId) { console.warn(`  ⚠ No country_id for ${countryCode}`); continue; }

    for (const op of operators) {
      // Create a market_entity for this test operator
      let entityId;
      try {
        const { rows } = await c.query(
          `INSERT INTO public.market_entities (display_name, entity_type, country_id, hq_lat, hq_lng, claim_status)
           VALUES ($1, $2, $3, $4, $5, 'unclaimed')
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [op.name, 'company', countryId, op.lat, op.lng]
        );
        if (rows.length > 0) {
          entityId = rows[0].id;
          entityInserted++;
        } else {
          // Already exists, find it
          const { rows: existing } = await c.query(
            `SELECT id FROM public.market_entities WHERE display_name = $1 LIMIT 1`,
            [op.name]
          );
          entityId = existing[0]?.id;
        }
      } catch (e) {
        console.error(`  ❌ Entity ${op.name}: ${e.message.split('\n')[0]}`);
        continue;
      }

      if (!entityId) continue;

      // Create dispatch_supply entries for each key role
      for (const roleKey of KEY_ROLES) {
        const crId = crMap[`${countryCode}_${roleKey}`];
        if (!crId) continue;

        const statuses = ['available', 'available', 'available', 'busy', 'en_route'];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        try {
          await c.query(
            `INSERT INTO public.dispatch_supply 
              (entity_id, country_id, country_role_id, availability_status,
               accepts_urgent, accepts_night_moves, accepts_cross_border,
               home_lat, home_lng, last_seen_at, trust_score_snapshot, priority_score)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, $11)
             ON CONFLICT DO NOTHING`,
            [
              entityId, countryId, crId, status,
              Math.random() > 0.3, // 70% accept urgent
              Math.random() > 0.5, // 50% accept night
              Math.random() > 0.6, // 40% accept cross-border
              op.lat + (Math.random() - 0.5) * 0.2,
              op.lng + (Math.random() - 0.5) * 0.2,
              Math.round(60 + Math.random() * 40), // trust: 60-100
              Math.round(30 + Math.random() * 70),  // priority: 30-100
            ]
          );
          inserted++;
        } catch (e) {
          console.error(`  ❌ Supply ${countryCode}/${roleKey}: ${e.message.split('\n')[0]}`);
        }
      }
    }
  }

  console.log(`\nEntities created: ${entityInserted}`);
  console.log(`Supply entries created: ${inserted}`);

  // Verify
  const { rows: stats } = await c.query(`
    SELECT 
      count(*) as total,
      count(DISTINCT entity_id) as entities,
      count(*) FILTER (WHERE availability_status = 'available') as available,
      count(*) FILTER (WHERE accepts_urgent = true) as urgent_capable
    FROM public.dispatch_supply
  `);
  const s = stats[0];
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`DISPATCH_SUPPLY — FINAL STATE`);
  console.log(`${'═'.repeat(50)}`);
  console.log(`Total: ${s.total}`);
  console.log(`Entities: ${s.entities}`);
  console.log(`Available: ${s.available}`);
  console.log(`Urgent-capable: ${s.urgent_capable}`);

  // Per-country breakdown
  const { rows: byCountry } = await c.query(`
    SELECT c.code, count(*) as cnt,
      count(*) FILTER (WHERE ds.availability_status = 'available') as avail
    FROM public.dispatch_supply ds
    JOIN public.countries c ON c.id = ds.country_id
    GROUP BY c.code ORDER BY c.code
  `);
  console.log('\nBy country:');
  byCountry.forEach(r => console.log(`  ${r.code}: ${r.cnt} (${r.avail} available)`));

  await c.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
