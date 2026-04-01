require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Checking glossary_terms...");
  const { data: terms, error: termsErr } = await supabase.from('glossary_terms').select('*').limit(5);
  console.log("glossary_terms count:", terms ? terms.length : "ERROR: " + JSON.stringify(termsErr));
  if (terms) {
    console.log("Found:", terms.map(t => t.term));
    if (terms.length > 0) {
      console.log("Fields:", Object.keys(terms[0]));
    }
  }

  console.log("\nChecking definitions/dictionary/regulations views...");
  const { data: cols, error: colsErr } = await supabase.rpc('get_glossary_schema').catch(() => ({}));
}
run();
