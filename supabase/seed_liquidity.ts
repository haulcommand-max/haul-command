import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars.");
    Deno.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
    console.log("🌱 Seeding Liquidity Map Data...");

    // 1. Create Mock Drivers (Florida & Texas)
    const drivers = [
        { email: "driver.fl.1@example.com", lat: 28.5383, lng: -81.3792, type: 'high_pole' }, // Orlando
        { email: "driver.fl.2@example.com", lat: 25.7617, lng: -80.1918, type: 'escort' },    // Miami
        { email: "driver.fl.3@example.com", lat: 30.3322, lng: -81.6557, type: 'escort' },    // Jacksonville
        { email: "driver.fl.4@example.com", lat: 27.9506, lng: -82.4572, type: 'high_pole' }, // Tampa
        { email: "driver.tx.1@example.com", lat: 29.7604, lng: -95.3698, type: 'escort' },    // Houston
        { email: "driver.tx.2@example.com", lat: 32.7767, lng: -96.7970, type: 'escort' },    // Dallas
    ];

    for (const d of drivers) {
        // A. Create Auth User
        const { data: user, error: userError } = await supabase.auth.admin.createUser({
            email: d.email,
            password: "password123",
            email_confirm: true,
            user_metadata: { role: 'driver', display_name: `Driver ${d.email.split('@')[0]}` }
        });

        // Ignore if already exists, but we need the ID. 
        // If error, try fetch.
        let userId = user?.user?.id;
        if (userError && !userId) {
            // If user already exists, we might not get ID easily without listUsers loop or specific error parsing
            // For seed script, we'll skip or try to login. 
            // Simplest: Just List users to find ID
            const { data: listData } = await supabase.auth.admin.listUsers();
            const existing = listData?.users.find(u => u.email === d.email);
            userId = existing?.id;
        }

        if (userId) {
            // B. Create Profile (Trigger usually handles this, but ensuring updates)
            // Upsert Profile
            await supabase.from('profiles').upsert({
                id: userId,
                role: 'driver',
                country: 'US',
                home_state: d.email.includes('.fl.') ? 'FL' : 'TX',
                email: d.email
            });

            // C. Create Driver Profile
            await supabase.from('driver_profiles').upsert({
                user_id: userId,
                base_lat: d.lat,
                base_lng: d.lng,
                has_high_pole: d.type === 'high_pole',
                last_active_at: new Date().toISOString()
            });

            // D. Create Initial Rank (Gamification)
            await supabase.from('driver_ranks').upsert({
                driver_id: userId,
                current_points: 20,
                current_tier: 'ROOKIE',
                trust_score: 20,
                last_updated_at: new Date().toISOString()
            });

            console.log(`✅ Seeded Driver: ${d.email}`);
        }
    }

    // 2. Create Mock Loads (FL -> TX Corridor)
    const loads = [
        { origin: { lat: 25.7617, lng: -80.1918 }, dest: { lat: 29.7604, lng: -95.3698 }, title: "Miami to Houston Heavy" },
        { origin: { lat: 30.3322, lng: -81.6557 }, dest: { lat: 32.7767, lng: -96.7970 }, title: "JAX to Dallas Wide" },
        { origin: { lat: 28.5383, lng: -81.3792 }, dest: { lat: 33.7490, lng: -84.3880 }, title: "Orlando to Atlanta" },
    ];

    // Need a broker to own loads
    const { data: brokerUser } = await supabase.auth.admin.createUser({
        email: "broker.main@example.com",
        password: "password123",
        email_confirm: true,
        user_metadata: { role: 'broker' }
    });
    let brokerId = brokerUser?.user?.id;
    if (!brokerId) {
        const { data: listData } = await supabase.auth.admin.listUsers();
        const existing = listData?.users.find(u => u.email === "broker.main@example.com");
        brokerId = existing?.id;
    }

    if (brokerId) {
        await supabase.from('profiles').upsert({ id: brokerId, role: 'broker', email: "broker.main@example.com" });

        for (const l of loads) {
            await supabase.from('loads').insert({
                broker_id: brokerId,
                status: 'posted',
                title: l.title,
                origin_lat: l.origin.lat,
                origin_lng: l.origin.lng,
                dest_lat: l.dest.lat,
                dest_lng: l.dest.lng,
                equipment_requirements: { high_pole: true }
            });
            console.log(`✅ Seeded Load: ${l.title}`);
        }
    }

    console.log("Done.");
}

seed();
