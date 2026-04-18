import React from 'react';
import { SHELL_IA_CONFIG } from '../config/shell-ia.config';
import { HCFooterColumnGroup } from './HCFooterColumnGroup';
import { HCFooterBottomBar } from './HCFooterBottomBar';
import { HCFooterTrustMeta } from './HCFooterTrustMeta';

export interface HCFooterShellProps {
  columns?: typeof SHELL_IA_CONFIG.footer.desktopColumns;
  mode?: 'public' | 'app';
}

export function HCFooterShell({ columns = SHELL_IA_CONFIG.footer.desktopColumns, mode = 'public' }: HCFooterShellProps) {
  if (mode === 'app') return null; // Typically footer is heavily reduced or absent in app shell

  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
          <HCFooterColumnGroup columns={columns} />
        </div>
        
        <HCFooterTrustMeta />

        <div className="mt-12 pt-8 border-t border-gray-200">
          <HCFooterBottomBar />
        </div>
      </div>
    </footer>
  );
}
