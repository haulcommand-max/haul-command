import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { GoogleAuth } from "npm:google-auth-library";
import webpush from "npm:web-push@3.6.7";

serve(async (req) => {
    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
            { auth: { persistSession: false } }
        );

        // Fetch active push endpoints
        const { data: endpoints, error } = await supabase
            .from('push_endpoints')
            .select('*');

        if (error || !endpoints || endpoints.length === 0) {
            return new Response("No active endpoints", { status: 200 });
        }

        const project_id = Deno.env.get("FIREBASE_PROJECT_ID") ?? "haul-command"; // env var preferred
        let accessToken = "";
        try {
            const auth = new GoogleAuth({
                scopes: ["https://www.googleapis.com/auth/firebase.messaging"],
                credentials: JSON.parse(Deno.env.get("FIREBASE_SERVICE_ACCOUNT") || '{}'),
            });
            const client = await auth.getClient();
            const tokenResponse = await client.getAccessToken();
            accessToken = tokenResponse.token || "";
        } catch (e) {
            console.error("FCM Auth failed, skipping native push", e);
        }

        // Configure VAPID
        webpush.setVapidDetails(
            'mailto:admin@haul-command.com',
            Deno.env.get('NEXT_PUBLIC_VAPID_PUBLIC_KEY') || '',
            Deno.env.get('VAPID_PRIVATE_KEY') || ''
        );

        const successes = [];
        const failures = [];

        // Basic payload — in real system, we generate personalized ones
        const payload = {
            title: "Morning Market Pulse",
            body: "Brokers posted 14 new loads near your corridor overnight. Check the board.",
            data: { url: "/load-board" }
        };

        for (const ep of endpoints) {
            // ── Build personalized payload per operator ──
            let personalPayload = {
                title: "Morning Market Pulse",
                body: "New loads posted overnight. Check the board.",
                data: { url: "/load-board" }
            };

            try {
                // Fetch operator's home corridor/state for personalization
                const { data: profile } = await supabase
                    .from("escort_profiles")
                    .select("home_base_state, display_name")
                    .eq("user_id", ep.user_id)
                    .single();

                if (profile?.home_base_state) {
                    // Count loads posted in operator's state since yesterday
                    const yesterday = new Date(Date.now() - 86_400_000).toISOString();
                    const { count } = await supabase
                        .from("loads")
                        .select("id", { count: "exact", head: true })
                        .eq("origin_state", profile.home_base_state)
                        .gte("created_at", yesterday)
                        .eq("status", "active");

                    const loadCount = count ?? 0;
                    const name = profile.display_name?.split(" ")[0] || "Operator";

                    personalPayload = loadCount > 0
                        ? {
                            title: `Morning Pulse — ${profile.home_base_state}`,
                            body: `${name}, ${loadCount} new load${loadCount > 1 ? 's' : ''} posted near ${profile.home_base_state} overnight. Check the board.`,
                            data: { url: `/load-board?state=${profile.home_base_state}` }
                        }
                        : {
                            title: `Morning Pulse — ${profile.home_base_state}`,
                            body: `${name}, corridor activity is quiet today. A good time to update your availability.`,
                            data: { url: "/dashboard/availability" }
                        };
                }
            } catch (_e) {
                // Non-fatal — use default payload
            }

            if (ep.provider === 'fcm' && accessToken) {
                // Native push via Firebase Cloud Messaging API v1
                const response = await fetch(`https://fcm.googleapis.com/v1/projects/${project_id}/messages:send`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`,
                    },
                    body: JSON.stringify({
                        message: {
                            token: ep.token,
                            notification: {
                                title: personalPayload.title,
                                body: personalPayload.body,
                            },
                            data: personalPayload.data
                        }
                    })
                });
                if (response.ok) successes.push(ep.token);
                else failures.push(ep.token);
            } else if (ep.provider === 'webpush') {
                // Web push via VAPID
                try {
                    const sub = JSON.parse(ep.token);
                    await webpush.sendNotification(sub, JSON.stringify(personalPayload));
                    successes.push(sub.endpoint);
                } catch (e: any) {
                    failures.push(ep.token);
                    // Standard practice: if Gone (410), delete the endpoint
                    if (e.statusCode === 410 || e.statusCode === 404) {
                        await supabase.from('push_endpoints').delete().eq('id', ep.id);
                    }
                }
            }
        }

        return new Response(JSON.stringify({
            status: "success",
            successes: successes.length,
            failures: failures.length
        }), {
            headers: { "Content-Type": "application/json" },
        });

    } catch (err: any) {
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
});
