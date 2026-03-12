import React from 'react';
import type { IconDef } from './types';

/** Commerce & Marketplace icons — P2, ranks 44-52 */
export const COMMERCE_MARKETPLACE_ICONS: IconDef[] = [
  { id:'equipment_dealers', label:'Equipment Dealers', priority:'P2', group:'commerce_marketplace', rank:44,
    primaryFill:'M3 10h10v10H3z',
    paths:<><rect x="3" y="10" width="10" height="10" rx="1"/><path d="M3 14h10"/><path d="M7 10V7l3-4"/><path d="M13 7l-3-4"/><path d="M5 17h6"/><path d="M16 6h5v4"/><path d="M16 6l5 4"/><rect x="16" y="13" width="6" height="4" rx=".5"/><path d="M17 17v3"/><path d="M21 17v3"/><path d="M15.5 20h7"/></> },
  { id:'truck_dealers', label:'Truck Dealers', priority:'P2', group:'commerce_marketplace', rank:45,
    primaryFill:'M2 11h12v6H2z',
    paths:<><path d="M2 16V11a1 1 0 0 1 1-1h11v6"/><path d="M14 10v3h3l2 2v1"/><circle cx="6" cy="17" r="1.75"/><circle cx="16" cy="17" r="1.75"/><path d="M2 16h2.25"/><path d="M7.75 16h6.25"/><path d="M17.75 16h2.75"/><path d="M18 4l2 2-2 2"/><path d="M20 6h-4"/><path d="M20 2v2"/></> },
  { id:'trailer_dealers', label:'Trailer Dealers', priority:'P2', group:'commerce_marketplace', rank:46,
    primaryFill:'M1 8h18v7H1z',
    paths:<><path d="M1 15V8.5a.5.5 0 0 1 .5-.5h17a.5.5 0 0 1 .5.5V15"/><circle cx="6.5" cy="16" r="1.75"/><path d="M1 15h2.75"/><path d="M8.25 15H19"/><path d="M2.5 15v2.5"/><path d="M1 17.5h3"/><circle cx="1.5" cy="8" r=".4" fill="currentColor"/><path d="M20.5 4l2 2-2 2"/><path d="M22.5 6h-3"/><path d="M22 3v2"/></> },
  { id:'parts_accessories', label:'Parts & Accessories', priority:'P2', group:'commerce_marketplace', rank:47,
    primaryFill:'M12 12m-5 0a5 5 0 1 0 10 0a5 5 0 1 0-10 0',
    paths:<><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 4v2"/><path d="M12 18v2"/><path d="M4 12h2"/><path d="M18 12h2"/><path d="M6.34 6.34l1.42 1.42"/><path d="M16.24 16.24l1.42 1.42"/><path d="M6.34 17.66l1.42-1.42"/><path d="M16.24 7.76l1.42-1.42"/></> },
  { id:'installers', label:'Installers', priority:'P2', group:'commerce_marketplace', rank:48,
    paths:<><rect x="4" y="10" width="16" height="11" rx="1"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><path d="M10 15l2 2 2-2"/><path d="M12 17v-5"/><path d="M9 20h6"/><path d="M4 14h16"/></> },
  { id:'escort_equipment', label:'Escort Equipment', priority:'P2', group:'commerce_marketplace', rank:49,
    paths:<><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M10 2v4"/><path d="M14 2v4"/><path d="M12 6v3"/><path d="M9 9h6"/><path d="M2 14l4-2v10l-4-2z"/><path d="M22 14l-4-2v10l-4-2z"/><path d="M9 12h6v9H9z"/><path d="M9 15h6"/><path d="M9 18h6"/></> },
  { id:'used_equipment', label:'Used Equipment', priority:'P2', group:'commerce_marketplace', rank:50,
    primaryFill:'M4 8h12v10H4z',
    paths:<><rect x="4" y="8" width="12" height="10" rx="1"/><path d="M7 8V5l3-2 3 2v3"/><path d="M8 12h6"/><path d="M8 15h4"/><path d="M19 5a4 4 0 0 1 0 7"/><path d="M20.5 5.5l1-1"/><path d="M22.5 8h1"/><path d="M20.5 11.5l1 1"/><path d="M18 3.5v-1"/></> },
  { id:'auctions', label:'Auctions', priority:'P2', group:'commerce_marketplace', rank:51,
    paths:<><path d="M5 18l8-8"/><path d="M10.5 7.5l3 3"/><path d="M10.5 7.5l1.5-1.5a1.5 1.5 0 0 1 2.12 0l.88.88a1.5 1.5 0 0 1 0 2.12l-1.5 1.5"/><path d="M5 18l-1.5 1.5a1.5 1.5 0 0 0 0 2.12v0a1.5 1.5 0 0 0 2.12 0L7 20"/><path d="M2 22h5"/><path d="M16 14l5 5"/><path d="M19 16l2 2"/><rect x="15" y="2" width="7" height="5" rx="1"/><path d="M17 4h3"/></> },
  { id:'property_hosts', label:'Property Hosts', priority:'P2', group:'commerce_marketplace', rank:52,
    primaryFill:'M3 8h12v13H3z',
    paths:<><path d="M3 21V8a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v13"/><path d="M3 7l6-4 6 4"/><path d="M6 11h2v2H6z"/><path d="M10 11h2v2h-2z"/><rect x="7" y="16" width="4" height="5" rx=".5"/><path d="M18 10v11"/><path d="M18 10c0-2 2-3 4-2"/><path d="M18 14c0-2 2-3 4-2"/><circle cx="20" cy="18" r="1.5"/><path d="M15 21h7"/></> },
];
