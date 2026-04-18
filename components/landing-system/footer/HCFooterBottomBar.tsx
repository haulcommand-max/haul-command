import React from 'react';
import Link from 'next/link';
import { BRAND_NAME_UPPER } from '@/lib/config/brand';

export function HCFooterBottomBar() {
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
      <div>
        &copy; {currentYear} {BRAND_NAME_UPPER}. All rights reserved.
      </div>
      <div className="flex items-center gap-6">
        <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
        <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
        <Link href="/sitemap.xml" className="hover:text-gray-900 transition-colors">Sitemap</Link>
      </div>
    </div>
  );
}
