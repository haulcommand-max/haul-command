import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import FAQSchema from '@/components/FAQSchema';
import BreadcrumbSchema from '@/components/BreadcrumbSchema';
import Navbar from '@/components/Navbar';

interface StateDOTInfo {
  slug: string;
  name: string;
  abbrev: string;
  dotName: string;
  dotUrl: string;
  permitPortal: string;
  phone: string;
  widthFirstEscort: string;
  widthSecondEscort: string;
  heightTrigger: string;
  lengthTrigger: string;
  weightSuperload: string;
  travelRestrictions: string;
  permitFeeRange: string;
  annualPermitAvailable: boolean;
  policeEscortRequired: string;
  specialNotes: string;
}

const US_STATES: StateDOTInfo[] = [
  { slug: 'alabama', name: 'Alabama', abbrev: 'AL', dotName: 'ALDOT', dotUrl: 'https://www.dot.state.al.us', permitPortal: 'https://www.dot.state.al.us/maweb/oversizeOverweight.html', phone: '(334) 242-6358', widthFirstEscort: '12\'', widthSecondEscort: '14\'6"', heightTrigger: '14\'6"', lengthTrigger: '75\'', weightSuperload: '120,000 lbs', travelRestrictions: 'No night travel for loads >12\' wide', permitFeeRange: '$10–$75', annualPermitAvailable: true, policeEscortRequired: 'Width >14\'6" or weight >150,000 lbs', specialNotes: 'ALDOT requires 5 business days for superload review.' },
  { slug: 'alaska', name: 'Alaska', abbrev: 'AK', dotName: 'AKDOT&PF', dotUrl: 'https://dot.alaska.gov', permitPortal: 'https://dot.alaska.gov/mscve/oversize-overweight', phone: '(907) 365-1200', widthFirstEscort: '12\'', widthSecondEscort: '16\'', heightTrigger: '15\'', lengthTrigger: '110\'', weightSuperload: '200,000 lbs', travelRestrictions: 'Seasonal weight restrictions on thaw-susceptible roads', permitFeeRange: '$25–$150', annualPermitAvailable: true, policeEscortRequired: 'Width >16\' or length >150\'', specialNotes: 'Spring breakup weight restrictions March–May.' },
  { slug: 'arizona', name: 'Arizona', abbrev: 'AZ', dotName: 'ADOT', dotUrl: 'https://azdot.gov', permitPortal: 'https://azdot.gov/motor-vehicles/commercial-vehicles/permits', phone: '(602) 712-8141', widthFirstEscort: '12\'', widthSecondEscort: '16\'', heightTrigger: '14\'6"', lengthTrigger: '95\'', weightSuperload: '160,000 lbs', travelRestrictions: 'No travel on I-10 during peak hours for superloads', permitFeeRange: '$15–$90', annualPermitAvailable: true, policeEscortRequired: 'Width >16\' or weight >200,000 lbs', specialNotes: 'Desert heat restrictions may apply May–September.' },
  { slug: 'arkansas', name: 'Arkansas', abbrev: 'AR', dotName: 'ArDOT', dotUrl: 'https://www.ardot.gov', permitPortal: 'https://www.ardot.gov/divisions/system-operations/permit-services/', phone: '(501) 569-2381', widthFirstEscort: '12\'', widthSecondEscort: '14\'', heightTrigger: '14\'6"', lengthTrigger: '100\'', weightSuperload: '120,000 lbs', travelRestrictions: 'No movement 30 min before sunset to 30 min after sunrise', permitFeeRange: '$10–$50', annualPermitAvailable: true, policeEscortRequired: 'Width >14\' or at ArDOT discretion', specialNotes: 'Seasonal weight limits on secondary roads.' },
  { slug: 'california', name: 'California', abbrev: 'CA', dotName: 'Caltrans', dotUrl: 'https://dot.ca.gov', permitPortal: 'https://dot.ca.gov/programs/traffic-operations/transportation-permits', phone: '(916) 654-4793', widthFirstEscort: '10\'', widthSecondEscort: '12\'', heightTrigger: '14\'6"', lengthTrigger: '75\'', weightSuperload: '110,000 lbs', travelRestrictions: 'No movement during commute hours on urban freeways', permitFeeRange: '$18–$270', annualPermitAvailable: true, policeEscortRequired: 'Width >12\' or CHP discretion', specialNotes: 'Caltrans has the strictest permit processing in the US (5–15 business days).' },
  { slug: 'colorado', name: 'Colorado', abbrev: 'CO', dotName: 'CDOT', dotUrl: 'https://www.codot.gov', permitPortal: 'https://www.codot.gov/business/permits/oversize-overweight', phone: '(303) 757-9539', widthFirstEscort: '12\'', widthSecondEscort: '16\'', heightTrigger: '14\'6"', lengthTrigger: '95\'', weightSuperload: '125,000 lbs', travelRestrictions: 'I-70 mountain corridor restrictions for wide loads', permitFeeRange: '$15–$125', annualPermitAvailable: true, policeEscortRequired: 'Width >16\' or weight >200,000 lbs', specialNotes: 'Mountain passes have specific clearance and grade restrictions.' },
  { slug: 'connecticut', name: 'Connecticut', abbrev: 'CT', dotName: 'CTDOT', dotUrl: 'https://portal.ct.gov/dot', permitPortal: 'https://portal.ct.gov/DOT/Oversize-and-Overweight-Permits', phone: '(860) 594-2614', widthFirstEscort: '12\'', widthSecondEscort: '14\'', heightTrigger: '13\'6"', lengthTrigger: '75\'', weightSuperload: '100,000 lbs', travelRestrictions: 'No travel on Route 15 (Merritt Parkway) for oversize', permitFeeRange: '$35–$100', annualPermitAvailable: true, policeEscortRequired: 'Width >14\' or local police jurisdictions', specialNotes: 'Many low bridges — height pole mandatory for loads >13\'.' },
  { slug: 'delaware', name: 'Delaware', abbrev: 'DE', dotName: 'DelDOT', dotUrl: 'https://deldot.gov', permitPortal: 'https://deldot.gov/Business/Permits/oversize-overweight', phone: '(302) 760-2080', widthFirstEscort: '12\'', widthSecondEscort: '14\'', heightTrigger: '14\'', lengthTrigger: '75\'', weightSuperload: '100,000 lbs', travelRestrictions: 'No oversize travel on DE-1 during peak hours', permitFeeRange: '$25–$80', annualPermitAvailable: true, policeEscortRequired: 'Width >14\' or weight >120,000 lbs', specialNotes: 'Small state — most moves cross into MD/PA, requiring multi-state permits.' },
  { slug: 'florida', name: 'Florida', abbrev: 'FL', dotName: 'FDOT', dotUrl: 'https://www.fdot.gov', permitPortal: 'https://www.fdot.gov/maintenance/os-ow.shtm', phone: '(850) 410-5777', widthFirstEscort: '12\'', widthSecondEscort: '14\'6"', heightTrigger: '14\'6"', lengthTrigger: '95\'', weightSuperload: '160,000 lbs', travelRestrictions: 'No movement on I-4 construction zones without special approval', permitFeeRange: '$10–$200', annualPermitAvailable: true, policeEscortRequired: 'Width >14\'6" or weight >200,000 lbs', specialNotes: 'Florida is one of the busiest OSOW states. Permit processing is typically 3–5 days.' },
  { slug: 'georgia', name: 'Georgia', abbrev: 'GA', dotName: 'GDOT', dotUrl: 'https://www.dot.ga.gov', permitPortal: 'https://www.dot.ga.gov/PartnerSmart/Motorcarrier/Pages/default.aspx', phone: '(404) 635-8051', widthFirstEscort: '12\'', widthSecondEscort: '14\'', heightTrigger: '14\'6"', lengthTrigger: '100\'', weightSuperload: '132,000 lbs', travelRestrictions: 'No movement during Atlanta rush hours (7-9AM, 4-7PM) on I-75/I-85', permitFeeRange: '$10–$100', annualPermitAvailable: true, policeEscortRequired: 'Width >14\' or GSP discretion', specialNotes: 'Savannah port corridor is high-volume for project cargo.' },
  { slug: 'hawaii', name: 'Hawaii', abbrev: 'HI', dotName: 'HDOT', dotUrl: 'https://hidot.hawaii.gov', permitPortal: 'https://hidot.hawaii.gov/highways/vehicle-permits/', phone: '(808) 587-6317', widthFirstEscort: '12\'', widthSecondEscort: '14\'', heightTrigger: '14\'', lengthTrigger: '65\'', weightSuperload: '80,000 lbs', travelRestrictions: 'Inter-island transport requires barge coordination', permitFeeRange: '$25–$100', annualPermitAvailable: false, policeEscortRequired: 'Most oversize loads on H-1', specialNotes: 'Island geography means very limited route alternatives. Barge transport between islands.' },
  { slug: 'idaho', name: 'Idaho', abbrev: 'ID', dotName: 'ITD', dotUrl: 'https://itd.idaho.gov', permitPortal: 'https://itd.idaho.gov/motor-vehicles/permits/', phone: '(208) 334-8420', widthFirstEscort: '12\'', widthSecondEscort: '14\'6"', heightTrigger: '14\'6"', lengthTrigger: '105\'', weightSuperload: '120,000 lbs', travelRestrictions: 'Seasonal weight limits on designated routes', permitFeeRange: '$20–$75', annualPermitAvailable: true, policeEscortRequired: 'Width >14\'6" or weight >150,000 lbs', specialNotes: 'Wind energy corridor through Snake River Valley is high-demand.' },
  { slug: 'illinois', name: 'Illinois', abbrev: 'IL', dotName: 'IDOT', dotUrl: 'https://idot.illinois.gov', permitPortal: 'https://idot.illinois.gov/transportation-system/local-transportation-partners/commercial-vehicle-permits', phone: '(217) 785-1477', widthFirstEscort: '12\'', widthSecondEscort: '14\'6"', heightTrigger: '14\'6"', lengthTrigger: '85\'', weightSuperload: '120,000 lbs', travelRestrictions: 'No Chicago expressway travel during rush hours', permitFeeRange: '$20–$150', annualPermitAvailable: true, policeEscortRequired: 'Width >14\'6" or at IDOT discretion', specialNotes: 'Chicago metro requires specific route planning due to low viaducts.' },
  { slug: 'indiana', name: 'Indiana', abbrev: 'IN', dotName: 'INDOT', dotUrl: 'https://www.in.gov/indot', permitPortal: 'https://www.in.gov/indot/files/overweight-oversize-permits.htm', phone: '(317) 615-7320', widthFirstEscort: '12\'', widthSecondEscort: '14\'6"', heightTrigger: '14\'6"', lengthTrigger: '100\'', weightSuperload: '108,000 lbs', travelRestrictions: 'No Sunday travel for superloads', permitFeeRange: '$15–$100', annualPermitAvailable: true, policeEscortRequired: 'Width >14\'6" or weight >150,000 lbs', specialNotes: 'Gary/NW Indiana is a major staging area for Midwest wind energy transport.' },
  { slug: 'iowa', name: 'Iowa', abbrev: 'IA', dotName: 'Iowa DOT', dotUrl: 'https://iowadot.gov', permitPortal: 'https://iowadot.gov/mvd/motorcarriers/oversize-overweight', phone: '(515) 237-3264', widthFirstEscort: '12\'', widthSecondEscort: '14\'6"', heightTrigger: '14\'6"', lengthTrigger: '100\'', weightSuperload: '120,000 lbs', travelRestrictions: 'Seasonal weight limits on secondary roads', permitFeeRange: '$10–$50', annualPermitAvailable: true, policeEscortRequired: 'Width >14\'6" or weight >150,000 lbs', specialNotes: 'Major wind energy corridor — high demand for blade escorts.' },
  { slug: 'kansas', name: 'Kansas', abbrev: 'KS', dotName: 'KDOT', dotUrl: 'https://www.ksdot.gov', permitPortal: 'https://www.ksdot.gov/PermitsRestrictions.asp', phone: '(785) 296-3618', widthFirstEscort: '12\'', widthSecondEscort: '16\'', heightTrigger: '15\'', lengthTrigger: '110\'', weightSuperload: '120,000 lbs', travelRestrictions: 'No I-70 travel during high wind warnings', permitFeeRange: '$15–$60', annualPermitAvailable: true, policeEscortRequired: 'Width >16\' or weight >200,000 lbs', specialNotes: 'Wind farm construction in western Kansas drives seasonal demand.' },
  { slug: 'kentucky', name: 'Kentucky', abbrev: 'KY', dotName: 'KYTC', dotUrl: 'https://transportation.ky.gov', permitPortal: 'https://transportation.ky.gov/Motor-Carriers/Pages/Overweight-Overdimensional-Permits.aspx', phone: '(502) 564-7000', widthFirstEscort: '12\'', widthSecondEscort: '14\'', heightTrigger: '14\'6"', lengthTrigger: '90\'', weightSuperload: '120,000 lbs', travelRestrictions: 'Mountain parkway restrictions for wide loads', permitFeeRange: '$15–$60', annualPermitAvailable: true, policeEscortRequired: 'Width >14\' or KSP discretion', specialNotes: 'Appalachian terrain creates specific clearance challenges.' },
  { slug: 'louisiana', name: 'Louisiana', abbrev: 'LA', dotName: 'LADOTD', dotUrl: 'https://wwwsp.dotd.la.gov', permitPortal: 'https://wwwsp.dotd.la.gov/Inside_LaDOTD/Divisions/Operations/Permit_Unit/Pages/default.aspx', phone: '(225) 379-1436', widthFirstEscort: '12\'', widthSecondEscort: '14\'6"', heightTrigger: '14\'6"', lengthTrigger: '100\'', weightSuperload: '120,000 lbs', travelRestrictions: 'Hurricane season may cause route closures June–November', permitFeeRange: '$10–$100', annualPermitAvailable: true, policeEscortRequired: 'Width >14\'6" or weight >150,000 lbs', specialNotes: 'Gulf Coast petrochemical loads are major market. Baton Rouge area high-demand.' },
  { slug: 'maine', name: 'Maine', abbrev: 'ME', dotName: 'MaineDOT', dotUrl: 'https://www.maine.gov/mdot', permitPortal: 'https://www.maine.gov/mdot/csd/permits/', phone: '(207) 624-3600', widthFirstEscort: '12\'', widthSecondEscort: '14\'', heightTrigger: '14\'', lengthTrigger: '75\'', weightSuperload: '100,000 lbs', travelRestrictions: 'Spring weight limits on posted roads', permitFeeRange: '$20–$75', annualPermitAvailable: true, policeEscortRequired: 'Width >14\' or at DOT discretion', specialNotes: 'Wind energy projects along coast drive demand.' },
  { slug: 'maryland', name: 'Maryland', abbrev: 'MD', dotName: 'MDOT SHA', dotUrl: 'https://www.roads.maryland.gov', permitPortal: 'https://www.roads.maryland.gov/pages/hauling-permits.aspx', phone: '(410) 582-5734', widthFirstEscort: '12\'', widthSecondEscort: '14\'', heightTrigger: '14\'', lengthTrigger: '75\'', weightSuperload: '100,000 lbs', travelRestrictions: 'No travel on I-95 corridor during rush hours', permitFeeRange: '$25–$100', annualPermitAvailable: true, policeEscortRequired: 'Width >14\' or at MSP discretion', specialNotes: 'Baltimore port area and I-95 corridor are high-volume.' },
  { slug: 'massachusetts', name: 'Massachusetts', abbrev: 'MA', dotName: 'MassDOT', dotUrl: 'https://www.mass.gov/massdot', permitPortal: 'https://www.mass.gov/oversize-and-overweight-permits', phone: '(857) 368-8066', widthFirstEscort: '11\'', widthSecondEscort: '13\'', heightTrigger: '13\'6"', lengthTrigger: '70\'', weightSuperload: '100,000 lbs', travelRestrictions: 'Very strict time-of-day restrictions on Mass Pike', permitFeeRange: '$30–$200', annualPermitAvailable: true, policeEscortRequired: 'Most oversize loads require police in metro areas', specialNotes: 'One of the most restrictive states — low bridges, tight roads, high escort requirements.' },
  { slug: 'michigan', name: 'Michigan', abbrev: 'MI', dotName: 'MDOT', dotUrl: 'https://www.michigan.gov/mdot', permitPortal: 'https://www.michigan.gov/mdot/programs/highway-programs/permits', phone: '(517) 241-3499', widthFirstEscort: '12\'', widthSecondEscort: '14\'6"', heightTrigger: '14\'6"', lengthTrigger: '85\'', weightSuperload: '154,000 lbs', travelRestrictions: 'Spring weight restrictions April–May', permitFeeRange: '$15–$100', annualPermitAvailable: true, policeEscortRequired: 'Width >14\'6" or at MSP discretion', specialNotes: 'Michigan allows highest axle weights in US under designated axle configurations.' },
  { slug: 'minnesota', name: 'Minnesota', abbrev: 'MN', dotName: 'MnDOT', dotUrl: 'https://www.dot.state.mn.us', permitPortal: 'https://www.dot.state.mn.us/cvo/oversize-overweight/', phone: '(651) 296-6000', widthFirstEscort: '12\'', widthSecondEscort: '14\'6"', heightTrigger: '14\'6"', lengthTrigger: '95\'', weightSuperload: '120,000 lbs', travelRestrictions: 'Spring load restrictions on weight-restricted routes', permitFeeRange: '$15–$75', annualPermitAvailable: true, policeEscortRequired: 'Width >14\'6" or weight >150,000 lbs', specialNotes: 'Major wind energy corridor in southern Minnesota.' },
  { slug: 'mississippi', name: 'Mississippi', abbrev: 'MS', dotName: 'MDOT', dotUrl: 'https://mdot.ms.gov', permitPortal: 'https://mdot.ms.gov/portal/oversize-overweight-permits', phone: '(601) 359-7113', widthFirstEscort: '12\'', widthSecondEscort: '14\'', heightTrigger: '14\'6"', lengthTrigger: '100\'', weightSuperload: '120,000 lbs', travelRestrictions: 'No night travel for loads >14\' wide', permitFeeRange: '$10–$50', annualPermitAvailable: true, policeEscortRequired: 'Width >14\' or at MHP discretion', specialNotes: 'Gulf Coast industrial loads and Hattiesburg corridor.' },
  { slug: 'missouri', name: 'Missouri', abbrev: 'MO', dotName: 'MoDOT', dotUrl: 'https://www.modot.org', permitPortal: 'https://www.modot.org/oversize-overweight-permits', phone: '(573) 526-6990', widthFirstEscort: '12\'', widthSecondEscort: '14\'6"', heightTrigger: '15\'', lengthTrigger: '100\'', weightSuperload: '120,000 lbs', travelRestrictions: 'No I-70 travel during high wind for wide loads', permitFeeRange: '$15–$75', annualPermitAvailable: true, policeEscortRequired: 'Width >14\'6" or MSHP discretion', specialNotes: 'Kansas City and St. Louis are major staging hubs.' },
  { slug: 'montana', name: 'Montana', abbrev: 'MT', dotName: 'MDT', dotUrl: 'https://www.mdt.mt.gov', permitPortal: 'https://www.mdt.mt.gov/business/permits/', phone: '(406) 444-7262', widthFirstEscort: '12\'', widthSecondEscort: '16\'', heightTrigger: '15\'', lengthTrigger: '110\'', weightSuperload: '160,000 lbs', travelRestrictions: 'Mountain pass restrictions for wide loads', permitFeeRange: '$20–$100', annualPermitAvailable: true, policeEscortRequired: 'Width >16\' or weight >200,000 lbs', specialNotes: 'Wind energy and mining drive escort demand. Long distances between staging areas.' },
  { slug: 'nebraska', name: 'Nebraska', abbrev: 'NE', dotName: 'NDOT', dotUrl: 'https://dot.nebraska.gov', permitPortal: 'https://dot.nebraska.gov/business-center/permits/', phone: '(402) 471-0034', widthFirstEscort: '12\'', widthSecondEscort: '14\'6"', heightTrigger: '15\'', lengthTrigger: '100\'', weightSuperload: '120,000 lbs', travelRestrictions: 'I-80 wind restrictions for tall loads', permitFeeRange: '$15–$50', annualPermitAvailable: true, policeEscortRequired: 'Width >14\'6" or weight >150,000 lbs', specialNotes: 'Major wind turbine corridor through central Nebraska.' },
  { slug: 'nevada', name: 'Nevada', abbrev: 'NV', dotName: 'NDOT', dotUrl: 'https://www.dot.nv.gov', permitPortal: 'https://www.dot.nv.gov/doing-business/motor-carrier/permits', phone: '(775) 888-7410', widthFirstEscort: '12\'', widthSecondEscort: '16\'', heightTrigger: '14\'6"', lengthTrigger: '95\'', weightSuperload: '130,000 lbs', travelRestrictions: 'No travel on Las Vegas Strip for oversize', permitFeeRange: '$15–$100', annualPermitAvailable: true, policeEscortRequired: 'Width >16\' or NHP discretion', specialNotes: 'Solar farm installations driving demand in southern Nevada.' },
  { slug: 'new-hampshire', name: 'New Hampshire', abbrev: 'NH', dotName: 'NHDOT', dotUrl: 'https://www.nh.gov/dot', permitPortal: 'https://www.nh.gov/dot/org/operations/oversize/', phone: '(603) 271-2691', widthFirstEscort: '12\'', widthSecondEscort: '14\'', heightTrigger: '13\'6"', lengthTrigger: '75\'', weightSuperload: '100,000 lbs', travelRestrictions: 'Covered bridge restrictions', permitFeeRange: '$20–$75', annualPermitAvailable: true, policeEscortRequired: 'Width >14\' on state roads', specialNotes: 'Historic covered bridges require advance clearance verification.' },
  { slug: 'new-jersey', name: 'New Jersey', abbrev: 'NJ', dotName: 'NJDOT', dotUrl: 'https://www.nj.gov/transportation', permitPortal: 'https://www.nj.gov/transportation/freight/osow/', phone: '(609) 530-2027', widthFirstEscort: '12\'', widthSecondEscort: '14\'', heightTrigger: '13\'6"', lengthTrigger: '75\'', weightSuperload: '100,000 lbs', travelRestrictions: 'No NJ Turnpike travel during peak hours for most oversize', permitFeeRange: '$25–$200', annualPermitAvailable: true, policeEscortRequired: 'Almost all oversize loads require NJSP escort', specialNotes: 'One of the most restrictive states. NJ Turnpike and Parkway have strict protocols.' },
  { slug: 'new-mexico', name: 'New Mexico', abbrev: 'NM', dotName: 'NMDOT', dotUrl: 'https://dot.nm.gov', permitPortal: 'https://dot.nm.gov/business-support/commercial-vehicles/oversize-overweight/', phone: '(505) 795-1401', widthFirstEscort: '12\'', widthSecondEscort: '16\'', heightTrigger: '14\'6"', lengthTrigger: '110\'', weightSuperload: '120,000 lbs', travelRestrictions: 'High wind restrictions on I-25 and I-40', permitFeeRange: '$15–$75', annualPermitAvailable: true, policeEscortRequired: 'Width >16\' or weight >150,000 lbs', specialNotes: 'Wind energy corridor through eastern NM is growing rapidly.' },
  { slug: 'new-york', name: 'New York', abbrev: 'NY', dotName: 'NYSDOT', dotUrl: 'https://www.dot.ny.gov', permitPortal: 'https://www.dot.ny.gov/portal/page/portal/divisions/operating/oom/oversize-overweight', phone: '(518) 457-6512', widthFirstEscort: '12\'', widthSecondEscort: '14\'', heightTrigger: '13\'6"', lengthTrigger: '75\'', weightSuperload: '100,000 lbs', travelRestrictions: 'No NYC entry without special NYC DOT approval', permitFeeRange: '$25–$250', annualPermitAvailable: true, policeEscortRequired: 'Width >14\' and in many county jurisdictions', specialNotes: 'NYC is effectively a no-go zone for most oversize loads. Upstate has fewer restrictions.' },
  { slug: 'north-carolina', name: 'North Carolina', abbrev: 'NC', dotName: 'NCDOT', dotUrl: 'https://www.ncdot.gov', permitPortal: 'https://www.ncdot.gov/dmv/offices-services/online/Pages/overweight-oversize-permits.aspx', phone: '(919) 861-3022', widthFirstEscort: '12\'', widthSecondEscort: '14\'', heightTrigger: '14\'6"', lengthTrigger: '100\'', weightSuperload: '132,000 lbs', travelRestrictions: 'I-40/I-85 corridor restrictions during rush hours', permitFeeRange: '$10–$100', annualPermitAvailable: true, policeEscortRequired: 'Width >14\' or NCSHP discretion', specialNotes: 'Charlotte metro and coastal wind energy are high-demand corridors.' },
  { slug: 'north-dakota', name: 'North Dakota', abbrev: 'ND', dotName: 'NDDOT', dotUrl: 'https://www.dot.nd.gov', permitPortal: 'https://www.dot.nd.gov/divisions/mv/oversize-overweight.htm', phone: '(701) 328-2621', widthFirstEscort: '12\'', widthSecondEscort: '16\'', heightTrigger: '15\'', lengthTrigger: '110\'', weightSuperload: '200,000 lbs', travelRestrictions: 'Spring load restrictions', permitFeeRange: '$20–$75', annualPermitAvailable: true, policeEscortRequired: 'Width >16\' or weight >250,000 lbs', specialNotes: 'Oil field equipment and wind turbine transport drive major demand.' },
  { slug: 'ohio', name: 'Ohio', abbrev: 'OH', dotName: 'ODOT', dotUrl: 'https://www.transportation.ohio.gov', permitPortal: 'https://www.transportation.ohio.gov/business/motor-carriers/permits', phone: '(614) 351-2300', widthFirstEscort: '12\'', widthSecondEscort: '14\'6"', heightTrigger: '14\'6"', lengthTrigger: '90\'', weightSuperload: '120,000 lbs', travelRestrictions: 'Cleveland/Columbus metro rush hour restrictions', permitFeeRange: '$20–$100', annualPermitAvailable: true, policeEscortRequired: 'Width >14\'6" or OSHP discretion', specialNotes: 'Ohio Turnpike has separate permit process from ODOT.' },
  { slug: 'oklahoma', name: 'Oklahoma', abbrev: 'OK', dotName: 'ODOT', dotUrl: 'https://oklahoma.gov/odot', permitPortal: 'https://oklahoma.gov/odot/operations/motor-carrier-services.html', phone: '(405) 521-6000', widthFirstEscort: '12\'', widthSecondEscort: '14\'6"', heightTrigger: '15\'', lengthTrigger: '100\'', weightSuperload: '120,000 lbs', travelRestrictions: 'Tornado season may cause route closures', permitFeeRange: '$15–$50', annualPermitAvailable: true, policeEscortRequired: 'Width >14\'6" or OHP discretion', specialNotes: 'Major wind energy corridor in western Oklahoma. Tulsa and OKC are staging hubs.' },
  { slug: 'oregon', name: 'Oregon', abbrev: 'OR', dotName: 'ODOT', dotUrl: 'https://www.oregon.gov/odot', permitPortal: 'https://www.oregon.gov/odot/MCT/Pages/Over-Dimension-Permit.aspx', phone: '(503) 378-6699', widthFirstEscort: '10\'', widthSecondEscort: '14\'', heightTrigger: '14\'6"', lengthTrigger: '105\'', weightSuperload: '98,000 lbs', travelRestrictions: 'Columbia Gorge wind restrictions', permitFeeRange: '$20–$120', annualPermitAvailable: true, policeEscortRequired: 'Width >14\' or at ODOT/OSP discretion', specialNotes: 'Wind energy and timber industry drive demand. OR accepts WA ESC card.' },
  { slug: 'pennsylvania', name: 'Pennsylvania', abbrev: 'PA', dotName: 'PennDOT', dotUrl: 'https://www.penndot.pa.gov', permitPortal: 'https://www.penndot.pa.gov/Doing-Business/Pages/Motor-Carrier-Services.aspx', phone: '(717) 787-7445', widthFirstEscort: '12\'', widthSecondEscort: '14\'', heightTrigger: '14\'', lengthTrigger: '85\'', weightSuperload: '120,000 lbs', travelRestrictions: 'PA Turnpike has separate permit process', permitFeeRange: '$25–$150', annualPermitAvailable: true, policeEscortRequired: 'Width >14\' or at PSP discretion', specialNotes: 'Appalachian terrain and many low bridges. PA Turnpike requires separate permits.' },
  { slug: 'rhode-island', name: 'Rhode Island', abbrev: 'RI', dotName: 'RIDOT', dotUrl: 'https://www.dot.ri.gov', permitPortal: 'https://www.dot.ri.gov/permits/', phone: '(401) 222-2481', widthFirstEscort: '12\'', widthSecondEscort: '14\'', heightTrigger: '13\'6"', lengthTrigger: '73\'', weightSuperload: '80,000 lbs', travelRestrictions: 'Very limited route options on I-95', permitFeeRange: '$25–$75', annualPermitAvailable: true, policeEscortRequired: 'Most oversize loads require RISP escort', specialNotes: 'Smallest state — limited route alternatives. Plan for multi-state coordination.' },
  { slug: 'south-carolina', name: 'South Carolina', abbrev: 'SC', dotName: 'SCDOT', dotUrl: 'https://www.scdot.org', permitPortal: 'https://www.scdot.org/travel/permits-oversize.aspx', phone: '(803) 737-6748', widthFirstEscort: '12\'', widthSecondEscort: '14\'', heightTrigger: '14\'6"', lengthTrigger: '100\'', weightSuperload: '120,000 lbs', travelRestrictions: 'Charleston port road restrictions', permitFeeRange: '$15–$75', annualPermitAvailable: true, policeEscortRequired: 'Width >14\' or at SCHP discretion', specialNotes: 'Charleston port drives heavy equipment imports. Growing manufacturing base.' },
  { slug: 'south-dakota', name: 'South Dakota', abbrev: 'SD', dotName: 'SDDOT', dotUrl: 'https://dot.sd.gov', permitPortal: 'https://dot.sd.gov/doing-business/motor-carriers/permits', phone: '(605) 773-3697', widthFirstEscort: '12\'', widthSecondEscort: '16\'', heightTrigger: '15\'', lengthTrigger: '110\'', weightSuperload: '200,000 lbs', travelRestrictions: 'Spring load restrictions on weight-posted routes', permitFeeRange: '$15–$50', annualPermitAvailable: true, policeEscortRequired: 'Width >16\' or weight >200,000 lbs', specialNotes: 'Wind energy corridor and agriculture equipment transport.' },
  { slug: 'tennessee', name: 'Tennessee', abbrev: 'TN', dotName: 'TDOT', dotUrl: 'https://www.tn.gov/tdot', permitPortal: 'https://www.tn.gov/tdot/multimodal-transportation-resources/motor-carrier-services/overweight-overdimensional-permits.html', phone: '(615) 399-4260', widthFirstEscort: '12\'', widthSecondEscort: '14\'', heightTrigger: '14\'6"', lengthTrigger: '95\'', weightSuperload: '120,000 lbs', travelRestrictions: 'Nashville and Memphis metro rush hour restrictions', permitFeeRange: '$10–$75', annualPermitAvailable: true, policeEscortRequired: 'Width >14\' or THP discretion', specialNotes: 'Nashville growth and Memphis logistics hub drive escort demand.' },
  { slug: 'texas', name: 'Texas', abbrev: 'TX', dotName: 'TxDOT', dotUrl: 'https://www.txdot.gov', permitPortal: 'https://www.txdot.gov/business/oversize-overweight-permits.html', phone: '(800) 299-1700', widthFirstEscort: '12\'', widthSecondEscort: '16\'', heightTrigger: '15\'', lengthTrigger: '110\'', weightSuperload: '200,000 lbs', travelRestrictions: 'Houston metro restrictions during rush hours', permitFeeRange: '$10–$250', annualPermitAvailable: true, policeEscortRequired: 'Width >16\' or weight >250,000 lbs', specialNotes: 'Texas is the #1 state for OSOW volume. TxDMV permit system is online. Permian Basin oil & gas and Gulf Coast petrochemical are major corridors.' },
  { slug: 'utah', name: 'Utah', abbrev: 'UT', dotName: 'UDOT', dotUrl: 'https://www.udot.utah.gov', permitPortal: 'https://www.udot.utah.gov/connect/doing-business-with-udot/motor-carrier/', phone: '(801) 965-4892', widthFirstEscort: '12\'', widthSecondEscort: '16\'', heightTrigger: '14\'6"', lengthTrigger: '95\'', weightSuperload: '120,000 lbs', travelRestrictions: 'Canyon road restrictions for wide loads', permitFeeRange: '$15–$75', annualPermitAvailable: true, policeEscortRequired: 'Width >16\' or UHP discretion', specialNotes: 'Mountain canyons create specific escort challenges. Salt Lake City is a staging hub.' },
  { slug: 'vermont', name: 'Vermont', abbrev: 'VT', dotName: 'VTrans', dotUrl: 'https://vtrans.vermont.gov', permitPortal: 'https://vtrans.vermont.gov/operations/oversize-overweight-permits', phone: '(802) 879-5667', widthFirstEscort: '12\'', widthSecondEscort: '14\'', heightTrigger: '13\'6"', lengthTrigger: '75\'', weightSuperload: '100,000 lbs', travelRestrictions: 'Covered bridge restrictions', permitFeeRange: '$20–$75', annualPermitAvailable: true, policeEscortRequired: 'Width >14\' or at VT State Police discretion', specialNotes: 'Historic covered bridges and narrow rural roads. Very limited route alternatives.' },
  { slug: 'virginia', name: 'Virginia', abbrev: 'VA', dotName: 'VDOT', dotUrl: 'https://www.virginiadot.org', permitPortal: 'https://www.virginiadot.org/business/resources/hauling_mobility/default.asp', phone: '(804) 497-0000', widthFirstEscort: '12\'', widthSecondEscort: '14\'', heightTrigger: '14\'6"', lengthTrigger: '85\'', weightSuperload: '115,000 lbs', travelRestrictions: 'No I-95/I-64 Hampton Roads travel during rush hours', permitFeeRange: '$20–$100', annualPermitAvailable: true, policeEscortRequired: 'Width >14\' or at VSP discretion', specialNotes: 'Hampton Roads/Norfolk port area is high-volume. DC metro restrictions apply.' },
  { slug: 'washington', name: 'Washington', abbrev: 'WA', dotName: 'WSDOT', dotUrl: 'https://wsdot.wa.gov', permitPortal: 'https://wsdot.wa.gov/commercial-travel/permits-regulations/oversize-overweight-permits', phone: '(360) 704-6340', widthFirstEscort: '10\'', widthSecondEscort: '14\'', heightTrigger: '14\'6"', lengthTrigger: '95\'', weightSuperload: '200,000 lbs', travelRestrictions: 'I-5 Seattle metro restrictions during peak hours', permitFeeRange: '$20–$150', annualPermitAvailable: true, policeEscortRequired: 'Width >14\' or WSP discretion', specialNotes: 'Washington ESC (Evergreen Safety Council) card is the gold standard for PEVO certification. Accepted in 14+ states.' },
  { slug: 'west-virginia', name: 'West Virginia', abbrev: 'WV', dotName: 'WVDOT', dotUrl: 'https://transportation.wv.gov', permitPortal: 'https://transportation.wv.gov/highways/programplanning/preliminary_engineering/Pages/Oversize-Overweight-Permits.aspx', phone: '(304) 558-3063', widthFirstEscort: '12\'', widthSecondEscort: '14\'', heightTrigger: '14\'6"', lengthTrigger: '85\'', weightSuperload: '120,000 lbs', travelRestrictions: 'Mountain terrain and tunnel restrictions', permitFeeRange: '$15–$75', annualPermitAvailable: true, policeEscortRequired: 'Width >14\' or at WV State Police discretion', specialNotes: 'Appalachian terrain, tunnels, and narrow roads. Route surveys critical.' },
  { slug: 'wisconsin', name: 'Wisconsin', abbrev: 'WI', dotName: 'WisDOT', dotUrl: 'https://wisconsindot.gov', permitPortal: 'https://wisconsindot.gov/Pages/dmv/com-drv-vehs/mtr-car-trkrs/osow-permits.aspx', phone: '(608) 266-7320', widthFirstEscort: '12\'', widthSecondEscort: '14\'6"', heightTrigger: '14\'6"', lengthTrigger: '95\'', weightSuperload: '120,000 lbs', travelRestrictions: 'Spring thaw weight restrictions', permitFeeRange: '$15–$75', annualPermitAvailable: true, policeEscortRequired: 'Width >14\'6" or at WSP discretion', specialNotes: 'Wind energy and agriculture equipment drive demand.' },
  { slug: 'wyoming', name: 'Wyoming', abbrev: 'WY', dotName: 'WYDOT', dotUrl: 'https://www.dot.state.wy.us', permitPortal: 'https://www.dot.state.wy.us/home/trucking_commercial_vehicles/osw_permits.html', phone: '(307) 777-4375', widthFirstEscort: '12\'', widthSecondEscort: '16\'', heightTrigger: '15\'', lengthTrigger: '120\'', weightSuperload: '200,000 lbs', travelRestrictions: 'I-80 high wind closures affect wide/tall loads', permitFeeRange: '$15–$75', annualPermitAvailable: true, policeEscortRequired: 'Width >16\' or weight >200,000 lbs', specialNotes: 'Wind energy corridor and oil/gas equipment. I-80 snow closures in winter. Very high wind exposure.' },
];

export function generateStaticParams() {
  return US_STATES.map(s => ({ state: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state: stateSlug } = await params;
  const state = US_STATES.find(s => s.slug === stateSlug);
  if (!state) return { title: 'Not Found' };

  const title = `${state.name} Oversize Load Permits & Escort Requirements | ${state.dotName} | Haul Command`;
  const description = `${state.name} (${state.abbrev}) oversize/overweight permit portal, escort vehicle requirements, pilot car regulations, and ${state.dotName} contact info. Width trigger: ${state.widthFirstEscort}. Updated March 2026.`;

  return {
    title,
    description,
    openGraph: { title, description, url: `https://haulcommand.com/permits/us/${stateSlug}` },
    alternates: { canonical: `https://haulcommand.com/permits/us/${stateSlug}` },
  };
}

export default async function StateDOTPage({
  params,
}: {
  params: Promise<{ state: string }>;
}) {
  const { state: stateSlug } = await params;
  const state = US_STATES.find(s => s.slug === stateSlug);
  if (!state) notFound();

  const baseUrl = 'https://haulcommand.com';

  const faqs = [
    {
      question: `What are the oversize load permit requirements in ${state.name}?`,
      answer: `${state.name} requires oversize permits through ${state.dotName} for loads exceeding standard legal dimensions. First escort required at ${state.widthFirstEscort} width, second escort at ${state.widthSecondEscort}. Height trigger: ${state.heightTrigger}. Length trigger: ${state.lengthTrigger}. Permit fees range ${state.permitFeeRange}. ${state.annualPermitAvailable ? 'Annual permits are available.' : 'Only single-trip permits available.'}`,
    },
    {
      question: `When do I need a police escort in ${state.name}?`,
      answer: `${state.policeEscortRequired}. Contact ${state.dotName} at ${state.phone} for specific requirements.`,
    },
    {
      question: `What travel restrictions apply to oversize loads in ${state.name}?`,
      answer: `${state.travelRestrictions}. ${state.specialNotes}`,
    },
    {
      question: `How much does an oversize permit cost in ${state.name}?`,
      answer: `${state.dotName} permit fees typically range ${state.permitFeeRange} depending on load dimensions and route. Superload permits (over ${state.weightSuperload}) may cost more and require additional engineering review. ${state.annualPermitAvailable ? 'Annual blanket permits are also available for frequent haulers.' : ''}`,
    },
  ];

  // Related states
  const relatedStates = US_STATES.filter(s => s.slug !== stateSlug).slice(0, 8);

  return (
    <>
      <FAQSchema faqs={faqs} />
      <BreadcrumbSchema
        items={[
          { name: 'Haul Command', url: baseUrl },
          { name: 'Permits', url: `${baseUrl}/permits` },
          { name: 'United States', url: `${baseUrl}/permits/us` },
          { name: state.name, url: `${baseUrl}/permits/us/${stateSlug}` },
        ]}
      />
      <Navbar />
      <main className="min-h-screen bg-[#0a0e17]">
        <section className="relative pt-24 pb-16 bg-gradient-to-b from-accent/5 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6 flex-wrap">
              <Link href="/" className="hover:text-white transition-colors">Haul Command</Link>
              <span className="text-slate-600">/</span>
              <Link href="/permits" className="hover:text-white transition-colors">Permits</Link>
              <span className="text-slate-600">/</span>
              <Link href="/permits/us" className="hover:text-white transition-colors">🇺🇸 United States</Link>
              <span className="text-slate-600">/</span>
              <span className="text-white">{state.name}</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-4 tracking-tight">
              {state.name} <span className="text-accent">Oversize Load Permits</span>
            </h1>
            <p className="text-lg text-slate-300 max-w-2xl mb-8 leading-relaxed">
              Everything you need to move an oversize or overweight load through {state.name}. Direct links to 
              the {state.dotName} permit portal, escort vehicle requirements, dimension triggers, and travel restrictions.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={state.permitPortal} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center px-8 py-4 bg-accent hover:bg-yellow-500 text-black font-black rounded-xl transition-all shadow-lg shadow-accent/20 text-sm">
                Open {state.dotName} Permit Portal →
              </a>
              <Link href={`/directory/us`} className="inline-flex items-center justify-center px-6 py-4 border border-white/10 hover:border-accent/30 text-white font-semibold rounded-xl transition-colors text-sm">
                Find Escort Operators in {state.name}
              </Link>
            </div>
          </div>
        </section>

        {/* Escort Requirement Quick Reference */}
        <section className="py-16 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-white mb-8">
              {state.name} Escort Vehicle Requirements
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'First Escort Required', value: `Width exceeds ${state.widthFirstEscort}`, icon: '🚙' },
                { label: 'Second Escort Required', value: `Width exceeds ${state.widthSecondEscort}`, icon: '🚓' },
                { label: 'Height Pole Trigger', value: `Height exceeds ${state.heightTrigger}`, icon: '📏' },
                { label: 'Length Trigger', value: `Length exceeds ${state.lengthTrigger}`, icon: '📐' },
                { label: 'Superload Threshold', value: `Weight exceeds ${state.weightSuperload}`, icon: '⚖️' },
                { label: 'Police Escort', value: state.policeEscortRequired, icon: '👮' },
                { label: 'Permit Fees', value: state.permitFeeRange, icon: '💰' },
                { label: 'Annual Permit', value: state.annualPermitAvailable ? 'Available ✓' : 'Not available ✗', icon: '📋' },
              ].map((item) => (
                <div key={item.label} className="p-5 rounded-xl border border-white/10 bg-white/[0.02]">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{item.icon}</span>
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{item.label}</h3>
                  </div>
                  <p className="text-white font-medium text-sm">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Travel Restrictions */}
        <section className="py-16 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-white mb-6">Travel Restrictions & Special Notes</h2>
            <div className="p-6 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
              <p className="text-slate-300 mb-4"><strong className="text-yellow-400">Travel Restrictions:</strong> {state.travelRestrictions}</p>
              <p className="text-slate-300"><strong className="text-white">Special Notes:</strong> {state.specialNotes}</p>
            </div>
          </div>
        </section>

        {/* DOT Contact */}
        <section className="py-16 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-white mb-6">{state.dotName} Contact Information</h2>
            <div className="p-6 rounded-xl border border-white/10 bg-white/[0.02]">
              <div className="grid gap-4">
                <div><span className="text-slate-400 text-sm">Agency:</span> <span className="text-white font-semibold ml-2">{state.dotName} — {state.name} Department of Transportation</span></div>
                <div><span className="text-slate-400 text-sm">Phone:</span> <a href={`tel:${state.phone.replace(/\D/g, '')}`} className="text-accent font-semibold ml-2 hover:underline">{state.phone}</a></div>
                <div><span className="text-slate-400 text-sm">Website:</span> <a href={state.dotUrl} target="_blank" rel="noopener noreferrer" className="text-accent font-semibold ml-2 hover:underline">{state.dotUrl}</a></div>
                <div><span className="text-slate-400 text-sm">Permit Portal:</span> <a href={state.permitPortal} target="_blank" rel="noopener noreferrer" className="text-accent font-semibold ml-2 hover:underline">Apply for Permits →</a></div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 border-t border-white/5">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-white mb-8">FAQ — Oversize Load Permits in {state.name}</h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <details key={i} className="group rounded-xl border border-white/5 bg-white/[0.02] overflow-hidden">
                  <summary className="cursor-pointer px-6 py-4 text-white font-medium hover:bg-white/[0.03] transition-colors flex items-center justify-between">
                    {faq.question}
                    <span className="text-slate-500 group-open:rotate-180 transition-transform ml-4">▾</span>
                  </summary>
                  <div className="px-6 pb-4 text-slate-300 leading-relaxed border-t border-white/5 pt-4">{faq.answer}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Other States */}
        <section className="py-16 border-t border-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-white mb-8">Permits in Other States</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {relatedStates.map(s => (
                <Link key={s.slug} href={`/permits/us/${s.slug}`} className="group p-4 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-accent/[0.03] hover:border-accent/20 transition-all">
                  <span className="text-sm text-white group-hover:text-accent font-medium">{s.name}</span>
                  <span className="block text-xs text-slate-500 mt-1">{s.dotName} · {s.widthFirstEscort} trigger →</span>
                </Link>
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link href="/escort-requirements" className="text-accent text-sm font-bold hover:underline">View All 50 State Requirements →</Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto bg-gradient-to-r from-accent/10 via-accent/5 to-transparent border border-accent/20 rounded-2xl p-8 sm:p-10 text-center">
            <h2 className="text-2xl font-black text-white mb-3 tracking-tight">Moving Through {state.name}?</h2>
            <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">
              Get matched with verified {state.name} escort operators who know the {state.dotName} permit process, 
              the local routes, and the curfew windows.
            </p>
            <Link href="/claim" className="bg-accent text-black px-8 py-4 rounded-xl font-black text-sm hover:bg-yellow-500 transition-all shadow-[0_0_24px_rgba(245,159,10,0.3)]">
              List Your {state.name} Escort Company — Free
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
