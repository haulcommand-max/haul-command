import fs from 'fs';
import https from 'https';
import http from 'http';

// The production or local URLs to pound (we'll blast the live production URL for true stress testing)
const TARGET_HOST = 'www.haulcommand.com';
const TARGET_URL = `https://${TARGET_HOST}`;

const ROUTES = [
  '/',
  '/corridors/us-port-houston-to-dallas-i45',
  '/available-now',
  '/directory/elite',
  '/tools',
  '/api/available-now?country=US&limit=10',
  '/training/us/texas/tx-scale-compliance'
];

const CONCURRENT_REQUESTS = 30; // Number of parallel requests per batch
const BATCHES = 3;             // Number of waves

async function hitRoute(route) {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = https.get(`${TARGET_URL}${route}`, {
      headers: {
        'User-Agent': 'HaulCommand-Automated-Stress-Test/1.0',
        'Cache-Control': 'no-cache'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        const ms = Date.now() - start;
        resolve({ route, status: res.statusCode, ms });
      });
    });

    req.on('error', (e) => {
      resolve({ route, status: 500, ms: Date.now() - start, error: e.message });
    });
    
    // Timeout at 8 seconds
    req.setTimeout(8000, () => {
      req.destroy();
      resolve({ route, status: 408, ms: 8000, error: 'TIMEOUT' });
    });
  });
}

async function runStressTest() {
  console.log(`[STRESS TEST INITIALIZED] Target: ${TARGET_URL}`);
  console.log(`Executing ${BATCHES} waves of ${CONCURRENT_REQUESTS} concurrent requests...\n`);

  let totalSuccess = 0;
  let totalFail = 0;
  let totalMs = 0;

  for (let wave = 1; wave <= BATCHES; wave++) {
    console.log(`=== WAVE ${wave} ===`);
    const promises = [];
    
    // Build a batch of random routes
    for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
        const randomRoute = ROUTES[Math.floor(Math.random() * ROUTES.length)];
        promises.push(hitRoute(randomRoute));
    }

    const results = await Promise.all(promises);
    
    // Tabulate
    results.forEach(r => {
      totalMs += r.ms;
      if (r.status >= 200 && r.status < 400) {
        totalSuccess++;
        console.log(`✅ [${r.status}] ${r.ms}ms \t| ${r.route}`);
      } else {
        totalFail++;
        console.log(`❌ [${r.status}] ${r.ms}ms \t| ${r.route} ${r.error ? '('+r.error+')' : ''}`);
      }
    });

    console.log(`\nWave ${wave} completed. Waiting 2 seconds before next wave...\n`);
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log('====================================');
  console.log('STRESS TEST SUMMARY');
  console.log('====================================');
  console.log(`Total Requests: ${totalSuccess + totalFail}`);
  console.log(`Success (2xx/3xx): ${totalSuccess}`);
  console.log(`Failures (4xx/5xx): ${totalFail}`);
  console.log(`Average Latency: ${Math.round(totalMs / (totalSuccess + totalFail))}ms`);
  
  if (totalFail > 0) {
    console.log('\n⚠️ WARNING: Sub-optimal infrastructure performance detected (500/Timeout errors).');
    process.exit(1);
  } else {
    console.log('\n🟢 PRODUCTION SYSTEMS GREEN. Cache architecture holding rigid.');
    process.exit(0);
  }
}

runStressTest();
