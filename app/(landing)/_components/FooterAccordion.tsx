"use client";

import React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const FOOTER_SECTIONS = [
    {
        title: "Market",
        links: [
            { href: "/loads",        label: "Oversize Load Board" },
            { href: "/directory",    label: "Pilot Car Directory" },
            { href: "/rates",        label: "Pilot Car Rates 2026" },
            { href: "/leaderboards", label: "Leaderboard" },
            { href: "/corridors",    label: "Corridors" },
            { href: "/map",          label: "Live Map" },
            { href: "/available-now",label: "Available Now" },
        ],
    },
    {
        title: "Popular Regions",
        links: [
            { href: "/directory/us/texas",         label: "Texas Pilot Cars" },
            { href: "/directory/us/florida",        label: "Florida Pilot Cars" },
            { href: "/directory/us/california",     label: "California Pilot Cars" },
            { href: "/directory/us/louisiana",      label: "Louisiana Pilot Cars" },
            { href: "/directory/us/north-carolina", label: "North Carolina Pilot Cars" },
            { href: "/directory/us/oklahoma",       label: "Oklahoma Pilot Cars" },
            { href: "/regulations",                 label: "All Countries →" },
        ],
    },
    {
        title: "Free Tools",
        links: [
            { href: "/tools/escort-count-calculator", label: "Escort Calculator" },
            { href: "/escort-requirements",           label: "Escort Requirements" },
            { href: "/tools/compliance-card",         label: "Compliance Copilot" },
            { href: "/tools/regulation-alerts",       label: "Regulation Alerts" },
            { href: "/tools/permit-calculator",       label: "Permit Calculator" },
            { href: "/shortage-index",                label: "Shortage Index" },
        ],
    },
    {
        title: "Knowledge Base",
        links: [
            { href: "/glossary",               label: "Industry Glossary" },
            { href: "/what-is-a-pilot-car",    label: "What is a Pilot Car?" },
            { href: "/regulations",            label: "State Regulations" },
            { href: "/roles",                  label: "Heavy Haul Role Guide" },
            { href: "/training",               label: "Training & Academy" },
            { href: "/blog",                   label: "Industry Intelligence" },
        ],
    },
    {
        title: "For Business",
        links: [
            { href: "/claim",         label: "Claim Your Listing" },
            { href: "/advertise/buy", label: "Advertise on Haul Command" },
            { href: "/loads/post",    label: "Post a Load" },
            { href: "/partner",       label: "Partner Network" },
            { href: "/advertise",     label: "AdGrid & Sponsorships" },
            { href: "/contact",       label: "Contact Us" },
        ],
    },
];

export function FooterAccordion() {
    return (
        <footer className="relative z-10">
            {/* -- Link grid — 2-col mobile, 3-col sm, 5-col md -- */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-8">
                {FOOTER_SECTIONS.map((section) => (
                    <div key={section.title}>
                        <h4 className="text-[11px] font-black uppercase tracking-[0.18em] text-[#C6923A] mb-3">
                            {section.title}
                        </h4>
                        <ul className="space-y-0" role="list">
                            {section.links.map(l => (
                                <li key={l.href}>
                                    <Link
                                        href={l.href}
                                        className="flex items-center justify-between gap-1 text-sm text-amber-100/75 hover:text-white hover:bg-white/[0.05] rounded-lg px-2 py-2.5 -mx-2 transition-all group min-h-[44px]"
                                    >
                                        <span className="leading-snug">{l.label}</span>
                                        <ChevronRight className="w-3 h-3 text-amber-200/25 group-hover:text-[#F1A91B] flex-shrink-0 transition-colors" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* -- SEO density block -- */}
            <div className="mt-10 pt-8 border-t border-white/[0.06] text-center">
                <h3 className="text-[#C6923A] text-xs font-bold uppercase tracking-widest mb-3">
                    The Global OS for Pilot Cars &amp; Heavy Haul
                </h3>
                <p className="text-amber-200/50 text-xs leading-relaxed max-w-3xl mx-auto">
                    Haul Command is the world&apos;s premier logistics infrastructure for oversize load transportation —
                    a verified pilot car directory, oversize load board, permit compliance tools, route corridor
                    intelligence, and trust verification network covering 120 countries. Built for operators, brokers,
                    carriers, permit agents, staging yards, equipment suppliers, route surveyors, and heavy-haul
                    authorities worldwide.
                </p>
            </div>

            {/* -- Bottom bar -- */}
            <div className="border-t border-white/[0.04] mt-8 pt-5 flex flex-col sm:flex-row justify-between items-center gap-3">
                <span className="text-[11px] text-amber-200/45 font-semibold uppercase tracking-wider text-center sm:text-left">
                    © 2026 Haul Command. The Operating System for Heavy Haul.
                </span>
                <div className="flex gap-4 text-[11px] text-amber-200/45 font-semibold uppercase tracking-wider">
                    <Link href="/terms"   className="hover:text-white/70 transition-colors min-h-[44px] flex items-center">Terms</Link>
                    <span className="opacity-40">·</span>
                    <Link href="/privacy" className="hover:text-white/70 transition-colors min-h-[44px] flex items-center">Privacy</Link>
                    <span className="opacity-40">·</span>
                    <Link href="/contact" className="hover:text-white/70 transition-colors min-h-[44px] flex items-center">Contact</Link>
                </div>
            </div>
        </footer>
    );
}
