'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Shield, Globe, Lock, Clock, Award
} from 'lucide-react';
import { LOGO_MARK_SRC, ALT_TEXT } from '@/lib/config/brand';

// ══════════════════════════════════════════════════════════════
// ENHANCED FOOTER — SEO Link Mesh + Trust Signals + Social Proof
// ══════════════════════════════════════════════════════════════

const SERVICES = [
    { slug: 'pilot-car-services', name: 'Pilot Car Services' },
    { slug: 'escort-vehicle-services', name: 'Escort Vehicle Services' },
    { slug: 'oversize-load-escorts', name: 'Oversize Load Escorts' },
    { slug: 'wide-load-escorts', name: 'Wide Load Escorts' },
    { slug: 'route-survey-services', name: 'Route Surveys' },
    { slug: 'height-pole-services', name: 'Height Pole Services' },
];

export default function EnhancedFooter() {
    return (
        <footer className="border-t border-white/5 bg-[#050505] py-16 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Trust Bar */}
                <div className="flex justify-center gap-8 flex-wrap p-6 mb-12 bg-white/[0.02] rounded-2xl border border-white/[0.04]">
                    {[
                        { icon: Shield, text: 'Verified Escorts', color: '#10b981' },
                        { icon: Lock, text: 'Escrow Protected', color: '#3b82f6' },
                        { icon: Clock, text: 'Median Fill: 47min', color: '#F1A91B' },
                        { icon: Globe, text: '120 Countries', color: '#a855f7' },
                        { icon: Award, text: 'Industry Leaderboard', color: '#f59e0b' },
                    ].map(item => (
                        <div key={item.text} className="flex items-center gap-2">
                            <item.icon className="w-4 h-4" style={{ color: item.color }} />
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{item.text}</span>
                        </div>
                    ))}
                </div>

                {/* Grid layout for footer - responsive, strict 6-cols on desktop */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-8 gap-y-12 mb-12 text-sm">
                    {/* Column 1: Company */}
                    <div>
                        <h3 className="text-[11px] font-extrabold text-yellow-500 uppercase tracking-widest mb-4">Company</h3>
                        <nav className="flex flex-col gap-3">
                            {[
                                { href: '/legal/terms', label: 'Terms of Service' },
                                { href: '/legal/privacy', label: 'Privacy Policy' },
                                { href: '/legal/refund', label: 'Refund Policy' },
                                { href: '/legal/acceptable-use', label: 'Acceptable Use' },
                                { href: '/sla', label: 'SLA' },
                                { href: '/security', label: 'Security' },
                                { href: '/contact', label: 'Contact Us' },
                                { href: '/remove-listing', label: 'Remove / Opt-Out' },
                                { href: '/claim', label: 'Claim Your Listing' },
                                { href: '/onboarding/start', label: 'Get Started' },
                            ].map(l => (
                                <Link key={l.href} href={l.href} className="text-gray-500 hover:text-gray-300 transition-colors">
                                    {l.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Column 2: Product */}
                    <div>
                        <h3 className="text-[11px] font-extrabold text-yellow-500 uppercase tracking-widest mb-4">Product</h3>
                        <nav className="flex flex-col gap-3">
                            {[
                                { href: '/loads', label: 'Oversize Load Board' },
                                { href: '/directory', label: 'Pilot Car Directory' },
                                { href: '/leaderboards', label: 'Leaderboard' },
                                { href: '/corridor', label: 'Corridor Intelligence' },
                                { href: '/rates', label: 'Pilot Car Rates' },
                                { href: '/tools', label: 'All Tools (18+)' },
                                { href: '/tools/instant-quote', label: 'Instant Quote \u2192' },
                                { href: '/tools/permit-checker', label: 'Permit Checker' },
                                { href: '/tools/escort-calculator', label: 'Escort Calculator' },
                                { href: '/blog', label: 'Industry Intel' },
                            ].map(l => (
                                <Link key={l.href} href={l.href} className="text-gray-500 hover:text-gray-300 transition-colors">
                                    {l.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Column 3: US Regions */}
                    <div>
                        <h3 className="text-[11px] font-extrabold text-yellow-500 uppercase tracking-widest mb-4">U.S. Regions</h3>
                        <nav className="flex flex-col gap-3">
                            {[
                                { href: '/directory/us/tx', label: 'Texas Escorts' },
                                { href: '/directory/us/fl', label: 'Florida Escorts' },
                                { href: '/directory/us/ca', label: 'California Escorts' },
                                { href: '/directory/us/ga', label: 'Georgia Escorts' },
                                { href: '/directory/us/oh', label: 'Ohio Escorts' },
                                { href: '/directory/us/la', label: 'Louisiana Escorts' },
                                { href: '/directory/us/nc', label: 'NC Escorts' },
                                { href: '/directory/us/ok', label: 'Oklahoma Escorts' },
                            ].map(l => (
                                <Link key={l.href} href={l.href} className="text-gray-500 hover:text-gray-300 transition-colors">
                                    {l.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Column 4: Global Markets */}
                    <div>
                        <h3 className="text-[11px] font-extrabold text-yellow-500 uppercase tracking-widest mb-4">Global Markets</h3>
                        <nav className="flex flex-col gap-3">
                            {[
                                { href: '/directory/ca', label: '🇨🇦 Canada' },
                                { href: '/directory/au', label: '🇦🇺 Australia' },
                                { href: '/directory/gb', label: '🇬🇧 UK' },
                                { href: '/directory/de', label: '🇩🇪 Germany' },
                                { href: '/directory/za', label: '🇿🇦 South Africa' },
                                { href: '/directory/ae', label: '🇦🇪 UAE' },
                                { href: '/directory/br', label: '🇧🇷 Brazil' },
                                { href: '/directory', label: 'All 120 Countries \u2192' },
                            ].map(l => (
                                <Link key={l.href} href={l.href} className="text-gray-500 hover:text-gray-300 transition-colors">
                                    {l.label}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Column 5: Services */}
                    <div>
                        <h3 className="text-[11px] font-extrabold text-yellow-500 uppercase tracking-widest mb-4">Services</h3>
                        <nav className="flex flex-col gap-3">
                            {SERVICES.map(s => (
                                <Link key={s.slug} href={`/us/tx/${s.slug}`} className="text-gray-500 hover:text-gray-300 transition-colors">
                                    {s.name}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    {/* Column 6: Knowledge Base */}
                    <div>
                        <h3 className="text-[11px] font-extrabold text-yellow-500 uppercase tracking-widest mb-4">Knowledge Base</h3>
                        <nav className="flex flex-col gap-3">
                            {[
                                { href: '/resources', label: 'Resource Hub' },
                                { href: '/resources/guides/how-to-start-pilot-car-company', label: 'Start a Pilot Car Co.' },
                                { href: '/resources/certification/state-pilot-car-certifications', label: 'State Certifications' },
                                { href: '/glossary', label: 'Industry Glossary' },
                                { href: '/glossary/pilot-car', label: 'What is a Pilot Car?' },
                                { href: '/escort-requirements', label: 'Escort Requirements' },
                                { href: '/regulations', label: 'Global Regulations' },
                            ].map(l => (
                                <Link key={l.href} href={l.href} className="text-gray-500 hover:text-gray-300 transition-colors">
                                    {l.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 mt-2 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <Image
                            src={LOGO_MARK_SRC}
                            alt={ALT_TEXT}
                            width={24}
                            height={24}
                            className="object-contain block opacity-85"
                        />
                        <span className="text-[11px] text-gray-500 font-semibold">
                            © 2026 Haul Command. The Operating System for Heavy Haul.
                        </span>
                    </div>
                    <div className="text-[10px] text-gray-700 font-semibold uppercase tracking-widest">
                        Built for the corridor. Not the crowd.
                    </div>
                </div>
            </div>
        </footer>
    );
}
