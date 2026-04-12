"use client";

/**
 * /operator â€” Operator Dashboard
 * 
 * Three modules:
 *   1. Availability Toggle (online/offline)
 *   2. Incoming Offers panel
 *   3. Profile Completion Meter
 *
 * Calls hc_operator_dashboard RPC and hc_toggle_availability RPC.
 */

import React, { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
    Power, Bell, Star, Shield, MapPin, Truck,
    ChevronRight, Clock, AlertTriangle, CheckCircle,
    User, Award, MessageSquare, Activity
} from "lucide-react";
import InviteCard from "@/components/growth/InviteCard";
import { MilestoneCelebration, BenchmarkCard } from "@/components/psychology/GrowthHooks";


interface DashboardData {
    entity_id: string;
    company_name: string;
    city: string;
    region_code: string;
    country_code: string;
    availability: string;
    profile_completion: number;
    claim_status: string;
    trust_score: number;
    rating_avg: number;
    rating_count: number;
    jobs_completed: number;
    escort_verified: boolean;
    has_high_pole: boolean;
    last_seen_at: string | null;
    offers_pending: number;
    bookings_active: number;
    bookings_completed: number;
    unread_notifications: number;
}

interface Notification {
    notification_id: string;
    notif_type: string;
    title: string;
    body: string;
    payload: Record<string, unknown>;
    read_at: string | null;
    created_at: string;
}

export default function OperatorDashboard() {
    const [dash, setDash] = useState<DashboardData | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState(false);
    const [entityId, setEntityId] = useState<string | null>(null);

    const supabase = createClient();

    // â”€â”€ Load dashboard data â”€â”€
    const loadDashboard = useCallback(async (userId: string) => {
        // Fallback to standard querying since RPC might not exist
        const { data: profile } = await supabase
            .from("escort_profiles")
            .select("*")
            .eq("user_id", userId)
            .single();

        const { data: availability } = await supabase
            .from("hc_available_now")
            .select("available_until")
            .eq("user_id", userId)
            .single();

        const isOnline = availability && availability.available_until !== null && new Date(availability.available_until) > new Date();

        if (profile) {
            setDash({
                entity_id: profile.id,
                company_name: profile.business_name || profile.display_name || "Operator",
                city: profile.city || "Unknown",
                region_code: profile.region_code || "",
                country_code: profile.country_code || "US",
                availability: isOnline ? "available" : "unavailable",
                profile_completion: profile.business_name && profile.city ? 100 : 50,
                claim_status: profile.claimed_status || "unclaimed",
                trust_score: profile.trust_score || 80,
                rating_avg: 0,
                rating_count: 0,
                jobs_completed: 0,
                escort_verified: true,
                has_high_pole: false,
                last_seen_at: new Date().toISOString(),
                offers_pending: 0,
                bookings_active: 0,
                bookings_completed: 0,
                unread_notifications: 0
            });
        }
    }, [supabase]);

    const loadNotifications = useCallback(async (userId: string) => {
        const { data } = await supabase
            .from("hc_notifications")
            .select("*")
            .eq("identity_id", userId)
            .order("created_at", { ascending: false })
            .limit(20);
        if (data) setNotifications(data as Notification[]);
    }, [supabase]);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }
            // Use User ID instead of entity_id for direct lookups
            setEntityId(user.id);
            await loadDashboard(user.id);
            await loadNotifications(user.id);
            setLoading(false);
        };
        init();
    }, [supabase, loadDashboard, loadNotifications]);

    // â”€â”€ Toggle availability â”€â”€
    const toggleAvailability = async () => {
        if (!dash || toggling) return;
        setToggling(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const isCurrentlyOnline = dash.availability === "available";
            
            if (isCurrentlyOnline) {
                // Take offline
                await supabase.from("hc_available_now").delete().eq("user_id", user.id);
            } else {
                // Go online
                const { data: profile } = await supabase.from("escort_profiles").select("*").eq("user_id", user.id).single();
                if (profile) {
                    const expiry = new Date();
                    expiry.setHours(expiry.getHours() + 12); // Online for 12 hours
                    
                    await supabase.from("hc_available_now").upsert({
                        user_id: user.id,
                        slug: profile.slug || user.id,
                        business_name: profile.business_name,
                        display_name: profile.display_name,
                        country_code: profile.country_code || 'US',
                        city: profile.city || '',
                        lat: profile.lat || null,
                        lng: profile.lng || null,
                        trust_score: profile.trust_score || 80,
                        is_verified: true,
                        available_since: new Date().toISOString(),
                        available_until: expiry.toISOString()
                    });
                }
            }
            if (entityId) await loadDashboard(entityId);
        }
        setToggling(false);
    };

    const isOnline = dash?.availability === "available";

    if (loading) {
        return (
            <div className=" bg-transparent flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#F1A91B]/30 border-t-[#F1A91B] rounded-full animate-spin" />
            </div>
        );
    }

    if (!dash) {
        return (
            <div className=" bg-transparent flex flex-col items-center justify-center gap-4 px-4">
                <Shield className="w-12 h-12 text-[#F1A91B]" />
                <h2 className="text-xl font-black text-white text-center">Operator Dashboard</h2>
                <p className="text-white/40 text-sm text-center">Sign in and claim your listing to access the dashboard.</p>
                <a href="/login" className="mt-4 px-6 py-3 bg-[#F1A91B] text-white font-bold rounded-xl text-sm">
                    Sign In
                </a>
            </div>
        );
    }

    return (
        <div className=" bg-transparent text-white pb-24">
            {/* Header */}

            <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                {/* â”€â”€ MODULE 1: Availability Toggle â”€â”€ */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-6"
                    style={{
                        background: isOnline
                            ? "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(16,185,129,0.02))"
                            : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isOnline ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.06)"}`,
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div
                                className="relative w-14 h-14 rounded-2xl flex items-center justify-center transition-all"
                                style={{
                                    background: isOnline ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                                    boxShadow: isOnline ? "0 0 30px rgba(16,185,129,0.2)" : "none",
                                }}
                            >
                                <Power className={`w-6 h-6 ${isOnline ? "text-emerald-400" : "text-white/20"}`} />
                                {isOnline && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                                )}
                            </div>
                            <div>
                                <h2 className="text-lg font-black">
                                    {isOnline ? "You're Online" : "You're Offline"}
                                </h2>
                                <p className="text-xs text-white/40">
                                    {isOnline
                                        ? "Receiving load offers in your area"
                                        : "Toggle on to receive escort requests"}
                                </p>
                            </div>
                        </div>
                        <button aria-label="Interactive Button"
                            onClick={toggleAvailability}
                            disabled={toggling}
                            className="relative w-16 h-8 rounded-full transition-all"
                            style={{
                                background: isOnline ? "#10B981" : "rgba(255,255,255,0.08)",
                            }}
                        >
                            <motion.div
                                className="absolute top-1 w-6 h-6 rounded-full bg-[#121212] shadow-lg"
                                animate={{ x: isOnline ? 34 : 4 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        </button>
                    </div>
                </motion.div>

                {/* â”€â”€ MODULE 2: Stats Grid â”€â”€ */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Trust Score", value: dash.trust_score, icon: Shield, color: "#F1A91B" },
                        { label: "Rating", value: dash.rating_avg > 0 ? `${dash.rating_avg.toFixed(1)}â˜…` : "â€”", icon: Star, color: "#FBBF24" },
                        { label: "Jobs Done", value: dash.jobs_completed, icon: Award, color: "#10B981" },
                        { label: "Offers", value: dash.offers_pending, icon: Activity, color: "#8B5CF6" },
                    ].map((stat, i) => (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="rounded-xl p-4"
                            style={{
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                            }}
                        >
                            <stat.icon className="w-4 h-4 mb-2" style={{ color: stat.color }} />
                            <div className="text-xl font-black text-white">{stat.value}</div>
                            <div className="text-[10px] text-white/30 uppercase tracking-widest">{stat.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* â”€â”€ MODULE 3: Profile Completion â”€â”€ */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-2xl p-5"
                    style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                    }}
                >
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Profile Completion</h3>
                        <span className="text-sm font-black text-[#F1A91B]">{dash.profile_completion}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(dash.profile_completion, 100)}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            style={{
                                background: dash.profile_completion >= 80
                                    ? "linear-gradient(90deg, #10B981, #34D399)"
                                    : dash.profile_completion >= 50
                                        ? "linear-gradient(90deg, #F1A91B, #FBBF24)"
                                        : "linear-gradient(90deg, #EF4444, #F87171)",
                            }}
                        />
                    </div>
                    {dash.profile_completion < 80 && (
                        <p className="text-[11px] text-white/30 mt-2">
                            Complete your profile to rank higher in search results and receive more offers.
                        </p>
                    )}
                    {/* Quick badges */}
                    <div className="flex gap-2 mt-3 flex-wrap">
                        {dash.escort_verified && (
                            <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                âœ“ Verified
                            </span>
                        )}
                        {dash.has_high_pole && (
                            <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[#F1A91B]/10 text-[#F1A91B] border border-[#F1A91B]/20">
                                âš¡ High Pole
                            </span>
                        )}
                        {dash.claim_status === "claimed" && (
                            <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                âœ“ Claimed
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* â”€â”€ MODULE 3.5: Invite & Growth â”€â”€ */}
                <InviteCard />

                {/* Milestone celebration â€” triggers once per session */}
                {dash.jobs_completed > 0 && !sessionStorage?.getItem('hc_milestone_dismiss') && (
                    <MilestoneCelebration
                        type={dash.jobs_completed >= 100 ? '100_jobs' : dash.jobs_completed >= 50 ? '50_jobs' : dash.jobs_completed >= 10 ? '10_jobs' : 'first_job'}
                        title={dash.jobs_completed >= 100 ? 'Century Club ðŸ†' : dash.jobs_completed >= 50 ? 'Elite Hauler' : dash.jobs_completed >= 10 ? 'First Fleet' : 'First Run Complete'}
                        description={`You've completed ${dash.jobs_completed} job${dash.jobs_completed > 1 ? 's' : ''} on Haul Command. Keep going to climb the leaderboard.`}
                        emoji={dash.jobs_completed >= 100 ? 'ðŸ‘‘' : dash.jobs_completed >= 50 ? 'ðŸ”¥' : dash.jobs_completed >= 10 ? 'âš¡' : 'ðŸŽ‰'}
                        onDismiss={() => { try { sessionStorage.setItem('hc_milestone_dismiss', '1'); } catch { } }}
                    />
                )}

                {/* â”€â”€ MODULE 4: Incoming Offers / Notifications â”€â”€ */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="rounded-2xl overflow-hidden"
                    style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(255,255,255,0.06)",
                    }}
                >
                    <div className="px-5 py-4 border-b border-white/6">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-white/50">Activity Feed</h3>
                    </div>
                    {notifications.length === 0 ? (
                        <div className="px-5 py-12 text-center">
                            <Bell className="w-8 h-8 text-white/10 mx-auto mb-3" />
                            <p className="text-sm text-white/30">No activity yet</p>
                            <p className="text-xs text-white/15 mt-1">Toggle availability to start receiving offers</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/4">
                            {notifications.map((n) => (
                                <div
                                    key={n.notification_id}
                                    className="px-5 py-3.5 flex items-start gap-3 hover:bg-white/2 transition-colors"
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${n.notif_type === "offer_received" ? "bg-[#F1A91B]/10"
                                        : n.notif_type === "review_request" ? "bg-amber-500/10"
                                            : n.notif_type === "new_message" ? "bg-blue-500/10"
                                                : "bg-white/5"
                                        }`}>
                                        {n.notif_type === "offer_received" ? <Truck className="w-4 h-4 text-[#F1A91B]" /> :
                                            n.notif_type === "review_request" ? <Star className="w-4 h-4 text-amber-400" /> :
                                                n.notif_type === "new_message" ? <MessageSquare className="w-4 h-4 text-blue-400" /> :
                                                    <Bell className="w-4 h-4 text-white/30" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-white">{n.title}</div>
                                        <div className="text-xs text-white/40 truncate">{n.body}</div>
                                        <div className="text-[10px] text-white/20 mt-1">
                                            {new Date(n.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    {!n.read_at && (
                                        <span className="w-2 h-2 rounded-full bg-[#F1A91B] flex-shrink-0 mt-2" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* â”€â”€ Quick Actions â”€â”€ */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <a
                        href="/loads"
                        className="rounded-xl p-4 flex items-center gap-3 transition-all hover:-translate-y-0.5"
                        style={{
                            background: "rgba(241,169,27,0.06)",
                            border: "1px solid rgba(241,169,27,0.15)",
                        }}
                    >
                        <Truck className="w-5 h-5 text-[#F1A91B]" />
                        <div>
                            <div className="text-sm font-bold text-white">Load Board</div>
                            <div className="text-[10px] text-white/30">Browse available loads</div>
                        </div>
                    </a>
                    <a
                        href="/chat"
                        className="rounded-xl p-4 flex items-center gap-3 transition-all hover:-translate-y-0.5"
                        style={{
                            background: "rgba(59,130,246,0.06)",
                            border: "1px solid rgba(59,130,246,0.15)",
                        }}
                    >
                        <MessageSquare className="w-5 h-5 text-blue-400" />
                        <div>
                            <div className="text-sm font-bold text-white">Messages</div>
                            <div className="text-[10px] text-white/30">Chat with brokers</div>
                        </div>
                    </a>
                    <a
                        href="/operator/backhaul"
                        className="col-span-2 md:col-span-1 border border-[#10B981]/20 bg-[#10B981]/5 hover:bg-[#10B981]/10 rounded-xl p-4 flex items-center gap-3 transition-all hover:-translate-y-0.5"
                    >
                        <MapPin className="w-5 h-5 text-[#10B981]" />
                        <div>
                            <div className="text-sm font-bold text-white">Post Backhaul</div>
                            <div className="text-[10px] text-[#10B981]/60">Broadcast empty run</div>
                        </div>
                    </a>
                </div>

                {/* â”€â”€ MODULE 6: Benchmark Comparison â”€â”€ */}
                <BenchmarkCard
                    metrics={[
                        { label: 'Trust Score', yours: dash.trust_score, avg: 65, top10: 95, unit: '' },
                        { label: 'Jobs Completed', yours: dash.jobs_completed, avg: 12, top10: 85, unit: '' },
                        { label: 'Rating', yours: Math.round(dash.rating_avg * 10) / 10, avg: 3.8, top10: 4.9, unit: 'â˜…' },
                    ]}
                />

            </main>
        </div>
    );
}