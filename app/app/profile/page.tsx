"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ProfileStrengthMeter } from "@/components/onboarding/ProfileStrengthMeter";
import { Settings, ShieldCheck, Map, Truck, Edit3 } from "lucide-react";
import { MobileBackHeader } from "@/components/navigation/MobileBackHeader";
import { AvailableNowToggle } from "@/components/presence/AvailableNowToggle";
import { CurfewClock } from "@/components/presence/CurfewClock";
import { ComplianceLocker } from "@/components/compliance/ComplianceLocker";

export default function MobileProfilePage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        async function load() {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }
            const { data } = await supabase
                .from("profiles")
                .select("*, onboarding_events(*), verification_artifacts(*)")
                .eq("id", user.id)
                .single();
            setProfile(data);
            setLoading(false);
        }
        load();
    }, []);

    if (loading) return <div className="p-8 text-center text-hc-muted animate-pulse">Loading profile...</div>;

    if (!profile) return (
        <div className="p-8 text-center text-hc-danger font-bold">
            Please log in or complete onboarding first.
        </div>
    );

    // Provide default fallback strength calculation if not updated via RPC yet
    const strength = profile.profile_strength || 15;
    const tier = profile.visibility_tier || "limited";

    return (
        <main className="min-h-screen bg-hc-bg pb-24">
            <MobileBackHeader title="My Profile" />

            <div className="px-4 py-6 space-y-6">

                {/* Available Now Toggle */}
                <AvailableNowToggle useGeo={true} />

                {/* Curfew Clock */}
                <CurfewClock state={profile.home_base_state} />

                {/* Strength Meter */}
                <ProfileStrengthMeter
                    strength={strength}
                    tier={tier}
                    nextStep={{
                        step: "insurance",
                        reason: "Upload insurance to hit Standard Tier",
                        seconds: 120
                    }}
                />

                {/* Quick Info Card */}
                <div className="hc-card p-5 space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-hc-surface border-2 border-hc-border flex items-center justify-center text-hc-gold-500 font-black text-xl overflow-hidden shadow-dispatch">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    profile.full_name?.charAt(0) || "U"
                                )}
                            </div>
                            <div>
                                <h1 className="text-xl font-black text-hc-text uppercase tracking-tight">
                                    {profile.full_name || "New Operator"}
                                </h1>
                                <p className="text-sm text-hc-muted font-bold">
                                    {profile.home_base_city}, {profile.home_base_state}
                                </p>
                            </div>
                        </div>
                        <button className="w-10 h-10 rounded-full bg-hc-surface border border-hc-border flex items-center justify-center text-hc-muted hover:text-hc-text hover:border-hc-gold-500 transition-colors">
                            <Edit3 className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-hc-border-bare">
                        <div className="p-3 bg-hc-surface rounded-xl border border-hc-border space-y-1">
                            <Truck className="w-4 h-4 text-hc-subtle" />
                            <p className="text-[10px] text-hc-muted uppercase tracking-widest font-black">Vehicle</p>
                            <p className="text-sm font-bold text-hc-text truncate">{profile.vehicle_type || "Not Set"}</p>
                        </div>
                        <div className="p-3 bg-hc-surface rounded-xl border border-hc-border space-y-1">
                            <Map className="w-4 h-4 text-hc-subtle" />
                            <p className="text-[10px] text-hc-muted uppercase tracking-widest font-black">Radius</p>
                            <p className="text-sm font-bold text-hc-text">{profile.coverage_radius_miles || 0} Miles</p>
                        </div>
                    </div>
                </div>

                {/* Compliance Locker */}
                <ComplianceLocker />

                {/* Settings Links */}
                <div className="space-y-1">
                    <button className="w-full flex items-center gap-3 p-4 bg-hc-surface hover:bg-hc-elevated rounded-xl transition-colors text-left border border-hc-border-bare">
                        <Settings className="w-5 h-5 text-hc-subtle" />
                        <span className="text-sm font-bold text-hc-muted uppercase tracking-wider">Account Settings</span>
                    </button>
                </div>

            </div>
        </main>
    );
}
