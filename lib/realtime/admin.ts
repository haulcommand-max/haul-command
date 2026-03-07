import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase admin client for broadcasting Realtime events.
 * NEVER expose SUPABASE_SERVICE_ROLE_KEY to the client.
 */
export const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Broadcast an event to a corridor channel.
 * Used for surge alerts, new load notifications, etc.
 */
export async function broadcastCorridorEvent(
    corridorId: string,
    eventType: string,
    payload: Record<string, unknown>
) {
    const channelName = `corridor:${corridorId}`;
    const channel = supabaseAdmin.channel(channelName);

    const status = await channel.send({
        type: "broadcast",
        event: eventType ?? "corridor_event",
        payload: payload ?? {},
    });

    await supabaseAdmin.removeChannel(channel);

    if (status !== "ok") {
        console.error("broadcastCorridorEvent error:", status);
        throw new Error(`Broadcast failed with status: ${status}`);
    }
}
