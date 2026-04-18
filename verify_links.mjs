import fs from 'fs';
import fetch from 'node-fetch'; // requires node 18+ global fetch if not using node-fetch
// Just use global fetch available in Node.js 18+

const DOMAIN = 'https://www.haulcommand.com';
const TEST_URLS = [
  '/',
  '/glossary/pilot-car',
  '/glossary/escort-vehicle',
  '/glossary/wide-load',
  '/tools/escort-calculator',
  '/tools/permit-cost-calculator', 
  '/escort-requirements',
  '/regulations/us',
  '/training',
  '/loads',
  '/directory'
];

async function checkLinks() {
  console.log('Testing critical surface URLs for 200 OK...');
  let errors = 0;
  for (const path of TEST_URLS) {
    try {
      const res = await fetch(`${DOMAIN}${path}`);
      if (res.status >= 400) {
        console.error(`❌ [${res.status}] ${path} returned error`);
        errors++;
      } else {
        console.log(`✅ [${res.status}] ${path}`);
      }
    } catch(e) {
      console.error(`❌ [NETWORK] ${path} failed: ${e.message}`);
      errors++;
    }
  }
  process.exit(errors > 0 ? 1 : 0);
}

checkLinks();
