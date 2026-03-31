"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

/* ══════════════════════════════════════════════════════════════
   FOOTER ACCORDION — Mobile-First
   Mobile: stacked accordion sections, tap to expand.
   Desktop (≥768px): 4-column grid, all sections visible.
   ══════════════════════════════════════════════════════════════ */

const FOOTER_SECTIONS = [
    {
        title: "Market",
        links: [
            { href: "/loads", label: "Oversize Load Board" },
            { href: "/directory", label: "Pilot Car Directory" },
            { href: "/rates", label: "Pilot Car Rates" },
            { href: "/leaderboards", label: "Leaderboard" },
            { href: "/corridors", label: "Corridors" },
            { href: "/map", label: "Live Map" },
        ],
    },
    {
        title: "Popular Regions",
        links: [
            { href: "/directory/us/texas", label: "Texas Pilot Cars" },
            { href: "/directory/us/florida", label: "Florida Pilot Cars" },
            { href: "/directory/us/california", label: "California Pilot Cars" },
            { href: "/directory/us/louisiana", label: "Louisiana Pilot Cars" },
            { href: "/directory/us/north-carolina", label: "North Carolina Pilot Cars" },
            { href: "/directory/us/oklahoma", label: "Oklahoma Pilot Cars" },
        ],
    },
    {
        title: "Free Tools",
        links: [
            { href: "/tools/escort-calculator", label: "Escort Calculator" },
            { href: "/escort-requirements", label: "Escort Requirements" },
            { href: "/tools/compliance-card", label: "Compliance Card" },
            { href: "/tools/regulation-alerts", label: "Regulation Alerts" },
            { href: "/tools/discovery-map", label: "Discovery Map" },
            { href: "/services/pilot-car", label: "Pilot Car Services" },
        ],
    },
    {
        title: "Knowledge Base",
        links: [
            { href: '/glossary', label: 'Industry Glossary' },
            { href: '/glossary/pilot-car', label: 'What is a Pilot Car?' },
            { href: '/glossary/oversize-load', label: 'Oversize Load Defined' },
            { href: '/escort-requirements', label: 'Escort Requirements' },
            { href: '/regulations', label: 'State Regulations' },
        ],
    },
    {
        title: "Company",
        links: [
            { href: "/terms", label: "Terms of Service" },
            { href: "/privacy", label: "Privacy Policy" },
            { href: "/contact", label: "Contact Us" },
            { href: "/about", label: "About" },
        ],
    },
];

export function FooterAccordion() {
    const [openSection, setOpenSection] = useState<string | null>(null);

    const toggle = (title: string) => {
        setOpenSection(prev => (prev === title ? null : title));
    };

    return (
        <footer className="relative z-10 border-t border-white/[0.06]">
            {/* Mobile-first footer styles */}
            <style>{`
                /* ── Mobile default: stacked accordion ── */
                .ft-grid {
                    display: flex;
                    flex-direction: column;
                    gap: 0;
                }
                .ft-section {
                    border-bottom: 1px solid rgba(255,255,255,0.04);
                }
                .ft-trigger {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    padding: 14px 0;
                    background: none;
                    border: none;
                    cursor: pointer;
                    min-height: 48px;
                }
                .ft-trigger-icon {
                    width: 16px;
                    height: 16px;
                    color: #5A6577;
                    transition: transform 0.2s ease;
                    flex-shrink: 0;
                }
                .ft-trigger-icon--open {
                    transform: rotate(180deg);
                }
                .ft-body {
                    max-height: 0;
                    overflow: hidden;
                    transition: max-height 0.25s ease;
                }
                .ft-body--open {
                    max-height: 400px;
                }
                .ft-body-inner {
                    padding-bottom: 16px;
                }
                /* Desktop title — hidden on mobile */
                .ft-desktop-title {
                    display: none;
                }

                /* ── Desktop (≥768px): 4-col grid, no accordion ── */
                @media (min-width: 768px) {
                    .ft-grid {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 2rem;
                    }
                    .ft-section {
                        border-bottom: none;
                    }
                    .ft-trigger {
                        display: none;
                    }
                    .ft-body {
                        max-height: none !important;
                        overflow: visible;
                    }
                    .ft-desktop-title {
                        display: block;
                        margin-bottom: 16px;
                    }
                }
            `}</style>

            <div className="hc-container py-8 md:py-16">
                <div className="ft-grid">
                    {FOOTER_SECTIONS.map((section) => {
                        const isOpen = openSection === section.title;
                        return (
                            <div key={section.title} className="ft-section">
                                {/* Mobile: clickable accordion trigger */}
                                <button aria-label="Interactive Button"
                                    className="ft-trigger"
                                    aria-expanded={isOpen}
                                    onClick={() => toggle(section.title)}
                                >
                                    <h4 className="text-[11px] font-bold text-[#C6923A] uppercase tracking-[0.2em]">
                                        {section.title}
                                    </h4>
                                    <ChevronDown className={`ft-trigger-icon ${isOpen ? 'ft-trigger-icon--open' : ''}`} />
                                </button>

                                {/* Desktop: always-visible title */}
                                <h4 className="ft-desktop-title text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.2em]">
                                    {section.title}
                                </h4>

                                {/* Links body */}
                                <div className={`ft-body ${isOpen ? 'ft-body--open' : ''}`}>
                                    <div className="ft-body-inner space-y-2">
                                        {section.links.map(l => (
                                            <Link aria-label="Navigation Link"
                                                key={l.href}
                                                href={l.href}
                                                className="block text-sm text-[#8fa3b8] hover:text-white transition-colors py-1"
                                                style={{ minHeight: 36, display: 'flex', alignItems: 'center' }}
                                            >
                                                {l.label}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-white/[0.04] py-6">
                <div className="hc-container flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] text-[#5A6577] font-semibold uppercase tracking-[0.1em]">
                            © 2026 Haul Command. The Operating System for Heavy Haul.
                        </span>
                    </div>
                    <div className="flex gap-4 text-[11px] text-[#5A6577] font-semibold uppercase tracking-[0.1em]">
                        <Link aria-label="Navigation Link" href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
                        <span className="opacity-50 text-[10px]">•</span>
                        <Link aria-label="Navigation Link" href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
                        <span className="opacity-50 text-[10px]">•</span>
                        <Link aria-label="Navigation Link" href="/contact" className="hover:text-white/60 transition-colors">Contact</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
