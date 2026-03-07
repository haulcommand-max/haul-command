// ══════════════════════════════════════════════════════════════
// SEO KEYWORD MATRIX — "pilot car directory [location]"
// Purpose: Generate target keyword combos for all 52 countries
//          at country → state/province → city granularity
// Pattern: "{local_escort_term} directory {location}"
//          "{local_escort_term} near {location}"
//          "{local_escort_term} services in {location}"
// ══════════════════════════════════════════════════════════════

import { getEscortTerminology } from "./escort-terminology";

// ── Country-Level Keyword Seeds ──

export interface CountryKeywordSeed {
    iso2: string;
    country: string;
    /** Primary escort term in local language */
    primaryTerm: string;
    /** All variant terms people search */
    searchTerms: string[];
    /** Local oversize load term */
    oversizeTerm: string;
    /** Major cities for city-level pages */
    topCities: string[];
    /** States/provinces/regions for sub-national pages */
    regions: string[];
    /** Regulatory body name (for authority content) */
    regulatoryBody: string;
}

// All 52 countries with localized escort terminology

export const COUNTRY_KEYWORD_SEEDS: CountryKeywordSeed[] = [
    // ═══ TIER A — GOLD ═══
    {
        iso2: "US", country: "United States",
        primaryTerm: "pilot car",
        searchTerms: ["pilot car", "escort vehicle", "pilot escort vehicle", "pevo", "oversize load escort", "wide load escort", "pilot car service", "pilot car driver"],
        oversizeTerm: "oversize load",
        topCities: ["Houston", "Dallas", "Los Angeles", "Phoenix", "Denver", "Atlanta", "Nashville", "Charlotte", "Oklahoma City", "Salt Lake City", "Seattle", "Portland", "Minneapolis", "Tampa", "Jacksonville", "San Antonio", "Tulsa", "Albuquerque", "Boise", "Fargo", "Billings", "Midland", "Lubbock", "Odessa", "Casper"],
        regions: ["Texas", "California", "Florida", "Colorado", "Oklahoma", "Washington", "Arizona", "Georgia", "North Carolina", "Minnesota", "Utah", "Virginia", "Pennsylvania", "New York", "Oregon", "Idaho", "Montana", "Wyoming", "New Mexico", "Nevada", "Ohio", "Illinois", "Tennessee", "Alabama", "Louisiana", "Mississippi", "Arkansas", "Kansas", "Nebraska", "South Dakota", "North Dakota", "Iowa", "Missouri", "Wisconsin", "Michigan", "Indiana", "Kentucky", "West Virginia", "South Carolina", "Maryland", "New Jersey", "Connecticut", "Massachusetts", "Maine", "New Hampshire", "Vermont", "Rhode Island", "Delaware", "Hawaii", "Alaska"],
        regulatoryBody: "FHWA / State DOTs",
    },
    {
        iso2: "CA", country: "Canada",
        primaryTerm: "pilot car",
        searchTerms: ["pilot car", "escort vehicle", "pilot vehicle", "wide load escort", "oversize escort", "pilot car service"],
        oversizeTerm: "oversize load",
        topCities: ["Calgary", "Edmonton", "Vancouver", "Toronto", "Montreal", "Winnipeg", "Saskatoon", "Regina", "Halifax", "Ottawa", "Thunder Bay", "Fort McMurray"],
        regions: ["Alberta", "British Columbia", "Ontario", "Quebec", "Saskatchewan", "Manitoba", "Nova Scotia", "New Brunswick", "Newfoundland", "Prince Edward Island", "Northwest Territories", "Yukon", "Nunavut"],
        regulatoryBody: "Transport Canada / Provincial MoTs",
    },
    {
        iso2: "AU", country: "Australia",
        primaryTerm: "escort vehicle",
        searchTerms: ["escort vehicle", "pilot vehicle", "escort car", "oversize escort", "over-dimensional escort", "escort vehicle operator", "pilot vehicle driver"],
        oversizeTerm: "over-dimensional load",
        topCities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Darwin", "Hobart", "Canberra", "Gold Coast", "Newcastle", "Townsville", "Cairns", "Port Hedland", "Karratha", "Kalgoorlie"],
        regions: ["New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia", "Tasmania", "Northern Territory", "Australian Capital Territory"],
        regulatoryBody: "NHVR (National Heavy Vehicle Regulator)",
    },
    {
        iso2: "GB", country: "United Kingdom",
        primaryTerm: "escort vehicle",
        searchTerms: ["escort vehicle", "abnormal load escort", "wide load escort", "police escort vehicle", "STGO escort", "heavy haulage escort", "abnormal load notification"],
        oversizeTerm: "abnormal load",
        topCities: ["London", "Birmingham", "Manchester", "Leeds", "Glasgow", "Edinburgh", "Liverpool", "Bristol", "Southampton", "Aberdeen", "Newcastle", "Sheffield", "Felixstowe", "Immingham"],
        regions: ["England", "Scotland", "Wales", "Northern Ireland"],
        regulatoryBody: "DVSA / Highways England",
    },
    {
        iso2: "NZ", country: "New Zealand",
        primaryTerm: "pilot vehicle",
        searchTerms: ["pilot vehicle", "escort vehicle", "overweight permit escort", "over-dimension escort", "pilot vehicle operator"],
        oversizeTerm: "over-dimension load",
        topCities: ["Auckland", "Wellington", "Christchurch", "Hamilton", "Tauranga", "Dunedin", "Napier", "New Plymouth"],
        regions: ["Auckland", "Canterbury", "Waikato", "Bay of Plenty", "Wellington", "Otago", "Manawatu-Whanganui", "Northland", "Taranaki", "Hawke's Bay", "Southland"],
        regulatoryBody: "Waka Kotahi NZ Transport Agency",
    },
    {
        iso2: "ZA", country: "South Africa",
        primaryTerm: "escort vehicle",
        searchTerms: ["escort vehicle", "abnormal load escort", "pilot car", "oversize escort", "traffic escort"],
        oversizeTerm: "abnormal load",
        topCities: ["Johannesburg", "Cape Town", "Durban", "Pretoria", "Port Elizabeth", "East London", "Richards Bay", "Saldanha Bay"],
        regions: ["Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape", "Free State", "Mpumalanga", "Limpopo", "North West", "Northern Cape"],
        regulatoryBody: "DoT South Africa / RTMC",
    },
    {
        iso2: "DE", country: "Germany",
        primaryTerm: "Begleitfahrzeug",
        searchTerms: ["Begleitfahrzeug", "Schwertransport Begleitung", "BF3", "BF4", "escort vehicle Germany", "Schwertransport escort", "Großraum- und Schwertransport"],
        oversizeTerm: "Schwertransport",
        topCities: ["Hamburg", "Bremen", "Duisburg", "Frankfurt", "Munich", "Berlin", "Cologne", "Stuttgart", "Hanover", "Dortmund", "Essen", "Leipzig", "Dresden", "Rostock", "Bremerhaven"],
        regions: ["Nordrhein-Westfalen", "Bayern", "Baden-Württemberg", "Niedersachsen", "Hessen", "Sachsen", "Schleswig-Holstein", "Brandenburg", "Mecklenburg-Vorpommern", "Thüringen", "Sachsen-Anhalt", "Rheinland-Pfalz", "Saarland", "Berlin", "Bremen", "Hamburg"],
        regulatoryBody: "BASt / Landesbehörden",
    },
    {
        iso2: "NL", country: "Netherlands",
        primaryTerm: "begeleidingsvoertuig",
        searchTerms: ["begeleidingsvoertuig", "exceptioneel transport begeleiding", "escort vehicle Netherlands", "zwaar transport begeleiding"],
        oversizeTerm: "exceptioneel transport",
        topCities: ["Rotterdam", "Amsterdam", "The Hague", "Utrecht", "Eindhoven", "Groningen", "Tilburg", "Vlissingen"],
        regions: ["Zuid-Holland", "Noord-Holland", "Noord-Brabant", "Gelderland", "Limburg", "Overijssel", "Groningen", "Friesland", "Drenthe", "Flevoland", "Zeeland", "Utrecht"],
        regulatoryBody: "RDW / Rijkswaterstaat",
    },
    {
        iso2: "AE", country: "United Arab Emirates",
        primaryTerm: "escort vehicle",
        searchTerms: ["escort vehicle UAE", "oversize load escort Dubai", "heavy equipment escort", "pilot car Dubai", "abnormal load escort Abu Dhabi"],
        oversizeTerm: "oversize load",
        topCities: ["Dubai", "Abu Dhabi", "Sharjah", "Fujairah", "Ras Al Khaimah", "Jebel Ali", "Khalifa Port"],
        regions: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"],
        regulatoryBody: "RTA / ITC / Municipality",
    },
    {
        iso2: "BR", country: "Brazil",
        primaryTerm: "veículo batedor",
        searchTerms: ["veículo batedor", "escolta de carga", "carga indivisível escolta", "veículo de escolta", "batedor de transporte especial", "escort vehicle Brazil"],
        oversizeTerm: "carga indivisível",
        topCities: ["São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre", "Salvador", "Recife", "Manaus", "Vitória", "Santos", "Paranaguá"],
        regions: ["São Paulo", "Minas Gerais", "Rio de Janeiro", "Paraná", "Rio Grande do Sul", "Bahia", "Santa Catarina", "Goiás", "Pará", "Mato Grosso", "Mato Grosso do Sul", "Pernambuco"],
        regulatoryBody: "DNIT / ANTT",
    },

    // ═══ TIER B — BLUE ═══
    {
        iso2: "IE", country: "Ireland",
        primaryTerm: "escort vehicle",
        searchTerms: ["escort vehicle", "abnormal load escort Ireland", "wide load escort", "pilot car Ireland"],
        oversizeTerm: "abnormal load",
        topCities: ["Dublin", "Cork", "Galway", "Limerick", "Waterford", "Shannon"],
        regions: ["Dublin", "Cork", "Galway", "Limerick", "Munster", "Connacht", "Leinster", "Ulster"],
        regulatoryBody: "TII / An Garda Síochána",
    },
    {
        iso2: "SE", country: "Sweden",
        primaryTerm: "eskortfordon",
        searchTerms: ["eskortfordon", "följefordon", "bred last eskort", "specialtransport", "escort vehicle Sweden"],
        oversizeTerm: "specialtransport",
        topCities: ["Stockholm", "Gothenburg", "Malmö", "Uppsala", "Luleå", "Norrköping"],
        regions: ["Stockholm", "Västra Götaland", "Skåne", "Norrbotten", "Västerbotten", "Dalarna"],
        regulatoryBody: "Transportstyrelsen",
    },
    {
        iso2: "NO", country: "Norway",
        primaryTerm: "følgebil",
        searchTerms: ["følgebil", "spesialtransport", "bred last følge", "escort vehicle Norway"],
        oversizeTerm: "spesialtransport",
        topCities: ["Oslo", "Bergen", "Trondheim", "Stavanger", "Tromsø", "Kristiansand"],
        regions: ["Oslo", "Vestland", "Trøndelag", "Rogaland", "Nordland", "Troms og Finnmark"],
        regulatoryBody: "Statens vegvesen",
    },
    {
        iso2: "DK", country: "Denmark",
        primaryTerm: "følgebil",
        searchTerms: ["følgebil", "specialtransport", "bred last følge", "escort vehicle Denmark"],
        oversizeTerm: "specialtransport",
        topCities: ["Copenhagen", "Aarhus", "Odense", "Aalborg", "Esbjerg", "Fredericia"],
        regions: ["Hovedstaden", "Sjælland", "Syddanmark", "Midtjylland", "Nordjylland"],
        regulatoryBody: "Vejdirektoratet",
    },
    {
        iso2: "FI", country: "Finland",
        primaryTerm: "saattoauto",
        searchTerms: ["saattoauto", "erikoiskuljetus saatto", "leveä kuljetus", "escort vehicle Finland"],
        oversizeTerm: "erikoiskuljetus",
        topCities: ["Helsinki", "Tampere", "Turku", "Oulu", "Jyväskylä", "Vaasa"],
        regions: ["Uusimaa", "Pirkanmaa", "Varsinais-Suomi", "Pohjois-Pohjanmaa", "Keski-Suomi"],
        regulatoryBody: "Traficom / ELY-keskus",
    },
    {
        iso2: "BE", country: "Belgium",
        primaryTerm: "begeleidingsvoertuig",
        searchTerms: ["begeleidingsvoertuig", "véhicule d'accompagnement", "exceptioneel transport", "convoi exceptionnel", "escort vehicle Belgium"],
        oversizeTerm: "exceptioneel transport / convoi exceptionnel",
        topCities: ["Antwerp", "Brussels", "Ghent", "Bruges", "Liège", "Charleroi", "Zeebrugge"],
        regions: ["Flanders", "Wallonia", "Brussels-Capital"],
        regulatoryBody: "FOD Mobiliteit / SPW Mobilité",
    },
    {
        iso2: "AT", country: "Austria",
        primaryTerm: "Begleitfahrzeug",
        searchTerms: ["Begleitfahrzeug", "Sondertransport Begleitung", "Schwertransport Österreich", "escort vehicle Austria"],
        oversizeTerm: "Sondertransport",
        topCities: ["Vienna", "Graz", "Linz", "Salzburg", "Innsbruck", "Klagenfurt"],
        regions: ["Wien", "Niederösterreich", "Oberösterreich", "Steiermark", "Tirol", "Kärnten", "Salzburg", "Vorarlberg", "Burgenland"],
        regulatoryBody: "ASFINAG / Landeshauptmann",
    },
    {
        iso2: "CH", country: "Switzerland",
        primaryTerm: "Begleitfahrzeug",
        searchTerms: ["Begleitfahrzeug", "véhicule d'accompagnement", "veicolo di scorta", "Schwertransport Schweiz", "escort vehicle Switzerland"],
        oversizeTerm: "Schwertransport / convoi exceptionnel",
        topCities: ["Zurich", "Geneva", "Basel", "Bern", "Lausanne", "Lucerne"],
        regions: ["Zürich", "Bern", "Vaud", "Genève", "Basel-Stadt", "Aargau", "St. Gallen", "Luzern", "Ticino", "Valais"],
        regulatoryBody: "ASTRA / Kantonale Behörden",
    },
    {
        iso2: "ES", country: "Spain",
        primaryTerm: "vehículo de acompañamiento",
        searchTerms: ["vehículo de acompañamiento", "escolta de transporte especial", "transporte especial escolta", "pilot car Spain", "escort vehicle Spain"],
        oversizeTerm: "transporte especial",
        topCities: ["Madrid", "Barcelona", "Valencia", "Seville", "Bilbao", "Málaga", "Zaragoza", "Algeciras", "Tarragona"],
        regions: ["Andalucía", "Cataluña", "Madrid", "Valencia", "País Vasco", "Galicia", "Castilla y León", "Aragón", "Murcia"],
        regulatoryBody: "DGT / Ministerio de Transportes",
    },
    {
        iso2: "FR", country: "France",
        primaryTerm: "véhicule d'accompagnement",
        searchTerms: ["véhicule d'accompagnement", "voiture pilote", "convoi exceptionnel escorte", "escort vehicle France", "accompagnateur convoi"],
        oversizeTerm: "convoi exceptionnel",
        topCities: ["Paris", "Marseille", "Lyon", "Le Havre", "Toulouse", "Bordeaux", "Nantes", "Lille", "Dunkerque", "Fos-sur-Mer"],
        regions: ["Île-de-France", "Auvergne-Rhône-Alpes", "Nouvelle-Aquitaine", "Occitanie", "Hauts-de-France", "Grand Est", "Pays de la Loire", "Bretagne", "Normandie", "PACA"],
        regulatoryBody: "DREAL / Préfectures",
    },
    {
        iso2: "IT", country: "Italy",
        primaryTerm: "veicolo di scorta",
        searchTerms: ["veicolo di scorta", "scorta tecnica", "trasporto eccezionale scorta", "escort vehicle Italy", "scorta trasporto eccezionale"],
        oversizeTerm: "trasporto eccezionale",
        topCities: ["Milan", "Rome", "Genoa", "Naples", "Turin", "Venice", "Trieste", "Ravenna", "Livorno", "Taranto", "Gioia Tauro"],
        regions: ["Lombardia", "Lazio", "Liguria", "Campania", "Piemonte", "Veneto", "Emilia-Romagna", "Toscana", "Puglia", "Sicilia"],
        regulatoryBody: "MIT / ANAS / Prefetture",
    },
    {
        iso2: "PT", country: "Portugal",
        primaryTerm: "veículo de escolta",
        searchTerms: ["veículo de escolta", "transporte especial escolta", "carga excepcional", "escort vehicle Portugal"],
        oversizeTerm: "transporte especial",
        topCities: ["Lisbon", "Porto", "Sines", "Setúbal", "Leixões", "Aveiro"],
        regions: ["Lisboa", "Porto", "Setúbal", "Alentejo", "Algarve", "Centro", "Norte"],
        regulatoryBody: "IMT / Infraestruturas de Portugal",
    },
    {
        iso2: "SA", country: "Saudi Arabia",
        primaryTerm: "escort vehicle",
        searchTerms: ["escort vehicle Saudi", "oversize escort Jeddah", "heavy load escort", "مركبة مرافقة", "escort vehicle KSA"],
        oversizeTerm: "oversize load",
        topCities: ["Riyadh", "Jeddah", "Dammam", "Jubail", "Yanbu", "NEOM", "Ras Al Khair"],
        regions: ["Riyadh", "Makkah", "Eastern Province", "Madinah", "Asir", "Tabuk"],
        regulatoryBody: "Ministry of Transport / Muroor",
    },
    {
        iso2: "QA", country: "Qatar",
        primaryTerm: "escort vehicle",
        searchTerms: ["escort vehicle Qatar", "oversize load escort Doha", "heavy haul escort Qatar"],
        oversizeTerm: "oversize load",
        topCities: ["Doha", "Lusail", "Mesaieed", "Ras Laffan"],
        regions: ["Doha", "Al Rayyan", "Al Wakrah", "Al Khor"],
        regulatoryBody: "Ministry of Transport / Ashghal",
    },
    {
        iso2: "MX", country: "Mexico",
        primaryTerm: "vehículo escolta",
        searchTerms: ["vehículo escolta", "escolta de carga", "escolta transporte especial", "banderero", "pilot car Mexico"],
        oversizeTerm: "carga sobredimensionada",
        topCities: ["Mexico City", "Monterrey", "Guadalajara", "Manzanillo", "Lázaro Cárdenas", "Veracruz", "Altamira", "Nuevo Laredo", "Tijuana", "Ciudad Juárez"],
        regions: ["Estado de México", "Nuevo León", "Jalisco", "Colima", "Michoacán", "Veracruz", "Tamaulipas", "Baja California", "Chihuahua", "Sonora", "Guanajuato"],
        regulatoryBody: "SCT / SICT",
    },

    // ═══ TIER C — SILVER ═══
    {
        iso2: "PL", country: "Poland",
        primaryTerm: "pojazd pilotujący",
        searchTerms: ["pojazd pilotujący", "pilot drogowy", "transport nienormatywny escort", "escort vehicle Poland"],
        oversizeTerm: "transport nienormatywny",
        topCities: ["Warsaw", "Gdańsk", "Gdynia", "Szczecin", "Łódź", "Wrocław", "Poznań", "Kraków", "Katowice"],
        regions: ["Mazowieckie", "Pomorskie", "Zachodniopomorskie", "Łódzkie", "Dolnośląskie", "Wielkopolskie", "Małopolskie", "Śląskie"],
        regulatoryBody: "GDDKiA / Starostwa",
    },
    {
        iso2: "CZ", country: "Czech Republic",
        primaryTerm: "doprovodné vozidlo",
        searchTerms: ["doprovodné vozidlo", "nadměrný náklad doprovod", "escort vehicle Czech", "přeprava nadměrných nákladů"],
        oversizeTerm: "nadměrný náklad",
        topCities: ["Prague", "Brno", "Ostrava", "Plzeň"],
        regions: ["Praha", "Středočeský", "Jihomoravský", "Moravskoslezský", "Plzeňský"],
        regulatoryBody: "Ministerstvo dopravy / ŘSD",
    },
    {
        iso2: "SK", country: "Slovakia",
        primaryTerm: "sprievodné vozidlo",
        searchTerms: ["sprievodné vozidlo", "nadrozmerná preprava", "escort vehicle Slovakia"],
        oversizeTerm: "nadrozmerná preprava",
        topCities: ["Bratislava", "Košice", "Žilina", "Banská Bystrica"],
        regions: ["Bratislavský", "Košický", "Žilinský", "Banskobystrický", "Prešovský"],
        regulatoryBody: "SSC / MDV SR",
    },
    {
        iso2: "HU", country: "Hungary",
        primaryTerm: "kísérő jármű",
        searchTerms: ["kísérő jármű", "túlméretes szállítmány", "escort vehicle Hungary"],
        oversizeTerm: "túlméretes szállítmány",
        topCities: ["Budapest", "Debrecen", "Szeged", "Győr", "Miskolc"],
        regions: ["Budapest", "Pest", "Hajdú-Bihar", "Csongrád-Csanád", "Győr-Moson-Sopron"],
        regulatoryBody: "Magyar Közút / NFM",
    },
    {
        iso2: "SI", country: "Slovenia",
        primaryTerm: "spremno vozilo",
        searchTerms: ["spremno vozilo", "izredni prevoz", "escort vehicle Slovenia"],
        oversizeTerm: "izredni prevoz",
        topCities: ["Ljubljana", "Maribor", "Koper"],
        regions: ["Osrednjeslovenska", "Podravska", "Obalno-kraška"],
        regulatoryBody: "DARS / DRSI",
    },
    {
        iso2: "EE", country: "Estonia",
        primaryTerm: "saatesõiduk",
        searchTerms: ["saatesõiduk", "erivedu saade", "escort vehicle Estonia"],
        oversizeTerm: "erivedu",
        topCities: ["Tallinn", "Tartu", "Pärnu", "Muuga"],
        regions: ["Harju", "Tartu", "Pärnu", "Ida-Viru"],
        regulatoryBody: "Transpordiamet",
    },
    {
        iso2: "LV", country: "Latvia",
        primaryTerm: "pavadoņa transportlīdzeklis",
        searchTerms: ["pavadoņa transportlīdzeklis", "escort vehicle Latvia"],
        oversizeTerm: "lielgabarīta krava",
        topCities: ["Riga", "Ventspils", "Liepāja", "Daugavpils"],
        regions: ["Rīga", "Kurzeme", "Vidzeme", "Latgale"],
        regulatoryBody: "VSIA LVC",
    },
    {
        iso2: "LT", country: "Lithuania",
        primaryTerm: "lydintis automobilis",
        searchTerms: ["lydintis automobilis", "escort vehicle Lithuania"],
        oversizeTerm: "negabaritinis krovinys",
        topCities: ["Vilnius", "Kaunas", "Klaipėda", "Šiauliai"],
        regions: ["Vilniaus", "Kauno", "Klaipėdos", "Šiaulių"],
        regulatoryBody: "LAKD",
    },
    {
        iso2: "HR", country: "Croatia",
        primaryTerm: "pratnja vozilo",
        searchTerms: ["pratnja vozilo", "izvanredni prijevoz", "escort vehicle Croatia"],
        oversizeTerm: "izvanredni prijevoz",
        topCities: ["Zagreb", "Split", "Rijeka", "Osijek"],
        regions: ["Zagreb", "Split-Dalmatia", "Primorje-Gorski Kotar", "Osijek-Baranja"],
        regulatoryBody: "HAC / Hrvatske ceste",
    },
    {
        iso2: "RO", country: "Romania",
        primaryTerm: "vehicul de însoțire",
        searchTerms: ["vehicul de însoțire", "transport agabaritic", "escort vehicle Romania"],
        oversizeTerm: "transport agabaritic",
        topCities: ["Bucharest", "Constanța", "Cluj-Napoca", "Timișoara", "Iași"],
        regions: ["București", "Constanța", "Cluj", "Timiș", "Iași", "Brașov"],
        regulatoryBody: "CNAIR / AND",
    },
    {
        iso2: "BG", country: "Bulgaria",
        primaryTerm: "пилотен автомобил",
        searchTerms: ["пилотен автомобил", "извънгабаритен товар", "escort vehicle Bulgaria"],
        oversizeTerm: "извънгабаритен товар",
        topCities: ["Sofia", "Varna", "Burgas", "Plovdiv"],
        regions: ["Sofia", "Varna", "Burgas", "Plovdiv", "Stara Zagora"],
        regulatoryBody: "АПИ / МТИТС",
    },
    {
        iso2: "GR", country: "Greece",
        primaryTerm: "όχημα συνοδείας",
        searchTerms: ["όχημα συνοδείας", "υπερμεγέθης φορτίο", "escort vehicle Greece"],
        oversizeTerm: "υπερμεγέθης φορτίο",
        topCities: ["Athens", "Thessaloniki", "Piraeus", "Patras", "Elefsina"],
        regions: ["Attica", "Central Macedonia", "Thessaly", "Western Greece", "Crete"],
        regulatoryBody: "Υπουργείο Υποδομών / ΕΥΔΕ",
    },
    {
        iso2: "TR", country: "Turkey",
        primaryTerm: "refakat aracı",
        searchTerms: ["refakat aracı", "gabari dışı yük", "escort vehicle Turkey", "özel yük taşıma"],
        oversizeTerm: "gabari dışı yük",
        topCities: ["Istanbul", "Ankara", "Izmir", "Mersin", "Antalya", "Trabzon", "Iskenderun"],
        regions: ["Istanbul", "Ankara", "Izmir", "Marmara", "Ege", "Akdeniz", "Karadeniz", "İç Anadolu"],
        regulatoryBody: "KGM / Ulaştırma Bakanlığı",
    },
    {
        iso2: "KW", country: "Kuwait",
        primaryTerm: "escort vehicle",
        searchTerms: ["escort vehicle Kuwait", "oversize load escort Kuwait"],
        oversizeTerm: "oversize load",
        topCities: ["Kuwait City", "Shuaiba", "Ahmadi", "Mina Abdullah"],
        regions: ["Al Asimah", "Hawalli", "Al Ahmadi", "Al Jahra"],
        regulatoryBody: "Ministry of Public Works",
    },
    {
        iso2: "OM", country: "Oman",
        primaryTerm: "escort vehicle",
        searchTerms: ["escort vehicle Oman", "oversize load escort Muscat", "heavy haul escort Oman"],
        oversizeTerm: "oversize load",
        topCities: ["Muscat", "Sohar", "Salalah", "Duqm"],
        regions: ["Muscat", "Al Batinah", "Dhofar", "Al Wusta"],
        regulatoryBody: "Ministry of Transport / ROP",
    },
    {
        iso2: "BH", country: "Bahrain",
        primaryTerm: "escort vehicle",
        searchTerms: ["escort vehicle Bahrain", "oversize escort Bahrain"],
        oversizeTerm: "oversize load",
        topCities: ["Manama", "Juffair", "Hidd", "Sitra"],
        regions: ["Capital", "Northern", "Southern", "Muharraq"],
        regulatoryBody: "Ministry of Works",
    },
    {
        iso2: "SG", country: "Singapore",
        primaryTerm: "escort vehicle",
        searchTerms: ["escort vehicle Singapore", "heavy vehicle escort", "oversize load escort SG"],
        oversizeTerm: "oversize vehicle",
        topCities: ["Singapore", "Tuas", "Jurong", "Changi"],
        regions: ["Central", "East", "North", "Northeast", "West"],
        regulatoryBody: "LTA",
    },
    {
        iso2: "MY", country: "Malaysia",
        primaryTerm: "kenderaan pengiring",
        searchTerms: ["kenderaan pengiring", "escort vehicle Malaysia", "oversize load escort"],
        oversizeTerm: "kenderaan berat",
        topCities: ["Kuala Lumpur", "Penang", "Johor Bahru", "Port Klang", "Kuantan"],
        regions: ["Selangor", "Johor", "Penang", "Perak", "Sabah", "Sarawak"],
        regulatoryBody: "JPJ / JKR",
    },
    {
        iso2: "JP", country: "Japan",
        primaryTerm: "先導車",
        searchTerms: ["先導車", "特殊車両 誘導車", "escort vehicle Japan", "特殊車両通行許可", "誘導車"],
        oversizeTerm: "特殊車両",
        topCities: ["Tokyo", "Yokohama", "Osaka", "Kobe", "Nagoya", "Fukuoka", "Kitakyushu", "Chiba"],
        regions: ["Kanto", "Kansai", "Chubu", "Kyushu", "Tohoku", "Hokkaido", "Chugoku", "Shikoku"],
        regulatoryBody: "MLIT / 道路管理者",
    },
    {
        iso2: "KR", country: "South Korea",
        primaryTerm: "유도차량",
        searchTerms: ["유도차량", "특수차량 호송", "escort vehicle Korea", "과적차량 운송"],
        oversizeTerm: "특수차량",
        topCities: ["Seoul", "Busan", "Incheon", "Ulsan", "Gwangyang", "Pyeongtaek"],
        regions: ["Seoul", "Gyeonggi", "Busan", "Incheon", "Gyeongnam", "Jeonnam"],
        regulatoryBody: "MOLIT / 한국도로공사",
    },
    {
        iso2: "CL", country: "Chile",
        primaryTerm: "vehículo escolta",
        searchTerms: ["vehículo escolta", "carga sobredimensionada Chile", "escort vehicle Chile"],
        oversizeTerm: "carga sobredimensionada",
        topCities: ["Santiago", "Antofagasta", "Valparaíso", "Calama", "Iquique", "Concepción"],
        regions: ["Metropolitana", "Antofagasta", "Valparaíso", "Biobío", "Atacama", "Tarapacá"],
        regulatoryBody: "MOP / Vialidad",
    },
    {
        iso2: "AR", country: "Argentina",
        primaryTerm: "vehículo de escolta",
        searchTerms: ["vehículo de escolta", "transporte especial escolta", "carga excepcional Argentina", "escort vehicle Argentina"],
        oversizeTerm: "carga excepcional",
        topCities: ["Buenos Aires", "Rosario", "Bahía Blanca", "Córdoba", "Mendoza", "Neuquén"],
        regions: ["Buenos Aires", "Santa Fe", "Córdoba", "Mendoza", "Neuquén", "Tucumán", "Entre Ríos"],
        regulatoryBody: "DNV / CNRT",
    },
    {
        iso2: "CO", country: "Colombia",
        primaryTerm: "vehículo escolta",
        searchTerms: ["vehículo escolta", "carga extradimensionada Colombia", "escort vehicle Colombia"],
        oversizeTerm: "carga extradimensionada",
        topCities: ["Bogotá", "Medellín", "Cartagena", "Barranquilla", "Buenaventura", "Cali"],
        regions: ["Cundinamarca", "Antioquia", "Bolívar", "Atlántico", "Valle del Cauca"],
        regulatoryBody: "ANI / INVÍAS / Mintransporte",
    },
    {
        iso2: "PE", country: "Peru",
        primaryTerm: "vehículo escolta",
        searchTerms: ["vehículo escolta", "carga especial Perú", "escort vehicle Peru"],
        oversizeTerm: "carga especial",
        topCities: ["Lima", "Callao", "Arequipa", "Trujillo", "Piura"],
        regions: ["Lima", "Callao", "Arequipa", "La Libertad", "Piura", "Cusco", "Ica"],
        regulatoryBody: "MTC / PROVIAS",
    },

    // ═══ TIER D — SLATE ═══
    {
        iso2: "UY", country: "Uruguay",
        primaryTerm: "vehículo escolta",
        searchTerms: ["vehículo escolta", "transporte especial Uruguay", "escort vehicle Uruguay"],
        oversizeTerm: "transporte especial",
        topCities: ["Montevideo", "Punta del Este", "Colonia", "Rivera"],
        regions: ["Montevideo", "Canelones", "Maldonado", "Rivera"],
        regulatoryBody: "MTOP / DNV",
    },
    {
        iso2: "PA", country: "Panama",
        primaryTerm: "vehículo escolta",
        searchTerms: ["vehículo escolta", "carga sobredimensionada Panamá", "escort vehicle Panama"],
        oversizeTerm: "carga sobredimensionada",
        topCities: ["Panama City", "Colón", "David"],
        regions: ["Panamá", "Colón", "Chiriquí"],
        regulatoryBody: "MOP / ATTT",
    },
    {
        iso2: "CR", country: "Costa Rica",
        primaryTerm: "vehículo escolta",
        searchTerms: ["vehículo escolta", "carga especial Costa Rica", "escort vehicle Costa Rica"],
        oversizeTerm: "carga especial",
        topCities: ["San José", "Limón", "Puntarenas", "Liberia"],
        regions: ["San José", "Limón", "Puntarenas", "Guanacaste", "Alajuela"],
        regulatoryBody: "MOPT / CONAVI",
    },
];

// ═══ KEYWORD GENERATION FUNCTIONS ═══

export interface GeneratedKeyword {
    keyword: string;
    type: "directory" | "near_me" | "services" | "regulations" | "cost";
    location: string;
    locationLevel: "country" | "region" | "city";
    iso2: string;
    searchVolumeTier: "high" | "medium" | "low";
}

/** Generate all keyword combinations for a country */
export function generateKeywordsForCountry(iso2: string): GeneratedKeyword[] {
    const seed = COUNTRY_KEYWORD_SEEDS.find(s => s.iso2 === iso2);
    if (!seed) return [];

    const keywords: GeneratedKeyword[] = [];
    const patterns = [
        { type: "directory" as const, template: (term: string, loc: string) => `${term} directory ${loc}` },
        { type: "near_me" as const, template: (term: string, loc: string) => `${term} near ${loc}` },
        { type: "services" as const, template: (term: string, loc: string) => `${term} services in ${loc}` },
        { type: "regulations" as const, template: (term: string, loc: string) => `${term} regulations ${loc}` },
        { type: "cost" as const, template: (term: string, loc: string) => `${term} cost ${loc}` },
    ];

    // Country-level
    for (const pattern of patterns) {
        keywords.push({
            keyword: pattern.template(seed.primaryTerm, seed.country),
            type: pattern.type,
            location: seed.country,
            locationLevel: "country",
            iso2,
            searchVolumeTier: "high",
        });
    }

    // Region-level
    for (const region of seed.regions) {
        for (const pattern of patterns) {
            keywords.push({
                keyword: pattern.template(seed.primaryTerm, region),
                type: pattern.type,
                location: region,
                locationLevel: "region",
                iso2,
                searchVolumeTier: "medium",
            });
        }
    }

    // City-level
    for (const city of seed.topCities) {
        for (const pattern of patterns) {
            keywords.push({
                keyword: pattern.template(seed.primaryTerm, city),
                type: pattern.type,
                location: city,
                locationLevel: "city",
                iso2,
                searchVolumeTier: seed.topCities.indexOf(city) < 5 ? "medium" : "low",
            });
        }
    }

    // Also generate for variant search terms at country level
    for (const term of seed.searchTerms.slice(1)) { // skip primary, already covered
        keywords.push({
            keyword: `${term} directory ${seed.country}`,
            type: "directory",
            location: seed.country,
            locationLevel: "country",
            iso2,
            searchVolumeTier: "medium",
        });
    }

    return keywords;
}

/** Get total keyword count across all countries */
export function getTotalKeywordCount(): number {
    let total = 0;
    for (const seed of COUNTRY_KEYWORD_SEEDS) {
        const patterns = 5; // directory, near, services, regulations, cost
        const countryLevel = patterns;
        const regionLevel = seed.regions.length * patterns;
        const cityLevel = seed.topCities.length * patterns;
        const variantTerms = seed.searchTerms.length - 1;
        total += countryLevel + regionLevel + cityLevel + variantTerms;
    }
    return total;
}

/** Get keyword seeds for a specific country */
export function getKeywordSeed(iso2: string): CountryKeywordSeed | undefined {
    return COUNTRY_KEYWORD_SEEDS.find(s => s.iso2 === iso2);
}

/** Get all regulatory bodies across all countries */
export function getAllRegulatoryBodies(): { iso2: string; body: string }[] {
    return COUNTRY_KEYWORD_SEEDS.map(s => ({ iso2: s.iso2, body: s.regulatoryBody }));
}
