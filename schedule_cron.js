require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: process.env.SUPABASE_DB_POOLER_URL });
  try {
    await client.connect();
    console.log('Connected to DB via pooler.');

    // Ensure pg_cron is enabled
    try {
      await client.query('CREATE EXTENSION IF NOT EXISTS pg_cron;');
      console.log('Extension pg_cron verified.');
    } catch (e) {
      console.log('Could not create extension (might require superuser, relying on Supabase cloud toggle).', e.message);
    }

    // Schedule the weekly claim reminders
    const sql = `SELECT cron.schedule('weekly-claim-reminders', '0 9 * * 1', 'SELECT public.hc_enqueue_claim_reminders()');`;
    const res = await client.query(sql);
    console.log('Successfully scheduled cron:', res.rows);
    
  } catch (err) {
    console.error('Failed to schedule cron:', err.message);
  } finally {
    await client.end();
  }
}

run();
