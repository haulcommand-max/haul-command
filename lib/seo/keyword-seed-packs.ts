// ═══════════════════════════════════════════════════════════
// GLOBAL KEYWORD SEED PACKS — Country-by-country SEO terms
// Pattern: service_core × equipment_type × geo_modifier
// ═══════════════════════════════════════════════════════════

export interface KeywordSeedPack {
    country: string;
    iso2: string;
    languages: string[];
    coreTerms: string[];
    geoModifiers: string[];
    equipmentTerms: string[];
    regulatoryTerms: string[];
    urgencyModifiers: string[];
}

export const KEYWORD_SEED_PACKS: KeywordSeedPack[] = [
    // ── WAVE 1: Foundation ──
    {
        country: "United States",
        iso2: "US",
        languages: ["en"],
        coreTerms: [
            "pilot car services",
            "oversize load escort",
            "wide load escort",
            "heavy haul escort",
            "escort vehicle services",
            "route survey services",
            "height pole services",
        ],
        geoModifiers: [
            "texas", "california", "florida", "georgia", "louisiana",
            "ohio", "pennsylvania", "illinois", "new york", "michigan",
            "houston", "dallas", "los angeles", "jacksonville", "atlanta",
        ],
        equipmentTerms: [
            "wind turbine blade transport",
            "mobile home transport",
            "transformer transport",
            "crane transport",
            "steel beam transport",
            "boat transport",
            "farm equipment transport",
            "construction equipment transport",
        ],
        regulatoryTerms: [
            "oversize load permit",
            "wide load regulations",
            "pilot car requirements",
            "escort vehicle certification",
            "oversize load dimensions",
        ],
        urgencyModifiers: [
            "near me", "today", "same day", "emergency",
            "available now", "24/7", "this week",
        ],
    },
    {
        country: "Canada",
        iso2: "CA",
        languages: ["en", "fr"],
        coreTerms: [
            "pilot car services canada",
            "oversize load escort canada",
            "wide load escort",
            "heavy haul escort vehicle",
            "véhicule d'escorte surdimensionné",
            "transport hors normes escorte",
        ],
        geoModifiers: [
            "ontario", "alberta", "british columbia", "quebec",
            "saskatchewan", "manitoba", "toronto", "calgary",
            "vancouver", "edmonton", "winnipeg", "montreal",
        ],
        equipmentTerms: [
            "oil sands equipment transport",
            "mining equipment escort",
            "wind turbine transport canada",
            "prefab building transport",
            "forestry equipment transport",
        ],
        regulatoryTerms: [
            "oversize load permit canada",
            "pilot car requirements ontario",
            "alberta wide load regulations",
            "bc oversize load escort rules",
        ],
        urgencyModifiers: [
            "near me", "available today", "this week",
        ],
    },
    {
        country: "Australia",
        iso2: "AU",
        languages: ["en"],
        coreTerms: [
            "pilot vehicle australia",
            "oversize escort australia",
            "heavy haul escort australia",
            "over-dimensional transport escort",
            "OSOM transport escort",
            "pilot vehicle operator",
        ],
        geoModifiers: [
            "perth", "brisbane", "melbourne", "sydney",
            "regional wa", "queensland", "new south wales",
            "victoria", "south australia", "northern territory",
            "port hedland", "gladstone", "hunter valley",
        ],
        equipmentTerms: [
            "mining equipment transport",
            "wind turbine transport australia",
            "oversize machinery escort",
            "agricultural machinery transport",
            "modular building transport",
        ],
        regulatoryTerms: [
            "NHVR oversize permit",
            "pilot vehicle accreditation",
            "OSOM vehicle permit",
            "state road authority escort rules",
        ],
        urgencyModifiers: [
            "near me", "available today", "urgent",
        ],
    },
    {
        country: "United Kingdom",
        iso2: "GB",
        languages: ["en"],
        coreTerms: [
            "abnormal load escort uk",
            "escort vehicle uk",
            "wide load escort uk",
            "STGO escort services",
            "abnormal load police notification",
            "special types escort",
        ],
        geoModifiers: [
            "midlands", "greater london", "manchester",
            "scotland corridor", "north england",
            "wales", "birmingham", "leeds", "bristol",
            "port of felixstowe", "port of southampton",
        ],
        equipmentTerms: [
            "abnormal indivisible loads",
            "heavy plant transport",
            "modular transport uk",
            "transformer transport uk",
            "wind farm transport",
        ],
        regulatoryTerms: [
            "STGO regulations",
            "abnormal load notification",
            "highways england escort requirements",
            "police escort booking",
            "vehicle special orders",
        ],
        urgencyModifiers: [
            "near me", "urgent", "same day",
        ],
    },

    // ── WAVE 2: Expansion ──
    {
        country: "Germany",
        iso2: "DE",
        languages: ["de", "en"],
        coreTerms: [
            "schwertransport begleitung",
            "begleitschutz transport",
            "grossraumtransport escort",
            "überbreite ladung begleitung",
            "BF3 begleitfahrzeug",
            "BF4 begleitfahrzeug",
        ],
        geoModifiers: [
            "nrw", "bavaria", "hamburg port",
            "niedersachsen", "baden-württemberg",
            "duisburg", "bremerhaven", "frankfurt",
        ],
        equipmentTerms: [
            "windkraft transport",
            "industrieanlagen transport",
            "transformator transport",
            "stahlbau transport",
            "baumaschinen transport",
        ],
        regulatoryTerms: [
            "STVO schwertransport",
            "genehmigung grossraum",
            "begleitfahrzeug zulassung",
        ],
        urgencyModifiers: [
            "sofort verfügbar", "dringend", "heute",
        ],
    },
    {
        country: "Netherlands",
        iso2: "NL",
        languages: ["nl", "en"],
        coreTerms: [
            "zwaar transport begeleiding",
            "exceptioneel transport escort",
            "oversize load escort netherlands",
        ],
        geoModifiers: [
            "rotterdam port", "amsterdam", "eindhoven",
            "maastricht", "groningen",
        ],
        equipmentTerms: [
            "offshore transport", "windmolen transport",
            "zware machines transport",
        ],
        regulatoryTerms: [
            "RDW ontheffing", "exceptioneel transport vergunning",
        ],
        urgencyModifiers: ["direct beschikbaar", "vandaag"],
    },
    {
        country: "South Africa",
        iso2: "ZA",
        languages: ["en"],
        coreTerms: [
            "abnormal load escort south africa",
            "pilot vehicle south africa",
            "oversize load escort SA",
        ],
        geoModifiers: [
            "gauteng", "cape town", "durban",
            "mpumalanga", "free state", "richards bay",
        ],
        equipmentTerms: [
            "mining equipment transport",
            "renewable energy transport",
            "turbine transport south africa",
        ],
        regulatoryTerms: [
            "RTMS abnormal load permit",
            "NRTA pilot vehicle requirements",
        ],
        urgencyModifiers: ["available now", "urgent"],
    },
    {
        country: "New Zealand",
        iso2: "NZ",
        languages: ["en"],
        coreTerms: [
            "pilot vehicle new zealand",
            "oversize load escort nz",
            "over-dimension vehicle escort",
        ],
        geoModifiers: [
            "auckland", "christchurch", "wellington",
            "waikato", "canterbury", "southland",
        ],
        equipmentTerms: [
            "dairy equipment transport",
            "forestry equipment escort",
            "construction machinery transport",
        ],
        regulatoryTerms: [
            "NZTA overdimension permit",
            "pilot vehicle operator certification",
        ],
        urgencyModifiers: ["available today", "urgent"],
    },

    // ── WAVE 3: Scale ──
    {
        country: "Brazil",
        iso2: "BR",
        languages: ["pt"],
        coreTerms: [
            "escolta carga especial",
            "escolta rodoviaria pesada",
            "transporte superdimensionado",
            "veículo batedor",
            "escolta carga indivisível",
        ],
        geoModifiers: [
            "são paulo", "minas gerais", "paraná corridor",
            "rio grande do sul", "bahia", "goiás",
            "santos port", "paranaguá",
        ],
        equipmentTerms: [
            "máquinas agrícolas transporte",
            "transformadores transporte",
            "equipamento mineração transporte",
            "turbina eólica transporte",
        ],
        regulatoryTerms: [
            "AET autorização especial trânsito",
            "DNIT normas carga especial",
        ],
        urgencyModifiers: ["disponível agora", "urgente", "hoje"],
    },
    {
        country: "Mexico",
        iso2: "MX",
        languages: ["es"],
        coreTerms: [
            "escolta carga sobredimensionada",
            "vehículo piloto transporte especial",
            "escolta transporte pesado",
        ],
        geoModifiers: [
            "monterrey", "guadalajara", "ciudad de méxico",
            "veracruz port", "manzanillo", "chihuahua",
        ],
        equipmentTerms: [
            "transporte maquinaria pesada",
            "transporte equipo industrial",
            "transporte aerogeneradores",
        ],
        regulatoryTerms: [
            "SCT permiso carga especial",
            "NOM transporte sobredimensionado",
        ],
        urgencyModifiers: ["disponible ahora", "urgente", "hoy"],
    },
    // ── AE (missing from Gold) ──
    {
        country: "United Arab Emirates",
        iso2: "AE",
        languages: ["en", "ar"],
        coreTerms: ["escort vehicle dubai", "pilot vehicle abu dhabi", "oversize load escort uae", "abnormal load escort uae", "مركبة مرافقة دبي"],
        geoModifiers: ["dubai", "abu dhabi", "sharjah", "jebel ali", "fujairah", "ras al khaimah", "khalifa port", "JAFZA"],
        equipmentTerms: ["oil rig equipment transport", "construction crane escort", "wind turbine escort uae", "modular building transport"],
        regulatoryTerms: ["RTA special transport permit", "traffic escort dubai", "oversize load permit abu dhabi"],
        urgencyModifiers: ["available now", "today", "urgent", "متاح الآن"],
    },
    // ══════════════ TIER B — BLUE (15 countries) ══════════════
    {
        country: "Ireland",
        iso2: "IE",
        languages: ["en"],
        coreTerms: ["escort vehicle ireland", "abnormal load escort", "pilot vehicle ireland", "wide load escort dublin"],
        geoModifiers: ["dublin", "cork", "limerick", "galway", "waterford", "shannon", "rosslare", "belfast corridor"],
        equipmentTerms: ["wind turbine transport ireland", "farm machinery escort", "pharmaceutical equipment transport"],
        regulatoryTerms: ["TII abnormal load permit", "garda escort notification", "abnormal load regulations ireland"],
        urgencyModifiers: ["available now", "today", "this week"],
    },
    {
        country: "Sweden",
        iso2: "SE",
        languages: ["sv", "en"],
        coreTerms: ["eskortfordon", "ledsagarbil", "specialtransport eskort", "bred last eskort", "pilot car sweden"],
        geoModifiers: ["göteborg", "stockholm", "malmö", "gothenburg port", "norrland", "västra götaland", "skåne"],
        equipmentTerms: ["vindkraftverk transport", "gruvutrustning transport", "transformator transport"],
        regulatoryTerms: ["Trafikverket specialtransport tillstånd", "bred last regler", "eskort krav sverige"],
        urgencyModifiers: ["tillgänglig nu", "akut", "idag", "available now"],
    },
    {
        country: "Norway",
        iso2: "NO",
        languages: ["no", "en"],
        coreTerms: ["følgebil", "eskortebil", "spesialtransport eskort", "bred last følgebil", "pilot car norway"],
        geoModifiers: ["oslo", "bergen", "stavanger", "trondheim", "tromsø", "hammerfest", "kristiansand"],
        equipmentTerms: ["vindturbin transport norge", "oljeplattform utstyr transport", "tunnelbormaskin transport"],
        regulatoryTerms: ["Statens vegvesen spesialtransport", "bred last tillatelse", "følgebil krav"],
        urgencyModifiers: ["tilgjengelig nå", "haster", "i dag"],
    },
    {
        country: "Denmark",
        iso2: "DK",
        languages: ["da", "en"],
        coreTerms: ["ledsagebil", "særtransport eskort", "bred last eskort", "pilot car denmark"],
        geoModifiers: ["copenhagen", "aarhus", "odense", "esbjerg port", "aalborg", "fredericia"],
        equipmentTerms: ["vindmølle transport", "offshore udstyr transport", "landbrugsmaskiner transport"],
        regulatoryTerms: ["Vejdirektoratet særtransport", "bred last regler danmark"],
        urgencyModifiers: ["tilgængelig nu", "haster", "i dag"],
    },
    {
        country: "Finland",
        iso2: "FI",
        languages: ["fi", "en"],
        coreTerms: ["saattueauto", "varoitusauto", "erikoiskuljetus", "erikoiskuljetus saattue", "pilot car finland"],
        geoModifiers: ["helsinki", "turku", "tampere", "oulu", "kotka port", "rauma", "kouvola"],
        equipmentTerms: ["tuulivoimala kuljetus", "kaivoskoneet kuljetus", "muuntaja kuljetus"],
        regulatoryTerms: ["ELY-keskus erikoiskuljetus lupa", "erikoiskuljetus säännöt"],
        urgencyModifiers: ["saatavilla nyt", "kiireellinen", "tänään"],
    },
    {
        country: "Belgium",
        iso2: "BE",
        languages: ["nl", "fr", "en"],
        coreTerms: ["begeleiding uitzonderlijk transport", "convoi exceptionnel escorte", "escort vehicle belgium", "transport exceptionnel belgique"],
        geoModifiers: ["antwerp port", "brussels", "ghent", "liège", "bruges", "charleroi", "zeebrugge"],
        equipmentTerms: ["windturbine transport", "petrochemisch transport", "zware industrie transport"],
        regulatoryTerms: ["FOD Mobiliteit uitzonderlijk vervoer", "SPW transport exceptionnel"],
        urgencyModifiers: ["beschikbaar nu", "disponible maintenant", "dringend"],
    },
    {
        country: "Austria",
        iso2: "AT",
        languages: ["de"],
        coreTerms: ["Schwertransport Begleitung Österreich", "Transportbegleitung", "Sondertransport Begleitfahrzeug", "oversize escort austria"],
        geoModifiers: ["wien", "graz", "linz", "salzburg", "innsbruck", "brenner pass", "vienna port"],
        equipmentTerms: ["Transformator Transport", "Windkraftanlage Transport", "Tunnelbohrmaschine Transport"],
        regulatoryTerms: ["BMK Sondertransport Genehmigung", "StVO §40 Begleitfahrzeug"],
        urgencyModifiers: ["sofort verfügbar", "dringend", "heute"],
    },
    {
        country: "Switzerland",
        iso2: "CH",
        languages: ["de", "fr", "it"],
        coreTerms: ["Schwertransport Begleitung Schweiz", "convoi exceptionnel suisse", "trasporto eccezionale svizzera", "oversize escort switzerland"],
        geoModifiers: ["zürich", "basel", "bern", "genève", "lausanne", "gotthard", "chiasso"],
        equipmentTerms: ["Tunnelbohrmaschine Transport", "Kraftwerk Komponenten Transport", "pharma equipment transport"],
        regulatoryTerms: ["ASTRA Schwertransport Bewilligung", "Sonderbewilligung Transport Schweiz"],
        urgencyModifiers: ["sofort verfügbar", "disponible immédiatement", "urgente"],
    },
    {
        country: "Spain",
        iso2: "ES",
        languages: ["es"],
        coreTerms: ["vehículo de acompañamiento", "escolta transporte especial", "transporte especial españa", "pilot car spain"],
        geoModifiers: ["madrid", "barcelona", "valencia port", "bilbao", "algeciras port", "sevilla", "zaragoza", "sagunto"],
        equipmentTerms: ["transporte aerogeneradores", "transporte maquinaria minería", "transporte grúa industrial"],
        regulatoryTerms: ["DGT transporte especial permiso", "Real Decreto 443/2001", "Guardia Civil escolta"],
        urgencyModifiers: ["disponible ahora", "urgente", "hoy"],
    },
    {
        country: "France",
        iso2: "FR",
        languages: ["fr"],
        coreTerms: ["voiture pilote convoi exceptionnel", "accompagnement convoi exceptionnel", "escorte transport exceptionnel", "pilot car france"],
        geoModifiers: ["paris", "lyon", "marseille port", "le havre port", "dunkerque", "toulouse", "nantes", "bordeaux"],
        equipmentTerms: ["transport éolienne", "transport transformateur", "transport nucléaire"],
        regulatoryTerms: ["DREAL convoi exceptionnel", "arrêté convoi exceptionnel", "gendarmerie escorte"],
        urgencyModifiers: ["disponible maintenant", "urgent", "aujourd'hui"],
    },
    {
        country: "Italy",
        iso2: "IT",
        languages: ["it"],
        coreTerms: ["scorta tecnica trasporto eccezionale", "veicolo scorta", "trasporto eccezionale italia", "escort service italy transport"],
        geoModifiers: ["milano", "roma", "genova port", "trieste port", "napoli", "torino", "bologna", "verona"],
        equipmentTerms: ["trasporto turbina eolica", "trasporto trasformatore", "trasporto macchinari pesanti"],
        regulatoryTerms: ["ANAS trasporto eccezionale", "Codice della Strada Art. 10", "Polizia Stradale scorta"],
        urgencyModifiers: ["disponibile ora", "urgente", "oggi"],
    },
    {
        country: "Portugal",
        iso2: "PT",
        languages: ["pt"],
        coreTerms: ["veículo de acompanhamento", "escolta transporte especial portugal", "transporte especial portugal"],
        geoModifiers: ["lisboa", "porto", "sines port", "leixões", "setúbal", "faro", "aveiro"],
        equipmentTerms: ["transporte aerogeradores", "transporte equipamento industrial", "transporte transformadores"],
        regulatoryTerms: ["IMT transporte especial licença", "GNR escolta transporte"],
        urgencyModifiers: ["disponível agora", "urgente", "hoje"],
    },
    {
        country: "Saudi Arabia",
        iso2: "SA",
        languages: ["ar", "en"],
        coreTerms: ["مركبة مرافقة السعودية", "escort vehicle saudi", "oversize load escort saudi", "نقل استثنائي مرافقة"],
        geoModifiers: ["riyadh", "jeddah", "dammam port", "jubail", "yanbu", "NEOM", "makkah", "madinah"],
        equipmentTerms: ["oil refinery equipment transport", "desalination plant transport", "construction crane transport saudi"],
        regulatoryTerms: ["وزارة النقل نقل استثنائي", "المرور السعودي تصريح", "MOMRA transport permit"],
        urgencyModifiers: ["متاح الآن", "عاجل", "اليوم", "available now"],
    },
    {
        country: "Qatar",
        iso2: "QA",
        languages: ["ar", "en"],
        coreTerms: ["مركبة مرافقة قطر", "escort vehicle qatar", "oversize load escort doha", "نقل خاص مرافقة"],
        geoModifiers: ["doha", "lusail", "ras laffan", "mesaieed", "hamad port", "al wakrah"],
        equipmentTerms: ["LNG equipment transport", "construction equipment escort qatar", "stadium equipment transport"],
        regulatoryTerms: ["Ashghal transport permit", "Qatar traffic escort", "oversize load permit doha"],
        urgencyModifiers: ["متاح الآن", "عاجل", "available now"],
    },
    // ══════════════ TIER C — SILVER (24 countries) ══════════════
    { country: "Poland", iso2: "PL", languages: ["pl"], coreTerms: ["pilot transportu nienormatywnego", "pojazd pilotujący", "transport ponadgabarytowy eskort"], geoModifiers: ["warszawa", "gdańsk port", "gdynia port", "wrocław", "katowice", "szczecin", "łódź"], equipmentTerms: ["transport turbin wiatrowych", "transport transformatorów", "transport maszyn górniczych"], regulatoryTerms: ["GDDKiA zezwolenie", "prawo o ruchu drogowym art. 64"], urgencyModifiers: ["dostępne teraz", "pilne", "dzisiaj"] },
    { country: "Czech Republic", iso2: "CZ", languages: ["cs"], coreTerms: ["doprovodné vozidlo", "nadrozměrná přeprava", "pilot přepravy"], geoModifiers: ["praha", "brno", "ostrava", "plzeň", "olomouc"], equipmentTerms: ["přeprava větrných elektráren", "přeprava transformátorů", "přeprava těžkých strojů"], regulatoryTerms: ["ŘSD nadrozměrná přeprava", "zákon o silničním provozu"], urgencyModifiers: ["k dispozici nyní", "naléhavé", "dnes"] },
    { country: "Slovakia", iso2: "SK", languages: ["sk"], coreTerms: ["sprievodné vozidlo", "nadrozmerná preprava", "eskort transport slovensko"], geoModifiers: ["bratislava", "košice", "žilina", "trnava", "nitra"], equipmentTerms: ["preprava veterných turbín", "preprava transformátorov"], regulatoryTerms: ["SSC nadrozmerná preprava povolenie"], urgencyModifiers: ["dostupné teraz", "naliehavé", "dnes"] },
    { country: "Hungary", iso2: "HU", languages: ["hu"], coreTerms: ["kísérő jármű", "túlméretes szállítmány", "különleges szállítmány kíséret"], geoModifiers: ["budapest", "debrecen", "győr", "szeged", "miskolc", "pécs"], equipmentTerms: ["szélturbina szállítás", "transzformátor szállítás", "nehézgép szállítás"], regulatoryTerms: ["Magyar Közút túlméretes engedély", "KRESZ különleges szállítmány"], urgencyModifiers: ["elérhető most", "sürgős", "ma"] },
    { country: "Slovenia", iso2: "SI", languages: ["sl"], coreTerms: ["spremno vozilo", "izredni prevoz", "eskort transport slovenija"], geoModifiers: ["ljubljana", "maribor", "koper port", "celje", "kranj"], equipmentTerms: ["prevoz vetrnih turbin", "prevoz transformatorjev"], regulatoryTerms: ["DARS izredni prevoz dovoljenje"], urgencyModifiers: ["na voljo zdaj", "nujno", "danes"] },
    { country: "Estonia", iso2: "EE", languages: ["et", "en"], coreTerms: ["saateauto", "erivedu", "suuregabariidiline vedu", "escort vehicle estonia"], geoModifiers: ["tallinn", "tartu", "muuga harbour", "pärnu", "narva"], equipmentTerms: ["tuuleturbiini transport", "trafod transport"], regulatoryTerms: ["Transpordiamet erivedu luba", "liiklusseadus"], urgencyModifiers: ["saadaval kohe", "kiire", "täna"] },
    { country: "Latvia", iso2: "LV", languages: ["lv", "en"], coreTerms: ["pavadošais auto", "lielgabarīta krava", "escort vehicle latvia"], geoModifiers: ["rīga", "ventspils port", "liepāja", "daugavpils", "rīga freeport"], equipmentTerms: ["vēja turbīnu transports", "transformatoru transports"], regulatoryTerms: ["Latvijas Valsts ceļi lielgabarīta atļauja"], urgencyModifiers: ["pieejams tagad", "steidzami", "šodien"] },
    { country: "Lithuania", iso2: "LT", languages: ["lt", "en"], coreTerms: ["lydimasis automobilis", "didžiagabaritė siunta", "escort vehicle lithuania"], geoModifiers: ["vilnius", "kaunas", "klaipėda port", "šiauliai", "panevėžys"], equipmentTerms: ["vėjo jėgainių transportas", "transformatorių transportas"], regulatoryTerms: ["LAKD didžiagabaričio leidimas"], urgencyModifiers: ["galima dabar", "skubu", "šiandien"] },
    { country: "Croatia", iso2: "HR", languages: ["hr"], coreTerms: ["prateno vozilo", "izvanredni prijevoz", "eskort transport hrvatska"], geoModifiers: ["zagreb", "rijeka port", "split", "osijek", "ploče port"], equipmentTerms: ["prijevoz vjetroturbina", "prijevoz transformatora"], regulatoryTerms: ["HAC izvanredni prijevoz dozvola", "zakon o sigurnosti prometa"], urgencyModifiers: ["dostupno sada", "hitno", "danas"] },
    { country: "Romania", iso2: "RO", languages: ["ro"], coreTerms: ["vehicul de însoțire", "transport agabaritic", "escortă transport special"], geoModifiers: ["bucurești", "constanța port", "timișoara", "cluj-napoca", "galați port", "brașov", "iași"], equipmentTerms: ["transport turbine eoliene", "transport transformatoare", "transport echipamente miniere"], regulatoryTerms: ["CNAIR transport agabaritic autorizație", "OG 43/1997"], urgencyModifiers: ["disponibil acum", "urgent", "azi"] },
    { country: "Bulgaria", iso2: "BG", languages: ["bg"], coreTerms: ["съпровождащо МПС", "извънгабаритен товар", "ескорт транспорт българия"], geoModifiers: ["софия", "варна port", "бургас port", "пловдив", "русе", "стара загора"], equipmentTerms: ["транспорт ветрогенератори", "транспорт трансформатори"], regulatoryTerms: ["АПИ извънгабаритен разрешение"], urgencyModifiers: ["наличен сега", "спешно", "днес"] },
    { country: "Greece", iso2: "GR", languages: ["el", "en"], coreTerms: ["όχημα συνοδείας", "υπερμεγέθης φορτίο", "escort vehicle greece", "έκτακτη μεταφορά"], geoModifiers: ["αθήνα", "θεσσαλονίκη", "piraeus port", "πάτρα", "ηράκλειο", "βόλος"], equipmentTerms: ["μεταφορά ανεμογεννητριών", "μεταφορά μετασχηματιστών"], regulatoryTerms: ["ΥΠΟΜΕ έκτακτη μεταφορά άδεια"], urgencyModifiers: ["διαθέσιμο τώρα", "επείγον", "σήμερα"] },
    { country: "Turkey", iso2: "TR", languages: ["tr", "en"], coreTerms: ["eskort aracı", "refakat aracı", "gabari dışı yük", "özel yük taşıma eskort", "pilot car turkey"], geoModifiers: ["istanbul", "ankara", "izmir", "mersin port", "gebze", "bursa", "antalya", "trabzon port"], equipmentTerms: ["rüzgar türbini nakliye", "transformatör nakliye", "ağır makine nakliye"], regulatoryTerms: ["KGM gabari dışı izin", "Karayolu Taşıma Yönetmeliği"], urgencyModifiers: ["şimdi müsait", "acil", "bugün"] },
    { country: "Kuwait", iso2: "KW", languages: ["ar", "en"], coreTerms: ["مركبة مرافقة كويت", "escort vehicle kuwait", "حمولة استثنائية مرافقة"], geoModifiers: ["kuwait city", "shuaiba port", "shuwaikh port", "ahmadi"], equipmentTerms: ["oil equipment transport kuwait", "construction crane escort"], regulatoryTerms: ["وزارة الداخلية تصريح نقل"], urgencyModifiers: ["متاح الآن", "عاجل", "available now"] },
    { country: "Oman", iso2: "OM", languages: ["ar", "en"], coreTerms: ["مركبة مرافقة عمان", "escort vehicle oman", "نقل خاص مرافقة"], geoModifiers: ["muscat", "sohar port", "salalah port", "duqm", "sur"], equipmentTerms: ["oil refinery transport oman", "LNG plant equipment transport"], regulatoryTerms: ["Royal Oman Police transport permit", "Ministry of Transport OM permit"], urgencyModifiers: ["متاح الآن", "عاجل", "available now"] },
    { country: "Bahrain", iso2: "BH", languages: ["ar", "en"], coreTerms: ["مركبة مرافقة بحرين", "escort vehicle bahrain", "حمولة استثنائية"], geoModifiers: ["manama", "khalifa bin salman port", "bahrain industrial"], equipmentTerms: ["aluminium smelter transport", "construction equipment escort"], regulatoryTerms: ["General Directorate of Traffic BH permit"], urgencyModifiers: ["متاح الآن", "عاجل"] },
    { country: "Singapore", iso2: "SG", languages: ["en"], coreTerms: ["escort vehicle singapore", "pilot vehicle singapore", "oversize vehicle escort"], geoModifiers: ["jurong port", "PSA terminal", "tuas", "changi", "woodlands"], equipmentTerms: ["petrochemical equipment transport", "offshore rig transport", "construction crane escort"], regulatoryTerms: ["LTA special vehicle permit", "Road Traffic Act SG"], urgencyModifiers: ["available now", "urgent", "today"] },
    { country: "Malaysia", iso2: "MY", languages: ["ms", "en"], coreTerms: ["kenderaan eskort", "kenderaan perintis", "escort vehicle malaysia", "muatan besar eskort"], geoModifiers: ["kuala lumpur", "port klang", "tanjung pelepas port", "penang port", "johor bahru", "kuantan", "ipoh"], equipmentTerms: ["pengangkutan turbin angin", "pengangkutan transformer", "pengangkutan jentera berat"], regulatoryTerms: ["JPJ permit kenderaan khas", "JKR oversize permit"], urgencyModifiers: ["tersedia sekarang", "segera", "hari ini"] },
    { country: "Japan", iso2: "JP", languages: ["ja", "en"], coreTerms: ["誘導車", "特殊車両 誘導", "大型特殊車両 先導車", "oversize load escort japan"], geoModifiers: ["東京", "横浜 港", "大阪", "神戸 港", "名古屋", "福岡", "札幌", "仙台"], equipmentTerms: ["風力発電 輸送", "変圧器 輸送", "建設機械 輸送", "プラント機器 輸送"], regulatoryTerms: ["国土交通省 特殊車両通行許可", "道路法第47条", "車両制限令"], urgencyModifiers: ["即日対応", "緊急", "本日", "available now"] },
    { country: "South Korea", iso2: "KR", languages: ["ko", "en"], coreTerms: ["유도차량", "에스코트 차량", "초과화물 유도", "oversize load escort korea"], geoModifiers: ["서울", "부산 항", "인천 항", "울산", "광양 항", "대전", "대구"], equipmentTerms: ["풍력터빈 운송", "변압기 운송", "중장비 운송"], regulatoryTerms: ["국토교통부 특수차량 허가", "도로법"], urgencyModifiers: ["지금 가능", "긴급", "오늘"] },
    { country: "Chile", iso2: "CL", languages: ["es"], coreTerms: ["vehículo de acompañamiento chile", "escolta carga sobredimensionada", "transporte especial escolta chile"], geoModifiers: ["santiago", "san antonio port", "valparaíso port", "antofagasta", "concepción", "temuco"], equipmentTerms: ["transporte equipos mineros", "transporte aerogeneradores chile", "transporte maquinaria pesada"], regulatoryTerms: ["Dirección de Vialidad permiso", "Carabineros escolta"], urgencyModifiers: ["disponible ahora", "urgente", "hoy"] },
    { country: "Argentina", iso2: "AR", languages: ["es"], coreTerms: ["vehículo batidor argentina", "escolta carga excepcional", "transporte especial escolta argentina"], geoModifiers: ["buenos aires", "rosario", "bahía blanca port", "mendoza", "córdoba", "tucumán", "neuquén"], equipmentTerms: ["transporte equipos petroleros", "transporte aerogeneradores", "transporte maquinaria agrícola"], regulatoryTerms: ["DNV carga excepcional permiso", "Gendarmería escolta"], urgencyModifiers: ["disponible ahora", "urgente", "hoy"] },
    { country: "Colombia", iso2: "CO", languages: ["es"], coreTerms: ["escolta carga extradimensionada", "vehículo acompañamiento colombia", "transporte especial escolta"], geoModifiers: ["bogotá", "cartagena port", "buenaventura port", "medellín", "barranquilla", "cali"], equipmentTerms: ["transporte equipo petrolero", "transporte maquinaria minera", "transporte turbinas"], regulatoryTerms: ["INVÍAS carga extradimensionada", "Ministerio de Transporte permiso"], urgencyModifiers: ["disponible ahora", "urgente", "hoy"] },
    { country: "Peru", iso2: "PE", languages: ["es"], coreTerms: ["vehículo de escolta perú", "transporte mercancías especiales", "escolta carga especial perú"], geoModifiers: ["lima", "callao port", "arequipa", "trujillo", "piura", "cusco", "tacna"], equipmentTerms: ["transporte equipos mineros perú", "transporte maquinaria pesada", "transporte concentrado mineral"], regulatoryTerms: ["SUTRAN transporte especial", "MTC permiso carga especial"], urgencyModifiers: ["disponible ahora", "urgente", "hoy"] },
    // ══════════════ TIER D — SLATE (3 countries) ══════════════
    { country: "Uruguay", iso2: "UY", languages: ["es"], coreTerms: ["vehículo de escolta uruguay", "transporte especial escolta", "carga excepcional escolta"], geoModifiers: ["montevideo", "nueva palmira port", "colonia", "punta del este", "paysandú"], equipmentTerms: ["transporte aerogeneradores uruguay", "transporte maquinaria forestal"], regulatoryTerms: ["DNV Uruguay carga excepcional", "Caminera permiso"], urgencyModifiers: ["disponible ahora", "urgente"] },
    { country: "Panama", iso2: "PA", languages: ["es"], coreTerms: ["vehículo de escolta panamá", "transporte especial escolta", "escolta carga sobredimensionada"], geoModifiers: ["ciudad de panamá", "colón port", "balboa port", "colón free zone", "tocumen"], equipmentTerms: ["transporte equipo canal", "transporte maquinaria construcción"], regulatoryTerms: ["ATTT transporte especial permiso"], urgencyModifiers: ["disponible ahora", "urgente"] },
    { country: "Costa Rica", iso2: "CR", languages: ["es"], coreTerms: ["vehículo de escolta costa rica", "transporte excepcional escolta", "escolta carga especial"], geoModifiers: ["san josé", "limón port", "caldera port", "heredia", "alajuela"], equipmentTerms: ["transporte equipo geotérmico", "transporte maquinaria agrícola"], regulatoryTerms: ["COSEVI transporte especial", "CONAVI permiso carga"], urgencyModifiers: ["disponible ahora", "urgente"] },
];

// ═══════════════════════════════════════════════════════════
// LONG-TAIL GENERATOR — Combine patterns programmatically
// ═══════════════════════════════════════════════════════════

export function generateLongTailKeywords(pack: KeywordSeedPack): string[] {
    const results: string[] = [];

    for (const core of pack.coreTerms) {
        // service + geo
        for (const geo of pack.geoModifiers) {
            results.push(`${core} ${geo}`);
            results.push(`${core} in ${geo}`);
            results.push(`${core} near ${geo}`);
        }
        // service + equipment
        for (const equip of pack.equipmentTerms) {
            results.push(`${core} ${equip}`);
        }
        // service + urgency
        for (const urgency of pack.urgencyModifiers) {
            results.push(`${core} ${urgency}`);
        }
    }

    // equipment + geo (cross products)
    for (const equip of pack.equipmentTerms) {
        for (const geo of pack.geoModifiers.slice(0, 5)) { // top 5 geos only
            results.push(`${equip} ${geo}`);
        }
    }

    return results;
}
