import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function main() {
  // Approach 1: Call the schema cache reload endpoint
  // Supabase projects have a /rest/v1/ endpoint that auto-reloads when the connection pool rotates
  // The issue is PostgREST has a static schema cache

  // Let's try adding a dummy column to force schema reload
  // Actually, the simplest approach: make a request to the admin endpoint
  
  // Try requesting the OpenAPI spec which forces a schema introspection
  console.log('Requesting OpenAPI spec to trigger schema reload...');
  const specRes = await fetch(`${URL}/rest/v1/`, {
    headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` },
  });
  console.log('OpenAPI spec:', specRes.status);

  // Wait
  await new Promise(r => setTimeout(r, 2000));

  // Now try a write
  console.log('\nTrying write to lb_ingestion_batches...');
  const testId = `test_${Date.now()}`;
  const wRes = await fetch(`${URL}/rest/v1/lb_ingestion_batches`, {
    method: 'POST',
    headers: {
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      id: testId,
      raw_text: 'test',
      text_hash: `h_${testId}`,
      source_type: 'test',
    }),
  });
  const wBody = await wRes.text();
  console.log(`Write: ${wRes.status} ${wRes.ok ? '✅' : '❌'}`);
  console.log(`Body: ${wBody.slice(0, 200)}`);

  if (wRes.ok) {
    // Clean up
    await fetch(`${URL}/rest/v1/lb_ingestion_batches?id=eq.${testId}`, {
      method: 'DELETE',
      headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` },
    });
    console.log('Cleanup: ✅');
  }

  // Also try broker_surfaces
  console.log('\nTrying write to broker_surfaces...');
  const surfId = `bsrf_test_${Date.now()}`;
  const sRes = await fetch(`${URL}/rest/v1/broker_surfaces`, {
    method: 'POST',
    headers: {
      'apikey': KEY,
      'Authorization': `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify({
      broker_surface_id: surfId,
      canonical_display_name: 'Test',
    }),
  });
  const sBody = await sRes.text();
  console.log(`Write: ${sRes.status} ${sRes.ok ? '✅' : '❌'}`);
  console.log(`Body: ${sBody.slice(0, 200)}`);

  if (sRes.ok) {
    await fetch(`${URL}/rest/v1/broker_surfaces?broker_surface_id=eq.${surfId}`, {
      method: 'DELETE',
      headers: { 'apikey': KEY, 'Authorization': `Bearer ${KEY}` },
    });
    console.log('Cleanup: ✅');
  }
}

main().catch(e => console.error(e));
