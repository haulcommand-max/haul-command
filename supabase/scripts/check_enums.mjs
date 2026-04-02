import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://hvjyfyzotqobfkakjozp.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2anlmeXpvdHFvYmZrYWtqb3pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ0NjMxNSwiZXhwIjoyMDg3MDIyMzE1fQ.xG-oo7qSFevW1JO9GVwd005ZXAMht86_C7P8RRHJ938');

// Check status and claim_status enum values used in existing data
const { data: s1 } = await supabase.from('hc_places').select('status').limit(10);
const { data: s2 } = await supabase.from('hc_places').select('claim_status').limit(10);
const { data: s3 } = await supabase.from('hc_places').select('surface_category_key').limit(20);
console.log('Status values:', [...new Set(s1?.map(r => r.status))]);
console.log('Claim_status values:', [...new Set(s2?.map(r => r.claim_status))]);
console.log('Category keys:', [...new Set(s3?.map(r => r.surface_category_key))]);
