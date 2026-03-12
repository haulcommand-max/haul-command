import React from 'react';
import type { IconDef } from './types';

/** Status Badge icons — P3, ranks 73-80 */
export const STATUS_BADGES_ICONS: IconDef[] = [
  { id:'verified', label:'Verified', priority:'P3', group:'status_badges', rank:73,
    primaryFill:'M12 2l2.5 3.5H18a1 1 0 0 1 1 1v3.5l3 2.5-3 2.5v3.5a1 1 0 0 1-1 1h-3.5L12 22l-2.5-3.5H6a1 1 0 0 1-1-1v-3.5L2 11.5l3-2.5V5.5a1 1 0 0 1 1-1h3.5z',
    paths:<><path d="M12 2l2.5 3.5H18a1 1 0 0 1 1 1v3.5l3 2.5-3 2.5v3.5a1 1 0 0 1-1 1h-3.5L12 22l-2.5-3.5H6a1 1 0 0 1-1-1v-3.5L2 11.5l3-2.5V5.5a1 1 0 0 1 1-1h3.5z"/><path d="M8.5 12l2.5 2.5 5-5"/></> },
  { id:'claimed', label:'Claimed', priority:'P3', group:'status_badges', rank:74,
    primaryFill:'M12 3l2 5h5l-4 3.5 1.5 5L12 13l-4.5 3.5L9 11.5 5 8h5z',
    paths:<><path d="M7 3v18"/><path d="M7 3h9a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H7"/><path d="M10 6h3"/><path d="M10 8.5h2"/><path d="M18 14l2 2 3-3"/><path d="M5 21h4"/></> },
  { id:'top_ranked', label:'Top Ranked', priority:'P3', group:'status_badges', rank:75,
    primaryFill:'M12 2l3 6h6l-5 4 2 6-6-3.5L6 18l2-6-5-4h6z',
    paths:<><path d="M6 21v-7"/><path d="M4 14h4v7H4z"/><path d="M10 21V10"/><path d="M8 10h4v11H8z"/><path d="M14 21v-5"/><path d="M12 16h4v5h-4z"/><path d="M18 21v-3"/><path d="M16 18h4v3h-4z"/><path d="M10 10l1-4 1 1.5L13 3l1 4.5L15 6l1 4"/><circle cx="12" cy="6" r="1" fill="currentColor"/></> },
  { id:'new_listing', label:'New Listing', priority:'P3', group:'status_badges', rank:76,
    paths:<><rect x="4" y="6" width="14" height="14" rx="1.5"/><path d="M7 10h8"/><path d="M7 13h6"/><path d="M7 16h4"/><path d="M17 2l1 3h3l-2.5 2 1 3-2.5-1.5L14.5 10l1-3L13 5h3z"/></> },
  { id:'sponsored', label:'Sponsored', priority:'P3', group:'status_badges', rank:77,
    primaryFill:'M3 5h18v14H3z',
    paths:<><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M12 8v8"/><path d="M8 12h8"/><path d="M12 5v-3"/><path d="M8 6l-1.5-2"/><path d="M16 6l1.5-2"/><circle cx="12" cy="12" r="4"/></> },
  { id:'urgent', label:'Urgent', priority:'P3', group:'status_badges', rank:78,
    paths:<><path d="M13 2L4 14h8l-1 8 9-12h-8z"/></> },
  { id:'available_now', label:'Available Now', priority:'P3', group:'status_badges', rank:79,
    paths:<><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="8" strokeDasharray="3 3"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/></> },
  { id:'premium', label:'Premium', priority:'P3', group:'status_badges', rank:80,
    primaryFill:'M4 4h16v16H4z',
    paths:<><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 14l2-5 2 3 2-3 2 5"/><path d="M8 14h8"/><path d="M10 17h4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/></> },
];
