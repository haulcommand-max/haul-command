'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

/* ══════════════════════════════════════════════════════════════
   MobileBottomNav — Frame 2 Spec
   56px height + safe area. 5 tabs. Center FAB.
   Active = gold icon + gold label.
   Built from approved mobile_design_system.md
   ══════════════════════════════════════════════════════════════ */

interface NavTab {
  href: string;
  label: string;
  icon: React.ReactNode;
  match?: RegExp;
}

/* SVG icons at 22x22 — sized per design system icon-md (22px) */
const HomeIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const LoadsIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="2" />
    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
    <circle cx="5.5" cy="18.5" r="2.5" />
    <circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

const PlusIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const DirectoryIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const InboxIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const MapIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={active ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
    <line x1="9" y1="3" x2="9" y2="18" />
    <line x1="15" y1="6" x2="15" y2="21" />
  </svg>
);

const NAV_TABS: NavTab[] = [
  {
    href: '/home',
    label: 'Home',
    icon: <HomeIcon active={false} />,
    match: /^\/home$/,
  },
  {
    href: '/loads',
    label: 'Loads',
    icon: <LoadsIcon active={false} />,
    match: /^\/loads/,
  },
  // FAB goes here (index 2) — handled separately
  {
    href: '/directory',
    label: 'Directory',
    icon: <DirectoryIcon active={false} />,
    match: /^\/(directory|united-states|place|escort)/,
  },
  {
    href: '/map',
    label: 'Map',
    icon: <MapIcon active={false} />,
    match: /^\/map/,
  },
  {
    href: '/inbox',
    label: 'Inbox',
    icon: <InboxIcon active={false} />,
    match: /^\/inbox/,
  },
];

interface MobileNavProps {
  unreadCount?: number;
  onFabPress?: () => void;
}

export function MobileAppNav({ unreadCount = 0, onFabPress }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const isTabActive = (tab: NavTab) =>
    tab.match ? tab.match.test(pathname) : pathname === tab.href;

  const leftTabs = NAV_TABS.slice(0, 2);
  const rightTabs = NAV_TABS.slice(2);

  return (
    <nav className="m-bottom-nav" role="tablist" aria-label="Main navigation">
      <div className="m-bottom-nav__tabs">
        {/* Left tabs: Home, Loads */}
        {leftTabs.map((tab) => {
          const active = isTabActive(tab);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`m-bottom-nav__tab ${active ? 'm-bottom-nav__tab--active' : ''}`}
              role="tab"
              aria-selected={active}
              aria-label={tab.label}
            >
              <span className="m-bottom-nav__tab-icon">
                {tab.href === '/'
                  ? <HomeIcon active={active} />
                  : <LoadsIcon active={active} />}
              </span>
              <span className="m-bottom-nav__tab-label">{tab.label}</span>
            </Link>
          );
        })}

        {/* Center FAB */}
        <button
          className="m-bottom-nav__fab"
          onClick={onFabPress ?? (() => router.push('/loads/post'))}
          aria-label="Post a load"
        >
          <span className="m-bottom-nav__fab-circle">
            <PlusIcon />
          </span>
        </button>

        {/* Right tabs: Directory, Map, Inbox */}
        {rightTabs.map((tab) => {
          const active = isTabActive(tab);
          const isInbox = tab.href === '/inbox';
          const isMap = tab.href === '/map';
          const isDirectory = tab.href === '/directory';
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`m-bottom-nav__tab ${active ? 'm-bottom-nav__tab--active' : ''}`}
              role="tab"
              aria-selected={active}
              aria-label={tab.label}
            >
              <span className="m-bottom-nav__tab-icon" style={{ position: 'relative' }}>
                {isInbox
                  ? <InboxIcon active={active} />
                  : isMap
                  ? <MapIcon active={active} />
                  : <DirectoryIcon active={active} />}
                {isInbox && unreadCount > 0 && (
                  <span className="m-bottom-nav__badge" />
                )}
              </span>
              <span className="m-bottom-nav__tab-label">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileAppNav;
