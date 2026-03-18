const https = require('https');
const PROJECT_REF = 'hvjyfyzotqobfkakjozp';
const ACCESS_TOKEN = 'sbp_c6b18d697dc25e7677e2b3e7b3c545355f95d4aa';
function makeRequest(hostname, reqPath, method, body, token) {
    return new Promise((resolve, reject) => {
        const postData = typeof body === 'string' ? body : JSON.stringify(body);
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
        if (method !== 'GET') headers['Content-Length'] = Buffer.byteLength(postData);
        const options = { hostname, path: reqPath, method, headers };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, body: data }));
        });
        req.on('error', reject);
        if (method !== 'GET') req.write(postData);
        req.end();
    });
}
async function main() {
    const r = await makeRequest('api.supabase.com', `/v1/projects/${PROJECT_REF}/database/query`, 'POST', JSON.stringify({ query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'territory_sponsorships' AND table_schema = 'public' ORDER BY ordinal_position;" }), ACCESS_TOKEN);
    console.log(r.body);
}
main();
