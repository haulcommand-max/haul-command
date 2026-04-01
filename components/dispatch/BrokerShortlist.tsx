'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Phone, Clock, Shield, MapPin, ChevronRight, Loader2, CheckCircle, Star, AlertTriangle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ShortlistEscort {
    escort_id: string;
    rank: number;
    confidence_pct: number;
    distance_miles: number;
    readiness_score: number;
    response_time_sec: number;
    trust_score: number;
    territory_match: boolean;
    // Joined from profiles (fetched client-side)
    name?: string;
    phone?: string;
    avatar_url?: string;
}

interface BrokerShortlistProps {
    loadId: string;
    onDispatch?: (escortId: string) => void;
}

export function BrokerShortlist({ loadId, onDispatch }: BrokerShortlistProps) {
    const [escorts, setEscorts] = useState<ShortlistEscort[]>([]);
    const [loading, setLoading] = useState(true);
    const [dispatching, setDispatching] = useState<string | null>(null);
    const [dispatched, setDispatched] = useState<Set<string>>(new Set());
    const [cached, setCached] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        generateShortlist();
    }, [loadId]);

    async function generateShortlist() {
        setLoading(true);
        setError(null);
        try {
            const supabase = createClient();
            const { data, error: rpcError } = await supabase.rpc('generate_broker_shortlist', { p_load_id: loadId });
            if (rpcError) throw rpcError;
            setEscorts(data?.shortlist || []);
            setCached(!!data?.cached);
        } catch (e: any) {
            setError(e.message || 'Failed to generate shortlist');
        } finally {
            setLoading(false);
        }
    }

    async function handleDispatch(escort: ShortlistEscort) {
        setDispatching(escort.escort_id);
        try {
            const supabase = createClient();
            const { data, error: rpcError } = await supabase.rpc('dispatch_from_shortlist', {
                p_load_id: loadId,
                p_escort_id: escort.escort_id,
                p_confidence_pct: escort.confidence_pct,
            });
            if (rpcError) throw rpcError;
            if (data?.success) {
                setDispatched(prev => new Set([...prev, escort.escort_id]));
                onDispatch?.(escort.escort_id);
            } else {
                setError(data?.error || 'Dispatch failed');
            }
        } catch (e: any) {
            setError(e.message || 'Dispatch failed');
        } finally {
            setDispatching(null);
        }
    }

    if (loading) {
        return (
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 text-center">
                <Loader2 className="w-6 h-6 text-amber-500 animate-spin mx-auto mb-3" />
                <p className="text-sm text-slate-400">Generating shortlist…</p>
                <p className="text-xs text-slate-600 mt-1">Scoring available escorts by proximity, readiness, and trust</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
                <AlertTriangle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-400">{error}</p>
                <button onClick={generateShortlist} className="mt-3 px-4 py-1.5 bg-slate-700 text-white text-xs font-bold rounded-lg hover:bg-slate-600">
                    Retry
                </button>
            </div>
        );
    }

    const topPick = escorts[0];
    const backups = escorts.slice(1);

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                        <Zap className="w-5 h-5 text-amber-500" /> Dispatch Shortlist
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        {escorts.length} escorts ranked • {cached ? 'cached' : 'fresh'}
                    </p>
                </div>
                <button onClick={generateShortlist} className="px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors">
                    Refresh
                </button>
            </div>

            {escorts.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 text-center">
                    <MapPin className="w-8 h-8 text-slate-700 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">No available escorts near this load</p>
                    <p className="text-xs text-slate-600 mt-1">Try posting at a different time or expanding the search radius</p>
                </div>
            ) : (
                <>
                    {/* Top Pick — Auto-Fill Card */}
                    {topPick && (
                        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/30 rounded-2xl p-5 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-amber-500 text-black text-[10px] font-black px-3 py-1 rounded-bl-xl">
                                #1 PICK
                            </div>
                            <EscortCard
                                escort={topPick}
                                isTopPick
                                isDispatched={dispatched.has(topPick.escort_id)}
                                isDispatching={dispatching === topPick.escort_id}
                                onDispatch={() => handleDispatch(topPick)}
                            />
                        </div>
                    )}

                    {/* Backup Escorts */}
                    {backups.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">Backup Recommendations</p>
                            {backups.map(escort => (
                                <div key={escort.escort_id} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                                    <EscortCard
                                        escort={escort}
                                        isDispatched={dispatched.has(escort.escort_id)}
                                        isDispatching={dispatching === escort.escort_id}
                                        onDispatch={() => handleDispatch(escort)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

/* ── Escort Card ── */
function EscortCard({ escort, isTopPick, isDispatched, isDispatching, onDispatch }: {
    escort: ShortlistEscort;
    isTopPick?: boolean;
    isDispatched: boolean;
    isDispatching: boolean;
    onDispatch: () => void;
}) {
    const confidenceColor = escort.confidence_pct >= 80 ? 'text-emerald-400' : escort.confidence_pct >= 60 ? 'text-amber-400' : 'text-orange-400';

    return (
        <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                    <span className={`text-2xl font-black ${confidenceColor}`}>{escort.confidence_pct}%</span>
                    <span className="text-xs text-slate-500">match confidence</span>
                    {escort.territory_match && (
                        <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/20">
                            TERRITORY
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <MapPin className="w-3 h-3" />
                        <span>{escort.distance_miles} mi</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <Star className="w-3 h-3" />
                        <span>{escort.readiness_score}/100</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{Math.round(escort.response_time_sec / 60)}min avg</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                        <Shield className="w-3 h-3" />
                        <span>{escort.trust_score}/100</span>
                    </div>
                </div>
            </div>

            <div className="shrink-0">
                {isDispatched ? (
                    <div className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-500/10 text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/20">
                        <CheckCircle className="w-4 h-4" /> Sent
                    </div>
                ) : (
                    <button
                        onClick={onDispatch}
                        disabled={isDispatching}
                        className={`flex items-center gap-1.5 px-4 py-2.5 font-black text-xs rounded-xl transition-all ${isTopPick
                                ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/20'
                                : 'bg-slate-700 hover:bg-slate-600 text-white'
                            } disabled:opacity-50`}
                    >
                        {isDispatching ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <>
                                <Zap className="w-4 h-4" />
                                {isTopPick ? 'Auto-Fill' : 'Dispatch'}
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
