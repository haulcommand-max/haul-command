'use client';

import React, { useState, useCallback } from 'react';
import { Upload, Camera, X, Check, AlertTriangle, Eye, EyeOff, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';

// ── Types ───────────────────────────────────────────────────────────────────

export type MediaSlot =
    | 'vehicle_front_3qtr' | 'vehicle_side' | 'vehicle_rear'
    | 'roof_beacon_setup' | 'flags_signs_poles' | 'radios_comms_setup'
    | 'safety_gear_layout' | 'optional_night_visibility'
    | 'optional_support_equipment' | 'optional_trailer_or_additional_vehicle';

export type VerificationState = 'self_reported' | 'photo_backed' | 'document_backed' | 'haul_command_verified';
export type ModerationState = 'pending' | 'approved' | 'rejected' | 'flagged' | 'expired';
export type MediaVisibility = 'public' | 'subscriber_only' | 'private_owner_only';

export interface MediaItem {
    media_id: string;
    slot_type: MediaSlot;
    original_url: string;
    optimized_url?: string;
    width?: number;
    height?: number;
    verification_state: VerificationState;
    moderation_state: ModerationState;
    visibility: MediaVisibility;
    is_primary: boolean;
    freshness_score: number;
    alt_text?: string;
    caption?: string;
    uploaded_at: string;
}

interface MediaGalleryProps {
    media: MediaItem[];
    operatorName: string;
    isOwner?: boolean;
    isPaidUser?: boolean;
    onUpload?: (slot: MediaSlot, file: File) => void;
    onDelete?: (mediaId: string) => void;
    onSetPrimary?: (mediaId: string) => void;
    onSetVisibility?: (mediaId: string, vis: MediaVisibility) => void;
}

// ── Slot Metadata ───────────────────────────────────────────────────────────

const SLOT_META: Record<MediaSlot, { label: string; required: boolean; defaultVisibility: MediaVisibility; tip: string }> = {
    vehicle_front_3qtr: { label: 'Vehicle Front ¾', required: true, defaultVisibility: 'public', tip: 'Show your vehicle from the front-left angle, beacon visible' },
    vehicle_side: { label: 'Vehicle Side', required: true, defaultVisibility: 'public', tip: 'Full side profile showing signs and beacon bar' },
    vehicle_rear: { label: 'Vehicle Rear', required: true, defaultVisibility: 'public', tip: 'Rear view showing signage, flags, and lights' },
    roof_beacon_setup: { label: 'Roof Beacon Setup', required: true, defaultVisibility: 'public', tip: 'Close-up of beacon bar and roof-mounted lights' },
    flags_signs_poles: { label: 'Flags, Signs & Poles', required: true, defaultVisibility: 'public', tip: 'Show OVERSIZE LOAD signs, flags, and height poles' },
    radios_comms_setup: { label: 'Radios & Comms', required: false, defaultVisibility: 'subscriber_only', tip: 'CB radio, handheld radios, and communication gear' },
    safety_gear_layout: { label: 'Safety Gear Layout', required: true, defaultVisibility: 'public', tip: 'PPE, first aid kit, fire extinguisher, cones, vests' },
    optional_night_visibility: { label: 'Night Visibility', required: false, defaultVisibility: 'subscriber_only', tip: 'Night lighting setup and visibility equipment' },
    optional_support_equipment: { label: 'Support Equipment', required: false, defaultVisibility: 'subscriber_only', tip: 'Any additional support equipment you carry' },
    optional_trailer_or_additional_vehicle: { label: 'Additional Vehicle', required: false, defaultVisibility: 'subscriber_only', tip: 'Second escort vehicle or tow trailer' },
};

const ALL_SLOTS: MediaSlot[] = Object.keys(SLOT_META) as MediaSlot[];

// ── Verification Badge ──────────────────────────────────────────────────────

function VerificationBadge({ state }: { state: VerificationState }) {
    const configs: Record<VerificationState, { label: string; color: string; bg: string }> = {
        self_reported: { label: 'Self-Reported', color: 'text-[#888]', bg: 'bg-[#888]/10' },
        photo_backed: { label: 'Photo Backed', color: 'text-blue-400', bg: 'bg-blue-400/10' },
        document_backed: { label: 'Document Verified', color: 'text-purple-400', bg: 'bg-purple-400/10' },
        haul_command_verified: { label: 'HC Verified', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    };
    const c = configs[state];
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${c.color} ${c.bg}`}>
            {state === 'haul_command_verified' ? <Check className="w-2.5 h-2.5" /> : null}
            {c.label}
        </span>
    );
}

// ── Freshness Indicator ─────────────────────────────────────────────────────

function FreshnessIndicator({ score }: { score: number }) {
    const color = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500';
    return (
        <div className="flex items-center gap-1.5" title={`Freshness: ${score}%`}>
            <div className="w-8 h-1 bg-[#222] rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
            </div>
            <span className="text-[8px] text-[#555] font-bold">{score}%</span>
        </div>
    );
}

// ── Main Gallery Component ──────────────────────────────────────────────────

export function MediaGallery({ media, operatorName, isOwner, isPaidUser, onUpload, onDelete, onSetPrimary, onSetVisibility }: MediaGalleryProps) {
    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);

    const sortedMedia = ALL_SLOTS.map(slot => {
        const item = media.find(m => m.slot_type === slot);
        return { slot, meta: SLOT_META[slot], item };
    });

    const approvedMedia = media.filter(m => m.moderation_state === 'approved');
    const filledCount = approvedMedia.length;
    const requiredCount = ALL_SLOTS.filter(s => SLOT_META[s].required).length;
    const requiredFilled = ALL_SLOTS.filter(s => SLOT_META[s].required && media.some(m => m.slot_type === s && m.moderation_state === 'approved')).length;
    const completionPct = Math.round((filledCount / ALL_SLOTS.length) * 100);

    const openViewer = (idx: number) => { setViewerIndex(idx); setViewerOpen(true); };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-[0.15em]">Equipment & Vehicle Gallery</h3>
                    <p className="text-[10px] text-[#555] mt-1">{filledCount}/{ALL_SLOTS.length} slots filled · {requiredFilled}/{requiredCount} required</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-24 h-1.5 bg-[#111] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${completionPct >= 80 ? 'bg-emerald-500' : completionPct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${completionPct}%` }} />
                    </div>
                    <span className="text-xs font-bold text-white">{completionPct}%</span>
                </div>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {sortedMedia.map(({ slot, meta, item }, idx) => (
                    <div key={slot} className="group relative">
                        {item && item.moderation_state === 'approved' ? (
                            <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-[#1a1a1a] cursor-pointer hover:border-[#C6923A]/50 transition-colors" onClick={() => openViewer(idx)}>
                                {/* Visibility gate for subscriber_only */}
                                {item.visibility === 'subscriber_only' && !isPaidUser && !isOwner ? (
                                    <div className="absolute inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center z-10">
                                        <EyeOff className="w-6 h-6 text-[#333] mb-2" />
                                        <span className="text-[9px] text-[#555] font-bold uppercase tracking-wider">Subscriber Only</span>
                                        <button aria-label="Interactive Button" className="mt-2 text-[9px] text-[#C6923A] font-bold uppercase tracking-wider hover:underline">Upgrade →</button>
                                    </div>
                                ) : (
                                    <img src={item.optimized_url || item.original_url} alt={item.alt_text || `${operatorName} — ${meta.label}`}
                                        className="w-full h-full object-cover" loading="lazy" />
                                )}
                                {/* Badges overlay */}
                                <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between">
                                    <VerificationBadge state={item.verification_state} />
                                    <FreshnessIndicator score={item.freshness_score} />
                                </div>
                                {item.is_primary && (
                                    <div className="absolute top-1 right-1 bg-[#C6923A] text-black text-[8px] font-black uppercase px-1.5 py-0.5 rounded">Primary</div>
                                )}
                            </div>
                        ) : (
                            /* Empty slot */
                            <div className={`aspect-[4/3] rounded-xl border-2 border-dashed ${meta.required ? 'border-[#C6923A]/30' : 'border-[#222]'} flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#C6923A]/60 transition-colors ${isOwner ? 'group-hover:bg-[#0a0a0a]' : ''}`}
                                onClick={() => isOwner && onUpload && document.getElementById(`upload-${slot}`)?.click()}>
                                {isOwner ? (
                                    <>
                                        <Upload className="w-5 h-5 text-[#333] group-hover:text-[#C6923A] transition-colors" />
                                        <span className="text-[9px] text-[#444] group-hover:text-[#888] font-bold uppercase tracking-wider">Upload</span>
                                    </>
                                ) : (
                                    <ImageIcon className="w-5 h-5 text-[#222]" />
                                )}
                                {isOwner && onUpload && (
                                    <input id={`upload-${slot}`} type="file" accept="image/*" className="hidden"
                                        onChange={e => e.target.files?.[0] && onUpload(slot, e.target.files[0])} />
                                )}
                            </div>
                        )}
                        {/* Slot label */}
                        <div className="mt-1.5 flex items-center gap-1">
                            <span className="text-[9px] text-[#555] font-semibold truncate">{meta.label}</span>
                            {meta.required && <span className="text-[8px] text-[#C6923A] font-bold">*</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Missing items prompts for owners */}
            {isOwner && requiredFilled < requiredCount && (
                <div className="bg-[#0a0a0a] border border-amber-500/20 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Missing Required Photos</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {ALL_SLOTS.filter(s => SLOT_META[s].required && !media.some(m => m.slot_type === s && m.moderation_state === 'approved')).map(s => (
                            <span key={s} className="text-[10px] text-[#888] bg-[#111] border border-[#222] rounded-lg px-2 py-1">{SLOT_META[s].label}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* Full-screen Viewer */}
            {viewerOpen && (
                <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center" onClick={() => setViewerOpen(false)}>
                    <button aria-label="Interactive Button" className="absolute top-4 right-4 text-white/50 hover:text-white" onClick={() => setViewerOpen(false)}>
                        <X className="w-8 h-8" />
                    </button>
                    <button aria-label="Interactive Button" className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                        onClick={e => { e.stopPropagation(); setViewerIndex(Math.max(0, viewerIndex - 1)); }}>
                        <ChevronLeft className="w-8 h-8" />
                    </button>
                    <button aria-label="Interactive Button" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
                        onClick={e => { e.stopPropagation(); setViewerIndex(Math.min(sortedMedia.length - 1, viewerIndex + 1)); }}>
                        <ChevronRight className="w-8 h-8" />
                    </button>
                    {sortedMedia[viewerIndex]?.item && (
                        <div className="max-w-4xl max-h-[80vh]" onClick={e => e.stopPropagation()}>
                            <img src={sortedMedia[viewerIndex].item!.optimized_url || sortedMedia[viewerIndex].item!.original_url}
                                alt={sortedMedia[viewerIndex].item!.alt_text || ''} className="max-w-full max-h-[75vh] object-contain rounded-lg" />
                            <div className="mt-3 flex items-center justify-between">
                                <span className="text-sm text-white font-bold">{sortedMedia[viewerIndex].meta.label}</span>
                                <VerificationBadge state={sortedMedia[viewerIndex].item!.verification_state} />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
