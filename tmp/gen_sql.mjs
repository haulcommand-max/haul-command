import fs from 'fs';
import path from 'path';

const t = fs.readFileSync(path.resolve('lib/geo/countries.ts'), 'utf8');
const regex = /iso2:\s*"([A-Z]{2})".*?currency:\s*"([A-Z]{3})".*?ppp_multiplier:\s*([0-9.]+).*?priority_score:\s*([0-9.]+)/gs;

let match;
let sql = `
-- ============================================================================
-- Sync AdGrid Pricing Matrix with 120-Country Supabase Expansion
-- Generated automatically from the single source of truth: lib/geo/countries.ts
-- ============================================================================

INSERT INTO public.adgrid_pricing_matrix 
(country_code, currency, base_cpm_usd, base_cpc_usd, multiplier, floor_price_usd, vat_rate, ad_maturity) 
VALUES
`;

let rows = [];

while ((match = regex.exec(t)) !== null) {
  const iso2 = match[1];
  const currency = match[2];
  const ppp = parseFloat(match[3]);
  const score = parseFloat(match[4]);

  let maturity = 'emerging';
  if (score > 6) maturity = 'high';
  else if (score > 4) maturity = 'medium';

  // Base metrics adapted by PPP multiplier to guarantee conversion velocity
  let cpm = (22.00 * ppp).toFixed(2);
  let cpc = (4.50 * ppp).toFixed(2);
  let multiplier = ppp.toFixed(2);
  let floor = (0.80 * ppp).toFixed(2);
  let vat = 0.00; // default for new ones

  rows.push(`  ('${iso2}', '${currency}', ${cpm}, ${cpc}, ${multiplier}, ${floor}, ${vat}, '${maturity}')`);
}

sql += rows.join(',\n');
sql += `\nON CONFLICT (country_code) DO UPDATE SET 
    currency = EXCLUDED.currency,
    base_cpm_usd = EXCLUDED.base_cpm_usd,
    base_cpc_usd = EXCLUDED.base_cpc_usd,
    multiplier = EXCLUDED.multiplier,
    floor_price_usd = EXCLUDED.floor_price_usd,
    ad_maturity = EXCLUDED.ad_maturity;
`;

// Also update the `triggerAdGridUpsell` logic natively in Supabase if any stored procedure relies on it
// Wait, the client was handling adgrid upsells in TypeScript, but let's check for stored procedures.

fs.writeFileSync('supabase/migrations/20260327_adgrid_120_country_sync.sql', sql, 'utf8');
console.log("SQL written for 120 countries.");
