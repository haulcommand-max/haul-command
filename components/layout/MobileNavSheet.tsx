'use client';
// components/layout/MobileNavSheet.tsx
// Hamburger → full-screen slide-in nav sheet for mobile (≤ 767px).
// Renders: hamburger button in top header + overlay sheet when open.
// Usage: drop <MobileNavSheet /> inside the mobile-header div in (public)/layout.tsx

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_GROUPS = [
  {
    heading: 'Core OS',
    color: '#D4A844',
    links: [
      { href: '/loads', icon: '📋', label: 'Oversize Load Board' },
      { href: '/directory', icon: '🔍', label: 'Pilot Car Directory' },
      { href: '/map', icon: '🗺', label: 'Live Map' },
      { href: '/estimate', icon: '⚡', label: 'Instant Quote' },
      { href: '/leaderboards', icon: '🏆', label: 'Leaderboard' },
      { href: '/corridor', icon: '🛣', label: 'Corridors' },
    ],
  },
  {
    heading: 'Tools & Intelligence',
    color: '#9CA3AF',
    links: [
      { href: '/tools', icon: '🔧', label: 'All Tools' },
      { href: '/glossary', icon: '📖', label: 'Glossary' },
      { href: '/regulations', icon: '⚖️', label: 'Regulations' },
      { href: '/rates', icon: '💵', label: 'Pilot Car Rates' },
      { href: '/resources', icon: '📚', label: 'Resource Hub' },
      { href: '/blog', icon: '📝', label: 'Blog & Intel' },
    ],
  },
  {
    heading: 'For Operators',
    color: '#22C55E',
    links: [
      { href: '/claim', icon: '✓', label: 'Claim Your Listing — Free' },
      { href: '/roles/pilot-car-operator', icon: '🚗', label: 'Pilot Car Operator Hub' },
      { href: '/pricing', icon: '💎', label: 'Pricing & Plans' },
      { href: '/available-now', icon: '🟢', label: 'Available Now' },
    ],
  },
  {
    heading: 'For Brokers & Carriers',
    color: '#3B82F6',
    links: [
      { href: '/find/pilot-car-operator', icon: '🔍', label: 'Find Operators Fast' },
      { href: '/available-now', icon: '🚨', label: 'Emergency Coverage' },
      { href: '/advertise', icon: '📣', label: 'Advertise on Haul Command' },
    ],
  },
];

export function MobileNavSheet() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* ── Hamburger Button ─────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '5px',
          width: 40,
          height: 40,
          padding: '8px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          borderRadius: 8,
          flexShrink: 0,
        }}
      >
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            display: 'block',
            width: '100%',
            height: 2,
            background: '#F0F0F0',
            borderRadius: 2,
            transition: 'all 0.2s ease',
          }} />
        ))}
      </button>

      {/* ── Backdrop ─────────────────────────────────────── */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 998,
            backdropFilter: 'blur(4px)',
            animation: 'mns-fade 0.2s ease',
          }}
        />
      )}

      {/* ── Nav Sheet ────────────────────────────────────── */}
      <nav
        aria-label="Full site navigation"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 'min(320px, 85vw)',
          background: '#0A0D14',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          zIndex: 999,
          overflowY: 'auto',
          transform: open ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.28s cubic-bezier(0.32,0.72,0,1)',
          boxShadow: open ? '4px 0 40px rgba(0,0,0,0.6)' : 'none',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Sheet header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <Link href="/" onClick={() => setOpen(false)} style={{
            fontSize: 15,
            fontWeight: 900,
            letterSpacing: '-0.02em',
            color: '#D4A844',
            textDecoration: 'none',
          }}>
            HAUL COMMAND
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            style={{
              width: 32, height: 32,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.06)',
              border: 'none', borderRadius: 8,
              color: '#F0F0F0', cursor: 'pointer', fontSize: 18,
            }}
          >
            ✕
          </button>
        </div>

        {/* Gold CTA — Claim Your Listing */}
        <div style={{ padding: '16px 20px', flexShrink: 0 }}>
          <Link href="/claim" onClick={() => setOpen(false)} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: '13px 20px',
            background: '#D4A844',
            color: '#000',
            fontWeight: 900,
            fontSize: 14,
            borderRadius: 10,
            textDecoration: 'none',
            letterSpacing: '-0.01em',
          }}>
            ✓ Claim Your Listing — Free
          </Link>
        </div>

        {/* Nav groups */}
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 80 }}>
          {NAV_GROUPS.map(group => (
            <div key={group.heading} style={{ padding: '8px 0' }}>
              <div style={{
                padding: '6px 20px 4px',
                fontSize: 10,
                fontWeight: 700,
                color: group.color,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                opacity: 0.7,
              }}>
                {group.heading}
              </div>
              {group.links.map(link => {
                const isActive = pathname === link.href || (link.href.length > 1 && pathname?.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '11px 20px',
                      fontSize: 14,
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? '#D4A844' : 'rgba(255,255,255,0.75)',
                      textDecoration: 'none',
                      background: isActive ? 'rgba(212,168,68,0.08)' : 'transparent',
                      borderLeft: isActive ? '2px solid #D4A844' : '2px solid transparent',
                      transition: 'all 0.12s',
                    }}
                  >
                    <span style={{ fontSize: 16, lineHeight: 1 }}>{link.icon}</span>
                    {link.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer links */}
        <div style={{
          padding: '16px 20px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          gap: 16,
          flexShrink: 0,
        }}>
          {[
            { href: '/pricing', label: 'Pricing' },
            { href: '/advertise', label: 'Advertise' },
            { href: '/dashboard', label: 'Sign In' },
          ].map(l => (
            <Link key={l.href} href={l.href} onClick={() => setOpen(false)} style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.4)',
              textDecoration: 'none',
            }}>
              {l.label}
            </Link>
          ))}
        </div>
      </nav>

      <style>{`
        @keyframes mns-fade { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </>
  );
}
