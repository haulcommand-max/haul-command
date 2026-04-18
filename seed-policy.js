const env = require('dotenv').config({path: '.env.local'}).parsed;
const { Client } = require('pg');
const c = new Client({ connectionString: env.SUPABASE_DB_POOLER_URL });
c.connect();
const sql = `
  insert into public.internal_link_policy (from_page_type, to_page_type, base_link_count, max_link_count) 
  values 
    ('training', 'glossary', 5, 8),
    ('training', 'regulation', 3, 5),
    ('training', 'tool', 2, 4),
    ('training', 'training', 3, 6),
    ('glossary', 'training', 2, 4),
    ('regulation', 'training', 2, 4),
    ('tool', 'training', 2, 4)
  on conflict (from_page_type, to_page_type) do nothing;
`;
c.query(sql).then(() => {
  console.log('Seeded internal_link_policy');
  c.end();
}).catch(e => {
  console.log('Error', e);
  c.end();
});
