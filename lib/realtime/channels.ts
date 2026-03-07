import { supabaseBrowser } from "./client";

/**
 * Subscribe to escort presence changes (availability/status).
 * Table: escort_presence (not operator_availability)
 */
export function subscribeOperatorAvailability(opts: {
    operatorId?: string;
    onInsert?: (payload: Record<string, unknown>) => void;
    onUpdate?: (payload: Record<string, unknown>) => void;
}) {
    const client = supabaseBrowser;

    const channel = client
        .channel("escort_presence_changes")
        .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "escort_presence" },
            (payload: Record<string, unknown>) => opts.onInsert?.(payload)
        )
        .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "escort_presence" },
            (payload: Record<string, unknown>) => opts.onUpdate?.(payload)
        );

    channel.subscribe();
    return () => client.removeChannel(channel);
}

/**
 * Join presence tracking for a corridor room.
 * Shows which operators are "online" in a given corridor.
 */
export function joinOperatorPresence(params: {
    corridorId: string;
    operatorId: string;
    onSync?: (state: Record<string, unknown>) => void;
    onJoin?: (key: string, newPresences: unknown[]) => void;
    onLeave?: (key: string, leftPresences: unknown[]) => void;
}) {
    const client = supabaseBrowser;
    const room = `presence:corridor:${params.corridorId}`;

    const channel = client.channel(room, {
        config: { presence: { key: params.operatorId } },
    });

    channel
        .on("presence", { event: "sync" }, () =>
            params.onSync?.(channel.presenceState() as Record<string, unknown>)
        )
        .on("presence", { event: "join" }, ({ key, newPresences }: { key: string; newPresences: unknown[] }) =>
            params.onJoin?.(key, newPresences)
        )
        .on("presence", { event: "leave" }, ({ key, leftPresences }: { key: string; leftPresences: unknown[] }) =>
            params.onLeave?.(key, leftPresences)
        )
        .subscribe(async (status: string) => {
            if (status === "SUBSCRIBED") {
                await channel.track({
                    operator_id: params.operatorId,
                    ts: new Date().toISOString(),
                });
            }
        });

    return () => client.removeChannel(channel);
}

/**
 * Subscribe to new loads (not load_requests).
 * Table: loads
 */
export function subscribeNewLoadRequests(opts: {
    corridorSlug?: string;
    onInsert?: (payload: Record<string, unknown>) => void;
}) {
    const client = supabaseBrowser;

    const filter = opts.corridorSlug
        ? `corridor_slug=eq.${opts.corridorSlug}`
        : undefined;

    const channel = client
        .channel("new_loads")
        .on(
            "postgres_changes",
            {
                event: "INSERT",
                schema: "public",
                table: "loads",
                ...(filter ? { filter } : {}),
            },
            (payload: Record<string, unknown>) => opts.onInsert?.(payload)
        );

    channel.subscribe();
    return () => client.removeChannel(channel);
}

/**
 * Subscribe to booking events (confirmations, cancellations).
 * Table: bookings
 */
export function subscribeBookingEvents(opts: {
    onInsert?: (payload: Record<string, unknown>) => void;
    onUpdate?: (payload: Record<string, unknown>) => void;
}) {
    const client = supabaseBrowser;

    const channel = client
        .channel("booking_events")
        .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "bookings" },
            (payload: Record<string, unknown>) => opts.onInsert?.(payload)
        )
        .on(
            "postgres_changes",
            { event: "UPDATE", schema: "public", table: "bookings" },
            (payload: Record<string, unknown>) => opts.onUpdate?.(payload)
        );

    channel.subscribe();
    return () => client.removeChannel(channel);
}
