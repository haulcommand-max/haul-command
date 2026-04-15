import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BRAND_NAME_UPPER, LOGO_MARK_SRC, ALT_TEXT } from '@/lib/config/brand';
import { HCDesktopNav } from './HCDesktopNav';
import { HCShellSearchTrigger } from './HCShellSearchTrigger';
import { HCMobileNavTrigger } from './HCMobileNavTrigger';
import { HCHeaderActions } from './HCHeaderActions';
import { SHELL_IA_CONFIG } from '../config/shell-ia.config';

export interface HCGlobalHeaderProps {
  nav_groups?: typeof SHELL_IA_CONFIG.desktopNavGroups;
  header_actions?: React.ReactNode;
  mode?: 'public' | 'app';
  is_authenticated?: boolean;
}

export function HCGlobalHeader({
  nav_groups = SHELL_IA_CONFIG.desktopNavGroups,
  header_actions,
  mode = 'public',
  is_authenticated = false
}: HCGlobalHeaderProps) {
  return (
    <header className="hc-global-header w-full border-b border-hc-border bg-hc-bg sticky top-0 z-40 backdrop-blur-md bg-opacity-90">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
        
        <div className="flex items-center gap-6 xl:gap-8">
          <Link href={mode === 'app' ? "/dashboard" : "/"} className="flex items-center gap-2 group">
            <Image
              src={LOGO_MARK_SRC}
              alt={ALT_TEXT}
              width={28}
              height={28}
              priority
              className="flex-shrink-0 group-hover:opacity-90 transition-opacity"
              style={{ objectFit: 'contain', display: 'block' }}
            />
            <span className="font-bold text-sm md:text-base tracking-tight text-hc-gold-500 uppercase">
              {BRAND_NAME_UPPER}
            </span>
          </Link>

          <div className="hidden lg:block">
            <HCDesktopNav navGroups={nav_groups} />
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <HCShellSearchTrigger />
          {header_actions ? header_actions : <HCHeaderActions isAuthenticated={is_authenticated} />}
          <HCMobileNavTrigger />
        </div>
      </div>
    </header>
  );
}
