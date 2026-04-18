require('dotenv').config({path:'.env.local'}); 
const { Pool } = require('pg'); 

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_POOLER_URL,
  ssl: { rejectUnauthorized: false }
});

(async () => { 
  try { 
    await pool.query(`
      INSERT INTO public.hc_command_agents (slug, name, domain, adapter_type, description, budget_monthly_cents, status, config)
      VALUES
          ('becker-notification-sniper', 'Becker Firebase Notification Sniper', 'comms', 'agent', 'Signals over noise. Routes 95% of alerts via low-cost Firebase Push. Reserves SMS parsing strictly for high-value offline users.', 1000, 'active', '{"skills": ["firebase_push", "signal_routing"], "fabric_role": "comms_director"}'),
          ('becker-fly-dot-scraper', 'Becker Fly.io Deep Compute Scraper', 'intelligence', 'agent', 'Spawns ephemeral Fly.io machines to scrape DOT databases, filtering out noise and piping pure data into Supabase.', 2500, 'active', '{"runtime": "fly.io", "skills": ["puppeteer", "data_pipeline"], "fabric_role": "extractor"}'),
          ('jobs-firebase-ux-auditor', 'Jobs Firebase UX Auditor', 'operations', 'agent', 'Reads Firebase Crashlytics & Performance data. Kills features or alerts engineering if UI drops below 60fps or gets bloated.', 1500, 'active', '{"skills": ["firebase_perf_api", "lighthouse"], "fabric_role": "ux_critic"}'),
          ('hormozi-ab-tester', 'Hormozi Firebase Remote Config Tester', 'growth', 'agent', 'Uses Firebase Remote Config to dynamically run A/B Grand Slam Offers without code deploys.', 1500, 'active', '{"skills": ["firebase_remote_config"], "fabric_role": "offer_tester"}')
      ON CONFLICT (slug) DO UPDATE SET description = EXCLUDED.description, config = EXCLUDED.config;
    `); 
    console.log('Successfully injected Firebase, Fly.io, and Alex Becker agents.'); 
  } catch (e) { 
    console.error(e); 
  } finally { 
    await pool.end(); 
  } 
})();
