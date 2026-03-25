import Link from 'next/link';

export const STATE_PORTALS: Record<string, { name: string; url: string; fallbackSearch: string }> = {
  AL: { name: 'Alabama DOT Permits', url: 'https://www.dot.state.al.us/oeweb/', fallbackSearch: 'Alabama oversize load permit application' },
  AK: { name: 'Alaska DOT&PF Permits', url: 'https://dot.alaska.gov/mscve/webpermit.shtml', fallbackSearch: 'Alaska oversize overweight permit' },
  AZ: { name: 'Arizona DOT Permits', url: 'https://apps.azdot.gov/ADOTNet/PermitPortal/', fallbackSearch: 'Arizona oversize overweight permit ADOT' },
  AR: { name: 'Arkansas DOT Permits', url: 'https://www.ardot.gov/divisions/highways-and-transportation/permits/', fallbackSearch: 'Arkansas oversize permit ArDOT' },
  CA: { name: 'Caltrans Permits', url: 'https://dot.ca.gov/programs/traffic-operations/transportation-permits', fallbackSearch: 'California Caltrans oversize permit' },
  CO: { name: 'Colorado CDOT Permits', url: 'https://www.codot.gov/business/permits/oversize-overweight-permits', fallbackSearch: 'Colorado oversize overweight permit CDOT' },
  CT: { name: 'Connecticut DOT Permits', url: 'https://portal.ct.gov/DOT/Permits', fallbackSearch: 'Connecticut DOT oversize load permit' },
  DE: { name: 'Delaware DOT Permits', url: 'https://deldot.gov/Business/trucking-info/index.shtml', fallbackSearch: 'Delaware oversize overweight permit DelDOT' },
  FL: { name: 'Florida DOT Permit Portal', url: 'https://www.fdot.gov/traffic/oversize-overweight/', fallbackSearch: 'Florida oversize load permit application FDOT' },
  GA: { name: 'Georgia DOT Permits', url: 'https://www.dot.ga.gov/GDOT/Pages/Oversize-Overweight.aspx', fallbackSearch: 'Georgia oversize overweight permit GDOT' },
  HI: { name: 'Hawaii DOT Permits', url: 'https://hidot.hawaii.gov/highways/other/overweight-and-oversized-vehicle-permits/', fallbackSearch: 'Hawaii oversize overweight permit' },
  ID: { name: 'Idaho ITD Permits', url: 'https://itd.idaho.gov/motor-carrier-services/', fallbackSearch: 'Idaho oversize overweight permit ITD' },
  IL: { name: 'Illinois DOT Permits', url: 'https://idot.illinois.gov/transportation-system/Doing-Business/permits', fallbackSearch: 'Illinois oversize overweight permit IDOT' },
  IN: { name: 'Indiana DOT Permits', url: 'https://www.in.gov/indot/help-and-resources/oversize-overweight-permits/', fallbackSearch: 'Indiana oversize overweight permit INDOT' },
  IA: { name: 'Iowa DOT Permits', url: 'https://iowadot.gov/mvd/ovosow', fallbackSearch: 'Iowa oversize overweight permits DOT' },
  KS: { name: 'Kansas DOT Permits', url: 'https://www.ksdot.gov/bureaus/burtrafficsaf/permitting.asp', fallbackSearch: 'Kansas oversize overweight permit KDOT' },
  KY: { name: 'Kentucky KYTC Permits', url: 'https://transportation.ky.gov/Motor-Carriers/Pages/Permits.aspx', fallbackSearch: 'Kentucky oversize overweight permit KYTC' },
  LA: { name: 'Louisiana DOTD Permits', url: 'http://wwwsp.dotd.la.gov/Inside_LaDOTD/Divisions/Engineering/Bridge_Maintenance/Pages/Permits.aspx', fallbackSearch: 'Louisiana oversize overweight permit LADOTD' },
  ME: { name: 'Maine DOT Permits', url: 'https://www.maine.gov/mdot/csd/permits/', fallbackSearch: 'Maine DOT oversize overweight permit' },
  MD: { name: 'Maryland SHA Permits', url: 'https://www.roads.maryland.gov/mdotsha/pages/Index.aspx?PageId=111', fallbackSearch: 'Maryland oversize overweight permit SHA' },
  MA: { name: 'Massachusetts DOT Permits', url: 'https://www.mass.gov/oversize-overweight-permits', fallbackSearch: 'Massachusetts oversize overweight permit MassDOT' },
  MI: { name: 'Michigan MDOT Permits', url: 'https://www.michigan.gov/mdot/travel/mobility/oversize-overweight', fallbackSearch: 'Michigan oversize overweight permit MDOT' },
  MN: { name: 'Minnesota DOT Permits', url: 'https://www.dot.state.mn.us/cvo/oversize-overweight.html', fallbackSearch: 'Minnesota oversize overweight permit MnDOT' },
  MS: { name: 'Mississippi DOT Permits', url: 'https://mdot.ms.gov/applications/permitsonline/', fallbackSearch: 'Mississippi oversize overweight permit MDOT' },
  MO: { name: 'Missouri DOT Permits', url: 'https://www.modot.org/motor-carrier-services-permits', fallbackSearch: 'Missouri oversize overweight permit MoDOT' },
  MT: { name: 'Montana DOT Permits', url: 'https://www.mdt.mt.gov/business/mcs/permits.aspx', fallbackSearch: 'Montana oversize overweight permit MDT' },
  NE: { name: 'Nebraska DOT Permits', url: 'https://dot.nebraska.gov/business-center/carrier/permits/', fallbackSearch: 'Nebraska oversize overweight permit NDOT' },
  NV: { name: 'Nevada DOT Permits', url: 'https://www.dot.nv.gov/doing-business/permits', fallbackSearch: 'Nevada oversize overweight permit NDOT' },
  NH: { name: 'New Hampshire DOT Permits', url: 'https://www.nh.gov/dot/org/operations/traffic/oversize-overweight/', fallbackSearch: 'New Hampshire oversize overweight permit NHDOT' },
  NJ: { name: 'New Jersey DOT Permits', url: 'https://www.state.nj.us/transportation/freight/sw/', fallbackSearch: 'New Jersey oversize overweight permit NJDOT' },
  NM: { name: 'New Mexico DOT Permits', url: 'https://www.dot.nm.gov/business-and-permits/nm-commercial-vehicle/', fallbackSearch: 'New Mexico oversize overweight permit NMDOT' },
  NY: { name: 'New York DOT Permits', url: 'https://www.dot.ny.gov/divisions/operating/oom/transportation-systems/permits', fallbackSearch: 'New York oversize overweight permit NYSDOT' },
  NC: { name: 'North Carolina DOT Permits', url: 'https://www.ncdot.gov/dmv/offices-services/online/Pages/oversize-overweight-permits.aspx', fallbackSearch: 'North Carolina oversize overweight permit NCDOT' },
  ND: { name: 'North Dakota DOT Permits', url: 'https://www.dot.nd.gov/divisions/maintenance/permits.htm', fallbackSearch: 'North Dakota oversize overweight permit NDDOT' },
  OH: { name: 'Ohio DOT Permits', url: 'https://www.transportation.ohio.gov/working/permits/#page=1', fallbackSearch: 'Ohio oversize overweight permit ODOT' },
  OK: { name: 'Oklahoma DOT Permits', url: 'https://oklahoma.gov/odot/programs-and-projects/oversize-overweight-permits.html', fallbackSearch: 'Oklahoma oversize overweight permit ODOT' },
  OR: { name: 'Oregon DOT Permits', url: 'https://www.oregon.gov/odot/MCT/Pages/over-dimension-permits.aspx', fallbackSearch: 'Oregon oversize overweight permit ODOT' },
  PA: { name: 'Pennsylvania DOT Permits', url: 'https://www.penndot.pa.gov/TravelInPA/Pages/Hauling-Permits.aspx', fallbackSearch: 'Pennsylvania oversize overweight permit PennDOT' },
  RI: { name: 'Rhode Island DOT Permits', url: 'https://www.dot.ri.gov/about/permits.php', fallbackSearch: 'Rhode Island oversize overweight permit RIDOT' },
  SC: { name: 'South Carolina DOT Permits', url: 'https://www.scdot.org/business/oversize-overweight-permits.aspx', fallbackSearch: 'South Carolina oversize overweight permit SCDOT' },
  SD: { name: 'South Dakota DOT Permits', url: 'https://dot.sd.gov/transportation/highways/operations/permitting', fallbackSearch: 'South Dakota oversize overweight permit SDDOT' },
  TN: { name: 'Tennessee DOT Permits', url: 'https://www.tn.gov/tdot/freight-and-logistics/oversize-overweight.html', fallbackSearch: 'Tennessee oversize overweight permit TDOT' },
  TX: { name: 'TxDMV Oversize/Overweight Permits', url: 'https://www.txdmv.gov/motor-carriers/oversize-overweight-permits', fallbackSearch: 'Texas oversize overweight permit TxDMV' },
  UT: { name: 'Utah DOT Permits', url: 'https://www.udot.utah.gov/main/f?p=100:pg:0:::1:T,V:7172', fallbackSearch: 'Utah oversize overweight permit UDOT' },
  VT: { name: 'Vermont VTrans Permits', url: 'https://vtrans.vermont.gov/highway/oversize-overweight', fallbackSearch: 'Vermont oversize overweight permit VTrans' },
  VA: { name: 'Virginia DOT Permits', url: 'https://www.dmv.virginia.gov/vehicles/hauling_permits.html', fallbackSearch: 'Virginia oversize overweight permit VDOT' },
  WA: { name: 'Washington DOT Permits', url: 'https://wsdot.wa.gov/business-wsdot/permits/commercial-vehicle-permits', fallbackSearch: 'Washington oversize overweight permit WSDOT' },
  WV: { name: 'West Virginia DOT Permits', url: 'https://transportation.wv.gov/highways/maintenance/Pages/Permit-Division.aspx', fallbackSearch: 'West Virginia oversize overweight permit WVDOT' },
  WI: { name: 'Wisconsin DOT Permits', url: 'https://wisconsindot.gov/Pages/dmv/cvo/permits/default.aspx', fallbackSearch: 'Wisconsin oversize overweight permit WisDOT' },
  WY: { name: 'Wyoming DOT Permits', url: 'https://www.dot.state.wy.us/home/trucking_commercial_vehicles/overweight-oversize-permits.html', fallbackSearch: 'Wyoming oversize overweight permit WYDOT' },
  DC: { name: 'DC DOT Permits', url: 'https://ddot.dc.gov/service/oversize-overweight-vehicle-permits', fallbackSearch: 'Washington DC oversize overweight permit DDOT' },
};

export function StatePortalLink({ stateCode }: { stateCode: string }) {
  const portal = STATE_PORTALS[stateCode.toUpperCase()];
  if (!portal) return null;

  return (
    <Link
      href={portal.url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-amber-400 hover:text-amber-300 text-sm transition-colors"
    >
      {portal.name} →
    </Link>
  );
}
