"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { evaluatePaywall, PaywallDecision } from "@/lib/monetization/monetization-engine";

export type UserRole = "escort" | "broker" | "carrier" | "admin" | "viewer";
export type UserTier = "free" | "pro" | "business" | "elite" | "enterprise";

export interface SessionUsage {
    searches: number;
    leads: number;
    routes: number;
    daysActive: number;
}

export interface AuthState {
    user: any | null;
    profile: { id: string; role: UserRole; tier: UserTier; [key: string]: any } | null;
    usage: SessionUsage;
    paywall: PaywallDecision | null;
    isLoading: boolean;
}

export function useAuth() {
    const [state, setState] = useState<AuthState>({
        user: null,
        profile: null,
        usage: { searches: 0, leads: 0, routes: 0, daysActive: 0 },
        paywall: null,
        isLoading: true,
    });

    useEffect(() => {
        let isMounded = true;
        
        async function fetchSession() {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    if (isMounded) setState(s => ({ ...s, user: null, profile: null, isLoading: false }));
                    return;
                }

                // Fetch Profile for Role & Tier
                const { data: profile } = await supabase
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();

                if (!profile) {
                    if (isMounded) setState(s => ({ ...s, user, profile: null, isLoading: false }));
                    return;
                }

                const internalRole = profile.role as string;
                // standardize role for monetization engine
                let mappedRole: "escort" | "broker" | "carrier" = "escort";
                if (internalRole === "broker") mappedRole = "broker";
                if (internalRole === "carrier" || internalRole === "driver") mappedRole = "carrier";

                // standardize tier
                let internalTier = ((profile.tier || "FREE").toString().toLowerCase()) as UserTier;

                // ── MOCK USAGE: In production, fetch from Redis or usage_stats table ──
                // For now, simulate basic usage extracting from local storage
                const usageStr = typeof window !== "undefined" ? localStorage.getItem("hc_session_usage") : null;
                const usage = usageStr ? JSON.parse(usageStr) : {
                    searches: 0,
                    leads: 0,
                    routes: 0,
                    daysActive: Math.max(1, Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)))
                };

                // evaluate paywall!
                const paywallDecision = evaluatePaywall(mappedRole, internalTier as any, usage);

                if (isMounded) {
                    setState({
                        user,
                        profile: { ...profile, role: internalRole, tier: internalTier },
                        usage,
                        paywall: paywallDecision,
                        isLoading: false,
                    });
                }
            } catch (error) {
                console.error("[useAuth] Failed to load session", error);
                if (isMounded) {
                    setState(s => ({ ...s, isLoading: false }));
                }
            }
        }

        fetchSession();

        return () => { isMounded = false; };
    }, []);

    // Utility to track usage client-side so paywall can accurately trigger
    const trackUsage = (metric: keyof SessionUsage, increment: number = 1) => {
        setState(s => {
            const newUsage = { ...s.usage, [metric]: s.usage[metric] + increment };
            localStorage.setItem("hc_session_usage", JSON.stringify(newUsage));
            
            // Re-evaluate paywall
            let mappedRole: "escort" | "broker" | "carrier" = "escort";
            if (s.profile?.role === "broker") mappedRole = "broker";
            if (s.profile?.role === "driver" || s.profile?.role === "carrier") mappedRole = "carrier";
            
            const internalTier = s.profile?.tier || "free";
            const newPaywall = evaluatePaywall(mappedRole, internalTier as any, newUsage);
            
            return { ...s, usage: newUsage, paywall: newPaywall };
        });
    };

    return { ...state, trackUsage };
}
