"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, Upload, Camera } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { motion, AnimatePresence } from "framer-motion";

// ══════════════════════════════════════════════════════════════
// ProfileGallery — Haul Command Directory
// Up to 6 photos of operator's rig / equipment setup.
// Pattern borrowed from: eDirectory photo galleries.
// ══════════════════════════════════════════════════════════════

interface GalleryPhoto {
    url: string;
    caption?: string;
    is_primary?: boolean;
}

interface ProfileGalleryProps {
    photos: GalleryPhoto[];
    /** If true, shows upload controls (for profile edit mode) */
    editable?: boolean;
    onUpload?: (file: File) => Promise<void>;
    onRemove?: (index: number) => Promise<void>;
    className?: string;
}

export function ProfileGallery({
    photos,
    editable = false,
    onUpload,
    onRemove,
    className,
}: ProfileGalleryProps) {
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
    const [uploading, setUploading] = useState(false);

    const MAX_PHOTOS = 6;
    const hasSlots = editable && photos.length < MAX_PHOTOS;

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file || !onUpload) return;
        setUploading(true);
        try {
            await onUpload(file);
        } finally {
            setUploading(false);
            e.target.value = ""; // reset
        }
    }

    function nextPhoto() {
        if (lightboxIndex === null) return;
        setLightboxIndex((lightboxIndex + 1) % photos.length);
    }

    function prevPhoto() {
        if (lightboxIndex === null) return;
        setLightboxIndex((lightboxIndex - 1 + photos.length) % photos.length);
    }

    if (!editable && photos.length === 0) {
        return null;
    }

    return (
        <>
            <div className={cn("space-y-3", className)}>
                {/* Section header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-hc-gold-500" />
                        <h3 className="text-[11px] font-black text-hc-text uppercase tracking-widest">
                            Gallery
                        </h3>
                        <span className="text-[10px] text-hc-subtle">
                            {photos.length}/{MAX_PHOTOS} photos
                        </span>
                    </div>
                </div>

                {/* Photo grid — masonry-style 3-col */}
                <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo, i) => (
                        <div
                            key={i}
                            className={cn(
                                "relative group overflow-hidden rounded-xl cursor-pointer",
                                "bg-hc-elevated border border-hc-border-bare",
                                // First photo is a featured 2-col wide slot
                                i === 0 ? "col-span-2 aspect-[16/9]" : "aspect-square",
                            )}
                            onClick={() => setLightboxIndex(i)}
                        >
                            <Image
                                src={photo.url}
                                alt={photo.caption ?? `Rig photo ${i + 1}`}
                                fill
                                sizes="(max-width: 768px) 50vw, 33vw"
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {/* Primary badge */}
                            {photo.is_primary && (
                                <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-hc-gold-500 text-hc-bg text-[9px] font-black uppercase tracking-widest rounded">
                                    Primary
                                </span>
                            )}
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                            {/* Remove button (edit mode) */}
                            {editable && onRemove && (
                                <button
                                    onClick={async (ev) => {
                                        ev.stopPropagation();
                                        await onRemove(i);
                                    }}
                                    className={cn(
                                        "absolute top-2 right-2 w-6 h-6 rounded-full",
                                        "bg-hc-danger text-white opacity-0 group-hover:opacity-100",
                                        "flex items-center justify-center transition-opacity duration-150",
                                        "shadow-card"
                                    )}
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Upload slot */}
                    {hasSlots && (
                        <label
                            className={cn(
                                "relative flex flex-col items-center justify-center",
                                "rounded-xl border-2 border-dashed border-hc-border",
                                "hover:border-hc-gold-500/40 hover:bg-hc-gold-500/4",
                                "cursor-pointer transition-all duration-200 aspect-square",
                                uploading && "opacity-60 pointer-events-none"
                            )}
                        >
                            <Upload className="w-5 h-5 text-hc-subtle mb-1.5" />
                            <span className="text-[10px] text-hc-subtle font-semibold uppercase tracking-widest">
                                {uploading ? "Uploading…" : "Add Photo"}
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={handleFileChange}
                                disabled={uploading}
                            />
                        </label>
                    )}
                </div>
            </div>

            {/* ===== LIGHTBOX ===== */}
            <AnimatePresence>
                {lightboxIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
                        onClick={() => setLightboxIndex(null)}
                    >
                        {/* Close */}
                        <button
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                            onClick={() => setLightboxIndex(null)}
                        >
                            <X className="w-5 h-5 text-white" />
                        </button>

                        {/* Prev */}
                        {photos.length > 1 && (
                            <button
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                                onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                            >
                                <ChevronLeft className="w-5 h-5 text-white" />
                            </button>
                        )}

                        {/* Image */}
                        <motion.div
                            key={lightboxIndex}
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="relative max-w-4xl max-h-[80vh] w-full aspect-video"
                            onClick={e => e.stopPropagation()}
                        >
                            <Image
                                src={photos[lightboxIndex].url}
                                alt={photos[lightboxIndex].caption ?? "Gallery photo"}
                                fill
                                className="object-contain rounded-2xl"
                                sizes="90vw"
                            />
                            {photos[lightboxIndex].caption && (
                                <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-white/80 font-medium">
                                    {photos[lightboxIndex].caption}
                                </p>
                            )}
                        </motion.div>

                        {/* Next */}
                        {photos.length > 1 && (
                            <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
                                onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                            >
                                <ChevronRight className="w-5 h-5 text-white" />
                            </button>
                        )}

                        {/* Dots */}
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {photos.map((_, i) => (
                                <button
                                    key={i}
                                    className={cn(
                                        "w-1.5 h-1.5 rounded-full transition-all",
                                        i === lightboxIndex ? "bg-white w-4" : "bg-white/40"
                                    )}
                                    onClick={e => { e.stopPropagation(); setLightboxIndex(i); }}
                                />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default ProfileGallery;
