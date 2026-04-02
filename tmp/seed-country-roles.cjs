const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function seed() {
  const c = new Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL });
  await c.connect();
  console.log('Connected.\n');

  // Get actual canonical role keys
  const roles = await c.query('SELECT id, role_key, role_name FROM public.canonical_roles ORDER BY role_key');
  console.log('Canonical roles in DB:');
  const roleMap = {};
  roles.rows.forEach(r => { roleMap[r.role_key] = r.id; console.log(`  ${r.role_key} → ${r.role_name}`); });

  // Get existing country_roles count
  const existing = await c.query('SELECT count(*) as cnt FROM public.country_roles');
  console.log(`\nExisting country_roles: ${existing.rows[0].cnt}`);

  // Get countries
  const countries = await c.query('SELECT id, code FROM public.countries WHERE code IS NOT NULL');
  console.log(`Countries: ${countries.rows.length}`);

  // Use ALL canonical roles - map each to localized defaults
  const ROLE_TITLES = {
    pilot_car_operator: { local: 'Pilot Car Operator', commercial: 'Pilot Car / Escort Vehicle Services' },
    escort_vehicle_operator: { local: 'Escort Vehicle Operator', commercial: 'Escort Vehicle Services' },
    high_pole_escort: { local: 'High Pole Escort', commercial: 'High Pole / Height Detection Escort' },
    route_surveyor: { local: 'Route Surveyor', commercial: 'Heavy Haul Route Survey Services' },
    permit_service: { local: 'Permit Service', commercial: 'Oversize Load Permit Services' },
    police_escort_liaison: { local: 'Police Escort Liaison', commercial: 'Law Enforcement Escort Coordination' },
    traffic_control_crew: { local: 'Traffic Control Crew', commercial: 'Traffic Control & Flagging Services' },
    bucket_truck_line_lift_crew: { local: 'Bucket Truck / Line Lift Crew', commercial: 'Utility Line Lift Services' },
    staging_yard_operator: { local: 'Staging Yard Operator', commercial: 'Staging & Layover Yard Services' },
    secure_parking_operator: { local: 'Secure Parking Operator', commercial: 'Secure Overnight Parking' },
    recovery_tow_specialist: { local: 'Recovery / Tow Specialist', commercial: 'Heavy Recovery & Towing' },
    customs_broker: { local: 'Customs Broker', commercial: 'Cross-Border Customs Brokerage' },
    project_cargo_broker: { local: 'Project Cargo Broker', commercial: 'Project Cargo & Heavy Haul Brokerage' },
    heavy_haul_carrier: { local: 'Heavy Haul Carrier', commercial: 'Over-Dimensional Freight Carrier' },
    utility_coordination_manager: { local: 'Utility Coordination Manager', commercial: 'Utility Clearance & Coordination' },
    bf3_escort: { local: 'BF3 Escort', commercial: 'BF3 Certified Escort' },
    bf4_escort: { local: 'BF4 Escort', commercial: 'BF4 Certified Escort' },
    scorta_tecnica: { local: 'Scorta Tecnica', commercial: 'Technical Escort (IT/EU)' },
    vehicle_pilote: { local: 'Véhicule Pilote', commercial: 'Pilot Vehicle (FR/BE/CH)' },
    odc_coordinator: { local: 'ODC Coordinator', commercial: 'Over-Dimensional Cargo Coordinator' },
  };

  // Country-specific overrides for key markets
  const OVERRIDES = {
    GB: { pilot_car_operator: { local: 'Escort Vehicle Operator', commercial: 'Abnormal Load Escort Services' },
           heavy_haul_carrier: { local: 'Abnormal Load Haulier', commercial: 'Heavy Haulage Specialist' } },
    AU: { pilot_car_operator: { local: 'Pilot Vehicle Operator', commercial: 'Escort Vehicle / Pilot Services' },
           heavy_haul_carrier: { local: 'Heavy Haulage Operator', commercial: 'OSOM Transport Services' } },
    DE: { pilot_car_operator: { local: 'Begleitfahrzeug-Führer', commercial: 'Schwertransport-Begleitung' },
           heavy_haul_carrier: { local: 'Schwertransport-Unternehmen', commercial: 'Großraum- und Schwertransporte' } },
    FR: { pilot_car_operator: { local: 'Conducteur véhicule pilote', commercial: 'Convoi exceptionnel - Pilote' },
           heavy_haul_carrier: { local: 'Transporteur exceptionnel', commercial: 'Convoi exceptionnel' } },
    BR: { pilot_car_operator: { local: 'Operador de carro batedor', commercial: 'Escolta de cargas especiais' },
           heavy_haul_carrier: { local: 'Transportadora pesada', commercial: 'Cargas excepcionais e indivisíveis' } },
    JP: { pilot_car_operator: { local: '誘導車オペレーター', commercial: '特殊車両誘導サービス' } },
    KR: { pilot_car_operator: { local: '유도차량 운전자', commercial: '특수차량 유도 서비스' } },
    SA: { pilot_car_operator: { local: 'مشغل سيارة مرافقة', commercial: 'خدمات مرافقة النقل الثقيل' } },
    AE: { pilot_car_operator: { local: 'مشغل مركبة مرافقة', commercial: 'خدمات مرافقة الحمولات الكبيرة' } },
    NL: { pilot_car_operator: { local: 'Begeleidingsvoertuig Bestuurder', commercial: 'Exceptioneel transport begeleiding' } },
    ES: { pilot_car_operator: { local: 'Operador de vehículo piloto', commercial: 'Escolta de transportes especiales' } },
    IT: { pilot_car_operator: { local: 'Operatore scorta tecnica', commercial: 'Scorta trasporti eccezionali' } },
    ZA: { pilot_car_operator: { local: 'Pilot Vehicle Operator', commercial: 'Abnormal Load Escort Services' } },
    IN: { pilot_car_operator: { local: 'Pilot Vehicle Operator', commercial: 'ODC Escort Services' } },
    MX: { pilot_car_operator: { local: 'Operador de vehículo piloto', commercial: 'Escolta de carga sobredimensionada' } },
  };

  let inserted = 0, skipped = 0;

  for (const country of countries.rows) {
    for (const [roleKey, roleId] of Object.entries(roleMap)) {
      const override = OVERRIDES[country.code]?.[roleKey];
      const defaults = ROLE_TITLES[roleKey] || { local: roleKey, commercial: roleKey };
      const titles = override || defaults;
      const english = ROLE_TITLES[roleKey]?.local || roleKey;

      try {
        await c.query(
          `INSERT INTO public.country_roles (country_id, canonical_role_id, local_title, commercial_title, english_fallback)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT DO NOTHING`,
          [country.id, roleId, titles.local, titles.commercial, english]
        );
        inserted++;
      } catch (e) {
        if (!e.message.includes('duplicate')) {
          console.error(`  ❌ ${country.code}/${roleKey}: ${e.message.split('\n')[0]}`);
        }
        skipped++;
      }
    }
  }

  console.log(`\nInserted: ${inserted}`);
  console.log(`Skipped: ${skipped}`);

  const v = await c.query(`
    SELECT count(*) as total,
      count(DISTINCT country_id) as countries,
      count(DISTINCT canonical_role_id) as roles
    FROM public.country_roles
  `);
  const vr = v.rows[0];
  console.log(`\n${'═'.repeat(50)}`);
  console.log(`COUNTRY_ROLES FINAL: ${vr.total} mappings`);
  console.log(`Countries: ${vr.countries}/120`);
  console.log(`Roles used: ${vr.roles}/20`);
  console.log(`${'═'.repeat(50)}`);

  const sample = await c.query(`
    SELECT c.code, cr2.role_key, crr.local_title
    FROM public.country_roles crr
    JOIN public.countries c ON c.id = crr.country_id
    JOIN public.canonical_roles cr2 ON cr2.id = crr.canonical_role_id
    WHERE c.code IN ('US','GB','DE','JP','BR','SA')
    AND cr2.role_key = 'pilot_car_operator'
    ORDER BY c.code
  `);
  console.log('\nPilot car titles by market:');
  sample.rows.forEach(r => console.log(`  ${r.code}: "${r.local_title}"`));

  await c.end();
}
seed().catch(e => { console.error(e); process.exit(1); });
