'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import HaulCommandLogo from '@/components/hc/HaulCommandLogo';
import { CabModeToggle } from '@/components/hc/CabModeToggle';

const TOOLS_MENU = [
  { href: '/tools/permit-checker/us', label: 'Permit Checker', icon: '📜', cat: 'Permits' },
  { href: '/tools/escort-rules/us',   label: 'Escort Rules',   icon: '🚓', cat: 'Compliance' },
  { href: '/tools/rate-estimator/us', label: 'Rate Estimator', icon: '💰', cat: 'Rates' },
  { href: '/tools/axle-weight',       label: 'Axle Weight',    icon: '⚖️', cat: 'Compliance' },
  { href: '/tools/broker-verify',     label: 'Broker Verify',  icon: '🛡️', cat: 'Compliance' },
  { href: '/tools/bridge-formula',    label: 'Bridge Formula', icon: '🌉', cat: 'Compliance' },
  { href: '/tools/cost-estimator',    label: 'Cost Estimator', icon: '📊', cat: 'Rates' },
  { href: '/tools/superload-meter',   label: 'Superload Meter',icon: '⚡', cat: 'Permits' },
];

const NAV_LINKS = [
  { href: '/glossary',   label: 'Glossary' },
  { href: '/directory',  label: 'Directory' },
  { href: '/requirements', label: 'Regulations' },
  { href: '/pricing',    label: 'Pricing' },
];

export default function Navbar() {
  const router = useRouter();
  const [toolsOpen, setToolsOpen] = useState(false);

  return (
    <nav className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50 overflow-visible max-w-full">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between h-14 sm:h-16 items-center min-w-0">

          {/* Left: Back + Logo */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white p-2 -ml-2 rounded-lg transition-colors"
              aria-label="Go Back"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <HaulCommandLogo variant="full" size="md" />
          </div>

          {/* Center: Nav links */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-300 hover:text-accent hover:bg-white/[0.03] px-3 py-2 rounded-lg text-sm font-medium transition-all"
              >
                {link.label}
              </Link>
            ))}

            {/* Tools dropdown */}
            <div className="relative" onMouseEnter={() => setToolsOpen(true)} onMouseLeave={() => setToolsOpen(false)}>
              <button
                className="text-gray-300 hover:text-accent hover:bg-white/[0.03] px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1"
                aria-haspopup="true"
                aria-expanded={toolsOpen}
              >
                Tools
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${toolsOpen ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>

              {toolsOpen && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-[#0d1220] border border-white/10 rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50">
                  <div className="p-3 grid grid-cols-2 gap-1">
                    {TOOLS_MENU.map((tool) => (
                      <Link
                        key={tool.href}
                        href={tool.href}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/[0.06] hover:text-accent text-gray-300 text-xs transition-colors"
                      >
                        <span>{tool.icon}</span>
                        <span className="font-medium">{tool.label}</span>
                      </Link>
                    ))}
                  </div>
                  <div className="border-t border-white/10 px-3 py-2 bg-white/[0.02]">
                    <Link href="/tools" className="text-accent text-xs font-bold hover:underline">
                      View All 26 Tools →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Auth + Claim */}
          <div className="flex items-center gap-2 sm:gap-3">
            <CabModeToggle />
            <Link
              href="/claim"
              className="hidden sm:inline-flex bg-accent text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-yellow-500 transition-colors"
            >
              Claim Profile
            </Link>
            <Link
              href="/login"
              className="text-gray-400 hover:text-white px-3 py-2 text-sm font-medium transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
