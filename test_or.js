require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

sb.from('glossary_public')
  .select('slug, term')
  .or(`slug.eq."pilot-car",synonyms.cs.{"pilot-car"}`)
  .then(res => console.log('TEST EXACT:', JSON.stringify(res, null, 2)));

