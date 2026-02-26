import Link from 'next/link';
import { Search, Map, Trophy, BookOpen, ArrowRight, Truck } from 'lucide-react';

// ══════════════════════════════════════════════════════════════
// HAUL COMMAND — 404 (Not Found)
// Branded recovery page with search, corridor links, and CTAs
// ══════════════════════════════════════════════════════════════

const QUICK_LINKS = [
    { href: '/loads', label: 'Load Board', icon: Map, desc: 'Browse active loads in real time' },
    { href: '/directory', label: 'Directory', icon: BookOpen, desc: 'Find verified escort operators' },
    { href: '/leaderboards', label: 'Leaderboards', icon: Trophy, desc: 'Top-ranked operators by corridor' },
    { href: '/onboarding/start', label: 'Get Started', icon: Truck, desc: 'Create your account' },
];

const CORRIDORS = [
    { href: '/directory/us/texas', label: 'Texas' },
    { href: '/directory/us/florida', label: 'Florida' },
    { href: '/directory/us/california', label: 'California' },
    { href: '/directory/us/ohio', label: 'Ohio' },
    { href: '/directory/us/pennsylvania', label: 'Pennsylvania' },
    { href: '/directory/us/georgia', label: 'Georgia' },
];

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#0B0B0C] text-white flex items-center justify-center px-4 sm:px-6 relative overflow-hidden">
            {/* Ambient glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_30%,rgba(241,169,27,0.06),transparent)]" />
            </div>

            <div className="relative z-10 w-full max-w-2xl mx-auto py-20 text-center">
                {/* 404 Heading */}
                <h1
                    className="text-[clamp(6rem,15vw,10rem)] font-black leading-none tracking-tighter mb-2 bg-gradient-to-b from-[#F1A91B] via-[#C6923A] to-[#3a3019] bg-clip-text text-transparent"
                    style={{ fontFamily: 'var(--font-display)' }}
                >
                    404
                </h1>
                <p className="text-lg sm:text-xl font-semibold text-white mb-2">
                    This corridor doesn&apos;t exist yet
                </p>
                <p className="text-sm text-[#8fa3b8] mb-10 max-w-md mx-auto">
                    The page you&apos;re looking for may have moved or hasn&apos;t been built yet.
                    Try searching or use the links below.
                </p>

                {/* Search bar */}
                <div className="relative mb-12 max-w-lg mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6577]" />
                    <input
                        type="text"
                        placeholder="Search operators, corridors, or loads…"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium outline-none transition-all"
                        style={{
                            background: 'var(--hc-surface, #111214)',
                            border: '1px solid var(--hc-border, #23262B)',
                            color: 'var(--hc-text, #F3F4F6)',
                        }}
                    />
                </div>

                {/* Quick links grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-12">
                    {QUICK_LINKS.map(({ href, label, icon: Icon, desc }) => (
                        <Link
                            key={href}
                            href={href}
                            className="intelligence-card group text-center p-5"
                            style={{ '--accent-color': '#F1A91B' } as React.CSSProperties}
                        >
                            <Icon className="w-5 h-5 mx-auto mb-3 text-[#F1A91B] opacity-70 group-hover:opacity-100 transition-opacity" />
                            <div className="text-xs font-bold text-white mb-1">{label}</div>
                            <div className="text-[10px] text-[#5A6577] leading-tight">{desc}</div>
                        </Link>
                    ))}
                </div>

                {/* Popular corridors */}
                <div className="mb-12">
                    <div className="text-[10px] font-bold text-[#5A6577] uppercase tracking-[0.2em] mb-4">
                        Popular Coverage Areas
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                        {CORRIDORS.map(({ href, label }) => (
                            <Link
                                key={href}
                                href={href}
                                className="px-4 py-2 rounded-lg text-xs font-semibold transition-all hover:border-[#F1A91B]/30 hover:text-[#F1A91B]"
                                style={{
                                    background: 'var(--hc-surface, #111214)',
                                    border: '1px solid var(--hc-border, #23262B)',
                                    color: '#B0B8C4',
                                }}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Return CTA */}
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#F1A91B] hover:bg-[#E0A318] text-black font-bold text-sm rounded-xl transition-all press-scale shadow-[0_0_30px_rgba(241,169,27,0.2)]"
                >
                    Return to Command Center
                    <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
