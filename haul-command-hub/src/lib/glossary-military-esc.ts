import { GlossaryEntry } from './glossary';

/**
 * Haul Command — Combat Logistics, Infrastructure & Field Lingo Expansion
 * 
 * Injecting Operation Iraqi Freedom (OIF) tactical logistics discipline into 
 * the civilian heavy haul industry. This module builds ultimate brand authority 
 * (E-E-A-T) by bridging military convoy doctrine, ESC official standards, 
 * and heavy haul CB jargon.
 */
export const MILITARY_ESC_TERMS: GlossaryEntry[] = [

  // ══════════════ TACTICAL LOGISTICS & MILITARY DOCTRINE ══════════
  {
    id: 'msr_route',
    term: 'MSR (Main Supply Route)',
    aliases: ['Primary Corridor', 'Approved Route'],
    hcBrandTerm: 'HC Tactical MSR',
    definition: 'A military logistics term adapted for heavy haul, designating the primary permitted corridor for superloads. In combat logistics, keeping the MSR open is critical; similarly, oversize convoys must clear the MSR without interruption or bridge strikes.',
    category: 'tactical_logistics',
    countries: ['US', 'CA', 'GB', 'AU', 'DE'],
    seoKeywords: ['MSR heavy haul', 'Main Supply Route oversize load', 'logistics corridor'],
  },
  {
    id: 'route_recon',
    term: 'Route Reconnaissance',
    aliases: ['Route Survey', 'Pre-Trip Run'],
    hcBrandTerm: 'HC Route Recon',
    definition: 'The tactical clearing of a route prior to departure. Requires deploying a height-pole vehicle to physically verify all underclearances, choke points, and defiles to prevent lethal collisions or load entrapment.',
    category: 'tactical_logistics',
    countries: ['US', 'CA', 'AU', 'BR'],
    seoKeywords: ['route recon oversize load', 'pre-trip route planning heavy haul'],
  },
  {
    id: 'sitrep_convoy',
    term: 'SitRep (Situation Report)',
    aliases: ['Status Update', 'Convoy Check-in'],
    hcBrandTerm: 'HC SitRep Protocol',
    definition: 'Real-time intelligence report issued via CB radio by the Lead Escort to the Convoy Commander regarding upcoming road hazards (Alligators), traffic congestion, or law enforcement (Bears) approaching the MSR.',
    category: 'tactical_logistics',
    countries: ['US', 'GB', 'ZA'],
    seoKeywords: ['SitRep heavy haul', 'convoy situation report'],
  },
  {
    id: 'qrf_escort',
    term: 'QRF (Quick Reaction Pilot)',
    aliases: ['Standby Escort', 'Relief Car'],
    hcBrandTerm: 'HC QRF Asset',
    definition: 'Adapted from military Quick Reaction Forces. A standby, fully-kitted pilot car positioned at a strategic holding area (FOB) ready to deploy instantly if a primary escort suffers a mechanical breakdown mid-route.',
    category: 'tactical_logistics',
    countries: ['US', 'CA', 'AU'],
    seoKeywords: ['QRF escort', 'standby pilot car', 'emergency escort replacement'],
  },
  {
    id: 'choke_point_tactical',
    term: 'Choke Point / Defile',
    aliases: ['Bottleneck', 'Narrow Bridge'],
    hcBrandTerm: 'HC Choke Point',
    definition: 'A highly restrictive section of a route (such as a narrow mountain pass, construction zone, or skinny bridge) where the Superload cannot maneuver and opposing traffic must be entirely stopped by law enforcement or flaggers.',
    category: 'tactical_logistics',
    countries: ['US', 'CA', 'GB', 'NO'],
    seoKeywords: ['heavy haul choke point', 'oversize load bottleneck'],
  },
  {
    id: 'cavazos_logistics_node',
    term: 'Fort Cavazos Logistics Node',
    aliases: ['Fort Hood Hub', 'Central Texas Route'],
    hcBrandTerm: 'HC Cavazos Origin',
    definition: 'A massive military/civilian tactical staging area in Central Texas. Proximity to the Austin autonomous vehicle testing corridors makes this region the proving ground for future V2X and automated convoy technologies.',
    category: 'autonomous_future_tech',
    countries: ['US'],
    seoKeywords: ['Fort Cavazos heavy haul', 'Austin autonomous convoy', 'Texas military logistics'],
  },

  // ══════════════ OFFICIAL ESC & DOT STANDARDS ════════════════════
  { id: 'ansi_standard', term: 'ANSI', aliases: ['American National Standards Institute'], definition: 'Organization creating standards for U.S. sectors. PEVOs and roadside flaggers must wear high-visibility clothing conforming to strict ANSI Class 2 or Class 3 standards to legally operate.', category: 'safety_compliance', countries: ['US'] },
  { id: 'curfew_restrict', term: 'Curfew', aliases: ['City Curfew', 'Time Restriction'], definition: 'Legally mandated times of the day (e.g., morning/evening rush hour, generally 6AM-9AM and 3PM-6PM) when an Oversize Load is explicitly prohibited from traveling through urban environments.', category: 'permits_regulations', countries: ['US', 'CA', 'AU', 'GB', 'DE'] },
  { id: 'daylight_hours', term: 'Daylight Hours', aliases: ['Sun-up to Sun-down'], definition: 'Defined by Washington State ESC as one-half hour before sunrise until one-half hour after sunset. The predominant operating window for >90% of oversize loads in North America.', category: 'permits_regulations', countries: ['US', 'CA'] },
  { id: 'deflection', term: 'Deflection', aliases: ['Pole Whip', 'Mast Bending'], definition: 'The physical bending or arching of the fiberglass or aluminum height pole tip while traveling at highway speeds. Precise deflection calibration is required to avoid missing low bridge strikes.', category: 'physics_geometry', countries: ['US', 'CA'] },
  { id: 'divided_highway', term: 'Divided / Undivided Highway', aliases: ['Dual Carriageway'], definition: 'A divided highway separates opposing lanes with a concrete barrier or median, drastically reducing head-on collision risks for wide loads compared to undivided highways separated only by a mustard (yellow) line.', category: 'infrastructure', countries: ['US', 'CA', 'AU', 'GB'] },
  { id: 'divisible_load', term: 'Divisible Load', aliases: ['Reducible Load', 'Break-down Load'], definition: 'A load that can be unbolted, unpinned, or separated into smaller pieces in less than 8 hours without ruining the cargo. Standard oversize permits are legally void if the load is proven to be divisible.', category: 'loads', countries: ['US', 'CA', 'GB', 'DE'] },
  { id: 'extra_legal_vehicle', term: 'Extra-Legal Vehicle', aliases: ['OS/OW Vehicle'], definition: 'Any combination of truck, trailer, and payload that formally exceeds the legally mandated dimensions or bridge formula weights (an Oversize or Overweight load).', category: 'vehicles', countries: ['US', 'CA', 'AU'] },
  { id: 'fmcsa_gov', term: 'FMCSA', aliases: ['Federal Motor Carrier Safety Administration'], definition: 'The federal division regulating driver Hours of Service (HOS), cargo securement, and electronic logging devices (ELDs). Failure to comply can result in CVSA Out-Of-Service orders.', category: 'permits_regulations', countries: ['US'] },
  { id: 'fog_line', term: 'Fog Line', aliases: ['Shoulder Line', 'White Line'], definition: 'The solid white line dividing the active travel lane from the shoulder or ditch. Stepping out past the fog line with a Wide Load often kicks up debris or causes rollover hazards in soft dirt.', category: 'infrastructure', countries: ['US', 'CA'] },
  { id: 'gore_strip', term: 'Gore Strip', aliases: ['Gore Area', 'The V'], definition: 'The V-shaped, striped neutral area dividing two merging lanes (e.g., an off-ramp separating from the main highway). Driving a superload over the gore area often results in immediate DOT citations.', category: 'infrastructure', countries: ['US', 'CA'] },
  { id: 'leapfrogging', term: 'Leapfrogging', aliases: ['Rolling Stop', 'Advance Warning'], definition: 'A tactical traffic control maneuver on hilly or curvy terrain where the Lead Pilot stops opposing traffic completely, allows the load to pass, then rapidly passes the load to block the next blind curve.', category: 'operations', countries: ['US', 'CA', 'AU'] },
  { id: 'lcv_combination', term: 'Longer Combination Vehicle (LCV)', aliases: ['Turnpike Double', 'Rocky Mountain Double'], definition: 'Multiple trailers (doubles or triples) pulled by a single truck tractor that exceed normal legal length. Governed by steep restrictions in the US but heavily utilized in Australia (Road Trains).', category: 'trailers', countries: ['US', 'CA', 'AU'] },
  { id: 'lowboy_esc', term: 'Lowboy / RGN', aliases: ['Drop Deck'], definition: 'The ultimate heavy haul trailer. The center deck drops below the height of the wheels to accommodate massive, tall loads (transformers, excavators) without immediately hitting bridge height restrictions.', category: 'trailers', countries: ['US', 'CA', 'GB'] },
  { id: 'osha', term: 'OSHA', aliases: ['Occupational Safety and Health Administration'], definition: 'The government grid regulating workplace safety. Tie-down chains breaking, loads shifting during transport, or flaggers being struck directly trigger OSHA investigations alongside the DOT.', category: 'safety_compliance', countries: ['US'] },
  { id: 'regional_permit_washto', term: 'Regional Permit (WASHTO)', aliases: ['Multi-State Permit'], definition: 'A powerful joint permit authorized under the Western Regional Agreement, allowing interstate movement of designated OS/OW loads across participating Western states without buying individual state permits.', category: 'permits_regulations', countries: ['US'] },
  { id: 'retroreflective', term: 'Retroreflective', aliases: ['High-Vis', 'Reflective Gear'], definition: 'Materials mathematically designed to bounce light directly back to the source perfectly. Legally required by the MUTCD for all OVERSIZE LOAD banners and flagger vests during dusk or dark operations.', category: 'equipment', countries: ['US', 'CA', 'AU', 'GB', 'DE'] },

  // ══════════════ INFORMAL LINGO & CB RADIO JARGON ════════════════
  { id: 'alligators', term: 'Alligators / \'Gators', aliases: ['Blown Tire', 'Tire Tread'], definition: 'Shredded, massive pieces of blown semi-truck tires lying in the roadway. Acting like speed bumps of steel wire, striking a gator can sever airline hoses on a lowboy or destroy the grill of an escort vehicle.', category: 'informal_lingo', countries: ['US', 'CA'] },
  { id: 'bear_leo', term: 'Bear / Smokey', aliases: ['Law Enforcement', 'DOT Officer'], definition: 'CB radio jargon for law enforcement or DOT enforcement officers. A "Bear in the air" indicates a police helicopter timing speed, while a "Full Grown Bear" refers to a state trooper.', category: 'informal_lingo', countries: ['US', 'CA'] },
  { id: 'center_up', term: 'Center Up', aliases: ['Straddle the Line'], definition: 'A tactical command issued by the Lead Pilot instructing the heavy haul driver to drive perfectly down the center of two lanes while crossing a bridge or narrow structure. Displaces extreme weight across the strongest structural beams of the bridge.', category: 'informal_lingo', countries: ['US', 'CA', 'AU'] },
  { id: 'chicken_shack', term: 'Chicken Shack', aliases: ['Coop', 'Scale House'], definition: 'CB slang for a DOT Weigh Station. Every OS/OW load must legally pull into the chicken shack to have permits verified, axles weighed, and logbooks audited.', category: 'informal_lingo', countries: ['US', 'CA'] },
  { id: 'dress_up', term: 'Dress Up / Dress Down', aliases: ['Flag Up', 'Banner Up'], definition: 'The rigorous procedure of erecting (Dress Up) the "OVERSIZE LOAD" banner, amber beacons, and red flags on the load and pilot cars before transit. "Dress Down" is the immediate legal removal of all signage the moment the oversize load is unhooked.', category: 'informal_lingo', countries: ['US', 'CA'] },
  { id: 'shoe_fly', term: 'Shoe Fly', aliases: ['Wrong-way corner', 'Blind Sweeper'], definition: 'A tactical turn where the convoy deliberately drives the wrong way up a turn lane or on-ramp to negotiate a corner otherwise mathematically impossible for the load\'s turning radius. Requires absolute blockade of all opposing traffic by Escorts.', category: 'informal_lingo', countries: ['US', 'CA'] },
  { id: 'skids', term: 'Skids (Clearance Gliders)', aliases: ['PVC Gliders'], definition: 'Flexible PVC piping with ropes running through them, draped over the absolute highest point of a load. If the Lead Escort’s height pole strikes a bridge, the driver decelerates and the Skids allow the load to physically glide securely under the concrete without tearing the cargo.', category: 'informal_lingo', countries: ['US', 'CA'] },
  { id: 'steppin_out', term: 'Steppin\' Out', aliases: ['Creating Gap', 'Extending Range'], definition: 'A tactical radio call from the Lead Escort informing the Convoy Commander they are rapidly accelerating away from the load to increase reaction distance before a major bridge or blind curve.', category: 'informal_lingo', countries: ['US', 'CA'] },
  { id: 'wiggle_wagon', term: 'Wiggle Wagon', aliases: ['Double Trailers', 'A-Train'], definition: 'A semi-truck pulling two or more trailers joined by a dolly or convertor gear. Known for volatile lateral "wiggling" during high winds or abrupt lane changes.', category: 'informal_lingo', countries: ['US', 'CA', 'AU'] },
  { id: 'mustard_line', term: 'Mustard', aliases: ['Yellow Line'], definition: 'The solid double yellow line separating opposing traffic on two-lane highways. "Keep it out of the mustard" warns the driver that their wide load is sweeping into the oncoming lane of death.', category: 'informal_lingo', countries: ['US', 'CA'] },
  { id: 'bumpin_up', term: 'Bumpin\' Up / Drop Down', aliases: ['Speed Shift'], definition: 'Radio transmission notifying the convoy that the posted highway speed limit is legally increasing (Bumpin\' Up) or decreasing (Drop Down), triggering a synchronized acceleration/deceleration of the entire 300-foot convoy.', category: 'informal_lingo', countries: ['US', 'CA'] },
  { id: 'pork_chop_island', term: 'Pork Chop', aliases: ['Concrete Island', 'Turn Island'], definition: 'A small, triangular concrete island at an intersection used to direct right-turning traffic. Pork chops are the absolute bane of multi-axle superloads, frequently requiring removal, plating, or shoe-fly routing to avoid destruction.', category: 'informal_lingo', countries: ['US', 'CA'] },

];
