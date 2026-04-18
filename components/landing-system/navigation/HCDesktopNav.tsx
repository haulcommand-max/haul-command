import React from 'react';
import Link from 'next/link';
import { DesktopNavGroup } from '../types/shell-ia.types';
import { ChevronDownIcon } from '@heroicons/react/24/solid';

export function HCDesktopNav({ navGroups }: { navGroups: Record<string, DesktopNavGroup> }) {
  const groups = Object.values(navGroups);

  return (
    <nav className="flex items-center gap-6">
      {groups.map((group) => (
        <div key={group.label} className="group relative">
          <button className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors py-2">
            {group.label}
            <ChevronDownIcon className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
          </button>
          
          <div className="absolute top-full left-0 mt-1 w-56 rounded-md border border-slate-800 bg-slate-950 p-2 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
            <div className="flex flex-col gap-1">
              {group.destinations.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 text-sm text-slate-400 hover:text-hc-gold-500 hover:bg-slate-900 rounded-md transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ))}
    </nav>
  );
}
