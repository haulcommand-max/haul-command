'use client';

import React from 'react';
import { FileText, MapPin, Camera, AlertTriangle, Clock, Download, CheckCircle2 } from 'lucide-react';

type ProofBundleData = {
    id: string;
    job_id: string;
    check_in_at: string | null;
    check_out_at: string | null;
    duration_minutes: number | null;
    origin_coords: { lat: number; lng: number } | null;
    destination_coords: { lat: number; lng: number } | null;
    route_waypoints: { lat: number; lng: number; ts: string; label?: string }[];
    photos: { url: string; caption: string; ts: string }[];
    incidents: { type: string; description: string; ts: string; severity: string }[];
    pdf_url: string | null;
    status: 'draft' | 'generating' | 'ready' | 'sent';
};

function TimelineEntry({ icon: Icon, label, time, color }: { icon: React.ElementType; label: string; time: string; color: string }) {
    return (
        <div className="flex items-start gap-3 relative">
            <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center shrink-0`}>
                <Icon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{label}</div>
                <div className="text-xs text-slate-500">{new Date(time).toLocaleString()}</div>
            </div>
        </div>
    );
}

export function ProofBundleViewer({ bundle }: { bundle: ProofBundleData }) {
    const statusColors: Record<string, string> = {
        draft: 'bg-slate-500/20 text-slate-400 border-slate-500/20',
        generating: 'bg-amber-500/20 text-amber-400 border-amber-500/20',
        ready: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
        sent: 'bg-blue-500/20 text-blue-400 border-blue-500/20',
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-amber-500" />
                    <div>
                        <h3 className="text-white font-bold">Proof Bundle</h3>
                        <p className="text-xs text-slate-500">Job {bundle.job_id.slice(0, 8)}…</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-widest ${statusColors[bundle.status]}`}>
                        {bundle.status}
                    </span>
                    {bundle.pdf_url && (
                        <a href={bundle.pdf_url} target="_blank" rel="noopener noreferrer"
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-colors flex items-center gap-2">
                            <Download className="w-3.5 h-3.5" /> PDF
                        </a>
                    )}
                </div>
            </div>

            <div className="p-6 grid md:grid-cols-2 gap-8">
                {/* Timeline Column */}
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Timeline</h4>
                    <div className="space-y-4">
                        {bundle.check_in_at && (
                            <TimelineEntry icon={CheckCircle2} label="Check In" time={bundle.check_in_at} color="bg-emerald-600" />
                        )}

                        {bundle.route_waypoints.map((wp, i) => (
                            <TimelineEntry key={i} icon={MapPin} label={wp.label || `Waypoint ${i + 1}`} time={wp.ts} color="bg-blue-600" />
                        ))}

                        {bundle.incidents.map((inc, i) => (
                            <TimelineEntry key={`inc-${i}`} icon={AlertTriangle}
                                label={`${inc.type}: ${inc.description}`}
                                time={inc.ts}
                                color={inc.severity === 'critical' ? 'bg-red-600' : 'bg-amber-600'} />
                        ))}

                        {bundle.check_out_at && (
                            <TimelineEntry icon={CheckCircle2} label="Check Out" time={bundle.check_out_at} color="bg-emerald-600" />
                        )}

                        {bundle.duration_minutes != null && (
                            <div className="flex items-center gap-2 text-xs text-slate-400 pt-2 border-t border-slate-800">
                                <Clock className="w-3.5 h-3.5" />
                                Total duration: <span className="font-bold text-white">{bundle.duration_minutes} min</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Photo Evidence Column */}
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Photo Evidence ({bundle.photos.length})</h4>
                    {bundle.photos.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3">
                            {bundle.photos.map((photo, i) => (
                                <div key={i} className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800">
                                    <div className="aspect-square bg-slate-800 flex items-center justify-center">
                                        <Camera className="w-8 h-8 text-slate-600" />
                                    </div>
                                    <div className="p-2">
                                        <p className="text-xs text-slate-400 truncate">{photo.caption}</p>
                                        <p className="text-[10px] text-slate-600">{new Date(photo.ts).toLocaleTimeString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-slate-950 rounded-xl border border-slate-800">
                            <Camera className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                            <p className="text-xs text-slate-600">No photos attached yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
