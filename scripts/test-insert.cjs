const pg = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const client = new pg.Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL, ssl: { rejectUnauthorized: false } });
client.connect().then(async () => {
  try {
    const _issuer = '00000000-0000-0000-0000-000000000101';
    const _ctype = '1d3c98ae-ea5e-44ce-b64f-f6d3f8d8c323';

    const res = await client.query(`
      INSERT INTO hc_training_courses (issuer_id, credential_type_id, slug, title, description, tier, price_cents, duration_hours, delivery_method, hc_trust_score_boost, country_codes, language_codes, tags, is_featured, sort_order, is_active, is_free)
      VALUES
        ($1, $2, 'pilot-car-fundamentals', 'Pilot Car Fundamentals', 'What pilot cars do...', 'free', 0, 1, 'online_self_paced', 0, '{US}', '{en}', '{free}', false, 1, true, true)
      RETURNING id
    `, [_issuer, _ctype]);
    console.log('Inserted:', res.rows);
  } catch (e) {
    console.error('Insert Error:', e.message);
  }
  await client.end();
}).catch(e => { console.error(e.message); process.exit(1); });
