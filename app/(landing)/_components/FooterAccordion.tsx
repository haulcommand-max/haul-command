"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

/* ══════════════════════════════════════════════════════════════
   FOOTER ACCORDION — FIX #12
   Desktop: 4-column grid.  Mobile: collapsible accordion.
   ══════════════════════════════════════════════════════════════ */

const FOOTER_SECTIONS = [
    {
        title: "Market",
        links: [
            { href: "/loads", label: "Load Board" },
            { href: "/directory", label: "Escort Directory" },
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
            <div className="hc-container py-10 md:py-16">
                <div className="footer-link-grid" style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '2rem',
                    marginBottom: '2rem',
                }}>
                    {FOOTER_SECTIONS.map((section) => {
                        const isOpen = openSection === section.title;
                        return (
                            <div key={section.title} className="footer-section">
                                {/* Mobile: clickable trigger */}
                                <button
                                    className="footer-accordion-trigger"
                                    aria-expanded={isOpen}
                                    onClick={() => toggle(section.title)}
                                >
                                    <h4 className="text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.2em]">
                                        {section.title}
                                    </h4>
                                    <ChevronDown className="footer-chevron" />
                                </button>

                                {/* Desktop: always-visible title */}
                                <h4 className="hidden md:block text-[10px] font-bold text-[#C6923A] uppercase tracking-[0.2em] mb-4">
                                    {section.title}
                                </h4>

                                {/* Links body — accordion on mobile, always open on desktop */}
                                <div className={`footer-section-body md:!max-h-none md:!overflow-visible md:!pb-0 ${isOpen ? 'footer-section-body--open' : ''}`}>
                                    <div className="space-y-2.5">
                                        {section.links.map(l => (
                                            <Link
                                                key={l.href}
                                                href={l.href}
                                                className="block text-sm text-[#8fa3b8] hover:text-white transition-colors py-0.5"
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
                        <Link href="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
                        <span className="opacity-50 text-[10px]">•</span>
                        <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
                        <span className="opacity-50 text-[10px]">•</span>
                        <Link href="/contact" className="hover:text-white/60 transition-colors">Contact</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
