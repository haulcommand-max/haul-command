const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// load env
const env = fs.readFileSync(path.join(__dirname, '.env.local'), 'utf-8');
let url = '', key = '';
for (const line of env.split('\n')) {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
}

const supabase = createClient(url, key);

async function main() {
  try {
    // Check tables
    const { data: tables, error: e1 } = await supabase.rpc('get_tables'); // or just standard query if available
    
    // Direct counts
    const { count: profilesCount } = await supabase.from('listings').select('*', { count: 'exact', head: true });
    console.log('Total Profiles:', profilesCount);
    
    // Try to find a tools table
    const { count: toolsCount, error: te } = await supabase.from('tools').select('*', { count: 'exact', head: true });
    console.log('Tools:', toolsCount, te ? te.message : '');

    // Try to find FAQ
    const { count: faqCount, error: fe } = await supabase.from('faqs').select('*', { count: 'exact', head: true });
    console.log('FAQs:', faqCount, fe ? fe.message : '');

    // Check dictionaries/questions
    const { count: termsCount } = await supabase.from('dictionary_terms').select('*', { count: 'exact', head: true });
    console.log('Dictionary Terms:', termsCount);

  } catch (err) {
    console.error(err);
  }
}
main();
