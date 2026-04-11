import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';

// Note: Given the context, this could also just trigger the existing HCMobileMenu logic.
export function HCMobileNavTrigger() {
  return (
    <button 
      className="lg:hidden p-2 -mr-2 rounded-md hover:bg-slate-800 transition-colors text-slate-300 hover:text-white"
      aria-label="Open mobile menu"
    >
      <Bars3Icon className="w-6 h-6" />
    </button>
  );
}
