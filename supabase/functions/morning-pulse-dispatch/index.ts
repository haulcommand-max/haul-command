import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { GoogleAuth } from "https://deno.land/x/google_auth@0.5.1/mod.ts";
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

        const project_id = "haul-command"; // Hardcoded for this demo, usually env
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
                                title: payload.title,
                                body: payload.body,
                            },
                            data: payload.data
                        }
                    })
                });
                if (response.ok) successes.push(ep.token);
                else failures.push(ep.token);
            } else if (ep.provider === 'webpush') {
                // Web push via VAPID
                try {
                    const sub = JSON.parse(ep.token);
                    await webpush.sendNotification(sub, JSON.stringify(payload));
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
