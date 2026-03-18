const https = require('https');
require('dotenv').config({ path: '.env.local' });

const PROJECT_REF = 'hvjyfyzotqobfkakjozp';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_c6b18d697dc25e7677e2b3e7b3c545355f95d4aa';

const sql = `
ALTER TABLE IF EXISTS public.directory_listings ADD COLUMN IF NOT EXISTS h3_r7 text;
ALTER TABLE IF EXISTS public.directory_listings ADD COLUMN IF NOT EXISTS h3_r8 text;
CREATE INDEX IF NOT EXISTS idx_directory_listings_h3_r7 ON public.directory_listings (h3_r7);
CREATE INDEX IF NOT EXISTS idx_directory_listings_h3_r8 ON public.directory_listings (h3_r8);
`;

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
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Response:', body.substring(0, 200));
        if (res.statusCode === 200 || res.statusCode === 201) {
            console.log('✅ H3 columns added to directory_listings');
        } else {
            console.log('❌ Failed to add H3 columns');
        }
    });
});

req.on('error', err => console.error('Error:', err.message));
req.write(data);
req.end();
