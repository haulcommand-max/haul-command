import { getSupabaseAdmin } from '../lib/supabase/admin.js';

async function findLowestStates() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('directory_listings')
    .select('region_code')
    .eq('country_code', 'US');

  if (error) {
    console.error('Error fetching listings:', error);
    return;
  }

  const counts: Record<string, number> = {};
  data.forEach((row: any) => {
    if (row.region_code) {
      counts[row.region_code] = (counts[row.region_code] || 0) + 1;
    }
  });

  const ALL_STATES = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  // Include states with 0
  for (const state of ALL_STATES) {
    if (!counts[state]) counts[state] = 0;
  }

  const sorted = Object.entries(counts)
    .filter(([state]) => ALL_STATES.includes(state))
    .sort((a, b) => a[1] - b[1]);

  console.log('--- BOTTOM 10 STATES IN DIRECTORY ---');
  sorted.slice(0, 10).forEach(([state, count], idx) => {
    console.log(`${idx + 1}. ${state} (${count} profiles)`);
  });
}

findLowestStates();
