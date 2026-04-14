const fs = require('fs');
const path = require('path');

const checkFiles = [
  'lib/seo/metadataFactory.ts',
  'components/home/AdGridSlot.tsx',
  'app/corridor-command/page.tsx',
  'components/auth/PushRegistrationGate.tsx',
  'app/api/activity/feed/route.ts',
  'components/feed/LiveActivityFeed.tsx',
  'app/api/cron/workflows/route.ts',
  'lib/notifications/channelRouter.ts',
  // Check variations of city page
  'app/directory/[country]/[state]/[city]/page.tsx',
  'app/directory/[country]/[slug]/page.tsx'
];

console.log('--- File Existence Check ---');
checkFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
});

console.log('--- Env Manual Check ---');
const envPath = '.env.local';
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  ['STRIPE_PRICE_HC_CERTIFIED', 'STRIPE_PRICE_AV_READY', 'STRIPE_PRICE_HC_ELITE', 'CRON_SECRET', 'NEXT_PUBLIC_FIREBASE_PROJECT_ID'].forEach(key => {
    const hasKey = content.includes(key);
    console.log(`${hasKey ? '✅' : '❌'} ${key}`);
  });
} else {
  console.log('❌ .env.local not found');
}
