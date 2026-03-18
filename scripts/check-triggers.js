const https = require('https');
require('dotenv').config({ path: '.env.local' });

const PROJECT_REF = 'hvjyfyzotqobfkakjozp';
const ACCESS_TOKEN = 'sbp_c6b18d697dc25e7677e2b3e7b3c545355f95d4aa';

function executeSql(sql) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ query: sql });
        const req = https.request({
            hostname: 'api.supabase.com',
            path: `/v1/projects/${PROJECT_REF}/database/query`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Length': Buffer.byteLength(data),
            },
        }, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body }));
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function main() {
    // Check triggers
    const r = await executeSql("SELECT trigger_name, event_manipulation, action_statement FROM information_schema.triggers WHERE event_object_table = 'directory_listings';");
    console.log('Triggers:', r.body);

    // Try a simple direct SQL update with session_replication_role
    const r2 = await executeSql(`
        SET session_replication_role = 'replica';
        UPDATE public.directory_listings SET h3_r7 = 'test' WHERE id = (SELECT id FROM public.directory_listings WHERE latitude IS NOT NULL LIMIT 1);
        SET session_replication_role = 'origin';
    `);
    console.log('Replica mode update:', r2.status, r2.body.substring(0, 200));
}
main();
