import { Client } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve('.env.local') });

async function fixSubTable() {
    const dbUrl = process.env.SUPABASE_DB_POOLER_URL;
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    
    // Check if table is empty
    const res = await client.query("SELECT COUNT(*) FROM user_subscriptions");
    const count = parseInt(res.rows[0].count);
    console.log("Existing sub rows:", count);

    if (count === 0) {
        console.log("Dropping broken user_subscriptions & recreating from schema...");
        await client.query("DROP TABLE IF EXISTS user_subscriptions CASCADE;");
        
        const schema = fs.readFileSync(path.resolve('supabase/migrations/20260321_user_subscriptions.sql'), 'utf8');
        await client.query(schema);

        // Re-apply the Engine 1 columns
        await client.query(`
            ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS plan_id text;
            ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS cancel_at_period_end boolean DEFAULT false;
            ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS latest_invoice_id text;
        `);
        console.log("✅ Recreated successfully.");
    } else {
        // Just alter to add missing pieces if there is real data somehow (very unlikely if user_id is missing)
        await client.query(`
            ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
            ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
            ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
            ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS price_key TEXT;
            ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'free';
            ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ;
            ALTER TABLE public.user_subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;
        `);
        console.log("✅ Fixed columns on live table.");
    }

    await client.end();
}

fixSubTable().catch(console.error);
