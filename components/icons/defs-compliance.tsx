import React from 'react';
import type { IconDef } from './types';

/** Compliance & Finance icons — P2, ranks 53-57 */
export const COMPLIANCE_FINANCE_ICONS: IconDef[] = [
  { id:'insurance', label:'Insurance', priority:'P2', group:'compliance_finance', rank:53,
    primaryFill:'M12 2l8 3v6c0 5.5-3.5 9.5-8 11-4.5-1.5-8-5.5-8-11V5z',
    paths:<><path d="M12 2l8 3v6c0 5.5-3.5 9.5-8 11-4.5-1.5-8-5.5-8-11V5z"/><path d="M8 10h8v5H8z"/><path d="M10 10V8a2 2 0 0 1 4 0v2"/><path d="M12 12.5v1.5"/></> },
  { id:'financing_factoring', label:'Financing & Factoring', priority:'P2', group:'compliance_finance', rank:54,
    primaryFill:'M3 4h10v14H3z',
    paths:<><rect x="3" y="4" width="10" height="14" rx="1"/><path d="M6 8h4"/><path d="M6 11h3"/><path d="M6 14h2"/><path d="M15 7l3-3 3 3"/><path d="M18 4v8"/><path d="M15 15l3 3 3-3"/><path d="M18 18v-6"/><path d="M15 12h6"/></> },
  { id:'legal_compliance', label:'Legal & Compliance', priority:'P2', group:'compliance_finance', rank:55,
    primaryFill:'M4 3h12v18H4z',
    paths:<><rect x="4" y="3" width="12" height="18" rx="1.5"/><path d="M7 7h6"/><path d="M7 10h4"/><path d="M7 13h5"/><path d="M18.5 6l2 2-2 2"/><path d="M20.5 8H18"/><path d="M18.5 13v5a1 1 0 0 1-1 1"/><path d="M18.5 18c-.5.5-1.5.5-2 0"/></> },
  { id:'permitting_authorities', label:'Permitting Authorities', priority:'P2', group:'compliance_finance', rank:56,
    primaryFill:'M4 6h16v14H4z',
    paths:<><path d="M6 2h12l2 4H4z"/><rect x="4" y="6" width="16" height="14" rx="1"/><path d="M4 10h16"/><path d="M9 6v4"/><path d="M15 6v4"/><circle cx="12" cy="15" r="3"/><path d="M12 14v2h1.5"/><path d="M7 20v2"/><path d="M17 20v2"/></> },
  { id:'inspection_services', label:'Inspection Services', priority:'P2', group:'compliance_finance', rank:57,
    primaryFill:'M5 2h10v18H5z',
    paths:<><rect x="5" y="2" width="10" height="18" rx="1.5"/><path d="M3 4h2"/><path d="M3 4v4h2"/><path d="M8 6h4"/><path d="M8 9h3"/><path d="M8 12l1.5 1.5 3-3"/><path d="M8 16h4"/><path d="M18 8l-1.5 1.5"/><path d="M18 8l1.5 1.5"/><path d="M18 5v3"/><circle cx="18" cy="15" r="3"/><path d="M18 13.5v1.5h1.5"/></> },
];
