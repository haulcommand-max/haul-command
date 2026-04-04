const pg = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL, ssl: { rejectUnauthorized: false } });
client.connect().then(async () => {
  try {
    const q = `
      INSERT INTO hc_training_courses 
        (slug, title, description, tier, price_cents, duration_hours, delivery_method, hc_trust_score_boost, country_codes, language_codes, tags, is_featured, sort_order, is_active)
      VALUES
        ('pilot-car-fundamentals','Pilot Car Fundamentals','What pilot cars do, radio protocol, bridge strikes, equipment basics.','free',0,1,'self_paced',0,'{US,CA,AU,GB}','{en}','{fundamentals,free,beginner}',false,1,true),
        ('how-to-read-permits','How to Read an Oversize Permit','Decode permit conditions, routing instructions, and escort specs.','free',0,0.5,'self_paced',0,'{US}','{en}','{permits,free,compliance}',false,2,true),
        ('radio-protocol-101','Radio Protocol 101','CB radio etiquette, channel selection, emergency calls for escort convoys.','free',0,0.5,'self_paced',0,'{US,CA}','{en}','{radio,free,communication}',false,3,true),
        ('hc-certified-foundation','HC Certified — Heavy Haul Safety Fundamentals','Heavy haul safety, defensive driving, documentation, equipment, communication, route survey, first aid. Available in 5 languages.','tier1',4900,4,'self_paced',10,'{US,CA,AU,GB,DE,ZA,NZ}','{en,es,de,fr,pt}','{safety,global,certificate,foundation}',true,10,true),
        ('washington-state-pevo','Washington State PEVO Certification','8-hour live online Washington State PEVO certification. Reciprocity in TX, FL, GA, CO, AZ, MN, OK, NC, VA, PA, UT, KS.','tier2_us',14900,8,'live_online',40,'{US}','{en}','{PEVO,WA,reciprocity,certification}',true,20,true),
        ('australia-national-pilot-vehicle','HC Australia National Pilot Vehicle Certification','First pan-Australia pilot vehicle certification. NHVR compliance, all 8 states and territories.','tier2_intl',24900,8,'live_online',50,'{AU}','{en}','{NHVR,Australia,certification}',true,30,true),
        ('uk-halo-escort-certification','HALO — UK Abnormal Load Escort Certification','UK first formal escort operator cert. National Highways Code of Practice, STGO Cat 1/2/3.','tier2_intl',19900,6,'live_online',45,'{GB}','{en}','{UK,HALO,abnormal-load}',true,31,true),
        ('canada-escort-certification','HC Canada Escort Operator Certification','Pan-Canada escort certification covering all 10 provinces and 3 territories.','tier2_intl',17900,6,'live_online',40,'{CA}','{en,fr}','{Canada,provincial,certification}',true,32,true),
        ('high-pole-mastery','High Pole Mastery Certification','Advanced height pole operations, electrical hazard clearance, equipment selection.','tier3_specialist',29500,6,'live_online',75,'{US,CA,AU}','{en}','{high-pole,specialist,electrical}',false,40,true),
        ('wind-turbine-escort-specialist','Wind Turbine Component Transport Specialist','Blade, nacelle, and tower transport escort. Route survey for energy corridors.','tier3_specialist',34500,8,'live_online',75,'{US,CA,AU,DE,GB}','{en}','{wind-energy,specialist,renewable}',false,41,true),
        ('twic-port-access-certification','TWIC Port Access Escort Certification','Maritime security protocols, TWIC credential validation, port gate procedures.','tier3_specialist',29500,5,'self_paced',75,'{US}','{en}','{TWIC,port,maritime,hazmat}',false,42,true),
        ('hc-master-operator','HC Master Operator Certification','The highest HC certification. Gold badge. Priority directory placement. 15% rate premium visibility to brokers.','tier4_master',79500,12,'live_online',100,'{US,AU,GB,CA,DE,AE,BR,ZA,NZ}','{en}','{master,elite,gold-badge,premium}',true,50,true)
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        tier = EXCLUDED.tier,
        price_cents = EXCLUDED.price_cents,
        duration_hours = EXCLUDED.duration_hours,
        delivery_method = EXCLUDED.delivery_method,
        hc_trust_score_boost = EXCLUDED.hc_trust_score_boost,
        country_codes = EXCLUDED.country_codes,
        language_codes = EXCLUDED.language_codes,
        tags = EXCLUDED.tags,
        is_featured = EXCLUDED.is_featured,
        sort_order = EXCLUDED.sort_order,
        is_active = EXCLUDED.is_active
      RETURNING slug
    `;
    const res = await client.query(q);
    console.log('Seeded Courses:', res.rows.map(r => r.slug));
  } catch (e) {
    console.error('Seed Error:', e.message);
  }
  await client.end();
}).catch(e => { console.error(e.message); process.exit(1); });
