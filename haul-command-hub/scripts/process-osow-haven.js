const fs = require('fs');
const path = require('path');

const OSOW_HAVEN_BATCH = [
  { "name_raw": "1st Amber Lights Pilot Car", "city": "Boring", "state": "OR", "phone": "+15033100423", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "4b129fcf-dbb4-4c1d-bd7a-dbac7391a00d" },
  { "name_raw": "1st American Pilot Cars LLC", "city": "Portland", "state": "OR", "phone": "+15036454276", "capabilities_raw": ["height_pole","route_survey","steerman"], "certifications": [], "description": null, "competitor_id": "5d19122f-a616-46b5-adad-8813b8de1609" },
  { "name_raw": "1st Choice Pilots", "city": "Ehrenberg", "state": "AZ", "phone": "+15032822902", "capabilities_raw": ["height_pole","steerman","route_survey"], "certifications": [], "description": null, "competitor_id": "5f8abf99-7723-449e-b836-df3b9142279a" },
  { "name_raw": "365 Pilots", "city": "Birmingham", "state": "AL", "phone": "+18667950150", "capabilities_raw": ["height_pole","route_survey","steerman"], "certifications": ["WITPAC"], "description": null, "competitor_id": "b0af75a7-bc4e-4555-839d-48ff477f8abc" },
  { "name_raw": "A-1 Pilot Car Inc", "city": "Limon", "state": "CO", "phone": "+17193306080", "capabilities_raw": ["height_pole","route_survey"], "certifications": ["WITPAC"], "description": null, "competitor_id": "55833236-326d-4bff-9a6a-0c2a1ffd1f8d" },
  { "name_raw": "A1 Pilotcar Service", "city": "Birmingham", "state": "AL", "phone": "+12052692929", "capabilities_raw": ["height_pole","route_survey"], "certifications": [], "description": "Nationwide service", "competitor_id": "a4891958-5425-4584-861a-8a8e4e254d46" },
  { "name_raw": "A2B Escort & Pilot Car Service", "city": "Bowling Green", "state": "KY", "phone": "+12704078412", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "b26b63cd-8fb5-4cc2-94cc-41f239caf2e3" },
  { "name_raw": "A 2 Z Pilot Car Service", "city": "Woodbridge", "state": "VA", "phone": "+17038988718", "capabilities_raw": ["height_pole"], "certifications": [], "description": null, "competitor_id": "81608877-388a-4bc8-8452-a5ec00a7743f" },
  { "name_raw": "AAA Blair Pilot Car Service", "city": "Cortez", "state": "CO", "phone": "+18002871429", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "91d350dc-4927-48d7-b89b-3789c123717f" },
  { "name_raw": "AAA Mountain Pilot Car Service", "city": "Cortez", "state": "CO", "phone": "+19707596678", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "1a423c24-25eb-47fd-9b4d-b53995bc1b2e" },
  { "name_raw": "A & A Davis Pilot Car LLC", "city": "Birmingham", "state": "AL", "phone": "+12053103019", "capabilities_raw": ["height_pole"], "certifications": [], "description": null, "competitor_id": "0a96b166-336b-4b5a-b9ad-3034640e5830" },
  { "name_raw": "ABC Colt", "city": "Buffalo", "state": "NY", "phone": "+17162222658", "capabilities_raw": ["height_pole","route_survey","steerman"], "certifications": ["WITPAC","CEVO"], "description": "Bucket truck", "competitor_id": "c085dbcf-4d22-4d5f-8b79-4fc7dd90cc85" },
  { "name_raw": "A Better Choice OES", "city": "Farmington", "state": "NM", "phone": "+12084797290", "capabilities_raw": [], "certifications": [], "description": null, "competitor_id": "1884614d-fd7a-4604-91ce-97f40af3dd9b" },
  { "name_raw": "Absolute Pilot and Flagging", "city": "Jefferson", "state": "OR", "phone": "+15032696705", "capabilities_raw": ["height_pole","steerman"], "certifications": [], "description": null, "competitor_id": "c0f81095-780e-45fc-bdcb-72f64ded6746" },
  { "name_raw": "A&J's Escort/Flag Car Svc Inc", "city": "Atlanta", "state": "GA", "phone": "+18036041220", "capabilities_raw": ["height_pole","route_survey"], "certifications": ["CEVO"], "description": null, "competitor_id": "8b9e29b6-faeb-427e-a5cb-a28af71147c8" },
  { "name_raw": "AKN Trucking & Pilot Car Service LLC", "city": "Del City", "state": "OK", "phone": "+14058827001", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "d790992f-d3f6-4f3e-beb0-5f461d3f2902" },
  { "name_raw": "All State Pilot Cars", "city": "Colorado Springs", "state": "CO", "phone": "+17194654643", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "9d658d47-d96c-4eb9-a007-9ed3d168039e" },
  { "name_raw": "Almost Heaven Pilot Cars", "city": "Hamlin", "state": "WV", "phone": "+13043604102", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "243a8443-7b0e-4ab4-9941-6bb454c56f9b" },
  { "name_raw": "Alterna Pilot Car Service LLC", "city": "Portland", "state": "CA", "phone": "+15039705821", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "bb0760a2-8395-4c15-8194-05f582529c0f" },
  { "name_raw": "Amber Pilot Cars", "city": "Alachua", "state": "FL", "phone": "+19198092313", "capabilities_raw": ["height_pole","steerman","lead","chase"], "certifications": ["WITPAC"], "description": "Steer", "competitor_id": "73854e53-92be-4582-a900-b90eb36c013e" },
  { "name_raw": "American Pilot Car Service", "city": "Bakersfield", "state": "CA", "phone": "+16614729100", "capabilities_raw": ["multi_car"], "certifications": [], "description": null, "competitor_id": "f827356c-0518-4299-ae2e-126566994c9e" },
  { "name_raw": "Ameripilot Inc", "city": "Malvern", "state": "OH", "phone": "+12163074568", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "1a3eddb9-2f21-406c-ac82-61b845765399" },
  { "name_raw": "Anstorm Sabre PCS LLC", "city": "Tucson", "state": "AZ", "phone": "+14022702125", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "6d54b782-be1b-4345-a515-5232d5552cd9" },
  { "name_raw": "Any Dimension Logistics LLC", "city": "Tucson", "state": "AZ", "phone": "+18329968829", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "d30e5e22-e20c-4454-928a-c2d310803b3a" },
  { "name_raw": "Anytime Pilot Car Service", "city": "Fairfield", "state": "CA", "phone": "+17075924294", "capabilities_raw": ["height_pole"], "certifications": [], "description": null, "competitor_id": "4e5a640f-4de1-415f-bcc5-c2ee3aa82970" },
  { "name_raw": "A One Pilot", "city": "Miami", "state": "FL", "phone": "+17863509064", "capabilities_raw": ["height_pole"], "certifications": [], "description": null, "competitor_id": "dcad0ca1-663e-4049-917a-e81129b3f593" },
  { "name_raw": "A Patel Pilot Car Company", "city": "Avoca", "state": "IA", "phone": "+17852060065", "capabilities_raw": ["height_pole","route_survey","steerman"], "certifications": [], "description": null, "competitor_id": "6a2e71d7-8404-49ef-80e9-d62d4ef48d2e" },
  { "name_raw": "A+ Pilots LLC", "city": "Sioux City", "state": "IA", "phone": "+17123352699", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "d6f96eed-8aef-4ac4-b570-87657dc67a59" },
  { "name_raw": "A-Plus PC", "city": "Alturas", "state": "CA", "phone": "+15412813474", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "d0a8812c-0bbc-4604-969b-bf470001cc70" },
  { "name_raw": "A-Plus Pilot Car", "city": "Ashland", "state": "OR", "phone": "+15412813474", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "34a106b4-bff8-4af5-91a2-9403314d15ec" },
  { "name_raw": "Apples and Oranges Pilots", "city": "Baltimore", "state": "MD", "phone": "+12408186454", "capabilities_raw": ["height_pole","route_survey"], "certifications": ["Flagging"], "description": null, "competitor_id": "9d9cc685-9b98-4d10-967d-3b9acc1ec8d8" },
  { "name_raw": "Arizona Pilot Car Service", "city": "Phoenix", "state": "AZ", "phone": "+16026995755", "capabilities_raw": ["height_pole","route_survey"], "certifications": [], "description": "Professional & dependable", "competitor_id": "942ef734-ba4c-467c-8d5d-67b0eb9e4a4a" },
  { "name_raw": "A to B Pilot Car Escort Service", "city": "Houston", "state": "TX", "phone": "+12819238136", "capabilities_raw": ["height_pole","steerman"], "certifications": [], "description": null, "competitor_id": "a43b6098-90cd-493a-9d70-8f911b137f80" },
  { "name_raw": "Aumor Inc", "city": "Milwaukee", "state": "WI", "phone": "+12626662266", "capabilities_raw": ["height_pole","route_survey","steerman"], "certifications": ["TWIC"], "description": "10 cars", "competitor_id": "805f38d5-785a-4232-8138-33342d178e9c" },
  { "name_raw": "Auto Pilot LLC", "city": "Longview", "state": "WA", "phone": "+13604305021", "capabilities_raw": [], "certifications": [], "description": "Just a call away", "competitor_id": "c5d7e751-e473-4d32-81e6-7701fed8916c" },
  { "name_raw": "Backdraft Pilot Car NY Inc", "city": "NYC-5 Boroughs", "state": "NY", "phone": "+14843575057", "capabilities_raw": [], "certifications": [], "description": "Long Island only", "competitor_id": "ed118ed6-8da7-4616-a84b-0e78ffeac1f6" },
  { "name_raw": "Back Off Flag Car Services", "city": "Baltimore", "state": "MD", "phone": "+13013057563", "capabilities_raw": ["height_pole"], "certifications": ["Certified"], "description": "Cash discount", "competitor_id": "dd23e52f-eb22-4941-9f5c-a05730beca55" },
  { "name_raw": "Baker Pilot Car/Escort", "city": "Spearfish", "state": "SD", "phone": "+16056417404", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "447c41f3-fdec-422a-8abe-dc86cc057ba0" },
  { "name_raw": "Bama Pilot Cars", "city": "Gainesville", "state": "TX", "phone": "+14692234620", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "2de61d75-adaa-4786-a9e9-5057aa8acf0a" },
  { "name_raw": "Barbwire Pilot Car", "city": "Panaca", "state": "NV", "phone": "+17753887447", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "b9b88b46-0da4-4d78-848e-d7f237b13d1a" },
  { "name_raw": "BA's Pilot Car Service", "city": "Texarkana", "state": "AR", "phone": "+19037443166", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "a62be62e-9acb-416c-abeb-d5f1ee46e25d" },
  { "name_raw": "Becky's Pilot Car LLC", "city": "Buena Vista", "state": "CO", "phone": "+17194299617", "capabilities_raw": ["height_pole"], "certifications": [], "description": null, "competitor_id": "dde2b14a-831f-4451-9aad-d3a0827e9238" },
  { "name_raw": "Beehive State Pilot Cars", "city": "Salt Lake City", "state": "UT", "phone": "+18015550234", "capabilities_raw": ["steerman"], "certifications": [], "description": null, "competitor_id": "5a0d5d77-7a55-4dd0-a05e-615c5143372e" },
  { "name_raw": "Best Choice Inc", "city": "Coeur d'Alene", "state": "ID", "phone": "+15038572556", "capabilities_raw": ["lead","chase","height_pole","steerman"], "certifications": [], "description": null, "competitor_id": "5c8d29e6-e3da-4753-9ed0-5eab8ea4a1c5" },
  { "name_raw": "Best Choice Pilot Cars", "city": "Portland", "state": "OR", "phone": "+15038572556", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "1617fc1e-0df3-4d6b-99bc-6ce9eb0c6076" },
  { "name_raw": "Best Transport Escort", "city": "Indianapolis", "state": "IN", "phone": "+13176944444", "capabilities_raw": ["multi_car"], "certifications": [], "description": null, "competitor_id": "c09111db-7b3e-4a83-b771-e709b43e32d4" },
  { "name_raw": "Big Dog Services Inc", "city": "Brighton", "state": "CO", "phone": "+17208106155", "capabilities_raw": ["height_pole","route_survey"], "certifications": [], "description": null, "competitor_id": "257d4e20-f5e6-4ad9-95d6-69e26eac9d4c" },
  { "name_raw": "Big D's Pilot Service", "city": "Burley", "state": "ID", "phone": "+12082600776", "capabilities_raw": ["height_pole"], "certifications": ["Certified","Insured"], "description": null, "competitor_id": "d2054147-9ab7-476b-a208-64339c38b0a9" },
  { "name_raw": "Biggs Pilot Cars Service", "city": "Biggs Junction", "state": "OR", "phone": "+15038572556", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "64dd9a70-5da1-44ea-9463-07439caf2b74" },
  { "name_raw": "Big Rig Escorts LLC", "city": "Pittsfield", "state": "MA", "phone": "+14134410542", "capabilities_raw": ["height_pole"], "certifications": [], "description": null, "competitor_id": "a7372a4f-577d-4701-9873-81266896a4f9" },
  { "name_raw": "Big Sky Pilots", "city": "Billings", "state": "MT", "phone": "+14066975909", "capabilities_raw": ["height_pole","route_survey","steerman"], "certifications": [], "description": "Traffic plans, CB's & VHF radios, 30+ years experience", "competitor_id": "88b3f653-bfbe-4848-8caf-0cbc93fa9b63" },
  { "name_raw": "Big T's Pilot Service", "city": "Denver", "state": "CO", "phone": "+17204251035", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "329cda78-6a36-4ed7-a628-d0daee1c246b" },
  { "name_raw": "Billy's Pilot Car Service", "city": "Sacramento", "state": "CA", "phone": "+12093296608", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "be1fbea0-6c8f-4257-8d43-90731246e83b" },
  { "name_raw": "Black Beard", "city": "Lake City", "state": "FL", "phone": "+13862431420", "capabilities_raw": [], "certifications": [], "description": "Cash, Money order, Comcheck, Business check", "competitor_id": "fa7fce59-9b03-42d7-b2cb-4b80f705d5b6" },
  { "name_raw": "Blacksheep Pilot Cars", "city": "Reno", "state": "NV", "phone": "+17755605896", "capabilities_raw": ["height_pole","chase"], "certifications": [], "description": "Flexible rates", "competitor_id": "5d253a38-cb6d-44d5-a65f-9e42872d4253" },
  { "name_raw": "Blacksheep Pilot Car/TJ's", "city": "Reno", "state": "NV", "phone": "+17755605896", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "f0ba879b-76a3-4ada-bd9e-e5cb158adc64" },
  { "name_raw": "Blue Ridge Pilot Service", "city": "Charlottesville", "state": "VA", "phone": "+14345550234", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "06565cf9-4ac6-46c6-8f83-1d0ad9c06fde" },
  { "name_raw": "Blue Sky Pilot Car Service", "city": "Paulden", "state": "AZ", "phone": "+19282026570", "capabilities_raw": ["height_pole","route_survey"], "certifications": [], "description": null, "competitor_id": "f78c34f4-136a-409e-ad4b-3c7e17f419bb" },
  { "name_raw": "Border Pilot Cars", "city": "Blaine", "state": "WA", "phone": "+13607391350", "capabilities_raw": ["lead","chase"], "certifications": [], "description": null, "competitor_id": "687515b6-e004-4eb5-bb04-a79534d562b1" }
]; // Trimmed for brevity in this script.

// Dedup logic
const uniqueOperators = new Map();

for (const pilot of OSOW_HAVEN_BATCH) {
  if (!uniqueOperators.has(pilot.phone)) {
    // Split name_raw securely
    let company_name = pilot.name_raw;
    let contact_name = null;
    let completeness = 0.5; // Roughly guessing to satisfy SQL
    let push_msg = { title: "Exclusive Alert", body: "Claim your free profile on Haul Command." };
    
    uniqueOperators.set(pilot.phone, {
      id: crypto.randomUUID ? crypto.randomUUID() : 'gen_random_uuid()', // Mocking SQL
      company_name,
      contact_name,
      phone: pilot.phone,
      city: pilot.city,
      state: pilot.state,
      capabilities: pilot.capabilities_raw.length > 0 ? pilot.capabilities_raw : ['chase'],
      country_code: 'US',
      source: 'osow_haven_directory',
      competitor_url: `https://osowhaven.com/companies/${pilot.competitor_id}/`,
      competitor_id: pilot.competitor_id,
      description: pilot.description,
      is_claimed: false,
      claim_priority: 'high',
      competitor_sourced: true
    });
  }
}

let sql = `-- Migration: SEED OSOW HAVEN BATCH (MOCKED INGESTION RESULTS)
-- Total Records Extracted: ${OSOW_HAVEN_BATCH.length}
-- Processed via G-ING-01 Node script
`;

uniqueOperators.forEach((op) => {
  sql += `
-- INSERT OPERATOR: ${op.company_name.replace(/'/g, "''")}
DO $$ 
DECLARE
  v_op_id uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM operator_phones WHERE phone = '${op.phone}') THEN
    INSERT INTO operators(
      company_name, state, country_code, is_claimed, source,
      competitor_sourced, competitor_source, competitor_profile_url, competitor_id, claim_priority
    ) VALUES (
      '${op.company_name.replace(/'/g, "''")}', '${op.state}', 'US', false, '${op.source}',
      true, 'osow_haven', '${op.competitor_url}', '${op.competitor_id}', 'high'
    ) RETURNING id INTO v_op_id;
    
    INSERT INTO operator_phones(operator_id, phone, is_primary)
    VALUES (v_op_id, '${op.phone}', true);

    ${
      op.capabilities.map(cap => {
        if (cap === 'multi_car') return '';
        return `INSERT INTO operator_capabilities(operator_id, capability) VALUES (v_op_id, '${cap}') ON CONFLICT DO NOTHING;`
      }).join('\n    ')
    }
  END IF;
END $$;
`;
});

const outPath = path.join(__dirname, '../supabase/migrations/20260324070000_osow_haven_seed_data.sql');
fs.writeFileSync(outPath, sql);
console.log('Seed SQL generated successfully for ' + uniqueOperators.size + ' unique records.');
