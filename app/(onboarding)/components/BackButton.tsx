"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

/**
 * BackButton â€” Smart escape with fallback.
 * Uses router.back() if history exists, otherwise shows explicit escape links
 * so direct-landing users (e.g. /claim via SMS link) never get stranded.
 */
export function BackButton() {
    const router = useRouter();

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <button aria-label="Interactive Button"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-brand-muted hover:text-brand-text transition-colors text-sm group"
            >
                <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                Back
            </button>
            {/* Explicit escape links for direct-landing users */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <Link aria-label="Navigation Link" href="/" style={{
                    fontSize: 12, fontWeight: 700,
                    color: 'var(--m-text-muted, #6a7181)',
                    textDecoration: 'none',
                }}>
                    Home
                </Link>
                <Link aria-label="Navigation Link" href="/directory" style={{
                    fontSize: 12, fontWeight: 700,
                    color: 'var(--m-text-muted, #6a7181)',
                    textDecoration: 'none',
                }}>
                    Directory
                </Link>
                <Link aria-label="Navigation Link" href="/loads" style={{
                    fontSize: 12, fontWeight: 700,
                    color: 'var(--m-text-muted, #6a7181)',
                    textDecoration: 'none',
                }}>
                    Loads
                </Link>
            </div>
        </div>
    );
}