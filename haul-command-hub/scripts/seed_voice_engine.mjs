import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '../.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const VOICE_QUERIES = [
  { country: 'US', pattern: 'What are the height pole requirements for an oversize load?' },
  { country: 'CA', pattern: 'When is a pilot vehicle required in Ontario?' },
  { country: 'US', pattern: 'How much does a pilot car cost per mile?' },
  { country: 'GB', pattern: 'What is the speed limit for an abnormal load escort?' },
  { country: 'AU', pattern: 'Do I need a load pilot for a 3.5 meter wide load?' },
  { country: 'US', pattern: 'Difference between pilot car and escort vehicle' },
  { country: 'US', pattern: 'Who needs a steerperson?' },
  { country: 'US', pattern: 'What is Haul Command Verified?' },
  { country: 'US', pattern: 'Best pilot car near me?' },
  { country: 'CA', pattern: 'Can I find a route survey specialist near me?' }
];

async function seedVoiceQueries() {
  console.log('Seeding Voice Query Engine...');
  const { data: glossaryTerms, error } = await supabase.from('glossary_control_term').select('id, term_slug').limit(10);
  
  if (error || !glossaryTerms || glossaryTerms.length === 0) {
    console.log('Glossary not populated yet. Skipping Voice Query seeded mapping.');
    return;
  }

  const defaultTermId = glossaryTerms[0].id;
  const inserts = VOICE_QUERIES.map(vq => ({
    country_code: vq.country,
    language_code: 'en-US',
    query_pattern: vq.pattern,
    mapped_term_id: defaultTermId,
    mapped_profile_type: 'operator',
    status: 'active'
  }));

  const { error: err } = await supabase.from('voice_query_template').insert(inserts);
  if (err) console.error('Failed to insert voice queries:', err);
  else console.log(`Seeded ${inserts.length} voice query templates.`);

  console.log('Task 6 Complete.');
}

seedVoiceQueries().then(() => process.exit(0)).catch(console.error);
