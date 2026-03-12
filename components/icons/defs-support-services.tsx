import React from 'react';
import type { IconDef } from './types';

/** Support Services icons — P1, ranks 35-43 */
export const SUPPORT_SERVICES_ICONS: IconDef[] = [
  { id:'trailer_repair', label:'Trailer Repair', priority:'P1', group:'support_services', rank:35,
    primaryFill:'M1 9h17v7H1z',
    paths:<><path d="M1 16V9a1 1 0 0 1 1-1h15a1 1 0 0 1 1 1v7"/><circle cx="7" cy="17" r="1.75"/><path d="M1 16h3.25"/><path d="M8.75 16h9.25"/><path d="M3 16v2"/><path d="M1.5 18h3"/><circle cx="2" cy="8" r=".5" fill="currentColor"/><path d="M19 5l3 3-3 3"/><path d="M22 8h-4"/><path d="M20 12l-2 2"/><path d="M20 16l-2-2"/></> },
  { id:'tire_shops', label:'Truck Tire Shops', priority:'P1', group:'support_services', rank:36,
    primaryFill:'M12 12m-8 0a8 8 0 1 0 16 0a8 8 0 1 0-16 0',
    paths:<><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="12" r=".75" fill="currentColor"/><path d="M12 7v-4"/><path d="M12 21v-4"/><path d="M7 12H3"/><path d="M21 12h-4"/></> },
  { id:'body_fabrication', label:'Body & Fabrication', priority:'P1', group:'support_services', rank:37,
    paths:<><rect x="3" y="8" width="14" height="10" rx="1"/><path d="M3 12h14"/><path d="M7 8v10"/><path d="M13 8v10"/><path d="M19 4l2 4-1 1"/><path d="M19 4l-2 4 1 1"/><path d="M18 10l1-1 1 1"/><path d="M17 12l3 1"/><path d="M17 14l3-1"/><path d="M20 16l1 3"/><path d="M22 16l-1 3"/></> },
  { id:'roadside_assistance', label:'Roadside Assistance', priority:'P1', group:'support_services', rank:38,
    primaryFill:'M12 3l9 16H3z',
    paths:<><path d="M12 3l9 16H3z"/><path d="M12 10v4"/><circle cx="12" cy="16" r=".75" fill="currentColor"/><path d="M1 21h7"/><path d="M16 21h7"/><path d="M3 21l1-2"/><path d="M21 21l-1-2"/></> },
  { id:'dispatch_services', label:'Dispatch Services', priority:'P1', group:'support_services', rank:39,
    primaryFill:'M4 6a4 4 0 0 1 8 0v3H4V6z',
    paths:<><path d="M4 6a4 4 0 0 1 8 0v3H4V6z"/><path d="M2 9h12v3a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V9z"/><path d="M8 13v2"/><path d="M12 6h4"/><path d="M14 3v6"/><circle cx="8" cy="6" r="1"/><path d="M14 14l4-2 4 2"/><path d="M14 17l4-2 4 2"/><path d="M14 20l4-2 4 2"/></> },
  { id:'recruiting_staffing', label:'Recruiting & Staffing', priority:'P1', group:'support_services', rank:40,
    paths:<><circle cx="8" cy="6" r="3"/><path d="M2 19v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><path d="M16 6h3l1.5 2h2"/><path d="M16 6v2h3l1 1v1.5"/><circle cx="19" cy="11" r="1"/><path d="M16 4h2"/><path d="M19 14v3"/><path d="M17 16h4"/></> },
  { id:'training_certification', label:'Training & Certification', priority:'P1', group:'support_services', rank:41,
    primaryFill:'M3 3h14v18H3z',
    paths:<><rect x="3" y="3" width="14" height="18" rx="1.5"/><path d="M6 7h8"/><path d="M6 10h6"/><path d="M6 13h4"/><circle cx="19.5" cy="10.5" r="3.5"/><path d="M19.5 7v3.5h2.5"/><path d="M19.5 14v2"/><path d="M17.5 17h4l-2 4-2-4z"/></> },
  { id:'survey_engineering', label:'Survey & Engineering', priority:'P1', group:'support_services', rank:42,
    paths:<><path d="M3 21l7-14 4 8 7-14"/><path d="M3 21h4"/><circle cx="10" cy="7" r="2"/><path d="M8 7h-4"/><path d="M14 7h3"/><path d="M10 5V2"/><path d="M10 9v2"/><path d="M19 9v12"/><path d="M17 9h4"/><path d="M17 15h4"/><path d="M17 21h4"/></> },
  { id:'utility_coordination', label:'Utility Coordination', priority:'P1', group:'support_services', rank:43,
    paths:<><path d="M6 2v5"/><path d="M4 4h4"/><path d="M6 7l-3 3"/><path d="M6 7l3 3"/><path d="M3 10v12"/><path d="M9 10v12"/><path d="M3 14h6"/><path d="M3 18h6"/><path d="M14 8l4-6 4 6"/><path d="M18 2v2"/><path d="M18 8v14"/><path d="M15 12h6"/><path d="M15 16h6"/></> },
];
