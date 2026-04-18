"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
   FOOTER ACCORDION — Mobile-First
   Mobile: stacked accordion sections, tap to expand.
   Desktop (â‰¥768px): 4-column grid, all sections visible.
   â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */

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
            { href: "/tools/compliance-copilot", label: "Compliance Copilot" },
            { href: "/tools/state-requirements", label: "Regulation Alerts" },
            { href: "/tools/global-command-map", label: "Discovery Map" },
            { href: "/roles/pilot-car-operator", label: "Pilot Car Services" },
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
    return (
        <footer className="relative z-10 border-t border-white/[0.06]">
            {/* Mobile/Desktop responsive footer styles */}
            <style>{`
                .ft-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 2rem;
                }
                .ft-title {
                    font-size: 11px;
                    font-weight: 700;
                    color: #C6923A;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    margin-bottom: 16px;
                }
                .ft-links {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                @media (min-width: 640px) {
                    .ft-grid { grid-template-columns: repeat(2, 1fr); }
                }
                @media (min-width: 768px) {
                    .ft-grid { grid-template-columns: repeat(5, 1fr); gap: 2rem; }
                }
            `}</style>

            <div className="hc-container py-8 md:py-16">
                <div className="ft-grid">
                    {FOOTER_SECTIONS.map((section) => (
                        <div key={section.title} className="ft-section">
                            <h4 className="ft-title">{section.title}</h4>
                            <div className="ft-links">
                                {section.links.map(l => (
                                    <Link aria-label="Navigation Link"
                                        key={l.href}
                                        href={l.href}
                                        className="block text-sm text-[#8fa3b8] hover:text-white transition-colors"
                                        style={{ minHeight: 36, display: 'flex', alignItems: 'center' }}
                                    >
                                        {l.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Crown Jewel SEO Density Block */}
            <div className="py-8 sm:py-12 mt-8">
                <div className="hc-container max-w-4xl mx-auto text-center">
                    <h3 className="text-[#C6923A] text-sm sm:text-base font-bold uppercase tracking-[0.1em] mb-4">
                        The Global OS for Pilot Cars & Heavy Haul
                    </h3>
                    <p className="text-[#5A6577] text-xs leading-relaxed max-w-4xl mx-auto">
                        Haul Command is the world's premier logistics infrastructure network for oversize load transportation and superload freight. 
                        We instantly match commercial freight brokers, specialized heavy haul trucking companies, and logistics dispatchers with 
                        certified pilot car operators and escort vehicles across 120 countries. Whether you require standard DOT permit compliance, 
                        complex route surveys, lead car height pole validation, or police escort routing, our real-time oversize load board 
                        and proprietary intelligence engines ensure your high-value cargo moves securely and legally. Join the largest verified PEVO 
                        (Pilot Escort Vehicle Operator) directory and leverage escrow-backed payments, live corridor tracking, and market analytics 
                        built specifically for the specialized transportation industry.
                    </p>
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
                        <span className="opacity-50 text-[10px]">·</span>
                        <Link aria-label="Navigation Link" href="/privacy" className="hover:text-white/60 transition-colors">Privacy</Link>
                        <span className="opacity-50 text-[10px]">·</span>
                        <Link aria-label="Navigation Link" href="/contact" className="hover:text-white/60 transition-colors">Contact</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}