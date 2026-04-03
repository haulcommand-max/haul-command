// components/swarm/SwarmTriggerPixel.tsx
// Invisible client component that fires a swarm trigger on mount.
// Use on any server-rendered page to wire page views into the swarm.
// Silent, no UI, no blocking.

"use client";

import { useEffect, useRef } from "react";
import { fireSwarmTrigger } from "@/lib/swarm/use-swarm-trigger";

interface Props {
  trigger: string;
  payload: Record<string, unknown>;
}

export function SwarmTriggerPixel({ trigger, payload }: Props) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    fireSwarmTrigger(trigger, payload);
  }, [trigger, payload]);

  return null; // Invisible — purely a signal component
}
