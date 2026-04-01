import { config } from 'dotenv';
config({ path: '.env.local' });

process.env.FEATURE_TYPESENSE = 'true'; 
process.env.NEXT_PUBLIC_FEATURE_TYPESENSE = 'true'; 

import { fullSync } from '../../lib/typesense/sync';

async function run() {
    console.log('🔄 Starting Typesense sync...');
    try {
        const result = await fullSync();
        console.log('✅ Typesense sync completed:', result);
    } catch (err) {
        console.error('❌ Typesense sync failed:', err);
    }
}

run();
