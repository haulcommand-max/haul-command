// ═══════════════════════════════════════════════════════════════════════
// INFRASTRUCTURE KEYWORD ENGINE — Claimable Places × SEO × Revenue
// ═══════════════════════════════════════════════════════════════════════
//
// PURPOSE:
//   1. Long-tail SEO: "[escort] near [port/truck stop/hotel]"
//   2. Claimable listings: infrastructure owners claim & pay for placement
//   3. Aggregate revenue: ad slots on infrastructure pages
//   4. Land grab: thousands of zero-competition pages per country
//
// IMPORTS FROM: lib/geo/countries.ts (single source of truth)

import { HC_COUNTRIES, type HCCountry, type CountryTier } from "@/lib/geo/countries";

// ═══════════════════════════════════════════════════════════════════════
// INFRASTRUCTURE CATEGORY TAXONOMY
// ═══════════════════════════════════════════════════════════════════════

export type InfraCategory =
    | "port"
    | "truck_stop"
    | "hotel"
    | "weigh_station"
    | "rest_area"
    | "industrial_park"
    | "rail_yard"
    | "border_crossing"
    | "airport_cargo"
    | "fuel_station"
    | "repair_shop"
    | "parking"
    | "warehouse"
    | "toll_plaza";

export interface InfraKeywordSet {
    category: InfraCategory;
    /** Native-language label for this category */
    label: string;
    /** SEO title template: {name} = facility name, {city} = city */
    titleTemplate: string;
    /** Keywords to target for this category */
    keywords: string[];
    /** Whether this category generates claimable listings */
    claimable: boolean;
    /** Revenue potential: ad slots on this page type */
    adSlots: number;
}

// ── Global infrastructure keyword templates (language-parameterized) ──

export const INFRA_CATEGORIES: Record<InfraCategory, {
    claimable: boolean;
    adSlots: number;
    revenueType: "listing_fee" | "ad_placement" | "lead_gen" | "sponsor";
}> = {
    port: { claimable: true, adSlots: 4, revenueType: "sponsor" },
    truck_stop: { claimable: true, adSlots: 3, revenueType: "listing_fee" },
    hotel: { claimable: true, adSlots: 3, revenueType: "lead_gen" },
    weigh_station: { claimable: false, adSlots: 2, revenueType: "ad_placement" },
    rest_area: { claimable: false, adSlots: 2, revenueType: "ad_placement" },
    industrial_park: { claimable: true, adSlots: 3, revenueType: "sponsor" },
    rail_yard: { claimable: true, adSlots: 2, revenueType: "sponsor" },
    border_crossing: { claimable: false, adSlots: 3, revenueType: "ad_placement" },
    airport_cargo: { claimable: true, adSlots: 3, revenueType: "sponsor" },
    fuel_station: { claimable: true, adSlots: 2, revenueType: "listing_fee" },
    repair_shop: { claimable: true, adSlots: 2, revenueType: "listing_fee" },
    parking: { claimable: true, adSlots: 2, revenueType: "listing_fee" },
    warehouse: { claimable: true, adSlots: 2, revenueType: "lead_gen" },
    toll_plaza: { claimable: false, adSlots: 1, revenueType: "ad_placement" },
};

// ═══════════════════════════════════════════════════════════════════════
// PER-COUNTRY INFRASTRUCTURE SEED DATA
// ═══════════════════════════════════════════════════════════════════════

export interface CountryInfraSeeds {
    iso2: string;
    /** Top ports handling heavy/oversize cargo */
    ports: string[];
    /** Major truck stops / service plazas */
    truckStops: string[];
    /** Trucker-friendly hotels / lodging chains */
    hotels: string[];
    /** Major industrial parks / zones */
    industrialParks: string[];
    /** Rail yards / intermodal terminals */
    railYards: string[];
    /** Border crossings (if applicable) */
    borderCrossings: string[];
    /** Major airports with cargo terminals */
    airportCargo: string[];
    /** Key corridors (for corridor × infra cross-products) */
    corridors: string[];
}

export const COUNTRY_INFRA_SEEDS: CountryInfraSeeds[] = [
    // ══════════════════════════════════════════════════════════
    // TIER A — GOLD (10 countries)
    // ══════════════════════════════════════════════════════════
    {
        iso2: "US",
        ports: [
            "Port of Houston", "Port of Los Angeles", "Port of Long Beach",
            "Port of Savannah", "Port of New York/New Jersey", "Port of Virginia",
            "Port of Charleston", "Port of Seattle/Tacoma", "Port of Oakland",
            "Port of New Orleans", "Port of Baltimore", "Port of Tampa",
            "Port of Mobile", "Port of Beaumont", "Port of Corpus Christi",
        ],
        truckStops: [
            "Pilot Flying J", "Love's Travel Stops", "TravelCenters of America",
            "Petro Stopping Centers", "Sapp Bros", "Buc-ee's",
            "Iowa 80 Truckstop", "Kenly 95 Petro", "Little America",
        ],
        hotels: [
            "Best Western Plus", "Comfort Inn & Suites", "Holiday Inn Express",
            "La Quinta Inn", "Super 8", "Days Inn", "Motel 6",
        ],
        industrialParks: [
            "Houston Ship Channel Industrial", "Port Arthur Industrial Complex",
            "Baytown Industrial District", "Gary Works Industrial",
            "Louisiana Industrial Corridor", "Texas City Industrial",
        ],
        railYards: [
            "BNSF Logistics Park Chicago", "UP Intermodal Terminal Dallas",
            "CSX Intermodal Jacksonville", "NS Intermodal Atlanta",
        ],
        borderCrossings: [
            "Laredo TX", "El Paso TX", "Otay Mesa CA", "Buffalo NY",
            "Detroit MI", "Blaine WA", "Nogales AZ", "Brownsville TX",
        ],
        airportCargo: [
            "Memphis MEM", "Louisville SDF", "Anchorage ANC",
            "Miami MIA", "Los Angeles LAX", "Chicago ORD",
        ],
        corridors: [
            "I-10 Gulf Coast", "I-35 NAFTA Spine", "I-95 Eastern Seaboard",
            "I-40 Cross Country", "I-80 Northern Route", "I-20 Southern Corridor",
        ],
    },
    {
        iso2: "CA",
        ports: [
            "Port of Vancouver", "Port of Montreal", "Port of Halifax",
            "Port of Prince Rupert", "Port of Saint John", "Port of Hamilton",
            "Port of Thunder Bay", "Port of Quebec",
        ],
        truckStops: [
            "Husky Travel Centres", "Petro-Canada", "Flying J Canada",
            "Esso Truck Stop", "Canadian Tire Gas+",
        ],
        hotels: [
            "Super 8 Canada", "Comfort Inn Canada", "Best Western Canada",
            "Sandman Hotels", "Travelodge Canada",
        ],
        industrialParks: [
            "Sherwood Park Industrial AB", "Fort Saskatchewan Industrial",
            "Nisku Industrial Park AB", "Hamilton Industrial ON",
        ],
        railYards: [
            "CN Intermodal Vancouver", "CP Rail Calgary Terminal",
            "CN Montreal Intermodal", "CP Toronto Intermodal",
        ],
        borderCrossings: [
            "Windsor-Detroit", "Niagara Falls", "Pacific Highway BC",
            "Emerson MB", "Coutts AB", "Lacolle QC",
        ],
        airportCargo: ["Toronto YYZ", "Vancouver YVR", "Montreal YUL", "Calgary YYC"],
        corridors: [
            "Trans-Canada Highway", "Highway 401 Corridor ON",
            "Highway 2 AB", "Highway 1 BC", "Highway 417 Ottawa",
        ],
    },
    {
        iso2: "AU",
        ports: [
            "Port of Melbourne", "Port of Sydney", "Port of Brisbane",
            "Port of Fremantle", "Port of Adelaide", "Port Hedland",
            "Port of Gladstone", "Port of Newcastle", "Port of Darwin",
        ],
        truckStops: [
            "BP Truckstop", "Shell Coles Express", "OTR Truck Stops",
            "Ampol Truckstop", "United Petroleum",
        ],
        hotels: ["Best Western AU", "Comfort Inn AU", "ibis Budget AU", "Quest Apartments"],
        industrialParks: [
            "Kwinana Industrial Area WA", "Pilbara Industrial Zone",
            "Gladstone Industrial Zone QLD", "Western Sydney Industrial",
        ],
        railYards: [
            "Parkes National Logistics Hub", "Melbourne Intermodal Terminal",
            "Brisbane Multimodal Terminal", "Adelaide Intermodal",
        ],
        borderCrossings: [],
        airportCargo: ["Sydney SYD", "Melbourne MEL", "Brisbane BNE", "Perth PER"],
        corridors: [
            "Hume Highway", "Pacific Highway", "Stuart Highway",
            "Great Western Highway", "Bruce Highway QLD",
        ],
    },
    {
        iso2: "GB",
        ports: [
            "Port of Felixstowe", "Port of Southampton", "Port of London Gateway",
            "Port of Liverpool", "Port of Immingham", "Port of Tilbury",
            "Port of Grangemouth", "Port of Bristol",
        ],
        truckStops: [
            "Truckstop Markham Moor", "Roadchef", "Moto Services",
            "Welcome Break", "Extra Motorway Services",
        ],
        hotels: ["Premier Inn", "Travelodge UK", "Holiday Inn Express UK", "ibis UK"],
        industrialParks: [
            "Humber Industrial Zone", "Teesside Industrial Estate",
            "Trafford Park Manchester", "Avonmouth Industrial",
        ],
        railYards: [
            "Freightliner Felixstowe", "Daventry IRFT",
            "DIRFT Terminal", "Hams Hall Terminal",
        ],
        borderCrossings: ["Channel Tunnel Folkestone", "Dover Ferry Terminal", "Holyhead Ferry"],
        airportCargo: ["London Heathrow LHR", "East Midlands EMA", "Stansted STN"],
        corridors: [
            "M1 Corridor", "M6 Motorway", "A1(M) Great North Road",
            "M62 Trans-Pennine", "M4 Corridor Wales",
        ],
    },
    {
        iso2: "NZ",
        ports: [
            "Port of Auckland", "Port of Tauranga", "Lyttelton Port",
            "Port of Napier", "Port Otago", "Port of Wellington",
        ],
        truckStops: ["BP Truckstop NZ", "Z Energy", "Mobil Commercial"],
        hotels: ["Distinction Hotels", "Jet Park Hotel", "Sudima Hotels"],
        industrialParks: ["East Tamaki Industrial", "Wiri Industrial Park", "Christchurch Industrial"],
        railYards: ["KiwiRail Wiri Terminal", "Port of Tauranga Rail"],
        borderCrossings: [],
        airportCargo: ["Auckland AKL", "Christchurch CHC"],
        corridors: ["SH1 Auckland–Hamilton", "SH1 Canterbury", "SH2 Tauranga Corridor"],
    },
    {
        iso2: "ZA",
        ports: [
            "Port of Durban", "Port of Richards Bay", "Port of Cape Town",
            "Port of Saldanha Bay", "Port of Port Elizabeth", "Port of East London",
        ],
        truckStops: ["Engen 1-Stop", "Total Truckstop", "Sasol Truckport"],
        hotels: ["City Lodge", "Protea Hotels", "Sun1 Hotels"],
        industrialParks: ["Coega IDZ", "Richards Bay IDZ", "Dube TradePort", "Atlantis SEZ"],
        railYards: ["Transnet City Deep Terminal", "Bayhead Terminal Durban"],
        borderCrossings: ["Beitbridge Zimbabwe", "Lebombo Mozambique", "Maseru Bridge Lesotho"],
        airportCargo: ["OR Tambo JNB", "Cape Town CPT", "King Shaka DUR"],
        corridors: ["N3 Durban–Johannesburg", "N1 Cape Town–Joburg", "N2 Coastal Route"],
    },
    {
        iso2: "DE",
        ports: [
            "Port of Hamburg", "Port of Bremerhaven", "Port of Wilhelmshaven",
            "Port of Duisburg (inland)", "Port of Rostock", "Port of Lübeck",
        ],
        truckStops: ["Autohof", "Aral Truckstop", "Shell Autohof", "Total Autohof"],
        hotels: ["ibis Hotel", "B&B Hotel", "Motel One", "Holiday Inn Express DE"],
        industrialParks: [
            "Ruhr Industrial Area", "Ludwigshafen BASF Complex",
            "Wolfsburg VW Industrial", "Stuttgart Industrial Zone",
        ],
        railYards: ["DB Cargo Duisburg", "Hamburg Maschen Yard", "München-Riem Terminal"],
        borderCrossings: ["Aachen-NL", "Kehl-FR", "Kiefersfelden-AT", "Frankfurt Oder-PL"],
        airportCargo: ["Frankfurt FRA", "Leipzig LEJ", "Cologne CGN", "Munich MUC"],
        corridors: [
            "A1 Hamburg–Bremen", "A2 Ruhr–Berlin", "A3 Frankfurt–Köln",
            "A5 Frankfurt–Basel", "A7 Hamburg–München",
        ],
    },
    {
        iso2: "NL",
        ports: [
            "Port of Rotterdam", "Port of Amsterdam", "Port of Moerdijk",
            "Port of Vlissingen", "Port of Groningen",
        ],
        truckStops: ["TotalEnergies Truckstop", "Shell Truckpoint", "Avia Truckstop"],
        hotels: ["Van der Valk", "Bastion Hotels", "Fletcher Hotels"],
        industrialParks: [
            "Maasvlakte Industrial", "Europoort Complex",
            "Moerdijk Industrial Park", "Chemelot Limburg",
        ],
        railYards: ["RSC Rotterdam", "Venlo Rail Terminal", "APM Terminals Rotterdam"],
        borderCrossings: ["Hazeldonk-BE", "Venlo-DE", "Oldenzaal-DE"],
        airportCargo: ["Amsterdam Schiphol AMS"],
        corridors: ["A15 Rotterdam–Arnhem", "A2 Amsterdam–Maastricht", "A1 Amsterdam–Hengelo"],
    },
    {
        iso2: "AE",
        ports: [
            "Jebel Ali Port Dubai", "Khalifa Port Abu Dhabi",
            "Port Rashid Dubai", "Sharjah Port", "Fujairah Port",
        ],
        truckStops: ["ADNOC Service Station", "ENOC Truck Stop", "Emarat Station"],
        hotels: ["Rove Hotels", "ibis Dubai", "Premier Inn Dubai", "Citymax Hotels"],
        industrialParks: [
            "JAFZA Jebel Ali Free Zone", "KIZAD Abu Dhabi",
            "Dubai Industrial City", "Sharjah Industrial Area",
        ],
        railYards: ["Etihad Rail Terminal Abu Dhabi"],
        borderCrossings: ["Al Ghuwaifat-SA", "Hatta-OM", "Khatm Al Shiklah-OM"],
        airportCargo: ["Dubai DXB", "Abu Dhabi AUH", "Sharjah SHJ", "Al Maktoum DWC"],
        corridors: ["E11 Abu Dhabi–Dubai", "E311 Sheikh Zayed", "E44 Dubai–Fujairah"],
    },
    {
        iso2: "BR",
        ports: [
            "Porto de Santos", "Porto de Paranaguá", "Porto de Rio Grande",
            "Porto de Itajaí", "Porto de Suape", "Porto de Salvador",
            "Porto do Rio de Janeiro", "Porto de Vitória",
        ],
        truckStops: ["Posto Graal", "Posto Shell BR", "Rede de Postos Ipiranga"],
        hotels: ["ibis Budget BR", "Comfort Hotel BR", "Go Inn", "Intercity Hotels BR"],
        industrialParks: [
            "Distrito Industrial Manaus", "SUAPE Complex PE",
            "Camaçari Petrochemical BA", "ABC Industrial SP",
        ],
        railYards: ["Rumo Santos Terminal", "MRS Logística Terminal SP"],
        borderCrossings: ["Foz do Iguaçu-AR", "Chuí-UY", "Jaguarão-UY"],
        airportCargo: ["Guarulhos GRU", "Viracopos VCP", "Manaus MAO"],
        corridors: [
            "BR-101 Litorânea", "BR-116 Rio–Bahia", "BR-381 Fernão Dias",
            "SP-Anchieta-Imigrantes", "BR-153 Transbrasiliana",
        ],
    },

    // ══════════════════════════════════════════════════════════
    // TIER B — BLUE (15 countries)
    // ══════════════════════════════════════════════════════════
    {
        iso2: "IE",
        ports: ["Port of Dublin", "Port of Cork", "Shannon Foynes Port", "Rosslare Europort"],
        truckStops: ["Applegreen", "Circle K Ireland", "Maxol"],
        hotels: ["Travelodge IE", "Clayton Hotels", "Maldron Hotels"],
        industrialParks: ["Shannon Free Zone", "IDA Business Parks"],
        railYards: ["Dublin Port Rail"],
        borderCrossings: ["Newry-NI", "Dundalk-NI"],
        airportCargo: ["Dublin DUB", "Shannon SNN"],
        corridors: ["M1 Dublin–Belfast", "M7 Dublin–Limerick", "N25 Cork–Rosslare"],
    },
    {
        iso2: "SE",
        ports: ["Port of Gothenburg", "Stockholm Norvik Port", "Port of Malmö", "Port of Helsingborg"],
        truckStops: ["Circle K Sweden", "OKQ8 Truckstop", "Preem Station"],
        hotels: ["Scandic Hotels", "Nordic Choice", "Best Western SE"],
        industrialParks: ["Gothenburg Industrial Zone", "Eskilstuna Logistics Park"],
        railYards: ["Gothenburg Combi Terminal", "Hallsberg Marshalling Yard"],
        borderCrossings: ["Svinesund-NO", "Øresund Bridge-DK"],
        airportCargo: ["Stockholm ARN", "Gothenburg GOT"],
        corridors: ["E6 Malmö–Gothenburg", "E4 Stockholm–Uppsala", "E18 Stockholm–Oslo"],
    },
    {
        iso2: "NO",
        ports: ["Port of Oslo", "Port of Bergen", "Port of Stavanger", "Port of Tromsø"],
        truckStops: ["Circle K Norway", "YX Truckstop", "Uno-X Station"],
        hotels: ["Scandic NO", "Thon Hotels", "Comfort Hotel NO"],
        industrialParks: ["Mongstad Industrial", "Hammerfest LNG Zone"],
        railYards: ["Alnabru Freight Terminal Oslo"],
        borderCrossings: ["Svinesund-SE", "Storlien-SE"],
        airportCargo: ["Oslo OSL", "Bergen BGO"],
        corridors: ["E6 Oslo–Trondheim", "E18 Oslo–Kristiansand", "E39 Bergen–Stavanger"],
    },
    {
        iso2: "DK",
        ports: ["Port of Copenhagen", "Port of Aarhus", "Port of Esbjerg", "Port of Fredericia"],
        truckStops: ["Circle K DK", "OK Benzin", "Q8 Station"],
        hotels: ["Scandic DK", "Cabinn Hotels", "Zleep Hotels"],
        industrialParks: ["Esbjerg Energy Zone", "Kalundborg Industrial Symbiosis"],
        railYards: ["Taulov Freight Terminal"],
        borderCrossings: ["Padborg-DE", "Øresund Bridge-SE"],
        airportCargo: ["Copenhagen CPH", "Billund BLL"],
        corridors: ["E45 Aalborg–Padborg", "E20 Copenhagen–Esbjerg"],
    },
    {
        iso2: "FI",
        ports: ["Port of Helsinki", "Port of HaminaKotka", "Port of Turku", "Port of Rauma"],
        truckStops: ["Neste Truckstop", "ABC Station", "Teboil Station"],
        hotels: ["Scandic FI", "Original Sokos", "Omenahotelli"],
        industrialParks: ["Kilpilahti Refinery Zone", "Nokia Industrial Area"],
        railYards: ["VR Cargo Kouvola Terminal"],
        borderCrossings: ["Vaalimaa-RU", "Tornio-SE"],
        airportCargo: ["Helsinki HEL"],
        corridors: ["E18 Helsinki–Turku", "VT4 Helsinki–Oulu"],
    },
    {
        iso2: "BE",
        ports: ["Port of Antwerp-Bruges", "Port of Ghent", "Port of Brussels", "Port of Liège"],
        truckStops: ["TotalEnergies BE", "Texaco BE", "Q8 Belgium"],
        hotels: ["ibis BE", "B&B Hotels BE", "Novotel BE"],
        industrialParks: ["Antwerp Chemical Cluster", "Ghent Bio-Energy Valley"],
        railYards: ["Antwerp North Terminal", "Liège Trilogiport"],
        borderCrossings: ["Hazeldonk-NL", "Aubange-LU", "Aachen-DE"],
        airportCargo: ["Brussels BRU", "Liège LGG"],
        corridors: ["E17 Antwerp–Ghent", "E40 Brussels–Liège", "E19 Antwerp–Brussels"],
    },
    {
        iso2: "AT",
        ports: ["Port of Vienna (Danube)", "Port of Linz (Danube)", "Port of Enns"],
        truckStops: ["OMV Autohof", "BP Autohof Austria", "Shell Autohof AT"],
        hotels: ["Motel One AT", "ibis AT", "A&O Hotels"],
        industrialParks: ["Linz Industrial Zone", "Graz Industrial Park"],
        railYards: ["Wien Süd Terminal", "Wels Cargo Terminal"],
        borderCrossings: ["Brenner-IT", "Nickelsdorf-HU", "Walserberg-DE", "Spielfeld-SI"],
        airportCargo: ["Vienna VIE", "Linz LNZ"],
        corridors: ["A1 Wien–Salzburg", "A2 Wien–Graz", "A13 Brenner Autobahn"],
    },
    {
        iso2: "CH",
        ports: ["Port of Basel (Rhine)"],
        truckStops: ["Avia Truckstop CH", "Shell Station CH", "BP Station CH"],
        hotels: ["ibis CH", "Motel One CH", "B&B Hotel CH"],
        industrialParks: ["Basel Chemical Cluster", "Zurich North Industrial"],
        railYards: ["Basel SBB Cargo", "Chiasso Rail Terminal"],
        borderCrossings: ["Basel-DE/FR", "Chiasso-IT", "St. Margrethen-AT", "Geneva-FR"],
        airportCargo: ["Zurich ZRH", "Basel BSL", "Geneva GVA"],
        corridors: ["A1 Zurich–Bern", "A2 Gotthard Route", "A1 Geneva–Lausanne"],
    },
    {
        iso2: "ES",
        ports: [
            "Port of Algeciras", "Port of Valencia", "Port of Barcelona",
            "Port of Bilbao", "Port of Las Palmas", "Port of Cartagena",
        ],
        truckStops: ["Repsol Estación", "Cepsa Estación", "BP Estación ES"],
        hotels: ["ibis ES", "NH Hotels", "Tryp Hotels", "Sercotel"],
        industrialParks: ["Zona Franca Barcelona", "Sagunto Industrial Zone"],
        railYards: ["Barcelona Morrot Terminal", "Madrid Abroñigal"],
        borderCrossings: ["La Jonquera-FR", "Irún-FR", "Tui-PT"],
        airportCargo: ["Madrid MAD", "Barcelona BCN", "Zaragoza ZAZ"],
        corridors: ["AP-7 Mediterranean", "A-2 Madrid–Barcelona", "A-1 Madrid–Burgos"],
    },
    {
        iso2: "FR",
        ports: [
            "Port of Marseille-Fos", "Port of Le Havre", "Port of Dunkirk",
            "Port of Nantes-Saint-Nazaire", "Port of Bordeaux",
        ],
        truckStops: ["TotalEnergies Relais", "Avia Truckstop FR", "AS24 Station"],
        hotels: ["ibis FR", "B&B Hotels FR", "Premiere Classe"],
        industrialParks: ["Fos-sur-Mer Industrial", "Dunkirk Industrial Zone"],
        railYards: ["Lyon Vénissieux Terminal", "Dourges Delta 3"],
        borderCrossings: ["Hendaye-ES", "Menton-IT", "Strasbourg-DE"],
        airportCargo: ["Paris CDG", "Lyon LYS", "Toulouse TLS"],
        corridors: ["A6 Paris–Lyon", "A1 Paris–Lille", "A7 Lyon–Marseille"],
    },
    {
        iso2: "IT",
        ports: [
            "Port of Genoa", "Port of Trieste", "Port of Gioia Tauro",
            "Port of La Spezia", "Port of Livorno", "Port of Naples",
        ],
        truckStops: ["Autogrill", "ENI Station", "IP Station IT"],
        hotels: ["ibis IT", "B&B Hotels IT", "NH Hotels IT"],
        industrialParks: ["Taranto Steel Zone", "Priolo Petrochemical"],
        railYards: ["Milano Smistamento", "Verona Quadrante Europa"],
        borderCrossings: ["Brennero-AT", "Ventimiglia-FR", "Fernetti-SI"],
        airportCargo: ["Milan MXP", "Rome FCO", "Bergamo BGY"],
        corridors: ["A1 Milano–Roma", "A4 Torino–Trieste", "A14 Bologna–Taranto"],
    },
    {
        iso2: "PT",
        ports: ["Port of Sines", "Port of Lisbon", "Port of Leixões", "Port of Setúbal"],
        truckStops: ["Galp Estação", "Repsol PT", "BP Station PT"],
        hotels: ["ibis PT", "Holiday Inn Express PT", "Star Inn Hotels"],
        industrialParks: ["Sines Industrial Zone", "Setúbal Industrial"],
        railYards: ["Entroncamento Rail Yard"],
        borderCrossings: ["Vilar Formoso-ES", "Valença-ES", "Caia-ES"],
        airportCargo: ["Lisbon LIS", "Porto OPO"],
        corridors: ["A1 Lisbon–Porto", "A2 Lisbon–Algarve", "A25 Aveiro–Vilar Formoso"],
    },
    {
        iso2: "SA",
        ports: ["King Abdulaziz Port Dammam", "Jeddah Islamic Port", "Jubail Commercial Port", "Yanbu Port"],
        truckStops: ["Aramco Station", "SASCO Truck Stop", "Naft Station"],
        hotels: ["ibis SA", "Holiday Inn SA", "Park Inn SA"],
        industrialParks: ["MODON Industrial Cities", "Jubail Industrial City", "Yanbu Industrial"],
        railYards: ["SAR Riyadh Dry Port", "Dammam Rail Terminal"],
        borderCrossings: ["Al Batha-AE", "Al Haditha-JO", "Al Tuwal-BH"],
        airportCargo: ["Riyadh RUH", "Jeddah JED", "Dammam DMM"],
        corridors: ["Route 10 Riyadh–Dammam", "Route 40 Jeddah–Riyadh", "Route 15 Makkah–Madinah"],
    },
    {
        iso2: "QA",
        ports: ["Hamad Port"],
        truckStops: ["Woqod Station", "Al Emadi Fuel Station"],
        hotels: ["ibis QA", "Premier Inn QA", "Rove QA"],
        industrialParks: ["Ras Laffan Industrial City", "Mesaieed Industrial Area"],
        railYards: [],
        borderCrossings: ["Abu Samra-SA"],
        airportCargo: ["Doha Hamad DOH"],
        corridors: ["Al Shamal Road", "Dukhan Highway"],
    },
    {
        iso2: "MX",
        ports: [
            "Puerto de Manzanillo", "Puerto de Lázaro Cárdenas",
            "Puerto de Veracruz", "Puerto de Altamira", "Puerto de Ensenada",
        ],
        truckStops: ["Pemex Estación", "BP Station MX", "Orsan Estación"],
        hotels: ["City Express", "One Hotels MX", "ibis MX", "Fiesta Inn"],
        industrialParks: [
            "Parque Industrial Monterrey", "FINSA Industrial Parks",
            "Parque Industrial Querétaro",
        ],
        railYards: ["Ferromex Terminal Guadalajara", "KCSM Monterrey Terminal"],
        borderCrossings: [
            "Nuevo Laredo-US", "Ciudad Juárez-US", "Tijuana-US",
            "Nogales-US", "Matamoros-US",
        ],
        airportCargo: ["Mexico City MEX", "Guadalajara GDL", "Monterrey MTY"],
        corridors: [
            "México-Querétaro Corridor", "Monterrey-Laredo NAFTA",
            "Guadalajara-Manzanillo", "México-Veracruz",
        ],
    },

    // ══════════════════════════════════════════════════════════
    // TIER C — SILVER (24 countries) — Condensed seeds
    // ══════════════════════════════════════════════════════════
    { iso2: "PL", ports: ["Port of Gdańsk", "Port of Gdynia", "Port of Szczecin"], truckStops: ["Orlen Station", "Shell PL"], hotels: ["ibis PL", "B&B Hotel PL"], industrialParks: ["Katowice SEZ", "Łódź SEZ"], railYards: ["PKP Cargo Małaszewicze"], borderCrossings: ["Świecko-DE", "Terespol-BY", "Medyka-UA"], airportCargo: ["Warsaw WAW"], corridors: ["A2 Warsaw–Berlin", "A1 Gdańsk–Łódź", "A4 Wrocław–Kraków"] },
    { iso2: "CZ", ports: [], truckStops: ["OMV CZ", "Benzina Station"], hotels: ["ibis CZ", "B&B Hotel CZ"], industrialParks: ["Ostrava Industrial Zone", "Plzeň Industrial"], railYards: ["Praha-Uhříněves Terminal"], borderCrossings: ["Rozvadov-DE", "Břeclav-AT"], airportCargo: ["Prague PRG"], corridors: ["D1 Prague–Brno", "D5 Prague–Plzeň"] },
    { iso2: "SK", ports: ["Port of Bratislava (Danube)"], truckStops: ["Slovnaft Station"], hotels: ["ibis SK"], industrialParks: ["Trnava Automotive Zone"], railYards: ["Bratislava ÚNS Terminal"], borderCrossings: ["Brodské-CZ", "Rajka-HU", "Rusovce-HU"], airportCargo: ["Bratislava BTS"], corridors: ["D1 Bratislava–Žilina"] },
    { iso2: "HU", ports: ["Port of Budapest (Danube)"], truckStops: ["MOL Station", "Shell HU"], hotels: ["ibis HU", "B&B Hotel HU"], industrialParks: ["Győr Audi Zone", "Kecskemét Mercedes Zone"], railYards: ["Budapest BILK Terminal"], borderCrossings: ["Hegyeshalom-AT", "Röszke-RS", "Záhony-UA"], airportCargo: ["Budapest BUD"], corridors: ["M1 Budapest–Vienna", "M5 Budapest–Szeged"] },
    { iso2: "SI", ports: ["Port of Koper"], truckStops: ["Petrol Station SI"], hotels: ["B&B Hotel SI"], industrialParks: ["Ljubljana Industrial Zone"], railYards: ["Koper Rail Terminal"], borderCrossings: ["Karavanke-AT", "Obrežje-HR"], airportCargo: ["Ljubljana LJU"], corridors: ["A1 Ljubljana–Maribor"] },
    { iso2: "EE", ports: ["Port of Tallinn", "Muuga Harbour"], truckStops: ["Circle K EE", "Neste EE"], hotels: ["Tallink Hotels"], industrialParks: ["Muuga Logistics Park"], railYards: ["Muuga Rail Terminal"], borderCrossings: ["Narva-RU", "Ikla-LV"], airportCargo: ["Tallinn TLL"], corridors: ["E20 Tallinn–Narva", "E67 Tallinn–Pärnu"] },
    { iso2: "LV", ports: ["Freeport of Riga", "Port of Ventspils", "Port of Liepāja"], truckStops: ["Circle K LV", "Neste LV"], hotels: ["ibis LV"], industrialParks: ["Riga Freeport Zone"], railYards: ["Riga Central Freight"], borderCrossings: ["Terehova-RU", "Grenctāle-LT"], airportCargo: ["Riga RIX"], corridors: ["A1 Riga–Bauska"] },
    { iso2: "LT", ports: ["Port of Klaipėda"], truckStops: ["Circle K LT", "Viada Station"], hotels: ["ibis LT"], industrialParks: ["Klaipėda FEZ", "Kaunas FEZ"], railYards: ["Klaipėda Intermodal"], borderCrossings: ["Kybartai-RU", "Medininkai-BY", "Šalčininkai-PL"], airportCargo: ["Vilnius VNO"], corridors: ["A1 Vilnius–Klaipėda"] },
    { iso2: "HR", ports: ["Port of Rijeka", "Port of Split", "Port of Ploče"], truckStops: ["INA Station", "Petrol HR"], hotels: ["ibis HR"], industrialParks: ["Rijeka Industrial Zone"], railYards: ["Rijeka Rail Terminal"], borderCrossings: ["Bregana-SI", "Bajakovo-RS"], airportCargo: ["Zagreb ZAG"], corridors: ["A1 Zagreb–Split", "A3 Zagreb–Slavonski Brod"] },
    { iso2: "RO", ports: ["Port of Constanța", "Port of Galați"], truckStops: ["Petrom Station", "OMV RO"], hotels: ["ibis RO", "B&B Hotel RO"], industrialParks: ["Constanța Free Zone", "Pitești Automotive Zone"], railYards: ["Constanța Rail Terminal"], borderCrossings: ["Nădlac-HU", "Giurgiu-BG", "Siret-UA"], airportCargo: ["Bucharest OTP"], corridors: ["A1 Bucharest–Pitești", "A2 Bucharest–Constanța"] },
    { iso2: "BG", ports: ["Port of Varna", "Port of Burgas"], truckStops: ["Lukoil BG", "Shell BG"], hotels: ["ibis BG"], industrialParks: ["Varna Free Zone", "Maritsa Industrial Zone"], railYards: ["Plovdiv Freight Terminal"], borderCrossings: ["Kapitan Andreevo-TR", "Kalotina-RS", "Kulata-GR"], airportCargo: ["Sofia SOF"], corridors: ["Trakia Motorway Sofia–Burgas", "Struma Motorway Sofia–Kulata"] },
    { iso2: "GR", ports: ["Port of Piraeus", "Port of Thessaloniki", "Port of Patras"], truckStops: ["Shell GR", "BP GR"], hotels: ["ibis GR"], industrialParks: ["Thessaloniki Industrial Zone"], railYards: ["Thessaloniki Rail Terminal"], borderCrossings: ["Promachonas-BG", "Evzoni-MK", "Kakavia-AL"], airportCargo: ["Athens ATH", "Thessaloniki SKG"], corridors: ["A1 Athens–Thessaloniki", "E92 Thessaloniki–Evzoni"] },
    { iso2: "TR", ports: ["Port of Mersin", "Port of Ambarlı Istanbul", "Port of İzmir", "Port of Trabzon"], truckStops: ["Petrol Ofisi", "Shell TR", "Opet Station"], hotels: ["ibis TR", "Holiday Inn TR"], industrialParks: ["Gebze Industrial Zone", "Kayseri OSB"], railYards: ["Halkalı Logistics Center Istanbul"], borderCrossings: ["Kapıkule-BG", "Habur-IQ", "Gürbulak-IR"], airportCargo: ["Istanbul IST", "Ankara ESB"], corridors: ["O-4 Istanbul–Ankara", "O-52 Ankara–İzmir"] },
    { iso2: "KW", ports: ["Port of Shuwaikh", "Port of Shuaiba"], truckStops: ["KNPC Station"], hotels: ["ibis KW", "Holiday Inn KW"], industrialParks: ["Shuaiba Industrial Area"], railYards: [], borderCrossings: ["Abdali-IQ"], airportCargo: ["Kuwait KWI"], corridors: ["Route 80 Kuwait–Iraq"] },
    { iso2: "OM", ports: ["Port of Sohar", "Port of Salalah", "Port Sultan Qaboos"], truckStops: ["Shell OM", "OQ Station"], hotels: ["ibis OM", "Citymax OM"], industrialParks: ["Sohar Industrial Port Zone", "Duqm SEZ"], railYards: [], borderCrossings: ["Al Ain-AE", "Wadi Mawt-YE"], airportCargo: ["Muscat MCT"], corridors: ["Route 1 Muscat–Sohar", "Route 31 Muscat–Salalah"] },
    { iso2: "BH", ports: ["Khalifa bin Salman Port"], truckStops: ["Bapco Station"], hotels: ["ibis BH"], industrialParks: ["BIIP Bahrain", "Salman Industrial City"], railYards: [], borderCrossings: ["King Fahd Causeway-SA"], airportCargo: ["Bahrain BAH"], corridors: ["King Fahd Causeway Corridor"] },
    { iso2: "SG", ports: ["Port of Singapore PSA", "Jurong Port"], truckStops: ["SPC Station", "Shell SG"], hotels: ["ibis SG", "Hotel 81"], industrialParks: ["Jurong Industrial Estate", "Tuas Industrial Zone"], railYards: [], borderCrossings: ["Woodlands-MY", "Tuas-MY"], airportCargo: ["Changi SIN"], corridors: ["AYE Tuas–Changi"] },
    { iso2: "MY", ports: ["Port Klang", "Port of Tanjung Pelepas", "Penang Port", "Kuantan Port"], truckStops: ["Petronas Station", "Shell MY", "BHP Station"], hotels: ["ibis MY", "Tune Hotels"], industrialParks: ["Kulim Hi-Tech Park", "Pasir Gudang Industrial"], railYards: ["Padang Besar Rail Terminal"], borderCrossings: ["JB-SG Causeway", "Bukit Kayu Hitam-TH", "Padang Besar-TH"], airportCargo: ["Kuala Lumpur KUL", "Penang PEN"], corridors: ["PLUS Highway KL–JB", "East Coast Expressway"] },
    { iso2: "JP", ports: ["Port of Tokyo", "Port of Yokohama", "Port of Kobe", "Port of Nagoya", "Port of Osaka"], truckStops: ["ENEOS Station", "Idemitsu Station"], hotels: ["APA Hotels", "Toyoko Inn", "Route Inn"], industrialParks: ["Keihin Industrial Zone", "Chukyo Industrial"], railYards: ["Tokyo Freight Terminal", "Osaka Freight Terminal"], borderCrossings: [], airportCargo: ["Narita NRT", "Kansai KIX", "Chubu NGO"], corridors: ["Tomei Expressway Tokyo–Nagoya", "Meishin Expressway Nagoya–Kobe"] },
    { iso2: "KR", ports: ["Port of Busan", "Port of Incheon", "Port of Ulsan", "Port of Gwangyang"], truckStops: ["SK Station", "GS Caltex Station"], hotels: ["ibis KR", "Lotte City Hotel"], industrialParks: ["Ulsan Industrial Complex", "Yeosu Petrochemical"], railYards: ["Busan BCTC Terminal"], borderCrossings: [], airportCargo: ["Incheon ICN", "Gimpo GMP"], corridors: ["Gyeongbu Expressway Seoul–Busan", "Honam Expressway"] },
    { iso2: "CL", ports: ["Puerto de San Antonio", "Puerto de Valparaíso", "Puerto de Antofagasta"], truckStops: ["Copec Estación", "Shell CL"], hotels: ["ibis CL", "Holiday Inn CL"], industrialParks: ["ENAMI Mining Zone Antofagasta", "Rancagua Industrial"], railYards: ["EFE Santiago Terminal"], borderCrossings: ["Los Libertadores-AR", "Chacalluta-PE"], airportCargo: ["Santiago SCL"], corridors: ["Ruta 5 Panamericana", "Ruta 68 Santiago–Valparaíso"] },
    { iso2: "AR", ports: ["Puerto de Buenos Aires", "Puerto de Rosario", "Puerto de Bahía Blanca"], truckStops: ["YPF Estación", "Shell AR", "Axion Station"], hotels: ["ibis AR", "Holiday Inn AR"], industrialParks: ["Polo Petroquímico Bahía Blanca", "Rosario Industrial Zone"], railYards: ["NCA Buenos Aires Terminal"], borderCrossings: ["Paso Cristo Redentor-CL", "Paso de los Libres-BR", "Gualeguaychú-UY"], airportCargo: ["Buenos Aires EZE"], corridors: ["RN 9 Buenos Aires–Rosario", "RN 3 Buenos Aires–Bahía Blanca"] },
    { iso2: "CO", ports: ["Puerto de Buenaventura", "Puerto de Cartagena", "Puerto de Barranquilla", "Puerto de Santa Marta"], truckStops: ["Terpel Estación", "Primax Station"], hotels: ["ibis CO", "Holiday Inn CO", "GHL Hotels"], industrialParks: ["Zona Franca Bogotá", "Zona Franca Cartagena"], railYards: [], borderCrossings: ["Cúcuta-VE", "Rumichaca-EC", "Paso Nuevo-PA"], airportCargo: ["Bogotá BOG", "Medellín MDE"], corridors: ["Ruta del Sol Bogotá–Coast", "Autopista Medellín–Bogotá"] },
    { iso2: "PE", ports: ["Puerto del Callao", "Puerto de Paita", "Puerto de Matarani"], truckStops: ["Primax Station PE", "Repsol PE"], hotels: ["ibis PE", "Casa Andina"], industrialParks: ["Zona Industrial Callao", "La Joya Industrial Arequipa"], railYards: ["Ferrovías Central Callao"], borderCrossings: ["Santa Rosa-EC", "Desaguadero-BO", "Tacna-CL"], airportCargo: ["Lima LIM"], corridors: ["Panamericana Norte", "Central Highway Lima–La Oroya"] },

    // ══════════════════════════════════════════════════════════
    // TIER D — SLATE (3 countries)
    // ══════════════════════════════════════════════════════════
    { iso2: "UY", ports: ["Puerto de Montevideo", "Puerto de Nueva Palmira"], truckStops: ["Ancap Estación", "Petrobras UY"], hotels: ["ibis UY"], industrialParks: ["Zona Franca Montevideo", "Zonamerica"], railYards: [], borderCrossings: ["Fray Bentos-AR", "Chuy-BR", "Colonia-AR Ferry"], airportCargo: ["Montevideo MVD"], corridors: ["Ruta 1 Montevideo–Colonia"] },
    { iso2: "PA", ports: ["Panama Canal Ports", "Port of Balboa", "Port of Cristóbal", "Port of Colón"], truckStops: ["Delta Station PA", "Puma Energy PA"], hotels: ["ibis PA", "Holiday Inn PA"], industrialParks: ["Colón Free Zone", "Panama Pacífico SEZ"], railYards: ["Panama Canal Railway"], borderCrossings: ["Paso Canoas-CR"], airportCargo: ["Tocumen PTY"], corridors: ["Pan-American Highway PA", "Corredor Norte Panama City"] },
    { iso2: "CR", ports: ["Puerto de Limón/Moín", "Puerto Caldera"], truckStops: ["Total CR", "Delta Station CR"], hotels: ["ibis CR", "Holiday Inn CR"], industrialParks: ["COYOL Free Zone", "El Coyol Industrial Park"], railYards: [], borderCrossings: ["Peñas Blancas-NI", "Paso Canoas-PA"], airportCargo: ["San José SJO"], corridors: ["Ruta 1 Interamericana", "Ruta 32 San José–Limón"] },
];

// ═══════════════════════════════════════════════════════════════════════
// CROSS-PRODUCT KEYWORD GENERATOR
// ═══════════════════════════════════════════════════════════════════════

/**
 * Generate infrastructure × escort keyword combinations for a country.
 * These create the long-tail and extremely-long-tail pages.
 *
 * Example outputs:
 *   "pilot car service near Port of Houston"
 *   "oversize escort Pilot Flying J Kenly 95"
 *   "escort vehicle Holiday Inn Express Houston"
 *   "schwertransport begleitung Hafen Hamburg"
 */
export function generateInfraKeywords(
    iso2: string,
    coreTerms: string[],
): string[] {
    const seeds = COUNTRY_INFRA_SEEDS.find((s) => s.iso2 === iso2);
    if (!seeds) return [];

    const results: string[] = [];
    const infraSets = [
        { items: seeds.ports, prefix: "near", suffix: "port escort" },
        { items: seeds.truckStops, prefix: "near", suffix: "truck stop escort" },
        { items: seeds.hotels, prefix: "near", suffix: "trucker lodging" },
        { items: seeds.industrialParks, prefix: "near", suffix: "industrial escort" },
        { items: seeds.railYards, prefix: "at", suffix: "intermodal escort" },
        { items: seeds.borderCrossings, prefix: "at", suffix: "cross-border escort" },
        { items: seeds.airportCargo, prefix: "near", suffix: "cargo escort" },
        { items: seeds.corridors, prefix: "on", suffix: "corridor escort" },
    ];

    for (const core of coreTerms.slice(0, 4)) { // top 4 core terms
        for (const set of infraSets) {
            for (const item of set.items.slice(0, 5)) { // top 5 per category
                results.push(`${core} ${set.prefix} ${item}`);
                results.push(`${item} ${set.suffix}`);
            }
        }
    }

    return results;
}

/**
 * Count total potential pages for a country.
 * Each infra item = 1 claimable page + N keyword combos.
 */
export function countClaimablePages(iso2: string): {
    total: number;
    byCategory: Record<string, number>;
} {
    const seeds = COUNTRY_INFRA_SEEDS.find((s) => s.iso2 === iso2);
    if (!seeds) return { total: 0, byCategory: {} };

    const byCategory: Record<string, number> = {
        ports: seeds.ports.length,
        truckStops: seeds.truckStops.length,
        hotels: seeds.hotels.length,
        industrialParks: seeds.industrialParks.length,
        railYards: seeds.railYards.length,
        borderCrossings: seeds.borderCrossings.length,
        airportCargo: seeds.airportCargo.length,
        corridors: seeds.corridors.length,
    };

    const total = Object.values(byCategory).reduce((a, b) => a + b, 0);
    return { total, byCategory };
}

/**
 * Get all claimable infrastructure for a country (for the claim flow).
 */
export function getClaimableInfra(iso2: string): Array<{
    name: string;
    category: string;
    claimable: boolean;
    adSlots: number;
}> {
    const seeds = COUNTRY_INFRA_SEEDS.find((s) => s.iso2 === iso2);
    if (!seeds) return [];

    const results: Array<{ name: string; category: string; claimable: boolean; adSlots: number }> = [];
    const mapping: [string, InfraCategory, string[]][] = [
        ["Port", "port", seeds.ports],
        ["Truck Stop", "truck_stop", seeds.truckStops],
        ["Hotel", "hotel", seeds.hotels],
        ["Industrial Park", "industrial_park", seeds.industrialParks],
        ["Rail Yard", "rail_yard", seeds.railYards],
        ["Border Crossing", "border_crossing", seeds.borderCrossings],
        ["Airport Cargo", "airport_cargo", seeds.airportCargo],
    ];

    for (const [label, cat, items] of mapping) {
        const config = INFRA_CATEGORIES[cat];
        for (const item of items) {
            results.push({
                name: item,
                category: label,
                claimable: config.claimable,
                adSlots: config.adSlots,
            });
        }
    }

    return results;
}

/** Total infrastructure across all 52 countries */
export function getGlobalInfraStats(): {
    totalLocations: number;
    claimableLocations: number;
    totalAdSlots: number;
    byCountry: Record<string, number>;
} {
    let totalLocations = 0;
    let claimableLocations = 0;
    let totalAdSlots = 0;
    const byCountry: Record<string, number> = {};

    for (const seeds of COUNTRY_INFRA_SEEDS) {
        const infra = getClaimableInfra(seeds.iso2);
        byCountry[seeds.iso2] = infra.length;
        totalLocations += infra.length;
        claimableLocations += infra.filter((i) => i.claimable).length;
        totalAdSlots += infra.reduce((s, i) => s + i.adSlots, 0);
    }

    return { totalLocations, claimableLocations, totalAdSlots, byCountry };
}
