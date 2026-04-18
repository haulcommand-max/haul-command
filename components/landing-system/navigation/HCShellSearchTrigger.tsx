import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export function HCShellSearchTrigger() {
  return (
    <button 
      className="flex items-center gap-2 p-2 rounded-md hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
      aria-label="Open search"
    >
      <MagnifyingGlassIcon className="w-5 h-5" />
      <span className="hidden sm:inline text-sm font-medium">Search</span>
    </button>
  );
}
