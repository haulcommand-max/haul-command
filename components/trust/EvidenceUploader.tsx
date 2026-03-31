"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import {
    Camera, FileText, MapPin, Upload, X, Check,
    Image as ImageIcon, File, Loader2, Shield,
} from "lucide-react";

// ══════════════════════════════════════════════════════════════
// EvidenceUploader — Photo/document/location evidence ingestion
// Spec: HC_DOMINATION_PATCH_V1 Phase 3 — Evidence Ingestion
// Types: photo, document, location_ping
// Mobile camera priority, AI classifier hook ready
// Storage: immutable bucket
// ══════════════════════════════════════════════════════════════

export type EvidenceType = "photo" | "document" | "location_ping";

interface EvidenceItem {
    id: string;
    type: EvidenceType;
    fileName?: string;
    previewUrl?: string;
    timestamp: string;
    status: "uploading" | "uploaded" | "classified" | "error";
    classification?: string; // AI classifier output
    lat?: number;
    lng?: number;
}

interface EvidenceUploaderProps {
    jobId: string;
    onUpload?: (evidence: EvidenceItem) => void;
    existingEvidence?: EvidenceItem[];
    className?: string;
}

const TYPE_CONFIG: Record<EvidenceType, {
    label: string; icon: React.ElementType; color: string; accept: string;
}> = {
    photo: { label: "Photo", icon: Camera, color: "#8b5cf6", accept: "image/*" },
    document: { label: "Document", icon: FileText, color: "#3b82f6", accept: ".pdf,.doc,.docx,.txt" },
    location_ping: { label: "Location", icon: MapPin, color: "#10b981", accept: "" },
};

export function EvidenceUploader({
    jobId, onUpload, existingEvidence = [], className,
}: EvidenceUploaderProps) {
    const [items, setItems] = useState<EvidenceItem[]>(existingEvidence);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeType, setActiveType] = useState<EvidenceType>("photo");

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (const file of Array.from(files)) {
            const id = `ev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
            const previewUrl = file.type.startsWith("image/")
                ? URL.createObjectURL(file) : undefined;

            const item: EvidenceItem = {
                id,
                type: file.type.startsWith("image/") ? "photo" : "document",
                fileName: file.name,
                previewUrl,
                timestamp: new Date().toISOString(),
                status: "uploading",
            };

            setItems(prev => [...prev, item]);
            setUploading(true);

            // Simulate upload (replace with actual Supabase storage call)
            setTimeout(() => {
                setItems(prev => prev.map(i =>
                    i.id === id ? { ...i, status: "uploaded" as const } : i
                ));
                setUploading(false);
                onUpload?.(item);
            }, 1500);
        }

        e.target.value = "";
    }, [onUpload]);

    const handleLocationPing = useCallback(() => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const item: EvidenceItem = {
                    id: `ev_loc_${Date.now()}`,
                    type: "location_ping",
                    timestamp: new Date().toISOString(),
                    status: "uploaded",
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                };
                setItems(prev => [...prev, item]);
                onUpload?.(item);
            },
            (err) => console.error("Geolocation error:", err),
            { enableHighAccuracy: true }
        );
    }, [onUpload]);

    const removeItem = useCallback((id: string) => {
        setItems(prev => prev.filter(i => i.id !== id));
    }, []);

    return (
        <div className={cn("rounded-2xl border border-white/[0.06] bg-[#0d1117] overflow-hidden", className)}>
            {/* Header */}
            <div className="px-5 pt-4 pb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-bold text-white">Evidence</span>
                <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded font-bold">
                    {items.length} items
                </span>
            </div>

            {/* Upload buttons — mobile camera priority */}
            <div className="px-5 pb-3 flex gap-2">
                {(Object.entries(TYPE_CONFIG) as [EvidenceType, typeof TYPE_CONFIG[EvidenceType]][]).map(
                    ([type, config]) => (
                        <button aria-label="Interactive Button"
                            key={type}
                            onClick={() => {
                                if (type === "location_ping") {
                                    handleLocationPing();
                                } else {
                                    setActiveType(type);
                                    fileInputRef.current?.click();
                                }
                            }}
                            className={cn(
                                "flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border transition-all",
                                "hover:scale-[1.02] active:scale-[0.98]",
                                type === "photo"
                                    ? "bg-violet-500/10 border-violet-500/20 hover:border-violet-500/40"
                                    : "bg-white/[0.03] border-white/[0.06] hover:border-white/15"
                            )}
                        >
                            <config.icon className="w-5 h-5" style={{ color: config.color }} />
                            <span className="text-[10px] font-bold" style={{ color: config.color }}>
                                {config.label}
                            </span>
                        </button>
                    )
                )}
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept={TYPE_CONFIG[activeType].accept}
                capture={activeType === "photo" ? "environment" : undefined}
                multiple
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Evidence gallery */}
            <AnimatePresence>
                {items.length > 0 && (
                    <div className="px-5 pb-4 grid grid-cols-3 gap-2">
                        {items.map(item => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="relative group rounded-xl overflow-hidden border border-white/[0.06] aspect-square"
                            >
                                {item.previewUrl ? (
                                    <img
                                        src={item.previewUrl}
                                        alt="Evidence"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center bg-white/[0.03]">
                                        {item.type === "location_ping" ? (
                                            <>
                                                <MapPin className="w-5 h-5 text-emerald-400 mb-1" />
                                                <span className="text-[8px] text-white/40">
                                                    {item.lat?.toFixed(4)}, {item.lng?.toFixed(4)}
                                                </span>
                                            </>
                                        ) : (
                                            <>
                                                <File className="w-5 h-5 text-blue-400 mb-1" />
                                                <span className="text-[8px] text-white/40 truncate max-w-full px-1">
                                                    {item.fileName}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* Status overlay */}
                                {item.status === "uploading" && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                                    </div>
                                )}

                                {item.status === "uploaded" && (
                                    <div className="absolute top-1 right-1">
                                        <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                                            <Check className="w-2.5 h-2.5 text-white" />
                                        </div>
                                    </div>
                                )}

                                {/* Remove button */}
                                <button aria-label="Interactive Button"
                                    onClick={() => removeItem(item.id)}
                                    className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3 text-white/60" />
                                </button>

                                {/* Type badge */}
                                <div className="absolute bottom-1 left-1 right-1">
                                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-black/50 text-white/60 uppercase tracking-wider">
                                        {item.type.replace("_", " ")}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* Empty state */}
            {items.length === 0 && (
                <div className="px-5 pb-4 text-center">
                    <p className="text-[11px] text-white/25">
                        Upload photos, documents, or drop a location pin to strengthen this job record
                    </p>
                </div>
            )}
        </div>
    );
}
