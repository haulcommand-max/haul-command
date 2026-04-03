// ═══════════════════════════════════════════════════════════════════════
// GLOBAL ESCORT TERMINOLOGY — What "pilot car" is called in 52 countries
// PURPOSE: Glossary pages, SEO enrichment, thin-page killer, localization
// SOURCE OF TRUTH for: escort_terminology, role_names, regulatory_bodies
// ═══════════════════════════════════════════════════════════════════════

export interface CountryEscortTerminology {
    iso2: string;
    /** Primary language for these terms */
    lang: string;
    /** What the escort vehicle is called */
    escortVehicle: string[];
    /** What the operator/driver is called */
    operatorRole: string[];
    /** What "oversize load" is called */
    oversizeLoad: string[];
    /** Regulatory body / permit authority */
    permitAuthority: string[];
    /** Official regulation name/code */
    regulationCode: string[];
    /** Equipment classification names */
    equipmentClasses: string[];
    /** Key glossary terms unique to this country (ESC-style) */
    glossaryTerms: Record<string, string>;
    /** Rate structure type: per_mile | per_km | per_day | per_job */
    rateStructure: string;
    /** Currency code */
    currency: string;
    /** Typical base rate range (local currency, per primary unit) */
    baseRateRange: [number, number];
    /** Rate unit */
    rateUnit: string;
    /** Day rate range (local currency) */
    dayRateRange: [number, number];
    /** Specialized escort premium multiplier */
    specializedMultiplier: number;
    /** Common role titles for job pages */
    jobTitles: string[];
}

export const GLOBAL_ESCORT_TERMS: CountryEscortTerminology[] = [
    // ══════════════ TIER A — GOLD ══════════════
    {
        iso2: "US", lang: "en",
        escortVehicle: ["pilot car", "escort vehicle", "pilot/escort vehicle", "P/E vehicle", "lead car", "chase car"],
        operatorRole: ["Pilot/Escort Vehicle Operator (PEVO)", "pilot car driver", "escort driver", "flagman"],
        oversizeLoad: ["oversize load", "wide load", "extra-legal vehicle", "superload", "over-dimensional load"],
        permitAuthority: ["State DOT", "FMCSA", "FHWA"],
        regulationCode: ["MUTCD", "23 CFR Part 658", "State-specific OSOW statutes"],
        equipmentClasses: ["standard PEVO setup", "height pole escort", "bucket truck escort", "route survey vehicle"],
        glossaryTerms: {
            "PEVO": "Pilot/Escort Vehicle Operator — certified driver of warning/guide vehicle",
            "superload": "Load requiring special analysis due to extreme dimensions or weight",
            "leapfrogging": "Stopping load on hilly terrain to set up traffic control before proceeding",
            "shoe fly": "Driving wrong way on turn lane to negotiate tight corner for long loads",
            "TWIC card": "Transportation Workers Identification Credential for maritime port access",
            "tillerman": "Individual steering rear axles of a CMV at highway speeds from the trailer",
            "steerperson": "Individual steering trailer axles while not physically on the trailer",
            "lowboy": "Low-clearance trailer (drop deck/RGN) for taller loads",
            "high pole": "Telescoping pole used to check overhead clearance before load passes",
            "deadhead": "Repositioning drive without a load, typically paid at reduced rate",
            "dress up": "Raising oversize load signs, securing banners, placing flags on pilot car",
            "dress down": "Removing banners, lowering signs, turning off warning lights",
            "fog line": "Solid white line dividing road from shoulder",
            "gore strip": "Area dividing two merging lanes",
            "alligators": "Shredded pieces of blown tire lying in or near the travel lane",
            "chicken shack": "Weigh station (informal)",
            "skinny bridge": "Narrow bridge with less than 1 foot of shoulder",
            "TCP": "Traffic Control Plan — route and procedures for safe movement",
            "non-divisible load": "Load that cannot be separated without compromising value/use",
            "retroreflective": "Material designed to reflect light back toward source for visibility",
        },
        rateStructure: "per_mile", currency: "USD", baseRateRange: [1.65, 2.25], rateUnit: "mile",
        dayRateRange: [450, 800], specializedMultiplier: 1.35,
        jobTitles: ["Pilot Car Driver", "Escort Vehicle Operator", "PEVO", "Lead Car Driver", "Chase Car Driver", "Height Pole Operator", "Route Survey Driver"],
    },
    {
        iso2: "CA", lang: "en",
        escortVehicle: ["pilot car", "pilot vehicle", "escort vehicle", "traffic control vehicle"],
        operatorRole: ["pilot car operator", "escort driver", "traffic control person"],
        oversizeLoad: ["oversized load", "oversize/overweight vehicle", "extra-legal load"],
        permitAuthority: ["Provincial Ministry of Transportation", "Transport Canada"],
        regulationCode: ["Provincial OSOW regulations", "Highway Traffic Act"],
        equipmentClasses: ["standard pilot car", "height clearance vehicle", "route survey vehicle"],
        glossaryTerms: {
            "OSOW": "Oversize/Overweight — vehicle exceeding provincial legal limits",
            "ATP": "Annual Trip Permit for repeated oversized movements",
            "MTO": "Ministry of Transportation Ontario — primary permit authority in ON",
            "voiture pilote": "Pilot car (French Canadian term, used in Quebec)",
            "convoi exceptionnel": "Exceptional convoy (French term for oversize movement)",
        },
        rateStructure: "per_km", currency: "CAD", baseRateRange: [2.00, 3.50], rateUnit: "km",
        dayRateRange: [600, 1000], specializedMultiplier: 1.30,
        jobTitles: ["Pilot Car Operator", "Escort Vehicle Driver", "Traffic Control Person", "Route Survey Driver"],
    },
    {
        iso2: "AU", lang: "en",
        escortVehicle: ["pilot vehicle", "escort vehicle", "warning vehicle", "OSOM escort"],
        operatorRole: ["pilot vehicle operator", "PVO", "escort driver", "accredited pilot"],
        oversizeLoad: ["over-size over-mass (OSOM)", "over-dimensional vehicle", "restricted access vehicle"],
        permitAuthority: ["NHVR (National Heavy Vehicle Regulator)", "State road authorities"],
        regulationCode: ["Heavy Vehicle National Law", "NHVR Pilot Vehicle Guidelines"],
        equipmentClasses: ["Class 1 pilot vehicle", "Class 2 pilot vehicle", "police escort", "travel-with vehicle"],
        glossaryTerms: {
            "NHVR": "National Heavy Vehicle Regulator — national oversize permit authority",
            "OSOM": "Over-Size Over-Mass — Australian term for oversize/overweight loads",
            "RAV": "Restricted Access Vehicle — requires special route approval",
            "PVO": "Pilot Vehicle Operator — accredited escort driver",
            "gazetted route": "Pre-approved route for specific vehicle configurations",
        },
        rateStructure: "per_km", currency: "AUD", baseRateRange: [2.50, 4.50], rateUnit: "km",
        dayRateRange: [700, 1200], specializedMultiplier: 1.40,
        jobTitles: ["Pilot Vehicle Operator", "PVO", "Escort Vehicle Driver", "OSOM Escort", "Class 1 Pilot", "Class 2 Pilot"],
    },
    {
        iso2: "GB", lang: "en",
        escortVehicle: ["escort vehicle", "abnormal load escort", "attendant vehicle", "statutory attendant"],
        operatorRole: ["escort driver", "attendant", "STGO operator"],
        oversizeLoad: ["abnormal load", "abnormal indivisible load (AIL)", "special types vehicle", "STGO vehicle"],
        permitAuthority: ["National Highways (England)", "Transport Scotland", "Welsh Government Transport"],
        regulationCode: ["STGO (Special Types General Order)", "Road Vehicles (Authorisation of Special Types) Order", "ESDAL notification system"],
        equipmentClasses: ["Category 1 escort", "Category 2 escort", "Category 3 escort (police)", "VSO vehicle"],
        glossaryTerms: {
            "STGO": "Special Types General Order — legal framework for abnormal loads in UK",
            "AIL": "Abnormal Indivisible Load — cannot be broken down for transport",
            "ESDAL": "Electronic Service Delivery for Abnormal Loads — online notification system",
            "VSO": "Vehicle Special Order — permit for loads exceeding STGO limits",
            "Section 44": "Police notification requirement for specific abnormal loads",
        },
        rateStructure: "per_mile", currency: "GBP", baseRateRange: [1.50, 2.50], rateUnit: "mile",
        dayRateRange: [400, 700], specializedMultiplier: 1.30,
        jobTitles: ["Abnormal Load Escort Driver", "STGO Escort Operator", "Attendant Vehicle Driver", "Category 2 Escort"],
    },
    {
        iso2: "NZ", lang: "en",
        escortVehicle: ["pilot vehicle", "escort vehicle", "warning vehicle"],
        operatorRole: ["pilot vehicle operator", "escort driver"],
        oversizeLoad: ["over-dimension vehicle", "over-weight vehicle", "permit vehicle"],
        permitAuthority: ["Waka Kotahi (NZTA)"],
        regulationCode: ["Land Transport Rule: Vehicle Dimensions and Mass", "NZTA Overdimension Permits"],
        equipmentClasses: ["Type A pilot", "Type B pilot", "police escort"],
        glossaryTerms: { "Waka Kotahi": "NZ Transport Agency — national permit authority", "HPMV": "High Productivity Motor Vehicle" },
        rateStructure: "per_km", currency: "NZD", baseRateRange: [2.50, 4.00], rateUnit: "km",
        dayRateRange: [600, 1000], specializedMultiplier: 1.25,
        jobTitles: ["Pilot Vehicle Operator", "Escort Driver NZ", "Over-Dimension Escort"],
    },
    {
        iso2: "ZA", lang: "en",
        escortVehicle: ["pilot vehicle", "escort vehicle", "abnormal load escort"],
        operatorRole: ["pilot vehicle driver", "escort operator"],
        oversizeLoad: ["abnormal load", "abnormal vehicle", "extra-heavy vehicle"],
        permitAuthority: ["Provincial Road Traffic Inspectorate", "SANRAL", "NRTA"],
        regulationCode: ["National Road Traffic Act", "RTMS (Road Transport Management System)"],
        equipmentClasses: ["standard pilot vehicle", "police escort", "metro escort"],
        glossaryTerms: { "RTMS": "Road Transport Management System — voluntary safety standard", "NRTA": "National Road Traffic Act" },
        rateStructure: "per_km", currency: "ZAR", baseRateRange: [15, 35], rateUnit: "km",
        dayRateRange: [5000, 12000], specializedMultiplier: 1.30,
        jobTitles: ["Pilot Vehicle Driver", "Abnormal Load Escort", "Escort Vehicle Operator"],
    },
    {
        iso2: "DE", lang: "de",
        escortVehicle: ["Begleitfahrzeug (BF3)", "Begleitfahrzeug (BF4)", "Transportbegleitung", "Schwertransportbegleitung"],
        operatorRole: ["BF3-Fahrer", "BF4-Fahrer", "Transportbegleiter", "Schwertransportbegleiter"],
        oversizeLoad: ["Großraum- und Schwertransport (GST)", "Schwerlast", "Überbreitentransport", "Sondertransport"],
        permitAuthority: ["Straßenverkehrsamt", "Landesamt für Straßenbau"],
        regulationCode: ["StVO §29", "StVZO", "GGVSEB", "Verwaltungsvorschrift zu §29 StVO"],
        equipmentClasses: ["BF3 Begleitfahrzeug", "BF4 Begleitfahrzeug", "Polizeibegleitung", "Vermessungsfahrzeug"],
        glossaryTerms: {
            "BF3": "Begleitfahrzeug Stufe 3 — private escort vehicle, lower clearance check",
            "BF4": "Begleitfahrzeug Stufe 4 — private escort with full traffic control authority",
            "GST": "Großraum- und Schwertransport — general term for oversize/heavy transport",
            "StVO": "Straßenverkehrsordnung — German road traffic regulations",
            "Achslast": "Axle load — weight distributed per axle",
        },
        rateStructure: "per_km", currency: "EUR", baseRateRange: [2.00, 4.00], rateUnit: "km",
        dayRateRange: [500, 900], specializedMultiplier: 1.40,
        jobTitles: ["BF3-Fahrer", "BF4-Fahrer", "Schwertransportbegleiter", "Transportbegleiter"],
    },
    {
        iso2: "NL", lang: "nl",
        escortVehicle: ["begeleidingsvoertuig", "transportbegeleiding", "exceptioneel transport begeleiding"],
        operatorRole: ["transportbegeleider", "begeleider exceptioneel transport"],
        oversizeLoad: ["exceptioneel transport", "bijzonder transport", "zwaar transport"],
        permitAuthority: ["RDW (Rijksdienst voor het Wegverkeer)", "Rijkswaterstaat"],
        regulationCode: ["Regeling voertuigen", "RDW ontheffing exceptioneel transport"],
        equipmentClasses: ["categorie 1 begeleiding", "categorie 2 begeleiding", "politie-escorte"],
        glossaryTerms: { "RDW": "Rijksdienst voor het Wegverkeer — vehicle/transport authority", "ontheffing": "Exemption/permit for oversize transport" },
        rateStructure: "per_km", currency: "EUR", baseRateRange: [2.00, 3.50], rateUnit: "km",
        dayRateRange: [500, 850], specializedMultiplier: 1.30,
        jobTitles: ["Transportbegeleider", "Begeleider Exceptioneel Transport", "Escort Driver NL"],
    },
    {
        iso2: "AE", lang: "en",
        escortVehicle: ["escort vehicle", "pilot vehicle", "traffic escort"],
        operatorRole: ["escort operator", "pilot vehicle driver"],
        oversizeLoad: ["abnormal load", "oversize load", "special transport"],
        permitAuthority: ["RTA Dubai", "DoT Abu Dhabi", "Ministry of Interior Traffic"],
        regulationCode: ["Federal Traffic Law", "RTA Special Transport Permits"],
        equipmentClasses: ["standard escort", "police escort", "traffic management vehicle"],
        glossaryTerms: { "RTA": "Roads & Transport Authority — Dubai transport permit authority", "SALIK": "Toll gate system in Dubai" },
        rateStructure: "per_km", currency: "AED", baseRateRange: [5, 12], rateUnit: "km",
        dayRateRange: [1500, 3500], specializedMultiplier: 1.50,
        jobTitles: ["Escort Vehicle Operator", "Pilot Vehicle Driver", "Traffic Escort Driver"],
    },
    {
        iso2: "BR", lang: "pt",
        escortVehicle: ["veículo batedor", "escolta rodoviária", "veículo de escolta", "carro de apoio"],
        operatorRole: ["motorista de escolta", "batedor", "operador de escolta"],
        oversizeLoad: ["carga especial", "carga superdimensionada", "carga indivisível", "carga excepcional"],
        permitAuthority: ["DNIT", "DER Estadual", "ANTT"],
        regulationCode: ["Resolução CONTRAN", "AET (Autorização Especial de Trânsito)"],
        equipmentClasses: ["escolta simples", "escolta com viatura policial", "escolta técnica"],
        glossaryTerms: {
            "AET": "Autorização Especial de Trânsito — special transit authorization",
            "DNIT": "Departamento Nacional de Infraestrutura de Transportes",
            "batedor": "Lead escort vehicle driver (informal term)",
        },
        rateStructure: "per_km", currency: "BRL", baseRateRange: [4, 10], rateUnit: "km",
        dayRateRange: [800, 2000], specializedMultiplier: 1.35,
        jobTitles: ["Motorista de Escolta", "Batedor Rodoviário", "Operador de Escolta", "Escoltista"],
    },

    // ══════════════ TIER B — BLUE (condensed) ══════════════
    { iso2: "IE", lang: "en", escortVehicle: ["escort vehicle", "pilot vehicle"], operatorRole: ["escort driver"], oversizeLoad: ["abnormal load"], permitAuthority: ["TII", "An Garda Síochána"], regulationCode: ["Road Traffic Act"], equipmentClasses: ["standard escort", "Garda escort"], glossaryTerms: { "TII": "Transport Infrastructure Ireland" }, rateStructure: "per_km", currency: "EUR", baseRateRange: [2.00, 3.50], rateUnit: "km", dayRateRange: [450, 750], specializedMultiplier: 1.25, jobTitles: ["Escort Driver", "Abnormal Load Escort"] },
    { iso2: "SE", lang: "sv", escortVehicle: ["eskortfordon", "ledsagarbil", "transporteskort"], operatorRole: ["eskortförare", "ledsagare"], oversizeLoad: ["bred last", "tung transport", "specialtransport"], permitAuthority: ["Trafikverket"], regulationCode: ["Trafikförordningen", "Transportstyrelsens föreskrifter"], equipmentClasses: ["standard eskort", "poliseskort"], glossaryTerms: { "bred last": "Wide load", "Trafikverket": "Swedish Transport Administration" }, rateStructure: "per_km", currency: "SEK", baseRateRange: [20, 40], rateUnit: "km", dayRateRange: [5000, 9000], specializedMultiplier: 1.30, jobTitles: ["Eskortförare", "Ledsagare Specialtransport"] },
    { iso2: "NO", lang: "no", escortVehicle: ["følgebil", "eskortekjøretøy", "ledsagerbil"], operatorRole: ["følgebilsjåfør", "eskortebilsjåfør"], oversizeLoad: ["bred last", "spesialtransport", "tungtransport"], permitAuthority: ["Statens vegvesen"], regulationCode: ["Forskrift om bruk av kjøretøy"], equipmentClasses: ["standard følgebil", "politieskorte"], glossaryTerms: { "følgebil": "Escort/follow car", "Statens vegvesen": "Norwegian Public Roads Administration" }, rateStructure: "per_km", currency: "NOK", baseRateRange: [25, 50], rateUnit: "km", dayRateRange: [6000, 11000], specializedMultiplier: 1.35, jobTitles: ["Følgebilsjåfør", "Eskortebilsjåfør"] },
    { iso2: "DK", lang: "da", escortVehicle: ["ledsagebil", "eskortekøretøj"], operatorRole: ["ledsagebilchauffør"], oversizeLoad: ["særtransport", "bred last"], permitAuthority: ["Vejdirektoratet"], regulationCode: ["Bekendtgørelse om særtransport"], equipmentClasses: ["standard ledsagebil", "politieskorte"], glossaryTerms: { "særtransport": "Special transport", "Vejdirektoratet": "Danish Road Directorate" }, rateStructure: "per_km", currency: "DKK", baseRateRange: [15, 30], rateUnit: "km", dayRateRange: [4000, 7500], specializedMultiplier: 1.25, jobTitles: ["Ledsagebilchauffør", "Særtransporteskort"] },
    { iso2: "FI", lang: "fi", escortVehicle: ["saattueauto", "varoitusauto", "saattoajoneuvo"], operatorRole: ["saattuekuljettaja", "varoitusauton kuljettaja"], oversizeLoad: ["erikoiskuljetus", "ylileveys", "ylimitta"], permitAuthority: ["Pirkanmaan ELY-keskus"], regulationCode: ["Liikenneministeriön asetus erikoiskuljetuksista"], equipmentClasses: ["varoitusauto", "liikenteenohjaaja", "poliisisaattue"], glossaryTerms: { "erikoiskuljetus": "Special transport (oversize)", "ELY-keskus": "Centre for Economic Development, Transport and Environment" }, rateStructure: "per_km", currency: "EUR", baseRateRange: [2.00, 3.50], rateUnit: "km", dayRateRange: [500, 850], specializedMultiplier: 1.25, jobTitles: ["Saattuekuljettaja", "Varoitusauton Kuljettaja", "Erikoiskuljetuseskort"] },
    { iso2: "BE", lang: "nl", escortVehicle: ["begeleidingsvoertuig", "uitzonderlijk transport begeleiding"], operatorRole: ["begeleider uitzonderlijk transport"], oversizeLoad: ["uitzonderlijk vervoer", "zwaar vervoer"], permitAuthority: ["FOD Mobiliteit", "AWV (Vlaanderen)"], regulationCode: ["KB Uitzonderlijk vervoer"], equipmentClasses: ["categorie begeleiding", "politieescorte"], glossaryTerms: { "AWV": "Agentschap Wegen en Verkeer" }, rateStructure: "per_km", currency: "EUR", baseRateRange: [2.00, 3.50], rateUnit: "km", dayRateRange: [500, 800], specializedMultiplier: 1.25, jobTitles: ["Begeleider Uitzonderlijk Transport", "Escort Driver BE"] },
    { iso2: "AT", lang: "de", escortVehicle: ["Begleitfahrzeug", "Transportbegleitung"], operatorRole: ["Transportbegleiter"], oversizeLoad: ["Sondertransport", "Schwertransport", "Überbreiter Transport"], permitAuthority: ["Landesregierung", "BMK"], regulationCode: ["StVO §40", "KFG §101"], equipmentClasses: ["Begleitfahrzeug", "Polizeibegleitung"], glossaryTerms: { "BMK": "Bundesministerium für Klimaschutz" }, rateStructure: "per_km", currency: "EUR", baseRateRange: [2.00, 3.50], rateUnit: "km", dayRateRange: [500, 850], specializedMultiplier: 1.30, jobTitles: ["Transportbegleiter", "Schwertransportbegleiter AT"] },
    { iso2: "CH", lang: "de", escortVehicle: ["Begleitfahrzeug", "Transportbegleitung"], operatorRole: ["Transportbegleiter"], oversizeLoad: ["Schwertransport", "Sonderbewilligung Transport"], permitAuthority: ["ASTRA", "Kantonspolizei"], regulationCode: ["SVG Art. 78", "VRV"], equipmentClasses: ["Begleitfahrzeug", "Polizeieskorte"], glossaryTerms: { "ASTRA": "Bundesamt für Strassen" }, rateStructure: "per_km", currency: "CHF", baseRateRange: [3.00, 5.00], rateUnit: "km", dayRateRange: [700, 1200], specializedMultiplier: 1.40, jobTitles: ["Transportbegleiter CH", "Schwertransportbegleiter CH"] },
    { iso2: "ES", lang: "es", escortVehicle: ["vehículo de acompañamiento", "vehículo piloto", "escolta de transporte"], operatorRole: ["conductor de vehículo piloto", "acompañante de transporte especial"], oversizeLoad: ["transporte especial", "carga sobredimensionada", "vehículo en régimen especial"], permitAuthority: ["DGT (Dirección General de Tráfico)"], regulationCode: ["Real Decreto 443/2001", "Norma 8.3-IC"], equipmentClasses: ["vehículo de acompañamiento", "escolta de la Guardia Civil"], glossaryTerms: { "DGT": "Dirección General de Tráfico", "VRAE": "Vehículo en Régimen de Autorización Especial" }, rateStructure: "per_km", currency: "EUR", baseRateRange: [1.50, 3.00], rateUnit: "km", dayRateRange: [400, 700], specializedMultiplier: 1.25, jobTitles: ["Conductor Vehículo Piloto", "Acompañante Transporte Especial", "Escolta de Carga"] },
    { iso2: "FR", lang: "fr", escortVehicle: ["voiture pilote", "véhicule d'accompagnement", "véhicule de protection"], operatorRole: ["accompagnateur de convoi exceptionnel", "pilote de convoi"], oversizeLoad: ["convoi exceptionnel", "transport exceptionnel", "charge indivisible"], permitAuthority: ["DREAL", "Préfecture"], regulationCode: ["Arrêté du 4 mai 2006", "Code de la route articles R433"], equipmentClasses: ["véhicule d'accompagnement", "guidage par la gendarmerie"], glossaryTerms: { "DREAL": "Direction Régionale de l'Environnement, de l'Aménagement et du Logement", "convoi exceptionnel": "Exceptional convoy — French oversize load term" }, rateStructure: "per_km", currency: "EUR", baseRateRange: [1.80, 3.00], rateUnit: "km", dayRateRange: [450, 750], specializedMultiplier: 1.25, jobTitles: ["Pilote de Convoi Exceptionnel", "Accompagnateur de Convoi", "Chauffeur Voiture Pilote"] },
    { iso2: "IT", lang: "it", escortVehicle: ["veicolo di scorta", "auto pilota", "scorta tecnica"], operatorRole: ["autista di scorta", "scorta tecnica operatore"], oversizeLoad: ["trasporto eccezionale", "carico eccezionale", "trasporto fuori sagoma"], permitAuthority: ["ANAS", "Motorizzazione Civile", "Prefettura"], regulationCode: ["Codice della Strada Art. 10", "DPR 495/1992"], equipmentClasses: ["scorta tecnica", "scorta della Polizia Stradale"], glossaryTerms: { "ANAS": "Azienda Nazionale Autonoma delle Strade — national road authority" }, rateStructure: "per_km", currency: "EUR", baseRateRange: [1.50, 3.00], rateUnit: "km", dayRateRange: [400, 700], specializedMultiplier: 1.30, jobTitles: ["Autista Scorta Tecnica", "Operatore Trasporto Eccezionale"] },
    { iso2: "PT", lang: "pt", escortVehicle: ["veículo de acompanhamento", "veículo piloto", "escolta de transporte"], operatorRole: ["condutor de veículo piloto", "acompanhante de transporte especial"], oversizeLoad: ["transporte especial", "carga especial", "veículo excepcional"], permitAuthority: ["IMT (Instituto da Mobilidade e dos Transportes)"], regulationCode: ["Decreto-Lei 28/2009"], equipmentClasses: ["veículo de acompanhamento", "escolta da GNR"], glossaryTerms: { "IMT": "Instituto da Mobilidade e dos Transportes" }, rateStructure: "per_km", currency: "EUR", baseRateRange: [1.50, 2.50], rateUnit: "km", dayRateRange: [350, 600], specializedMultiplier: 1.20, jobTitles: ["Condutor de Escolta", "Acompanhante de Transporte Especial PT"] },
    { iso2: "SA", lang: "ar", escortVehicle: ["مركبة مرافقة", "سيارة مرافقة", "escort vehicle"], operatorRole: ["سائق مرافقة", "escort driver"], oversizeLoad: ["حمولة كبيرة", "نقل استثنائي", "oversize load"], permitAuthority: ["المديرية العامة للمرور", "وزارة النقل"], regulationCode: ["نظام المرور السعودي"], equipmentClasses: ["مرافقة قياسية", "مرافقة شرطية"], glossaryTerms: { "MOMRA": "Ministry of Municipal, Rural Affairs and Housing" }, rateStructure: "per_km", currency: "SAR", baseRateRange: [5, 15], rateUnit: "km", dayRateRange: [1500, 4000], specializedMultiplier: 1.40, jobTitles: ["Escort Driver SA", "Transport Escort Operator"] },
    { iso2: "QA", lang: "ar", escortVehicle: ["مركبة مرافقة", "escort vehicle"], operatorRole: ["سائق مرافقة"], oversizeLoad: ["حمولة كبيرة", "نقل خاص"], permitAuthority: ["General Directorate of Traffic", "Ashghal"], regulationCode: ["Qatar Traffic Law"], equipmentClasses: ["standard escort", "police escort"], glossaryTerms: { "Ashghal": "Public Works Authority Qatar" }, rateStructure: "per_km", currency: "QAR", baseRateRange: [5, 15], rateUnit: "km", dayRateRange: [1500, 3500], specializedMultiplier: 1.40, jobTitles: ["Escort Driver QA", "Transport Escort"] },
    { iso2: "MX", lang: "es", escortVehicle: ["vehículo piloto", "escolta de transporte", "banderero"], operatorRole: ["chofer de escolta", "operador de vehículo piloto"], oversizeLoad: ["carga sobredimensionada", "transporte especial", "carga excedida"], permitAuthority: ["SCT (Secretaría de Comunicaciones y Transportes)"], regulationCode: ["NOM-012-SCT-2", "Reglamento de Tránsito en Carreteras"], equipmentClasses: ["escolta simple", "escolta con patrulla", "banderero"], glossaryTerms: { "SCT": "Secretaría de Comunicaciones y Transportes", "NOM": "Norma Oficial Mexicana" }, rateStructure: "per_km", currency: "MXN", baseRateRange: [15, 35], rateUnit: "km", dayRateRange: [5000, 12000], specializedMultiplier: 1.30, jobTitles: ["Chofer de Escolta", "Operador Vehículo Piloto MX", "Banderero"] },

    // ══════════════ TIER C — SILVER (condensed seeds) ══════════════
    { iso2: "PL", lang: "pl", escortVehicle: ["pojazd pilotujący", "pilot transportu"], operatorRole: ["pilot transportu nienormatywnego"], oversizeLoad: ["ładunek nienormatywny", "transport nienormatywny", "transport ponadgabarytowy"], permitAuthority: ["GDDKiA"], regulationCode: ["Prawo o ruchu drogowym Art. 64"], equipmentClasses: ["pojazd pilotujący", "eskorta policyjna"], glossaryTerms: { "GDDKiA": "Generalna Dyrekcja Dróg Krajowych i Autostrad" }, rateStructure: "per_km", currency: "PLN", baseRateRange: [5, 12], rateUnit: "km", dayRateRange: [1200, 2500], specializedMultiplier: 1.25, jobTitles: ["Pilot Transportu", "Kierowca Pilotujący"] },
    { iso2: "CZ", lang: "cs", escortVehicle: ["doprovodné vozidlo", "pilot přepravy"], operatorRole: ["řidič doprovodného vozidla"], oversizeLoad: ["nadměrná přeprava", "nadrozměrný náklad"], permitAuthority: ["Ministerstvo dopravy", "ŘSD"], regulationCode: ["Zákon č. 13/1997 Sb."], equipmentClasses: ["doprovodné vozidlo", "policejní doprovod"], glossaryTerms: { "ŘSD": "Ředitelství silnic a dálnic" }, rateStructure: "per_km", currency: "CZK", baseRateRange: [30, 70], rateUnit: "km", dayRateRange: [8000, 15000], specializedMultiplier: 1.25, jobTitles: ["Řidič Doprovodného Vozidla", "Pilot Přepravy"] },
    { iso2: "SK", lang: "sk", escortVehicle: ["sprievodné vozidlo"], operatorRole: ["vodič sprievodného vozidla"], oversizeLoad: ["nadrozmerná preprava"], permitAuthority: ["SSC"], regulationCode: ["Zákon č. 8/2009 Z.z."], equipmentClasses: ["sprievodné vozidlo", "policajný sprievod"], glossaryTerms: {}, rateStructure: "per_km", currency: "EUR", baseRateRange: [1.50, 3.00], rateUnit: "km", dayRateRange: [400, 700], specializedMultiplier: 1.20, jobTitles: ["Vodič Sprievodného Vozidla"] },
    { iso2: "HU", lang: "hu", escortVehicle: ["kísérő jármű", "figyelmeztető jármű"], operatorRole: ["kísérő jármű vezetője"], oversizeLoad: ["túlméretes szállítmány", "különleges szállítmány"], permitAuthority: ["Magyar Közút NZrt."], regulationCode: ["KRESZ", "1988. évi I. törvény"], equipmentClasses: ["kísérő jármű", "rendőrségi kíséret"], glossaryTerms: { "KRESZ": "Közúti Rendelkezések Egységes Szabályozása — traffic regulations" }, rateStructure: "per_km", currency: "HUF", baseRateRange: [500, 1200], rateUnit: "km", dayRateRange: [120000, 250000], specializedMultiplier: 1.20, jobTitles: ["Kísérő Jármű Vezetője"] },
    { iso2: "SI", lang: "sl", escortVehicle: ["spremno vozilo"], operatorRole: ["voznik spremnega vozila"], oversizeLoad: ["izredni prevoz"], permitAuthority: ["DARS"], regulationCode: ["Zakon o pravilih cestnega prometa"], equipmentClasses: ["spremno vozilo", "policijski spremstvo"], glossaryTerms: { "DARS": "Družba za avtoceste v Republiki Sloveniji" }, rateStructure: "per_km", currency: "EUR", baseRateRange: [1.50, 3.00], rateUnit: "km", dayRateRange: [350, 650], specializedMultiplier: 1.20, jobTitles: ["Voznik Spremnega Vozila"] },
    { iso2: "EE", lang: "et", escortVehicle: ["saateauto", "eskortauto"], operatorRole: ["saateauto juht"], oversizeLoad: ["erivedu", "suuregabariidiline vedu"], permitAuthority: ["Transpordiamet"], regulationCode: ["Liiklusseadus"], equipmentClasses: ["saateauto", "politsei saatmine"], glossaryTerms: {}, rateStructure: "per_km", currency: "EUR", baseRateRange: [1.50, 3.00], rateUnit: "km", dayRateRange: [350, 600], specializedMultiplier: 1.20, jobTitles: ["Saateauto Juht", "Eskortauto Juht"] },
    { iso2: "LV", lang: "lv", escortVehicle: ["pavadošais auto", "eskorts"], operatorRole: ["eskortauto vadītājs"], oversizeLoad: ["lielgabarīta krava", "smagsvara pārvadājums"], permitAuthority: ["VSIA Latvijas Valsts ceļi"], regulationCode: ["Ceļu satiksmes noteikumi"], equipmentClasses: ["pavadošais auto", "policijas eskorts"], glossaryTerms: {}, rateStructure: "per_km", currency: "EUR", baseRateRange: [1.50, 2.50], rateUnit: "km", dayRateRange: [300, 550], specializedMultiplier: 1.20, jobTitles: ["Eskortauto Vadītājs"] },
    { iso2: "LT", lang: "lt", escortVehicle: ["lydimasis automobilis", "eskorto automobilis"], operatorRole: ["lydimojo automobilio vairuotojas"], oversizeLoad: ["didžiagabaritė siunta", "viršsvorinis krovinys"], permitAuthority: ["LAKD"], regulationCode: ["Kelių eismo taisyklės"], equipmentClasses: ["lydimasis automobilis", "policijos palyda"], glossaryTerms: { "LAKD": "Lietuvos automobilių kelių direkcija" }, rateStructure: "per_km", currency: "EUR", baseRateRange: [1.50, 2.50], rateUnit: "km", dayRateRange: [300, 550], specializedMultiplier: 1.20, jobTitles: ["Lydimojo Automobilio Vairuotojas"] },
    { iso2: "HR", lang: "hr", escortVehicle: ["prateno vozilo", "eskortno vozilo"], operatorRole: ["vozač pratećeg vozila"], oversizeLoad: ["izvanredni prijevoz", "predimenzionirani teret"], permitAuthority: ["HAC", "ŽUC"], regulationCode: ["Zakon o sigurnosti prometa"], equipmentClasses: ["prateno vozilo", "policijska pratnja"], glossaryTerms: {}, rateStructure: "per_km", currency: "EUR", baseRateRange: [1.50, 3.00], rateUnit: "km", dayRateRange: [350, 650], specializedMultiplier: 1.20, jobTitles: ["Vozač Pratećeg Vozila"] },
    { iso2: "RO", lang: "ro", escortVehicle: ["vehicul de însoțire", "vehicul pilot"], operatorRole: ["conducător vehicul de însoțire"], oversizeLoad: ["transport agabaritic", "transport cu depășiri"], permitAuthority: ["CNAIR"], regulationCode: ["OG 43/1997"], equipmentClasses: ["vehicul de însoțire", "escortă poliție"], glossaryTerms: { "CNAIR": "Compania Națională de Administrare a Infrastructurii Rutiere" }, rateStructure: "per_km", currency: "RON", baseRateRange: [5, 12], rateUnit: "km", dayRateRange: [1200, 2500], specializedMultiplier: 1.20, jobTitles: ["Conducător Vehicul Pilot", "Escort Transport Agabaritic"] },
    { iso2: "BG", lang: "bg", escortVehicle: ["съпровождащо МПС", "ескорт"], operatorRole: ["водач на съпровождащо МПС"], oversizeLoad: ["извънгабаритен товар", "тежък товар"], permitAuthority: ["АПИ (Агенция Пътна Инфраструктура)"], regulationCode: ["ЗДвП"], equipmentClasses: ["съпровождащо МПС", "полицейски ескорт"], glossaryTerms: {}, rateStructure: "per_km", currency: "BGN", baseRateRange: [2, 5], rateUnit: "km", dayRateRange: [400, 800], specializedMultiplier: 1.20, jobTitles: ["Водач Съпровождащо МПС"] },
    { iso2: "GR", lang: "el", escortVehicle: ["όχημα συνοδείας", "πιλοτικό όχημα"], operatorRole: ["οδηγός συνοδείας"], oversizeLoad: ["υπερμεγέθης φορτίο", "έκτακτη μεταφορά"], permitAuthority: ["Υπουργείο Υποδομών και Μεταφορών"], regulationCode: ["ΚΟΚ"], equipmentClasses: ["όχημα συνοδείας", "αστυνομική συνοδεία"], glossaryTerms: {}, rateStructure: "per_km", currency: "EUR", baseRateRange: [1.50, 3.00], rateUnit: "km", dayRateRange: [350, 650], specializedMultiplier: 1.20, jobTitles: ["Οδηγός Συνοδείας"] },
    { iso2: "TR", lang: "tr", escortVehicle: ["eskort aracı", "refakat aracı", "pilot araç"], operatorRole: ["eskort sürücüsü", "refakat aracı şoförü"], oversizeLoad: ["gabari dışı yük", "özel yük taşıma", "ağır yük"], permitAuthority: ["KGM (Karayolları Genel Müdürlüğü)"], regulationCode: ["Karayolu Taşıma Yönetmeliği"], equipmentClasses: ["refakat aracı", "jandarma eskort"], glossaryTerms: { "KGM": "Karayolları Genel Müdürlüğü — highway authority" }, rateStructure: "per_km", currency: "TRY", baseRateRange: [15, 40], rateUnit: "km", dayRateRange: [5000, 12000], specializedMultiplier: 1.25, jobTitles: ["Eskort Sürücüsü", "Refakat Aracı Şoförü"] },
    { iso2: "KW", lang: "ar", escortVehicle: ["مركبة مرافقة", "escort vehicle"], operatorRole: ["سائق مرافقة"], oversizeLoad: ["حمولة استثنائية"], permitAuthority: ["وزارة الداخلية"], regulationCode: ["قانون المرور الكويتي"], equipmentClasses: ["مرافقة قياسية"], glossaryTerms: {}, rateStructure: "per_km", currency: "KWD", baseRateRange: [1, 3], rateUnit: "km", dayRateRange: [150, 350], specializedMultiplier: 1.40, jobTitles: ["Escort Driver KW"] },
    { iso2: "OM", lang: "ar", escortVehicle: ["مركبة مرافقة", "escort vehicle"], operatorRole: ["سائق مرافقة"], oversizeLoad: ["حمولة استثنائية", "نقل خاص"], permitAuthority: ["Royal Oman Police", "Ministry of Transport"], regulationCode: ["Traffic Law of Oman"], equipmentClasses: ["standard escort", "ROP escort"], glossaryTerms: {}, rateStructure: "per_km", currency: "OMR", baseRateRange: [2, 5], rateUnit: "km", dayRateRange: [100, 250], specializedMultiplier: 1.35, jobTitles: ["Escort Driver OM"] },
    { iso2: "BH", lang: "ar", escortVehicle: ["مركبة مرافقة"], operatorRole: ["سائق مرافقة"], oversizeLoad: ["حمولة استثنائية"], permitAuthority: ["General Directorate of Traffic"], regulationCode: ["Bahrain Traffic Law"], equipmentClasses: ["standard escort"], glossaryTerms: {}, rateStructure: "per_km", currency: "BHD", baseRateRange: [1, 3], rateUnit: "km", dayRateRange: [100, 250], specializedMultiplier: 1.35, jobTitles: ["Escort Driver BH"] },
    { iso2: "SG", lang: "en", escortVehicle: ["escort vehicle", "pilot vehicle"], operatorRole: ["escort driver"], oversizeLoad: ["oversize vehicle", "special vehicle"], permitAuthority: ["LTA"], regulationCode: ["Road Traffic Act"], equipmentClasses: ["standard escort", "LTA escort"], glossaryTerms: { "LTA": "Land Transport Authority Singapore" }, rateStructure: "per_km", currency: "SGD", baseRateRange: [3, 8], rateUnit: "km", dayRateRange: [500, 1000], specializedMultiplier: 1.30, jobTitles: ["Escort Vehicle Driver SG"] },
    { iso2: "MY", lang: "ms", escortVehicle: ["kenderaan eskort", "kenderaan perintis", "escort vehicle"], operatorRole: ["pemandu eskort"], oversizeLoad: ["muatan besar", "kenderaan khas"], permitAuthority: ["JPJ", "JKR"], regulationCode: ["Akta Pengangkutan Jalan 1987"], equipmentClasses: ["eskort standard", "eskort polis"], glossaryTerms: { "JPJ": "Jabatan Pengangkutan Jalan — Road Transport Department" }, rateStructure: "per_km", currency: "MYR", baseRateRange: [3, 8], rateUnit: "km", dayRateRange: [800, 1800], specializedMultiplier: 1.25, jobTitles: ["Pemandu Eskort", "Escort Vehicle Driver MY"] },
    { iso2: "JP", lang: "ja", escortVehicle: ["誘導車", "先導車", "エスコート車"], operatorRole: ["誘導員", "先導車ドライバー"], oversizeLoad: ["特殊車両", "大型特殊車両", "超大型車両"], permitAuthority: ["国土交通省", "道路管理者"], regulationCode: ["道路法第47条", "車両制限令"], equipmentClasses: ["誘導車", "警察先導"], glossaryTerms: { "特車": "Special vehicle (abbreviated)", "MLIT": "Ministry of Land, Infrastructure, Transport and Tourism" }, rateStructure: "per_km", currency: "JPY", baseRateRange: [300, 700], rateUnit: "km", dayRateRange: [50000, 100000], specializedMultiplier: 1.40, jobTitles: ["誘導員", "先導車ドライバー", "特殊車両誘導員"] },
    { iso2: "KR", lang: "ko", escortVehicle: ["유도차량", "에스코트 차량", "선도차량"], operatorRole: ["유도차량 운전자"], oversizeLoad: ["초과화물", "특수차량", "중량물"], permitAuthority: ["국토교통부", "도로관리청"], regulationCode: ["도로법", "차량 운행 제한규정"], equipmentClasses: ["유도차량", "경찰 에스코트"], glossaryTerms: {}, rateStructure: "per_km", currency: "KRW", baseRateRange: [2000, 5000], rateUnit: "km", dayRateRange: [500000, 1000000], specializedMultiplier: 1.35, jobTitles: ["유도차량 운전자", "에스코트 드라이버"] },
    { iso2: "CL", lang: "es", escortVehicle: ["vehículo de acompañamiento", "vehículo piloto", "escolta"], operatorRole: ["conductor de escolta"], oversizeLoad: ["carga sobredimensionada", "transporte de carga especial"], permitAuthority: ["Dirección de Vialidad", "Carabineros"], regulationCode: ["Decreto Supremo 298", "Ley de Tránsito"], equipmentClasses: ["escolta privada", "escolta de Carabineros"], glossaryTerms: {}, rateStructure: "per_km", currency: "CLP", baseRateRange: [500, 1200], rateUnit: "km", dayRateRange: [150000, 350000], specializedMultiplier: 1.25, jobTitles: ["Conductor de Escolta CL", "Acompañante de Transporte Especial CL"] },
    { iso2: "AR", lang: "es", escortVehicle: ["vehículo de acompañamiento", "escolta", "vehículo batidor"], operatorRole: ["conductor de escolta", "batidor"], oversizeLoad: ["carga excepcional", "transporte especial", "carga sobredimensionada"], permitAuthority: ["DNV (Dirección Nacional de Vialidad)", "Gendarmería"], regulationCode: ["Ley Nacional de Tránsito 24.449"], equipmentClasses: ["escolta privada", "escolta de Gendarmería"], glossaryTerms: { "DNV": "Dirección Nacional de Vialidad" }, rateStructure: "per_km", currency: "ARS", baseRateRange: [500, 1500], rateUnit: "km", dayRateRange: [150000, 400000], specializedMultiplier: 1.25, jobTitles: ["Conductor de Escolta AR", "Batidor AR"] },
    { iso2: "CO", lang: "es", escortVehicle: ["vehículo de acompañamiento", "escolta de carga"], operatorRole: ["conductor de escolta"], oversizeLoad: ["carga extradimensionada", "carga especial"], permitAuthority: ["INVÍAS", "Ministerio de Transporte"], regulationCode: ["Resolución 4959/2006"], equipmentClasses: ["escolta privada", "escolta de policía"], glossaryTerms: { "INVÍAS": "Instituto Nacional de Vías" }, rateStructure: "per_km", currency: "COP", baseRateRange: [2000, 5000], rateUnit: "km", dayRateRange: [500000, 1200000], specializedMultiplier: 1.20, jobTitles: ["Conductor de Escolta CO"] },
    { iso2: "PE", lang: "es", escortVehicle: ["vehículo de escolta", "vehículo piloto"], operatorRole: ["conductor de escolta"], oversizeLoad: ["carga especial", "transporte de mercancías especiales"], permitAuthority: ["SUTRAN", "MTC"], regulationCode: ["DS 007-2016-MTC"], equipmentClasses: ["escolta privada", "escolta PNP"], glossaryTerms: { "SUTRAN": "Superintendencia de Transporte Terrestre" }, rateStructure: "per_km", currency: "PEN", baseRateRange: [3, 8], rateUnit: "km", dayRateRange: [500, 1200], specializedMultiplier: 1.20, jobTitles: ["Conductor de Escolta PE"] },

    // ══════════════ TIER D — SLATE ══════════════
    { iso2: "UY", lang: "es", escortVehicle: ["vehículo de escolta", "vehículo batidor"], operatorRole: ["conductor de escolta"], oversizeLoad: ["carga excepcional", "transporte especial"], permitAuthority: ["DNV Uruguay", "Caminera"], regulationCode: ["Ley de Tránsito 18.191"], equipmentClasses: ["escolta privada", "escolta policial"], glossaryTerms: {}, rateStructure: "per_km", currency: "UYU", baseRateRange: [30, 80], rateUnit: "km", dayRateRange: [8000, 20000], specializedMultiplier: 1.20, jobTitles: ["Conductor de Escolta UY"] },
    { iso2: "PA", lang: "es", escortVehicle: ["vehículo de escolta", "vehículo piloto"], operatorRole: ["conductor de escolta"], oversizeLoad: ["carga sobredimensionada", "transporte especial"], permitAuthority: ["ATTT"], regulationCode: ["Ley 34 de Tránsito"], equipmentClasses: ["escolta privada", "escolta policial"], glossaryTerms: { "ATTT": "Autoridad del Tránsito y Transporte Terrestre" }, rateStructure: "per_km", currency: "USD", baseRateRange: [2, 5], rateUnit: "km", dayRateRange: [350, 700], specializedMultiplier: 1.20, jobTitles: ["Conductor de Escolta PA"] },
    { iso2: "CR", lang: "es", escortVehicle: ["vehículo de escolta", "vehículo piloto"], operatorRole: ["conductor de escolta"], oversizeLoad: ["carga especial", "transporte excepcional"], permitAuthority: ["COSEVI", "CONAVI"], regulationCode: ["Ley de Tránsito 9078"], equipmentClasses: ["escolta privada", "escolta de tránsito"], glossaryTerms: { "COSEVI": "Consejo de Seguridad Vial" }, rateStructure: "per_km", currency: "CRC", baseRateRange: [1000, 3000], rateUnit: "km", dayRateRange: [200000, 500000], specializedMultiplier: 1.20, jobTitles: ["Conductor de Escolta CR"] },
];

// ═══════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

/** Get terminology for a country */
export function getEscortTerminology(iso2: string): CountryEscortTerminology | undefined {
    return GLOBAL_ESCORT_TERMS.find((t) => t.iso2 === iso2);
}

/** Get all glossary terms for a country (for glossary pages) */
export function getGlossaryTerms(iso2: string): Record<string, string> {
    return getEscortTerminology(iso2)?.glossaryTerms ?? {};
}

/** Get SEO keywords from terminology (escort vehicle names × oversize load names) */
export function getTerminologyKeywords(iso2: string): string[] {
    const terms = getEscortTerminology(iso2);
    if (!terms) return [];
    return [
        ...terms.escortVehicle,
        ...terms.operatorRole,
        ...terms.oversizeLoad,
        ...terms.regulationCode,
        ...terms.jobTitles,
    ];
}

/** Get total glossary term count across all countries */
export function getGlobalGlossaryStats(): { totalTerms: number; countriesWithTerms: number } {
    let totalTerms = 0;
    let countriesWithTerms = 0;
    for (const t of GLOBAL_ESCORT_TERMS) {
        const count = Object.keys(t.glossaryTerms).length;
        totalTerms += count;
        if (count > 0) countriesWithTerms++;
    }
    return { totalTerms, countriesWithTerms };
}

/** Generate glossary page content for thin-page prevention */
export function generateGlossaryPageData(iso2: string): {
    title: string;
    terms: Array<{ term: string; definition: string; }>;
    relatedTerms: string[];
} | null {
    const t = getEscortTerminology(iso2);
    if (!t) return null;

    const terms = Object.entries(t.glossaryTerms).map(([term, definition]) => ({
        term, definition,
    }));

    // Add auto-generated terms from vehicle/role names
    for (const v of t.escortVehicle) {
        if (!t.glossaryTerms[v]) {
            terms.push({ term: v, definition: `Term for escort/pilot vehicle in ${t.lang.toUpperCase()} markets.` });
        }
    }
    for (const r of t.operatorRole) {
        if (!t.glossaryTerms[r]) {
            terms.push({ term: r, definition: `Professional role title for oversize load escort operators.` });
        }
    }

    return {
        title: `Escort & Pilot Car Terminology — ${iso2}`,
        terms: terms.sort((a, b) => a.term.localeCompare(b.term)),
        relatedTerms: [...t.equipmentClasses, ...t.regulationCode],
    };
}

/**
 * Get the primary local term for the escort vehicle in this country.
 * This is the #1 term used in CTA headlines, page headings, and meta.
 * Falls back to "pilot car" for countries not yet in terminology DB.
 *
 * Usage: const localTerm = getLocalTerm('DE') // → "Begleitfahrzeug (BF3)"
 */
export function getLocalTerm(iso2: string): string {
    const t = getEscortTerminology(iso2);
    return t?.escortVehicle?.[0] ?? 'pilot car';
}

/**
 * Get the primary operator role name for a country.
 * Used in job pages, directory headings, and role-specific CTAs.
 */
export function getLocalOperatorRole(iso2: string): string {
    const t = getEscortTerminology(iso2);
    return t?.operatorRole?.[0] ?? 'pilot car operator';
}

/**
 * Get the primary oversize load term for a country.
 * Used in permit pages, regulations headings, and SEO copy.
 */
export function getLocalOversizeLoadTerm(iso2: string): string {
    const t = getEscortTerminology(iso2);
    return t?.oversizeLoad?.[0] ?? 'oversize load';
}

