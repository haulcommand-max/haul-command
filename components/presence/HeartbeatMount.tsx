"use client";

import { useHeartbeat } from "@/lib/presence/useHeartbeat";

export function HeartbeatMount() {
    useHeartbeat();
    return null;
}
