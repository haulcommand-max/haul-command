"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MapPin, Camera, Save, Navigation, ShieldCheck, Flag, ArrowLeft } from 'lucide-react';
import PulsingButton from '@/components/ui/PulsingButton';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface LocationState {
    lat: number;
    lng: number;
    accuracy: number;
}

export default function RouteSurveyApp() {
    const supabase = createClient();
    const router = useRouter();

    const [isSurveying, setIsSurveying] = useState(false);
    const [surveyId, setSurveyId] = useState<string | null>(null);
    const [currentLoc, setCurrentLoc] = useState<LocationState | null>(null);
    const [waypointsCount, setWaypointsCount] = useState(0);
    const [surveyName, setSurveyName] = useState('');

    // Geolocation Tracking
    useEffect(() => {
        if (!isSurveying) return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setCurrentLoc({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy
                });
            },
            (err) => console.error("GPS Watch Error:", err),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [isSurveying]);

    const startSurvey = async () => {
        if (!surveyName) return alert("Enter a survey nickname first (e.g., I-10 East)");
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return alert("Please log in first.");

            const { data, error } = await supabase.from('digital_surveys').insert({
                operator_id: user.id,
                name: surveyName,
                status: 'draft',
                start_lat: currentLoc?.lat,
                start_lng: currentLoc?.lng
            }).select('id').single();

            if (error) throw error;
            setSurveyId(data.id);
            setIsSurveying(true);
        } catch (e) {
            console.error("Survey creation failed", e);
        }
    };

    const markObstacle = async (type: string, heightInches?: number) => {
        if (!surveyId || !currentLoc) return;
        try {
            // Instantly optimistic UI
            setWaypointsCount(prev => prev + 1);

            await supabase.from('digital_survey_waypoints').insert({
                survey_id: surveyId,
                latitude: currentLoc.lat,
                longitude: currentLoc.lng,
                obstacle_type: type,
                measured_height_inches: heightInches
            });
        } catch (e) {
            console.error("Failed to mark obstacle", e);
            setWaypointsCount(prev => prev - 1); // Revert
        }
    };

    const stopSurvey = async () => {
        setIsSurveying(false);
        if (surveyId) {
            await supabase.from('digital_surveys').update({
                status: 'completed',
                end_lat: currentLoc?.lat,
                end_lng: currentLoc?.lng
            }).eq('id', surveyId);
            router.push(`/tools/route-survey/${surveyId}`);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans">
            {/* Top Bar */}
            <div className="bg-slate-900 border-b border-slate-800 p-4 sticky top-0 z-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </Link>
                    <div>
                        <h1 className="text-xl font-black text-white flex items-center gap-2">
                            <Navigation className="w-5 h-5 text-amber-500" />
                            RouteIQ Survey
                        </h1>
                        <p className="text-xs text-slate-400 font-medium tracking-wide">DIGITAL HEIGHT POLE LOG</p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isSurveying ? "bg-red-500 animate-pulse" : "bg-amber-500"}`} />
                    <span className="text-xs font-bold text-amber-500 uppercase">{isSurveying ? "Recording" : "Ready"}</span>
                </div>
            </div>

            <div className="p-4 max-w-lg mx-auto">
                {!isSurveying && !surveyId && (
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl mt-4">
                        <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6">
                            <ShieldCheck className="w-8 h-8 text-amber-500" />
                        </div>
                        <h2 className="text-2xl font-black text-white mb-2">Automate Your Survey Logs</h2>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            As you drive, tap to log bridges, lines, and turns. RouteIQ automatically pins your exact GPS coordinates and generates a DOT-compliant PDF report.
                        </p>

                        <div className="mb-6">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Survey Route Name</label>
                            <input
                                type="text"
                                placeholder="e.g. I-45 North to Dallas"
                                value={surveyName}
                                onChange={e => setSurveyName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                            />
                        </div>

                        <PulsingButton
                            onClick={startSurvey}
                            disabled={!surveyName}
                            className="w-full flex justify-center py-4"
                        >
                            Start Navigation
                        </PulsingButton>
                    </div>
                )}

                {isSurveying && (
                    <div className="space-y-4 pb-24 mt-2">
                        {/* HUD Dashboard */}
                        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                            <div className="flex justify-between items-center mb-6 relative z-10">
                                <div>
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Route</div>
                                    <div className="font-bold text-white text-lg">{surveyName}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Waypoints</div>
                                    <div className="font-black text-amber-500 text-2xl">{waypointsCount}</div>
                                </div>
                            </div>

                            <div className="bg-slate-950 rounded-2xl p-4 flex items-center justify-between border border-white/5 relative z-10">
                                <div className="flex items-center gap-3">
                                    <MapPin className="w-5 h-5 text-slate-400" />
                                    <div>
                                        <div className="text-[10px] text-slate-500 font-mono tracking-wider">LAT {currentLoc?.lat?.toFixed(5) ?? "SEARCHING..."}</div>
                                        <div className="text-[10px] text-slate-500 font-mono tracking-wider">LNG {currentLoc?.lng?.toFixed(5) ?? "SEARCHING..."}</div>
                                    </div>
                                </div>
                                <div className="text-[10px] font-bold text-slate-400">
                                    ACCURACY: {currentLoc?.accuracy ? `${Math.round(currentLoc.accuracy)}m` : "--"}
                                </div>
                            </div>
                        </div>

                        {/* Action Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => markObstacle('bridge', 204)} // Assume 17' standard height pole hit for demo
                                className="bg-slate-900 hover:bg-slate-800 active:bg-slate-700 border-2 border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 transition-colors aspect-square touch-manipulation"
                            >
                                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center">
                                    <span className="text-3xl">🌉</span>
                                </div>
                                <span className="font-bold text-white uppercase tracking-wider text-sm">Bridge Hit</span>
                            </button>

                            <button
                                onClick={() => markObstacle('lines', 240)}
                                className="bg-slate-900 hover:bg-slate-800 active:bg-slate-700 border-2 border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 transition-colors aspect-square touch-manipulation"
                            >
                                <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center">
                                    <span className="text-3xl">⚡️</span>
                                </div>
                                <span className="font-bold text-white uppercase tracking-wider text-sm">Low Wires</span>
                            </button>

                            <button
                                onClick={() => markObstacle('turn')}
                                className="bg-slate-900 hover:bg-slate-800 active:bg-slate-700 border-2 border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 transition-colors aspect-square touch-manipulation"
                            >
                                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center">
                                    <span className="text-3xl">↪️</span>
                                </div>
                                <span className="font-bold text-white uppercase tracking-wider text-sm">Tight Turn</span>
                            </button>

                            <button
                                onClick={() => markObstacle('other')}
                                className="bg-slate-900 hover:bg-slate-800 active:bg-slate-700 border-2 border-slate-800 rounded-3xl p-6 flex flex-col items-center justify-center gap-4 transition-colors aspect-square touch-manipulation"
                            >
                                <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center">
                                    <span className="text-3xl">⚠️</span>
                                </div>
                                <span className="font-bold text-white uppercase tracking-wider text-sm">Other Pin</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Sticky Action Bar */}
            {isSurveying && (
                <div className="fixed bottom-0 left-0 right-0 p-4 border-t border-slate-800 bg-slate-950/80 backdrop-blur-xl z-50">
                    <div className="max-w-lg mx-auto flex gap-4">
                        <button className="h-14 w-14 bg-slate-800 rounded-2xl flex items-center justify-center shrink-0">
                            <Camera className="w-6 h-6 text-white" />
                        </button>
                        <button
                            onClick={stopSurvey}
                            className="flex-1 h-14 bg-red-500 hover:bg-red-400 text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 transition-colors"
                        >
                            <Save className="w-5 h-5" /> Finish Survey
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
