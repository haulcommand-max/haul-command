/**
 * Data pipeline PHASE 2 — Fix corridors (array format) + promote GB/AU listings
 */
const { createClient } = require('@supabase/supabase-js');
const sb = createClient('https://hvjyfyzotqobfkakjozp.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY, {auth:{persistSession:false}});

function slug(name, cc) {
  let s = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (cc) s += '-' + cc.toLowerCase();
  return s;
}

async function insertCorridors() {
  console.log('═══ CORRIDORS (array fix) ═══');
  
  const existing = await sb.from('corridors').select('corridor_slug').limit(500);
  const existingSlugs = new Set(existing.data?.map(c => c.corridor_slug) || []);
  
  const corridors = [
    // US corridors
    { name:'Interstate 45', s:'i-45-us', cc:'US', states:['TX'], spine:'energy_spine', cargo:['oil_gas','petrochemical','reactor_vessels','LNG'], len:285, desc:'Houston-Dallas energy corridor. Primary route for Gulf Coast petrochemical and refinery equipment.' },
    { name:'Texas Triangle (I-35/I-45/I-10)', s:'texas-triangle-us', cc:'US', states:['TX'], spine:'energy_spine', cargo:['wind_turbine','oil_gas','construction','transformers','military'], len:850, desc:'Triangle connecting Dallas-Houston-San Antonio. Highest oversize permit volume in the US.' },
    { name:'Oklahoma Wind Belt', s:'oklahoma-wind-belt-us', cc:'US', states:['OK','KS','TX'], spine:'energy_spine', cargo:['wind_turbine','wind_blades','nacelles','tower_sections'], len:500, desc:'America\'s wind energy alley. Highest concentration of wind turbine transport in North America.' },
    { name:'Florida I-75 Corridor', s:'florida-i75-us', cc:'US', states:['FL'], spine:'port_spine', cargo:['port_drayage','construction','bridge_beams','cranes'], len:470, desc:'Tampa to Naples. Major construction and port drayage route in Florida.' },
    { name:'Georgia Ports Corridor (I-16/I-95)', s:'georgia-ports-us', cc:'US', states:['GA'], spine:'port_spine', cargo:['port_drayage','construction','military','heavy_industrial'], len:350, desc:'Savannah port to Atlanta. Key import/export route for oversize project cargo.' },
    { name:'Permian Basin Energy Corridor', s:'permian-basin-us', cc:'US', states:['TX','NM'], spine:'energy_spine', cargo:['oil_gas','drilling_rigs','frac_tanks','modular','pipeline'], len:300, desc:'America\'s busiest oilfield. Constant flow of drilling rigs, frac equipment, and pipeline.' },
    { name:'Appalachian Pipeline Corridor', s:'appalachian-pipeline-us', cc:'US', states:['WV','PA','OH','VA'], spine:'energy_spine', cargo:['pipeline','compressor_stations','drilling_rigs','natural_gas'], len:450, desc:'Marcellus/Utica shale gas pipeline construction corridor.' },
    { name:'US-2 Northern Tier', s:'us-2-northern-tier-us', cc:'US', states:['WA','ID','MT','ND','MN','WI','MI'], spine:'manufacturing_spine', cargo:['wind_energy','agricultural','mining','military'], len:2571, desc:'Northern border route. Remote areas with limited alternate routes for oversize loads.' },
    { name:'I-44 Wind Energy Corridor', s:'i-44-wind-corridor-us', cc:'US', states:['TX','OK','MO'], spine:'energy_spine', cargo:['wind_turbine','wind_blades','nacelles','tower_sections'], len:630, desc:'Major wind energy transport route across the southern plains.' },
    { name:'Columbia River Gorge (I-84)', s:'columbia-river-gorge-us', cc:'US', states:['OR','WA','ID'], spine:'energy_spine', cargo:['wind_turbine','hydroelectric','barge_transfer','agricultural'], len:370, desc:'Pacific Northwest energy corridor with height-restricted tunnels.' },
    { name:'Gulf Coast Petrochemical Alley', s:'gulf-coast-petrochem-us', cc:'US', states:['TX','LA','MS'], spine:'energy_spine', cargo:['reactor_vessels','heat_exchangers','columns','petrochemical'], len:350, desc:'Highest concentration of refineries and chemical plants. Constant superload movement.' },
    { name:'California Central Valley (CA-99)', s:'california-central-valley-us', cc:'US', states:['CA'], spine:'manufacturing_spine', cargo:['agricultural','solar','wind_energy','construction','transformers'], len:460, desc:'Agricultural heartland with growing solar/wind installation traffic.' },
    { name:'Great Plains Wind Corridor', s:'great-plains-wind-us', cc:'US', states:['TX','NM','CO','WY'], spine:'energy_spine', cargo:['wind_turbine','wind_blades','nacelles','solar'], len:900, desc:'High-altitude wind energy corridor spanning the Great Plains.' },
    // Asian corridors
    { name:'Golden Quadrilateral', s:'golden-quadrilateral-in', cc:'IN', states:['Delhi','Maharashtra','Tamil Nadu','West Bengal','Karnataka'], spine:'manufacturing_spine', cargo:['transformers','heavy_industrial','port_cargo','construction'], len:3625, desc:'India\'s premier national highway network connecting Delhi, Mumbai, Chennai, and Kolkata.' },
    { name:'Mumbai-Delhi Industrial Corridor', s:'mumbai-delhi-industrial-corridor-in', cc:'IN', states:['Maharashtra','Gujarat','Rajasthan','Haryana','Delhi'], spine:'manufacturing_spine', cargo:['heavy_machinery','transformers','wind_energy','modular'], len:1350, desc:'High-traffic freight corridor connecting India\'s financial capital to the national capital.' },
    { name:'Eastern Dedicated Freight Corridor', s:'eastern-freight-corridor-in', cc:'IN', states:['Punjab','Haryana','Uttar Pradesh','Bihar','West Bengal'], spine:'port_spine', cargo:['coal','steel','port_cargo','mining_equipment'], len:1318, desc:'Dedicated freight corridor for oversize loads reducing transit delays.' },
    { name:'Trans-Java Highway', s:'trans-java-highway-id', cc:'ID', states:['West Java','Central Java','East Java'], spine:'manufacturing_spine', cargo:['heavy_industrial','construction','port_cargo','transformers'], len:1167, desc:'Primary freight corridor across Java connecting Jakarta to Surabaya.' },
    { name:'Kalimantan Mining Corridor', s:'kalimantan-mining-corridor-id', cc:'ID', states:['East Kalimantan','South Kalimantan','Central Kalimantan'], spine:'mining_spine', cargo:['mining_equipment','haul_trucks','processing_equipment','coal'], len:800, desc:'Remote mining region requiring specialized heavy haul transport.' },
    { name:'Sumatra Cross-Island Highway', s:'sumatra-cross-island-id', cc:'ID', states:['North Sumatra','Riau','South Sumatra','Lampung'], spine:'energy_spine', cargo:['palm_oil_equipment','mining','construction','port_cargo'], len:2300, desc:'Trans-Sumatra freight route serving plantation, mining and port operations.' },
    { name:'Eastern Seaboard Industrial Corridor', s:'eastern-seaboard-th', cc:'TH', states:['Chonburi','Rayong','Chachoengsao'], spine:'manufacturing_spine', cargo:['automotive','petrochemical','heavy_industrial','port_cargo'], len:225, desc:'Thailand\'s primary industrial region with automotive and petrochemical plants.' },
    { name:'Bangkok-Korat Highway', s:'bangkok-korat-highway-th', cc:'TH', states:['Bangkok','Saraburi','Nakhon Ratchasima'], spine:'manufacturing_spine', cargo:['construction','wind_energy','agricultural','industrial'], len:260, desc:'Major freight route connecting Bangkok to northeastern Thailand.' },
    { name:'Southern Thailand Port Corridor', s:'southern-port-corridor-th', cc:'TH', states:['Surat Thani','Songkhla'], spine:'port_spine', cargo:['rubber','port_cargo','palm_oil_equipment','construction'], len:950, desc:'Corridor linking southern Thai ports and industrial facilities.' },
    { name:'North-South Expressway', s:'north-south-expressway-vn', cc:'VN', states:['Ho Chi Minh City','Binh Duong','Dong Nai','Da Nang','Hanoi'], spine:'manufacturing_spine', cargo:['heavy_industrial','construction','port_cargo','wind_energy'], len:1800, desc:'Vietnam\'s primary north-south freight corridor.' },
    { name:'Hanoi-Hai Phong Industrial Corridor', s:'hanoi-haiphong-corridor-vn', cc:'VN', states:['Hanoi','Hung Yen','Hai Duong','Hai Phong'], spine:'port_spine', cargo:['port_cargo','electronics','heavy_industrial','construction'], len:120, desc:'Key industrial and port freight corridor in northern Vietnam.' },
    { name:'Ho Chi Minh-Vung Tau Port Corridor', s:'hcmc-vungtau-corridor-vn', cc:'VN', states:['Ho Chi Minh City','Dong Nai','Ba Ria-Vung Tau'], spine:'energy_spine', cargo:['oil_gas','port_cargo','construction','heavy_machinery'], len:125, desc:'Critical energy sector corridor connecting HCMC to deep-water ports.' },
    { name:'Manila-Clark-Subic Corridor', s:'manila-clark-subic-ph', cc:'PH', states:['Metro Manila','Bulacan','Pampanga','Tarlac','Zambales'], spine:'manufacturing_spine', cargo:['construction','heavy_industrial','port_cargo','transformers'], len:120, desc:'Philippines\' primary industrial corridor connecting Manila to economic zones.' },
    { name:'SLEX-STAR Tollway Corridor', s:'slex-star-corridor-ph', cc:'PH', states:['Metro Manila','Laguna','Batangas'], spine:'manufacturing_spine', cargo:['automotive','electronics','construction','port_cargo'], len:105, desc:'Southern Luzon freight corridor handling oversize industrial cargo.' },
    { name:'Mindanao Energy Corridor', s:'mindanao-energy-corridor-ph', cc:'PH', states:['Davao del Sur','Cotabato','Bukidnon'], spine:'energy_spine', cargo:['energy_equipment','agricultural','construction','mining'], len:450, desc:'Southern Philippines corridor serving energy and agricultural transport.' },
  ];

  let inserted = 0;
  for (const c of corridors) {
    if (existingSlugs.has(c.s)) { console.log(`  ⏭️  ${c.name} (exists)`); continue; }
    const { error } = await sb.from('corridors').insert({
      name: c.name, corridor_slug: c.s, slug: c.s, country_code: c.cc, country: c.cc,
      states: c.states, spine_type: c.spine, primary_cargo: c.cargo,
      description: c.desc, length_miles: c.len, direction: 'bidirectional',
      indexable: true, corridor_health_status: 'active', confidence_score: 80, priority_score: 70,
    });
    if (error) console.log(`  ❌ ${c.name}: ${error.message.substring(0,100)}`);
    else { inserted++; console.log(`  ✅ ${c.name}`); }
  }
  console.log(`  Corridors inserted: ${inserted}`);
  return inserted;
}

async function promoteListings(cc) {
  console.log(`\n═══ Promote ${cc} — hc_places → directory_listings ═══`);
  
  const { data: places } = await sb.from('hc_places').select('*').eq('country_code', cc).eq('status', 'published');
  const { data: existing } = await sb.from('directory_listings').select('entity_id').eq('country_code', cc);
  const existingIds = new Set(existing?.map(e => e.entity_id) || []);
  const existingSlugs = new Set(existing?.map(e => e.slug) || []);
  
  const newOnes = (places || []).filter(p => !existingIds.has(p.id)).map((p, i) => ({
    entity_type: p.surface_category_key === 'port' ? 'port' : p.surface_category_key === 'oil_gas_facility' ? 'industrial_facility' : p.surface_category_key === 'rail_intermodal' ? 'terminal' : p.surface_category_key === 'truck_stop' ? 'truck_stop' : p.surface_category_key === 'trucker_hotel' ? 'hotel' : p.surface_category_key === 'crane_service' ? 'crane_service' : 'place',
    entity_id: p.id,
    name: p.name,
    slug: existingSlugs.has(p.slug) ? p.slug + '-' + (i+1) : p.slug,
    city: p.locality,
    city_slug: p.locality ? slug(p.locality) : null,
    region_code: p.admin1_code || '',
    country_code: cc,
    latitude: p.lat,
    longitude: p.lng,
    source: p.primary_source_type || 'places_sync',
    claim_status: 'unclaimed',
    rank_score: Math.round(p.demand_score || 50),
    is_visible: true,
    profile_completeness: Math.round((p.lat ? 20 : 0) + (p.lng ? 20 : 0) + (p.locality ? 15 : 0) + (p.admin1_code ? 10 : 0) + (p.name ? 15 : 0) + (p.phone ? 10 : 0) + (p.website ? 10 : 0)),
    data_source_type: 'automated_pipeline',
    data_freshness_score: 75,
    gdpr_applicability: cc === 'GB' ? 'full' : 'partial',
  }));

  if (!newOnes.length) { console.log(`  No new listings for ${cc}`); return 0; }

  let inserted = 0;
  for (let i = 0; i < newOnes.length; i += 50) {
    const batch = newOnes.slice(i, i + 50);
    const { error } = await sb.from('directory_listings').insert(batch);
    if (error) {
      console.log(`  Batch error: ${error.message.substring(0,120)}`);
      // Try one by one for this batch
      for (const item of batch) {
        const { error: singleErr } = await sb.from('directory_listings').insert(item);
        if (!singleErr) inserted++;
        else if (!singleErr.message.includes('duplicate')) {
          // console.log(`  skip: ${item.name}`);
        }
      }
    } else {
      inserted += batch.length;
    }
  }
  console.log(`  ${cc}: ${inserted} new listings (from ${places?.length} published places)`);
  return inserted;
}

async function seedAsianPlacesAndListings() {
  console.log('\n═══ Seed Asian hc_places + directory_listings ═══');
  const countries = [
    { cc: 'ID', ports: [
      { name:'Tanjung Priok Port', city:'Jakarta', state:'Jakarta', lat:-6.1,lng:106.883 },
      { name:'Port of Surabaya', city:'Surabaya', state:'East Java', lat:-7.2,lng:112.733 },
      { name:'Belawan Port', city:'Medan', state:'North Sumatra', lat:3.783,lng:98.7 },
      { name:'Balikpapan Port', city:'Balikpapan', state:'East Kalimantan', lat:-1.265,lng:116.831 },
    ]},
    { cc: 'TH', ports: [
      { name:'Laem Chabang Port', city:'Si Racha', state:'Chonburi', lat:13.083,lng:100.883 },
      { name:'Bangkok Port', city:'Bangkok', state:'Bangkok', lat:13.707,lng:100.567 },
      { name:'Map Ta Phut Port', city:'Rayong', state:'Rayong', lat:12.717,lng:101.15 },
    ]},
    { cc: 'VN', ports: [
      { name:'Cat Lai Port', city:'Ho Chi Minh City', state:'HCMC', lat:10.753,lng:106.758 },
      { name:'Hai Phong Port', city:'Hai Phong', state:'Hai Phong', lat:20.858,lng:106.684 },
      { name:'Da Nang Port', city:'Da Nang', state:'Da Nang', lat:16.070,lng:108.217 },
      { name:'Cai Mep International Terminal', city:'Vung Tau', state:'Ba Ria-Vung Tau', lat:10.499,lng:107.012 },
    ]},
    { cc: 'PH', ports: [
      { name:'Port of Manila', city:'Manila', state:'Metro Manila', lat:14.578,lng:120.964 },
      { name:'Subic Bay Freeport', city:'Olongapo', state:'Zambales', lat:14.8,lng:120.283 },
      { name:'Port of Cebu', city:'Cebu City', state:'Cebu', lat:10.316,lng:123.885 },
      { name:'Batangas International Port', city:'Batangas', state:'Batangas', lat:13.757,lng:121.048 },
    ]},
  ];

  let total = 0;
  for (const c of countries) {
    for (const p of c.ports) {
      const placeSlug = slug(p.name, c.cc);
      // hc_places
      await sb.from('hc_places').insert({
        name: p.name, slug: placeSlug, surface_category_key:'port', country_code: c.cc,
        admin1_code: p.state, locality: p.city, lat: p.lat, lng: p.lng,
        primary_source_type:'pipeline_seed', status:'published', source_confidence:85, demand_score:70,
      }).then(({error}) => { if (error && !error.message.includes('duplicate')) console.log(`  place err: ${error.message.substring(0,60)}`); });
      // directory_listings
      const { error } = await sb.from('directory_listings').insert({
        entity_type:'port', name: p.name, slug: placeSlug,
        city: p.city, country_code: c.cc, region_code: p.state,
        latitude: p.lat, longitude: p.lng, source:'pipeline_seed',
        claim_status:'unclaimed', rank_score:60, is_visible:true,
        profile_completeness:70, data_source_type:'automated_pipeline', data_freshness_score:75,
      });
      if (error && !error.message.includes('duplicate')) console.log(`  listing err: ${error.message.substring(0,60)}`);
      else if (!error) { total++; console.log(`  ✅ ${c.cc}: ${p.name}`); }
    }
  }
  console.log(`  Asian listings created: ${total}`);
}

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  DATA PIPELINE PHASE 2                   ║');
  console.log('╚══════════════════════════════════════════╝');
  
  await insertCorridors();
  await promoteListings('GB');
  await promoteListings('AU');
  await seedAsianPlacesAndListings();

  // Final counts
  console.log('\n═══ FINAL COUNTS ═══');
  const countries = ['US','CA','AU','GB','IN','ID','TH','VN','PH','DE','NL','NZ','ZA','AE','BR'];
  for (const cc of countries) {
    const [s, p, l, c] = await Promise.all([
      sb.from('surfaces').select('*',{count:'exact',head:true}).eq('country_code',cc),
      sb.from('hc_places').select('*',{count:'exact',head:true}).eq('country_code',cc),
      sb.from('directory_listings').select('*',{count:'exact',head:true}).eq('country_code',cc),
      sb.from('corridors').select('*',{count:'exact',head:true}).eq('country_code',cc),
    ]);
    console.log(`${cc}: srf=${s.count||0} plc=${p.count||0} lst=${l.count||0} cor=${c.count||0}`);
  }
  const { count: tc } = await sb.from('corridors').select('*',{count:'exact',head:true});
  const { count: ts } = await sb.from('surfaces').select('*',{count:'exact',head:true});
  const { count: tl } = await sb.from('directory_listings').select('*',{count:'exact',head:true});
  const { count: tp } = await sb.from('hc_places').select('*',{count:'exact',head:true});
  console.log(`\nGLOBAL: ${tc} corridors | ${ts} surfaces | ${tp} places | ${tl} listings`);
}

main().catch(console.error);
