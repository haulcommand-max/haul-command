import { config } from 'dotenv';
import { resolve } from 'path';
import pg from 'pg';

config({ path: resolve(process.cwd(), '.env.local') });

async function run() {
  const client = new pg.Client({
    connectionString: process.env.SUPABASE_DB_POOLER_URL,
    ssl: { rejectUnauthorized: false }
  });
  
  await client.connect();
  
  // Training catalog count
  const catalog = await client.query("SELECT count(*) as cnt FROM training_catalog");
  console.log(`training_catalog: ${catalog.rows[0].cnt} programs`);
  
  // Training levels count
  const levels = await client.query("SELECT count(*) as cnt FROM training_levels");
  console.log(`training_levels: ${levels.rows[0].cnt} levels`);
  
  // Geo fit count
  const geo = await client.query("SELECT count(*) as cnt FROM training_geo_fit");
  console.log(`training_geo_fit: ${geo.rows[0].cnt} entries`);
  
  // Content edges count
  const edges = await client.query("SELECT count(*) as cnt FROM content_edges");
  console.log(`content_edges: ${edges.rows[0].cnt} edges`);
  
  // Training links count
  const links = await client.query("SELECT count(*) as cnt FROM training_links");
  console.log(`training_links: ${links.rows[0].cnt} links`);
  
  // Test hub RPC
  const hub = await client.query("SELECT training_hub_payload()");
  const hubData = hub.rows[0].training_hub_payload;
  console.log(`\ntraining_hub_payload():`);
  console.log(`  catalog: ${hubData.catalog.length} programs`);
  console.log(`  geo_coverage: ${hubData.geo_coverage.length} countries`);
  console.log(`  levels: ${hubData.levels.length} levels`);
  
  // Test page RPC
  const page = await client.query("SELECT training_page_payload('pilot-car-operator-certification')");
  const pageData = page.rows[0].training_page_payload;
  console.log(`\ntraining_page_payload('pilot-car-operator-certification'):`);
  console.log(`  title: ${pageData.training.title}`);
  console.log(`  geo_fit: ${pageData.geo_fit.length} countries`);
  console.log(`  links: ${pageData.links.length} links`);
  console.log(`  badge_effects: ${pageData.badge_effects.length} effects`);
  console.log(`  levels: ${pageData.levels.length} levels`);
  
  // Test country RPC
  const country = await client.query("SELECT training_country_payload('US')");
  const countryData = country.rows[0].training_country_payload;
  console.log(`\ntraining_country_payload('US'):`);
  console.log(`  trainings: ${countryData.trainings.length} programs`);
  countryData.trainings.forEach(t => console.log(`    - ${t.title} (${t.fit_type})`));
  
  await client.end();
  console.log('\n✅ All seed data verified');
}

run().catch(e => console.error(e.message));
