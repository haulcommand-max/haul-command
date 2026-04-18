import Link from 'next/link';
import { Home, Search, MapPin, BookOpen, Phone, Truck, Shield } from 'lucide-react';

// ══════════════════════════════════════════════════════════════
// 404 — NO DEAD ENDS
// Per Master Prompt §19: Every page must offer a meaningful next move.
// Role-aware suggestions guide the user to the right surface.
// Uses design system tokens exclusively — no hardcoded hex.
// ══════════════════════════════════════════════════════════════

const RECOVERY_LINKS = [
    { href: '/directory', label: 'Browse Directory', description: 'Find verified pilot cars and escort operators', icon: Search },
    { href: '/loads', label: 'Load Board', description: 'Post or browse oversize load jobs', icon: Truck },
    { href: '/near', label: 'Operators Near Me', description: 'Find available escorts nearby', icon: MapPin },
    { href: '/tools', label: 'Tools & Calculators', description: 'Rate calculators, route survey, DOT lookup', icon: Shield },
    { href: '/training', label: 'Haul Command Academy', description: 'Certification and compliance training', icon: BookOpen },
    { href: '/contact', label: 'Contact Us', description: 'Get help from the Haul Command team', icon: Phone },
];

export default function NotFound() {
    return (
        <div className="min-h-[70vh] flex flex-col justify-center items-center text-hc-text px-6 py-16">
            <div className="text-center max-w-2xl mx-auto">
                {/* Status Code */}
                <p className="text-8xl font-black font-display text-hc-gold-500/20 tracking-tighter select-none mb-2">
                    404
                </p>

                {/* Headline */}
                <h1 className="text-3xl md:text-4xl font-black font-display uppercase tracking-tight text-hc-text mb-3">
                    Route Not Found
                </h1>

                {/* Subtext */}
                <p className="text-hc-muted text-base md:text-lg leading-relaxed max-w-lg mx-auto mb-10">
                    This page doesn&apos;t exist or has been moved. Here&apos;s where you can go instead.
                </p>

                {/* Primary CTA */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 bg-hc-gold-500 hover:bg-hc-gold-400 text-hc-bg font-bold text-base px-8 py-4 rounded-2xl transition-all duration-200 shadow-gold-sm hover:shadow-gold-md mb-12"
                >
                    <Home className="w-5 h-5" />
                    Return to Command Center
                </Link>

                {/* Recovery Grid — NO DEAD ENDS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-left">
                    {RECOVERY_LINKS.map((link) => {
                        const Icon = link.icon;
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="group flex items-start gap-3 p-4 rounded-2xl bg-hc-surface border border-hc-border hover:border-hc-gold-500/30 hover:bg-hc-elevated transition-all duration-200"
                            >
                                <div className="shrink-0 h-10 w-10 rounded-xl bg-hc-elevated group-hover:bg-hc-gold-500/10 flex items-center justify-center transition-colors">
                                    <Icon className="h-5 w-5 text-hc-subtle group-hover:text-hc-gold-400 transition-colors" />
                                </div>
                                <div>
                                    <span className="block text-sm font-bold text-hc-text group-hover:text-hc-gold-400 transition-colors">
                                        {link.label}
                                    </span>
                                    <span className="block text-xs text-hc-subtle leading-snug mt-0.5">
                                        {link.description}
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}