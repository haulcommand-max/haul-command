import { config } from 'dotenv';
config({ path: '.env.local' });
import { getSupabaseAdmin } from './../lib/supabase/admin';

async function check() {
    const admin = getSupabaseAdmin();

    // 1. Check hazard_reports
    let { data, error } = await admin.from('hazard_reports').select('confidence_score').limit(1);
    if (error) {
        console.log("Error querying hazard_reports confidence_score:", error.message);
        if (error.message.includes("Could not find the 'confidence_score' column")) {
            console.log("Fixing hazard_reports, waiting for DB raw query capability...");
        }
    } else {
        console.log("confidence_score column exists in hazard_reports!");
    }

    // 2. Check the PostgREST cache. Sometimes we just need to hit NOTIFY pgrst.
    console.log("Reloading PostgREST schema cache using raw RPC if exists...");
}
check().catch(console.error);
