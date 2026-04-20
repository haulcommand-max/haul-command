// components/ui/NoDeadEndBlock.tsx
// Prevents dead ends on any page. Pass context-relevant links.
// Every important page should answer: "What does this role do next?"
// Server-compatible — no 'use client'.

import Link from 'next/link';

interface NextMove {
    href: string;
    icon: string;
    title: string;
    desc: string;
    color?: string;
    primary?: boolean;
}

interface NoDeadEndBlockProps {
    heading?: string;
    moves: NextMove[];
    style?: React.CSSProperties;
}

export function NoDeadEndBlock({
    heading = 'What Would You Like to Do Next?',
    moves,
    style,
}: NoDeadEndBlockProps) {
    return (
        <div style={{
            padding: '24px 16px',
            maxWidth: 900,
            margin: '0 auto',
            ...style,
        }}>
            <h2 style={{
                fontSize: 12, fontWeight: 700,
                color: '#6b7280',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                margin: '0 0 14px',
            }}>
                {heading}
            </h2>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: 10,
            }}>
                {moves.map(move => (
                    <Link
                        key={move.href + move.title}
                        href={move.href}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 6,
                            padding: '14px 16px',
                            borderRadius: 12,
                            background: move.primary
                                ? `${move.color ?? '#D4A844'}0d`
                                : '#f9fafb',
                            border: move.primary
                                ? `1px solid ${move.color ?? '#D4A844'}33`
                                : '1px solid #e5e7eb',
                            textDecoration: 'none',
                            transition: 'all 0.12s',
                        }}
                    >
                        <span style={{ fontSize: 20, lineHeight: 1 }}>{move.icon}</span>
                        <span style={{
                            fontSize: 13, fontWeight: 700,
                            color: move.primary ? (move.color ?? '#D4A844') : '#1f2937',
                            lineHeight: 1.2,
                        }}>
                            {move.title}
                        </span>
                        {move.desc && (
                            <span style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.4 }}>
                                {move.desc}
                            </span>
                        )}
                    </Link>
                ))}
            </div>
        </div>
    );
}

// ── Pre-built next-move configs for common page types ──────────────────────────

// For glossary term pages
export const GLOSSARY_NEXT_MOVES: NextMove[] = [
    { href: '/escort-requirements', icon: '⚖️', title: 'State Escort Rules', desc: 'Exact thresholds by state', primary: true, color: '#D4A844' },
    { href: '/tools/escort-calculator', icon: '🧮', title: 'Do I Need an Escort?', desc: 'Enter load dimensions' },
    { href: '/directory', icon: '🔍', title: 'Find Operators', desc: 'Verified providers near you' },
    { href: '/glossary', icon: '📖', title: 'Full Glossary', desc: 'All heavy haul terms' },
    { href: '/claim', icon: '✓', title: 'Claim Your Listing', desc: 'Free for operators' },
];

// For market/state pages
export const MARKET_NEXT_MOVES = (stateName: string, stateCode: string): NextMove[] => [
    { href: `/find/pilot-car-operator/${stateCode.toLowerCase()}`, icon: '🔍', title: `Find ${stateName} Operators`, desc: 'Verified, available now', primary: true, color: '#D4A844' },
    { href: '/claim', icon: '✓', title: 'Claim Your Profile', desc: `For ${stateName} operators`, primary: true, color: '#22C55E' },
    { href: '/loads', icon: '📋', title: 'Browse Loads', desc: 'Escort & pilot jobs' },
    { href: `/escort-requirements/${stateCode.toLowerCase()}`, icon: '⚖️', title: `${stateName} Rules`, desc: 'State escort thresholds' },
    { href: '/pricing', icon: '💎', title: 'Go Pro', desc: 'Priority placement' },
];

// For directory / search pages
export const DIRECTORY_NEXT_MOVES: NextMove[] = [
    { href: '/claim', icon: '✓', title: 'Claim Free Listing', desc: 'Get verified and visible', primary: true, color: '#D4A844' },
    { href: '/loads/post', icon: '📋', title: 'Post a Load', desc: 'Get coverage fast' },
    { href: '/corridors', icon: '🛣', title: 'Browse Corridors', desc: 'Coverage by route' },
    { href: '/pricing', icon: '💎', title: 'Priority Placement', desc: 'Pro listing visibility' },
    { href: '/available-now', icon: '🟢', title: 'Emergency Coverage', desc: 'Urgent escort needs' },
];

// For tool pages
export const TOOL_NEXT_MOVES: NextMove[] = [
    { href: '/directory', icon: '🔍', title: 'Find Operators', desc: 'Results near your route', primary: true, color: '#D4A844' },
    { href: '/loads', icon: '📋', title: 'Load Board', desc: 'Post or browse loads' },
    { href: '/escort-requirements', icon: '⚖️', title: 'State Rules', desc: 'Escort requirements' },
    { href: '/tools', icon: '🔧', title: 'More Tools', desc: 'Full tool library' },
    { href: '/claim', icon: '✓', title: 'Get Listed', desc: 'Free operator profile' },
];
