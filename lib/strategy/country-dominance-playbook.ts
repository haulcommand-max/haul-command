// ══════════════════════════════════════════════════════════════
// COUNTRY DOMINANCE PLAYBOOK + KEYWORD MATRIX
// Per-country competitive edges, exploit vectors, and
// complete keyword coverage for:
//   • Directory (pilot car directory)
//   • Load Board (oversize load board)
//   • Leaderboard (escort rankings)
//   • Mobile App (pilot car app)
//
// These are the specific moves per country that give Haul
// Command an unfair advantage.
// ══════════════════════════════════════════════════════════════

export interface CountryDominancePlaybook {
    code: string;
    name: string;
    tier: "gold" | "blue" | "silver" | "slate";

    /** What specifically can be exploited in this country */
    competitiveEdges: CompetitiveEdge[];

    /** Keyword clusters for all 4 products */
    keywords: CountryKeywordCluster;

    /** The #1 fastest move to dominate here */
    fastestWin: string;

    /** What competitors exist (if any) */
    competitorLandscape: "empty" | "fragmented" | "weak_incumbent" | "strong_incumbent";

    /** Regulatory moat opportunity */
    regulatoryMoat: string;
}

export interface CompetitiveEdge {
    edge: string;
    why: string;
    difficulty: "easy" | "medium" | "hard";
    timeToImpact: string;
}

export interface CountryKeywordCluster {
    /** Primary language keywords */
    directory: string[];
    loadBoard: string[];
    leaderboard: string[];
    mobileApp: string[];
    /** Long-tail / semantic keywords */
    longTail: string[];
    /** Voice / conversational queries */
    voiceQueries: string[];
}

// ══════════════════════════════════════════════════════════════
// TIER A — GOLD (10 countries) — Full dominance required
// ══════════════════════════════════════════════════════════════

export const GOLD_PLAYBOOKS: CountryDominancePlaybook[] = [
    {
        code: "US", name: "United States", tier: "gold",
        competitorLandscape: "fragmented",
        fastestWin: "You already have data depth no US competitor matches. Push state-specific pages for all 50 states NOW — each one ranks for '[state] pilot car requirements'",
        regulatoryMoat: "50-state regulatory fragmentation IS your moat. Nobody else maps all 50 states' escort thresholds, permit costs, and travel windows in one place.",
        competitiveEdges: [
            { edge: "State-by-state permit cost calculator", why: "Every broker Googles this. Nobody has it structured. You do.", difficulty: "easy", timeToImpact: "2-4 weeks" },
            { edge: "Wind corridor seasonal pages", why: "TX, IA, OK, KS wind farms drive massive escort demand. Seasonal content pages rank fast.", difficulty: "easy", timeToImpact: "4-6 weeks" },
            { edge: "Interstate route planner", why: "Dallas→Houston, LA→Phoenix — every city-pair is a long-tail page. 2,450+ pages from top 50 cities.", difficulty: "medium", timeToImpact: "6-12 weeks" },
            { edge: "TWIC verification integration", why: "Port escorts need TWIC cards. Being the only directory that verifies this = instant trust.", difficulty: "medium", timeToImpact: "4-8 weeks" },
        ],
        keywords: {
            directory: ["pilot car directory", "escort vehicle directory", "pilot car companies near me", "certified pilot car operators", "pilot car company directory USA", "find pilot car drivers", "oversize escort company search", "pilot car service [state]"],
            loadBoard: ["oversize load board", "pilot car load board", "heavy haul load board", "escort loads available", "wide load jobs near me", "pilot car jobs today", "oversize transport load matching", "pilot car loads available now"],
            leaderboard: ["top pilot car companies", "best escort vehicle services", "highest rated pilot car operators", "pilot car company rankings", "most trusted escort services", "top oversize escort providers", "pilot car driver ratings"],
            mobileApp: ["pilot car app", "escort vehicle app", "oversize load app", "pilot car driver app", "pilot car tracking app", "heavy haul load app", "escorts for wide loads app", "pilot car mobile app"],
            longTail: ["how to find a pilot car in [state]", "pilot car requirements by state", "how much does a pilot car cost per mile", "pilot car driver certification requirements", "best pilot car app for truckers", "oversize load escort requirements [state]", "pilot car equipment checklist", "how to become a certified pilot car driver"],
            voiceQueries: ["find me a pilot car near me", "how much does a pilot car cost", "do I need a pilot car in Texas", "what are pilot car requirements in California", "nearest escort vehicle service"],
        },
    },
    {
        code: "CA", name: "Canada", tier: "gold",
        competitorLandscape: "weak_incumbent",
        fastestWin: "Canada has no dominant pilot car directory. Build province-specific pages in EN + FR for Quebec/NB. You immediately own Canadian escort search.",
        regulatoryMoat: "Provincial fragmentation (ON, AB, BC each have different rules). French-language compliance content for QC is a massive gap nobody fills.",
        competitiveEdges: [
            { edge: "French-language pilot car content for Quebec", why: "Zero competition in French for 'véhicule d'escorte'. Massive untapped search volume.", difficulty: "easy", timeToImpact: "2-4 weeks" },
            { edge: "Oil sands corridor coverage (AB)", why: "Edmonton→Fort McMurray is the highest-value escort corridor in Canada. Own it.", difficulty: "easy", timeToImpact: "2-3 weeks" },
            { edge: "Cross-border US↔CA guide pages", why: "Nobody explains what changes when a load crosses at Windsor, Niagara, or Blaine. You already have this data.", difficulty: "easy", timeToImpact: "1-2 weeks" },
            { edge: "Provincial permit cost comparison", why: "ON vs AB vs BC vs SK — different permit systems, different costs. Structured comparison = SEO goldmine.", difficulty: "medium", timeToImpact: "4-6 weeks" },
        ],
        keywords: {
            directory: ["pilot car directory Canada", "escort vehicle companies Canada", "pilot car services Ontario", "pilot car Alberta", "find escort vehicle BC", "répertoire véhicule d'escorte", "annuaire pilote routier Québec", "pilot car company [province]"],
            loadBoard: ["oversize load board Canada", "pilot car loads Canada", "heavy haul jobs Ontario", "wide load jobs Alberta", "escort vehicle loads BC", "tableau de charges surdimensionnées"],
            leaderboard: ["best pilot car companies Canada", "top escort services Ontario", "pilot car rankings Alberta", "meilleurs services d'escorte Canada"],
            mobileApp: ["pilot car app Canada", "escort vehicle app Canada", "oversize load app Canada", "application véhicule d'escorte"],
            longTail: ["pilot car requirements Alberta", "escort vehicle certification Ontario", "how to get pilot car license BC", "oversize load permit cost Ontario", "véhicule d'escorte exigences Québec"],
            voiceQueries: ["find pilot car near Toronto", "do I need an escort vehicle in Alberta", "pilot car cost Canada per day", "combien coûte un véhicule d'escorte au Québec"],
        },
    },
    {
        code: "AU", name: "Australia", tier: "gold",
        competitorLandscape: "weak_incumbent",
        fastestWin: "Australia's NHVR system is unique. Build the definitive NHVR permit guide + pilot vehicle category explainer (Cat 1/2/3). Nobody has this structured.",
        regulatoryMoat: "NHVR categorization (Cat 1, 2, 3) is complex. Being the only site that explains what category your load falls into = permanent authority.",
        competitiveEdges: [
            { edge: "NHVR category calculator tool", why: "Enter dimensions → get category (1, 2, 3) + escort requirements. Nobody has this as a tool.", difficulty: "medium", timeToImpact: "4-6 weeks" },
            { edge: "Perth→Pilbara mining corridor page", why: "Highest-value escort corridor in Australia. Remote. Supply-constrained. Premium rates.", difficulty: "easy", timeToImpact: "1-2 weeks" },
            { edge: "State-by-state comparison (NSW vs QLD vs WA vs VIC)", why: "Different pilot vehicle requirements per state despite NHVR. Comparison content ranks.", difficulty: "easy", timeToImpact: "2-4 weeks" },
        ],
        keywords: {
            directory: ["pilot vehicle directory Australia", "escort vehicle companies Australia", "OSOM pilot vehicle services", "pilot vehicle drivers NSW", "find pilot vehicle Queensland", "pilot car companies Perth", "escort vehicle directory [state]"],
            loadBoard: ["oversize load board Australia", "OSOM loads Australia", "heavy haulage jobs Australia", "pilot vehicle jobs QLD", "escort vehicle work Western Australia"],
            leaderboard: ["best pilot vehicle companies Australia", "top escort vehicle services NSW", "pilot vehicle rankings QLD", "most reliable OSOM escorts"],
            mobileApp: ["pilot vehicle app Australia", "OSOM tracking app", "escort vehicle driver app Australia", "heavy haulage app"],
            longTail: ["NHVR pilot vehicle requirements", "do I need a pilot vehicle category 2", "pilot vehicle accreditation Australia", "OSOM escort vehicle equipment list", "pilot vehicle rates per km Australia"],
            voiceQueries: ["find pilot vehicle near me", "do I need an escort vehicle in Queensland", "how much does a pilot vehicle cost in Australia"],
        },
    },
    {
        code: "GB", name: "United Kingdom", tier: "gold",
        competitorLandscape: "fragmented",
        fastestWin: "UK uses 'abnormal load' not 'oversize'. STGO categories are complex. Be the STGO explainer + escort finder. Nobody owns this.",
        regulatoryMoat: "STGO Cat 1/2/3 + Special Order system is confusing. Building the definitive STGO guide makes you the authority search engines reference.",
        competitiveEdges: [
            { edge: "STGO category explainer + calculator", why: "Most haulers don't fully understand STGO. A clear, interactive guide = massive authority.", difficulty: "easy", timeToImpact: "2-4 weeks" },
            { edge: "Post-Brexit Channel crossing guide", why: "UK↔EU oversize loads now need customs + escort swaps. Nobody explains this well.", difficulty: "easy", timeToImpact: "1-2 weeks" },
            { edge: "Port escort coverage (Southampton, Felixstowe, Tilbury)", why: "Port-to-inland escorts are high-frequency, high-value. Own these pages.", difficulty: "easy", timeToImpact: "2-3 weeks" },
        ],
        keywords: {
            directory: ["abnormal load escort UK", "escort vehicle directory UK", "wide load escort companies", "STGO escort services", "pilot car UK", "abnormal load haulage companies", "escort vehicle hire [city]"],
            loadBoard: ["abnormal load jobs UK", "wide load escort work UK", "heavy haulage load board UK", "STGO escort jobs"],
            leaderboard: ["best abnormal load escorts UK", "top escort vehicle companies UK", "most reliable wide load escorts"],
            mobileApp: ["abnormal load app UK", "escort vehicle app UK", "wide load tracking app", "STGO escort app"],
            longTail: ["STGO category 1 2 3 explained", "do I need an escort for an abnormal load UK", "abnormal load notification highways England", "escort vehicle requirements UK", "how to become an escort vehicle driver UK"],
            voiceQueries: ["do I need an escort for my wide load in the UK", "how much does an escort vehicle cost UK", "abnormal load rules England"],
        },
    },
    {
        code: "NZ", name: "New Zealand", tier: "gold",
        competitorLandscape: "empty",
        fastestWin: "NZ has virtually NO digital pilot vehicle services. First mover takes everything. Build the NZTA overweight permit guide + pilot vehicle finder.",
        regulatoryMoat: "NZ classifies by Cat 1/2/3 like Australia. Small market but zero competition = instant #1.",
        competitiveEdges: [
            { edge: "Be the first digital pilot vehicle platform in NZ", why: "There is no competitor. First mover wins permanently in small markets.", difficulty: "easy", timeToImpact: "1-2 weeks" },
            { edge: "Auckland→Waikato corridor page", why: "Primary heavy transport corridor. Own this page = own NZ pilot vehicle search.", difficulty: "easy", timeToImpact: "1 week" },
        ],
        keywords: {
            directory: ["pilot vehicle directory New Zealand", "escort vehicle NZ", "pilot vehicle companies Auckland", "find pilot vehicle Christchurch", "overweight permit NZ escort"],
            loadBoard: ["oversize load jobs NZ", "pilot vehicle work New Zealand", "heavy transport loads NZ"],
            leaderboard: ["best pilot vehicle companies NZ", "top escort services New Zealand"],
            mobileApp: ["pilot vehicle app New Zealand", "oversize load app NZ"],
            longTail: ["pilot vehicle requirements NZ", "NZTA overweight permit escort rules", "pilot vehicle certification New Zealand", "how to get pilot vehicle accreditation NZ"],
            voiceQueries: ["do I need a pilot vehicle in New Zealand", "pilot vehicle cost NZ"],
        },
    },
    {
        code: "ZA", name: "South Africa", tier: "gold",
        competitorLandscape: "empty",
        fastestWin: "WhatsApp is king in ZA logistics. Build a WhatsApp-first escort booking flow. Nobody has this.",
        regulatoryMoat: "SA's tiered escort system (3m→4.5m→police) is well-defined but not digitized anywhere. You digitize it = you own it.",
        competitiveEdges: [
            { edge: "WhatsApp-native booking flow", why: "ZA logistics runs on WhatsApp. A directory with WhatsApp deep-links beats any website-only competitor.", difficulty: "easy", timeToImpact: "1-2 weeks" },
            { edge: "Johannesburg↔Durban corridor dominance", why: "N3 toll route = highest-volume oversize corridor in Africa. Own this page.", difficulty: "easy", timeToImpact: "1 week" },
            { edge: "Mining escort specialization (Mpumalanga)", why: "Mining equipment moves are constant. Specialized mining escort pages = premium.", difficulty: "medium", timeToImpact: "2-4 weeks" },
        ],
        keywords: {
            directory: ["pilot car directory South Africa", "escort vehicle companies Johannesburg", "abnormal load escort SA", "pilot vehicle services Durban", "find escort vehicle Cape Town"],
            loadBoard: ["oversize load jobs South Africa", "abnormal load board SA", "escort vehicle work Johannesburg", "pilot car loads Durban"],
            leaderboard: ["best escort vehicle companies South Africa", "top pilot car services Johannesburg"],
            mobileApp: ["pilot car app South Africa", "escort vehicle app SA", "abnormal load app"],
            longTail: ["abnormal load escort requirements South Africa", "how many escorts needed South Africa", "pilot car certification South Africa", "RTMC escort vehicle rules"],
            voiceQueries: ["find escort vehicle near Johannesburg", "do I need a pilot car in South Africa"],
        },
    },
    {
        code: "DE", name: "Germany", tier: "gold",
        competitorLandscape: "fragmented",
        fastestWin: "Germany's BF3/BF4 certification system is confusing. Build the definitive BF-Zertifizierung guide in German. Own 'Schwertransport' search.",
        regulatoryMoat: "VEMAGS digital permit system + BF3/BF4 certification tiers create a complexity moat. You simplify it = you own it.",
        competitiveEdges: [
            { edge: "BF3 vs BF4 certification explainer in German", why: "Most German haulers Google this. Nobody has a clean, complete guide.", difficulty: "easy", timeToImpact: "2-4 weeks" },
            { edge: "VEMAGS permit process guide", why: "Germany's digital permit system is complex. A step-by-step guide = permanent SEO authority.", difficulty: "easy", timeToImpact: "2-3 weeks" },
            { edge: "XING professional presence", why: "XING is Germany's LinkedIn. Having a XING company page with BF-escort content = B2B reach nobody else has.", difficulty: "easy", timeToImpact: "1 week" },
            { edge: "Wind corridor coverage (Schleswig-Holstein, Niedersachsen)", why: "Germany is Europe's biggest wind market. Blade escort pages = premium traffic.", difficulty: "medium", timeToImpact: "4-6 weeks" },
        ],
        keywords: {
            directory: ["Begleitfahrzeug Verzeichnis", "BF3 Begleitfahrzeug finden", "Schwertransport Begleitung", "Begleitfahrzeug Dienstleister Deutschland", "pilot car directory Germany", "escort vehicle companies Germany"],
            loadBoard: ["Schwertransport Aufträge", "Begleitfahrzeug Jobs", "Schwertransport Börse", "oversize load board Germany", "heavy transport loads Deutschland"],
            leaderboard: ["beste Begleitfahrzeug Firmen", "top Schwertransport Begleiter Deutschland", "BF4 Begleitfahrzeug Ranking"],
            mobileApp: ["Begleitfahrzeug App", "Schwertransport App", "BF3 App", "escort vehicle app Germany"],
            longTail: ["BF3 Ausbildung Kosten", "BF4 Zertifizierung Anforderungen", "VEMAGS Antrag Schwertransport", "Begleitfahrzeug Ausrüstung Pflicht", "Schwertransport Nachtfahrt Regeln"],
            voiceQueries: ["brauche ich ein Begleitfahrzeug für meinen Transport", "was kostet ein Begleitfahrzeug pro Tag", "BF3 oder BF4 was brauche ich"],
        },
    },
    {
        code: "NL", name: "Netherlands", tier: "gold",
        competitorLandscape: "weak_incumbent",
        fastestWin: "Rotterdam is Europe's biggest port. Own 'exceptioneel transport Rotterdam' and every broker in Netherlands finds you.",
        regulatoryMoat: "RDW/INCO 92 permit system + Rotterdam port escort specialization. Port-to-inland escort pages = permanent authority.",
        competitiveEdges: [
            { edge: "Rotterdam port escort specialization", why: "Europe's largest port. Every project cargo shipment needs escorts. Own this search.", difficulty: "easy", timeToImpact: "1-2 weeks" },
            { edge: "Cross-border DE↔NL escort swap guide", why: "German BF3 escorts can't operate in NL. This transition guide = unique value.", difficulty: "easy", timeToImpact: "1-2 weeks" },
            { edge: "Bilingual EN/NL content", why: "Dutch logistics pros read English. Having both languages = double the ranking surface.", difficulty: "easy", timeToImpact: "2-3 weeks" },
        ],
        keywords: {
            directory: ["begeleidingsvoertuig directory", "exceptioneel transport begeleiding", "pilot car Nederland", "begeleiding breed transport", "escort vehicle Netherlands", "find begeleidingsvoertuig"],
            loadBoard: ["exceptioneel transport opdrachten", "begeleidingsvoertuig werk", "zwaar transport beurs", "oversize load board Netherlands"],
            leaderboard: ["beste begeleidingsvoertuig bedrijven", "top escort services Nederland"],
            mobileApp: ["begeleidingsvoertuig app", "exceptioneel transport app", "escort vehicle app Netherlands"],
            longTail: ["begeleidingsvoertuig verplicht wanneer", "exceptioneel transport vergunning RDW", "begeleidingsvoertuig kosten per dag", "breed transport regels Nederland"],
            voiceQueries: ["heb ik een begeleidingsvoertuig nodig", "wat kost een begeleidingsvoertuig", "exceptioneel transport regels Nederland"],
        },
    },
    {
        code: "AE", name: "United Arab Emirates", tier: "gold",
        competitorLandscape: "empty",
        fastestWin: "UAE logistics is WhatsApp-first and English-dominant. A professional English directory with WhatsApp booking = instant market capture.",
        regulatoryMoat: "Abu Dhabi vs Dubai have different transport authorities. Mapping both = unique authority. Oil & gas project logistics creates massive escort demand.",
        competitiveEdges: [
            { edge: "Jebel Ali port-to-site escort guide", why: "Jebel Ali is the Middle East's busiest port. Project cargo = escort demand. Own this search.", difficulty: "easy", timeToImpact: "1-2 weeks" },
            { edge: "Oil & gas corridor pages (Abu Dhabi, Ruwais)", why: "Major oil infrastructure projects need constant escorts. These pages capture high-intent B2B traffic.", difficulty: "easy", timeToImpact: "2-3 weeks" },
            { edge: "Arabic future content", why: "Currently English-dominant market but Arabic content = competitive moat for long term. Flag for later.", difficulty: "hard", timeToImpact: "6+ months" },
        ],
        keywords: {
            directory: ["escort vehicle directory UAE", "pilot car companies Dubai", "oversize load escort Abu Dhabi", "transport escort services UAE", "find escort vehicle Dubai", "مركبة مرافقة دبي"],
            loadBoard: ["oversize load jobs UAE", "escort vehicle work Dubai", "heavy transport loads Abu Dhabi", "project cargo escort UAE"],
            leaderboard: ["best escort vehicle companies UAE", "top pilot car services Dubai", "trusted transport escorts Abu Dhabi"],
            mobileApp: ["pilot car app UAE", "escort vehicle app Dubai", "oversize transport app UAE"],
            longTail: ["escort vehicle requirements UAE", "oversize load permit Dubai", "transport escort Abu Dhabi cost", "heavy lift transport escort Jebel Ali"],
            voiceQueries: ["find escort vehicle in Dubai", "do I need escort for oversize load UAE", "how much does escort vehicle cost in UAE"],
        },
    },
    {
        code: "BR", name: "Brazil", tier: "gold",
        competitorLandscape: "empty",
        fastestWin: "Brazil has ZERO structured digital escort vehicle platforms. PIX payment + WhatsApp + Portuguese content = you own the entire Brazilian market.",
        regulatoryMoat: "DNIT permit system + state-level DETRAN requirements are fragmented like the US. Nobody has mapped this digitally in Portuguese.",
        competitiveEdges: [
            { edge: "PIX-native payment", why: "86% of Brazilian digital payments use PIX. If your competitor doesn't accept PIX, they don't exist in Brazil.", difficulty: "medium", timeToImpact: "4-6 weeks" },
            { edge: "WhatsApp-first booking flow", why: "Brazil runs on WhatsApp. Directory with WhatsApp deep-links for every operator = instant adoption.", difficulty: "easy", timeToImpact: "1-2 weeks" },
            { edge: "Santos port corridor page", why: "Port of Santos = Latin America's biggest. Project cargo needs escorts. Own 'escolta Santos' search.", difficulty: "easy", timeToImpact: "1-2 weeks" },
            { edge: "Full Portuguese content", why: "Zero English-language competition matters. Full Portuguese presence = you ARE the Brazilian market.", difficulty: "medium", timeToImpact: "4-8 weeks" },
        ],
        keywords: {
            directory: ["diretório de carro batedor", "batedores de escolta Brasil", "batedor São Paulo", "carro batedor transporte especial", "encontrar batedor de escolta", "empresas de escolta rodoviária"],
            loadBoard: ["cargas especiais disponíveis", "trabalho de batedor Brasil", "frete especial quadro de cargas", "escolta rodoviária vagas"],
            leaderboard: ["melhores empresas de batedor", "ranking de batedores Brasil", "batedores mais confiáveis"],
            mobileApp: ["aplicativo carro batedor", "app de batedor de escolta", "aplicativo transporte especial", "app de cargas especiais Brasil"],
            longTail: ["como ser batedor de escolta", "requisitos carro batedor DNIT", "quanto custa escolta rodoviária", "regras transporte especial DNIT", "licença batedor de escolta"],
            voiceQueries: ["preciso de batedor de escolta", "quanto custa um carro batedor no Brasil", "regras de escolta rodoviária"],
        },
    },
];

// ══════════════════════════════════════════════════════════════
// TIER B — BLUE (15 countries) — Credible presence
// ══════════════════════════════════════════════════════════════

export const BLUE_PLAYBOOKS: CountryDominancePlaybook[] = [
    { code: "IE", name: "Ireland", tier: "blue", competitorLandscape: "empty", fastestWin: "Ireland has no escort directory. First mover wins. Dublin port + M50 corridor.", regulatoryMoat: "RSA abnormal load rules. Small market = easy to dominate.", competitiveEdges: [{ edge: "Dublin port escort specialization", why: "All heavy imports come through Dublin Port", difficulty: "easy", timeToImpact: "1-2 weeks" }], keywords: { directory: ["escort vehicle Ireland", "pilot car companies Dublin", "abnormal load escort Ireland"], loadBoard: ["oversize load jobs Ireland", "escort vehicle work Dublin"], leaderboard: ["best escort companies Ireland"], mobileApp: ["pilot car app Ireland"], longTail: ["abnormal load requirements Ireland", "escort vehicle rules RSA Ireland"], voiceQueries: ["do I need an escort in Ireland"] } },
    { code: "SE", name: "Sweden", tier: "blue", competitorLandscape: "empty", fastestWin: "Sweden requires VTL certification. Build the VTL guide in Swedish. Zero competition.", regulatoryMoat: "VTL (Varnings- och Transportledare) certification is unique to Sweden.", competitiveEdges: [{ edge: "VTL certification guide in Swedish", why: "Unique regulatory requirement nobody explains well", difficulty: "easy", timeToImpact: "2-3 weeks" }], keywords: { directory: ["VTL förare Sverige", "eskortfordon Sverige", "specialtransport ledsagning"], loadBoard: ["specialtransport uppdrag Sverige", "VTL jobb"], leaderboard: ["bästa eskortföretag Sverige"], mobileApp: ["specialtransport app Sverige"], longTail: ["VTL utbildning krav", "specialtransport regler Sverige"], voiceQueries: ["behöver jag eskort för specialtransport i Sverige"] } },
    { code: "NO", name: "Norway", tier: "blue", competitorLandscape: "empty", fastestWin: "Norwegian tunnel restrictions are extreme. A tunnel clearance database = killer tool.", regulatoryMoat: "Norway's 1,200+ tunnels create unique routing challenges for oversize.", competitiveEdges: [{ edge: "Tunnel/bridge clearance database", why: "Norway has 1,200+ tunnels. Oversize routing is a nightmare without this data.", difficulty: "hard", timeToImpact: "3-6 months" }], keywords: { directory: ["spesialtransport følgebil Norge", "pilot car Norway", "eskortbil tjenester"], loadBoard: ["spesialtransport oppdrag Norge", "følgebil jobber"], leaderboard: ["beste følgebil selskaper Norge"], mobileApp: ["spesialtransport app Norge"], longTail: ["spesialtransport regler Norge", "følgebil krav Statens vegvesen"], voiceQueries: ["trenger jeg følgebil for spesialtransport i Norge"] } },
    { code: "DK", name: "Denmark", tier: "blue", competitorLandscape: "empty", fastestWin: "Denmark→Sweden bridge crossing oversize guide. Great Belt + Øresund.", regulatoryMoat: "Bridge crossings (Storebælt, Øresund) have strict oversize limits.", competitiveEdges: [{ edge: "Bridge crossing oversize guides", why: "Two iconic bridges with strict limits — unique content nobody has", difficulty: "easy", timeToImpact: "2-3 weeks" }], keywords: { directory: ["specialtransport ledsagelse Danmark", "pilot car Denmark", "eskort køretøj"], loadBoard: ["specialtransport opgaver Danmark"], leaderboard: ["bedste eskort firmaer Danmark"], mobileApp: ["specialtransport app Danmark"], longTail: ["specialtransport regler Danmark", "Storebælt bro bredde grænse"], voiceQueries: ["skal jeg bruge eskort til specialtransport i Danmark"] } },
    { code: "FI", name: "Finland", tier: "blue", competitorLandscape: "empty", fastestWin: "Finnish timber/forestry transport creates steady escort demand. Forest corridor pages.", regulatoryMoat: "Finnish weight limits are among the highest in EU (76-tonne trucks). Unique positioning.", competitiveEdges: [{ edge: "Forestry/timber transport escort pages", why: "Finland's primary heavy transport is forestry. Niche but unchallenged.", difficulty: "easy", timeToImpact: "2-3 weeks" }], keywords: { directory: ["erikoiskuljetus saattue Suomi", "pilot car Finland", "saattoauto palvelut"], loadBoard: ["erikoiskuljetus toimeksiannot Suomi"], leaderboard: ["parhaat saattue yritykset Suomi"], mobileApp: ["erikoiskuljetus sovellus"], longTail: ["erikoiskuljetus lupa Traficom", "saattoajoneuvo vaatimukset Suomi"], voiceQueries: ["tarvitaanko erikoiskuljetukseen saattue"] } },
    { code: "BE", name: "Belgium", tier: "blue", competitorLandscape: "weak_incumbent", fastestWin: "Antwerp port escort specialization. Belgium's Flanders/Wallonia language split is your SEO moat — bilingual NL/FR content.", regulatoryMoat: "Bilingual (NL/FR) market. Dual-language content doubles your ranking surface.", competitiveEdges: [{ edge: "Bilingual NL/FR port escort content", why: "Belgium's language divide means you need both Dutch and French content. Nobody does both.", difficulty: "medium", timeToImpact: "4-6 weeks" }], keywords: { directory: ["begeleidingsvoertuig België", "véhicule d'escorte Belgique", "escort vehicle Belgium", "transport exceptionnel Belgique"], loadBoard: ["exceptioneel transport opdrachten België", "transport exceptionnel emplois Belgique"], leaderboard: ["beste begeleidingsvoertuig België"], mobileApp: ["begeleidingsvoertuig app België"], longTail: ["exceptioneel transport regels België", "transport exceptionnel règles Belgique"], voiceQueries: ["heb ik begeleidingsvoertuig nodig in België"] } },
    { code: "AT", name: "Austria", tier: "blue", competitorLandscape: "empty", fastestWin: "Brenner Pass oversize corridor page. Austria ↔ Italy heavy transport.", regulatoryMoat: "Alpine transit regulations (Brenner, Tauern) create unique content.", competitiveEdges: [{ edge: "Brenner Pass corridor page (AT↔IT)", why: "Critical EU freight corridor with strict oversize rules. Unique value.", difficulty: "easy", timeToImpact: "2-3 weeks" }], keywords: { directory: ["Begleitfahrzeug Österreich", "Schwertransport Begleitung Österreich", "escort vehicle Austria"], loadBoard: ["Schwertransport Aufträge Österreich", "Begleitfahrzeug Jobs Tirol"], leaderboard: ["beste Begleitfahrzeug Firmen Österreich"], mobileApp: ["Schwertransport App Österreich"], longTail: ["Schwertransport Brenner Regeln", "Begleitfahrzeug Pflicht Österreich"], voiceQueries: ["brauche ich Begleitfahrzeug in Österreich"] } },
    { code: "CH", name: "Switzerland", tier: "blue", competitorLandscape: "empty", fastestWin: "Gotthard tunnel oversize restrictions. Trilingual (DE/FR/IT) content triples ranking.", regulatoryMoat: "Switzerland's Gotthard and Simplon pass restrictions + trilingual opportunity.", competitiveEdges: [{ edge: "Gotthard corridor guide (trilingual)", why: "Critical transit point. DE/FR/IT content = triple the search surface.", difficulty: "medium", timeToImpact: "4-6 weeks" }], keywords: { directory: ["Schwertransport Begleitung Schweiz", "transport exceptionnel escorte Suisse", "trasporto eccezionale Svizzera", "escort vehicle Switzerland"], loadBoard: ["Schwertransport Aufträge Schweiz"], leaderboard: ["beste Begleitfahrzeug Schweiz"], mobileApp: ["Schwertransport App Schweiz"], longTail: ["Gotthard Schwertransport Regeln", "Begleitfahrzeug Schweiz Kosten"], voiceQueries: ["brauche ich Begleitfahrzeug in der Schweiz", "faut-il escorte transport exceptionnel Suisse"] } },
    { code: "ES", name: "Spain", tier: "blue", competitorLandscape: "empty", fastestWin: "Spanish wind farm corridor pages. Spain is Europe's #2 wind market.", regulatoryMoat: "DGT permit system for transportes especiales. Wind energy corridors.", competitiveEdges: [{ edge: "Wind farm transport corridor pages", why: "Spain = major EU wind market. Blade transport escort pages in Spanish.", difficulty: "easy", timeToImpact: "2-4 weeks" }], keywords: { directory: ["directorio vehículo de escolta España", "empresas de escolta transporte especial", "coche piloto España"], loadBoard: ["cargas especiales España", "trabajos escolta transporte especial"], leaderboard: ["mejores empresas de escolta España"], mobileApp: ["app transporte especial España", "app vehículo de escolta"], longTail: ["requisitos vehículo escolta DGT", "transporte especial normativa España"], voiceQueries: ["necesito escolta para transporte especial en España"] } },
    { code: "FR", name: "France", tier: "blue", competitorLandscape: "fragmented", fastestWin: "France uses 'convoi exceptionnel' — own this term. Le Havre port corridor.", regulatoryMoat: "Transport exceptionnel categories (1st, 2nd, 3rd) are complex. DREAL permit system.", competitiveEdges: [{ edge: "Convoi exceptionnel category guide", why: "French TE categories are confusing. Clear guide = authority.", difficulty: "easy", timeToImpact: "2-3 weeks" }], keywords: { directory: ["annuaire véhicule d'accompagnement", "convoi exceptionnel escorte France", "entreprise d'escorte transport exceptionnel"], loadBoard: ["transport exceptionnel offres France", "travail escorte convoi exceptionnel"], leaderboard: ["meilleures entreprises d'escorte France"], mobileApp: ["application convoi exceptionnel", "app transport exceptionnel France"], longTail: ["réglementation convoi exceptionnel France", "permis transport exceptionnel DREAL", "catégories transport exceptionnel 1 2 3"], voiceQueries: ["faut-il escorte convoi exceptionnel en France", "combien coûte escorte transport exceptionnel"] } },
    { code: "IT", name: "Italy", tier: "blue", competitorLandscape: "empty", fastestWin: "Genoa port + Brenner corridor. Italian trasporto eccezionale content.", regulatoryMoat: "Italian trasporto eccezionale permits through prefettura.", competitiveEdges: [{ edge: "Genoa port + Brenner AT↔IT corridor", why: "Two mega-corridors. Port-to-north Italy escorts.", difficulty: "easy", timeToImpact: "2-3 weeks" }], keywords: { directory: ["scorta trasporto eccezionale Italia", "veicolo di scorta directory", "aziende scorta trasporti speciali"], loadBoard: ["trasporto eccezionale lavoro Italia", "scorta trasporti offerte"], leaderboard: ["migliori aziende scorta Italia"], mobileApp: ["app trasporto eccezionale"], longTail: ["normativa trasporto eccezionale Italia", "scorta veicolo requisiti"], voiceQueries: ["serve scorta per trasporto eccezionale in Italia"] } },
    { code: "PT", name: "Portugal", tier: "blue", competitorLandscape: "empty", fastestWin: "Port of Sines escort content. Portuguese content also reaches BR SEO.", regulatoryMoat: "Sines is Europe's fastest-growing port. IMT permit system.", competitiveEdges: [{ edge: "Portuguese content double-serves Portugal + Brazil SEO", why: "Portuguese language SEO benefits both PT and BR rankings", difficulty: "easy", timeToImpact: "immediate" }], keywords: { directory: ["diretório veículo de escolta Portugal", "empresas escolta transporte especial Portugal"], loadBoard: ["transporte especial ofertas Portugal"], leaderboard: ["melhores empresas escolta Portugal"], mobileApp: ["app veículo escolta Portugal"], longTail: ["requisitos escolta transporte especial IMT", "regras transporte especial Portugal"], voiceQueries: ["preciso de escolta para transporte especial em Portugal"] } },
    { code: "SA", name: "Saudi Arabia", tier: "blue", competitorLandscape: "empty", fastestWin: "Vision 2030 mega-projects (NEOM, Red Sea) need massive escort capacity. Position as the directory for Vision 2030 logistics.", regulatoryMoat: "Nascent digital market. Arabic content + mega-project positioning.", competitiveEdges: [{ edge: "Vision 2030 project logistics pages", why: "NEOM, Red Sea Project, Riyadh Metro — billions in construction = escort demand", difficulty: "medium", timeToImpact: "4-6 weeks" }], keywords: { directory: ["مركبة مرافقة السعودية", "escort vehicle Saudi Arabia", "pilot car Riyadh", "شركات نقل حمولات كبيرة"], loadBoard: ["حمولات كبيرة السعودية", "oversize load jobs Saudi Arabia"], leaderboard: ["أفضل شركات المرافقة السعودية"], mobileApp: ["تطبيق مركبة مرافقة", "escort vehicle app Saudi"], longTail: ["متطلبات النقل الثقيل السعودية", "تصريح نقل حمولات كبيرة"], voiceQueries: ["هل أحتاج مركبة مرافقة في السعودية"] } },
    { code: "QA", name: "Qatar", tier: "blue", competitorLandscape: "empty", fastestWin: "Post-World Cup infrastructure development still driving escort demand.", regulatoryMoat: "Small market, easy to own entirely with English content.", competitiveEdges: [{ edge: "Qatar infrastructure project pages", why: "Ongoing mega-projects. English and Arabic content.", difficulty: "easy", timeToImpact: "2-3 weeks" }], keywords: { directory: ["escort vehicle Qatar", "pilot car Doha", "مركبة مرافقة قطر"], loadBoard: ["oversize load jobs Qatar"], leaderboard: ["best escort companies Qatar"], mobileApp: ["escort vehicle app Qatar"], longTail: ["oversize transport rules Qatar", "escort vehicle requirements Doha"], voiceQueries: ["do I need escort vehicle in Qatar"] } },
    { code: "MX", name: "Mexico", tier: "blue", competitorLandscape: "empty", fastestWin: "US↔Mexico cross-border escort guide (Laredo, El Paso, Tijuana). Nobody has this.", regulatoryMoat: "SCT permit system + US border crossing complexity = unique content opportunity.", competitiveEdges: [{ edge: "US↔Mexico border crossing escort guides", why: "Laredo is #1 US-MX trade crossing. Cross-border oversize is a nightmare nobody guides.", difficulty: "easy", timeToImpact: "1-2 weeks" }, { edge: "Nearshoring trend content", why: "Mexico's nearshoring boom = more factory equipment imports = more escorts needed.", difficulty: "medium", timeToImpact: "4-6 weeks" }], keywords: { directory: ["directorio carro piloto México", "empresas escolta transporte especial México", "carro piloto Monterrey"], loadBoard: ["cargas especiales México", "trabajos carro piloto Monterrey"], leaderboard: ["mejores empresas escolta México"], mobileApp: ["app carro piloto México", "aplicación transporte especial"], longTail: ["requisitos carro piloto SCT México", "permiso transporte especial México", "escolta frontera Estados Unidos México"], voiceQueries: ["necesito carro piloto en México", "cuánto cuesta escolta de carga especial"] } },
];

// ══════════════════════════════════════════════════════════════
// TIER C — SILVER (24 countries) — Indexable beachheads
// Generate programmatically to save space
// ══════════════════════════════════════════════════════════════

interface SilverPlaybook {
    code: string; name: string; lang: string;
    fastestWin: string;
    uniqueEdge: string;
    directoryKW: string[];
    loadBoardKW: string[];
    appKW: string[];
    topLongTail: string[];
}

export const SILVER_PLAYBOOKS: SilverPlaybook[] = [
    { code: "PL", name: "Poland", lang: "pl", fastestWin: "Poland is EU's #1 logistics hub. Transport nienormatywny content in Polish = no competition.", uniqueEdge: "EU freight hub — connects DE, CZ, LT. Transit corridor content.", directoryKW: ["pojazd pilotujący Polska", "firma eskortowa transport nienormatywny", "pilot car Poland"], loadBoardKW: ["ładunki nienormatywne zlecenia Polska", "oversize load jobs Poland"], appKW: ["aplikacja transport nienormatywny"], topLongTail: ["wymagania pilot nienormatywny GDDKiA", "zezwolenie transport nienormatywny Polska"] },
    { code: "CZ", name: "Czech Republic", lang: "cs", fastestWin: "Czech = EU manufacturing transit hub. Škoda/automotive oversize content.", uniqueEdge: "Heavy manufacturing transit between DE and Eastern EU.", directoryKW: ["doprovodné vozidlo Česko", "pilot car Czech Republic"], loadBoardKW: ["nadrozměrný náklad zakázky ČR"], appKW: ["aplikace nadrozměrný transport"], topLongTail: ["pravidla nadrozměrné přepravy ČR"] },
    { code: "SK", name: "Slovakia", lang: "sk", fastestWin: "Slovakia's D1/D2 motorway oversize guide.", uniqueEdge: "Automotive manufacturing hub (VW, Kia, PSA).", directoryKW: ["sprievodné vozidlo Slovensko", "pilot car Slovakia"], loadBoardKW: ["nadrozmerné zásielky Slovensko"], appKW: ["aplikácia nadrozmerný transport"], topLongTail: ["podmienky nadrozmernej prepravy Slovensko"] },
    { code: "HU", name: "Hungary", lang: "hu", fastestWin: "Budapest industrial zone escorts. Hungarian content = zero competition.", uniqueEdge: "EU logistics corridor between AT and RO.", directoryKW: ["kísérő jármű Magyarország", "pilot car Hungary"], loadBoardKW: ["túlméretes szállítás megbízások"], appKW: ["túlméretes szállítás alkalmazás"], topLongTail: ["túlméretes rakomány szabályok Magyarország"] },
    { code: "SI", name: "Slovenia", lang: "sl", fastestWin: "Port of Koper escort content.", uniqueEdge: "Adriatic port = gateway for Central EU oversize.", directoryKW: ["spremljalno vozilo Slovenija", "pilot car Slovenia"], loadBoardKW: ["izredni prevoz naročila"], appKW: ["aplikacija izredni prevoz"], topLongTail: ["pogoji izrednega prevoza Slovenija"] },
    { code: "EE", name: "Estonia", lang: "et", fastestWin: "Baltic corridor (Tallinn→Riga→Vilnius) guide.", uniqueEdge: "Digital-first country. E-permit system.", directoryKW: ["saateauto Eesti", "pilot car Estonia"], loadBoardKW: ["eritransport tellimused Eesti"], appKW: ["eritransport äpp"], topLongTail: ["eritranspordi load nõuded Eesti"] },
    { code: "LV", name: "Latvia", lang: "lv", fastestWin: "Riga port escort content. Baltic hub.", uniqueEdge: "Port of Riga = major Baltic freight port.", directoryKW: ["pavadošais transportlīdzeklis Latvija", "pilot car Latvia"], loadBoardKW: ["lielgabarīta kravu pasūtījumi"], appKW: ["lielgabarīta transports lietotne"], topLongTail: ["lielgabarīta kravas noteikumi Latvija"] },
    { code: "LT", name: "Lithuania", lang: "lt", fastestWin: "Klaipėda port + Baltic corridor transit.", uniqueEdge: "Port of Klaipėda = deepest Baltic port.", directoryKW: ["lydimasis automobilis Lietuva", "pilot car Lithuania"], loadBoardKW: ["negabaritiniai kroviniai Lietuva"], appKW: ["negabaritinio transporto programėlė"], topLongTail: ["negabaritinio krovinio vežimo taisyklės"] },
    { code: "HR", name: "Croatia", lang: "hr", fastestWin: "Adriatic corridor (Rijeka→Zagreb) oversize guide.", uniqueEdge: "Port of Rijeka = growing alternative to Italian ports.", directoryKW: ["pilot vozilo Hrvatska", "escort vehicle Croatia"], loadBoardKW: ["izvanredni prijevoz poslovi Hrvatska"], appKW: ["aplikacija izvanredni prijevoz"], topLongTail: ["uvjeti izvanrednog prijevoza Hrvatska"] },
    { code: "RO", name: "Romania", lang: "ro", fastestWin: "Port of Constanța + Black Sea escort content.", uniqueEdge: "Constanța = EU's Black Sea gateway.", directoryKW: ["vehicul de pilotaj România", "escort vehicle Romania"], loadBoardKW: ["transport agabaritic comenzi România"], appKW: ["aplicație transport agabaritic"], topLongTail: ["reglementari transport agabaritic România"] },
    { code: "BG", name: "Bulgaria", lang: "bg", fastestWin: "Turkey↔EU transit corridor through Bulgaria.", uniqueEdge: "Critical transit country between TR and EU.", directoryKW: ["пилотна кола България", "pilot car Bulgaria"], loadBoardKW: ["извънгабаритни товари България"], appKW: ["приложение извънгабаритен транспорт"], topLongTail: ["правила извънгабаритен транспорт България"] },
    { code: "GR", name: "Greece", lang: "el", fastestWin: "Port of Piraeus escort content. Chinese investment = growing cargo.", uniqueEdge: "Piraeus = COSCO's Mediterranean hub.", directoryKW: ["συνοδευτικό όχημα Ελλάδα", "escort vehicle Greece"], loadBoardKW: ["υπέρβαρα φορτία Ελλάδα"], appKW: ["εφαρμογή υπέρβαρη μεταφορά"], topLongTail: ["κανονισμοί υπερβαριών μεταφορών Ελλάδα"] },
    { code: "TR", name: "Turkey", lang: "tr", fastestWin: "Turkey's mega-infrastructure projects (Istanbul canal, bridges). KGM permit content.", uniqueEdge: "Massive construction + EU↔Middle East transit hub.", directoryKW: ["refakat aracı Türkiye", "pilot car Turkey", "gabari dışı taşıma eskort"], loadBoardKW: ["gabari dışı yük ilanları Türkiye", "oversize load jobs Turkey"], appKW: ["refakat aracı uygulaması", "gabari dışı taşıma uygulaması"], topLongTail: ["gabari dışı taşıma KGM kuralları", "refakat aracı gereksinimleri Türkiye"] },
    { code: "KW", name: "Kuwait", lang: "ar", fastestWin: "Oil infrastructure escort content.", uniqueEdge: "Oil sector = constant heavy haul demand.", directoryKW: ["مركبة مرافقة الكويت", "escort vehicle Kuwait"], loadBoardKW: ["حمولات كبيرة الكويت"], appKW: ["تطبيق مركبة مرافقة"], topLongTail: ["متطلبات نقل الحمولات الكبيرة الكويت"] },
    { code: "OM", name: "Oman", lang: "ar", fastestWin: "Sohar industrial zone + Duqm development.", uniqueEdge: "Sohar port + industrial zone development.", directoryKW: ["مركبة مرافقة عمان", "escort vehicle Oman"], loadBoardKW: ["حمولات كبيرة عمان"], appKW: ["تطبيق مركبة مرافقة عمان"], topLongTail: ["قوانين النقل الثقيل عمان"] },
    { code: "BH", name: "Bahrain", lang: "ar", fastestWin: "King Fahd Causeway oversize crossing guide (SA↔BH).", uniqueEdge: "Causeway crossing = unique oversize challenge.", directoryKW: ["مركبة مرافقة البحرين", "escort vehicle Bahrain"], loadBoardKW: ["حمولات كبيرة البحرين"], appKW: ["تطبيق مركبة مرافقة"], topLongTail: ["نقل الحمولات الكبيرة جسر الملك فهد"] },
    { code: "SG", name: "Singapore", lang: "en", fastestWin: "Jurong industrial estate escort content. English market = easy content.", uniqueEdge: "Tiny country but massive port-to-site escort demand.", directoryKW: ["escort vehicle Singapore", "pilot car Singapore", "oversize load escort SG"], loadBoardKW: ["oversize load jobs Singapore"], appKW: ["pilot car app Singapore"], topLongTail: ["LTA oversize vehicle permit Singapore", "escort vehicle requirements Singapore"] },
    { code: "MY", name: "Malaysia", lang: "ms", fastestWin: "Penang→KL corridor + Johor industrial zone.", uniqueEdge: "Bilingual EN/MS market. Manufacturing hub.", directoryKW: ["kenderaan pengiring Malaysia", "escort vehicle Malaysia", "pilot car KL"], loadBoardKW: ["muatan besar pekerjaan Malaysia"], appKW: ["aplikasi kenderaan pengiring"], topLongTail: ["syarat kenderaan pengiring JPJ Malaysia"] },
    { code: "JP", name: "Japan", lang: "ja", fastestWin: "Japanese content = total linguistic moat. Zero English competition ranks.", uniqueEdge: "先導車 (sendōsha) content in Japanese. MLIT regulations.", directoryKW: ["先導車 ディレクトリ", "特殊車両 誘導車 日本", "pilot car Japan", "重量物運搬 先導"], loadBoardKW: ["特殊車両運送 案件", "先導車 仕事"], appKW: ["先導車 アプリ", "特殊車両 アプリ"], topLongTail: ["先導車 資格 要件", "特殊車両通行許可 MLIT 申請", "先導車 費用 日本"] },
    { code: "KR", name: "South Korea", lang: "ko", fastestWin: "Korean content = linguistic moat. Shipyard escort coverage (Ulsan, Geoje).", uniqueEdge: "Shipyard corridors for Hyundai Heavy, Samsung Heavy, Daewoo.", directoryKW: ["선도 차량 디렉토리 한국", "호송 차량 서비스", "pilot car Korea"], loadBoardKW: ["초과적재 운송 일감 한국"], appKW: ["선도 차량 앱"], topLongTail: ["특수차량 운송 규정 한국", "선도 차량 요건"] },
    { code: "CL", name: "Chile", lang: "es", fastestWin: "Mining corridor (Santiago→Atacama). Copper mining = constant oversize.", uniqueEdge: "World's largest copper producer. Mining equipment escorts.", directoryKW: ["directorio vehículo escolta Chile", "carro piloto Chile", "escolta transporte especial Santiago"], loadBoardKW: ["cargas especiales Chile", "trasporte especial trabajos"], appKW: ["app carro piloto Chile"], topLongTail: ["requisitos escolta transporte especial Chile", "normativa carga sobredimensionada Chile"] },
    { code: "AR", name: "Argentina", lang: "es", fastestWin: "Vaca Muerta shale oil development = growing escort demand.", uniqueEdge: "Vaca Muerta = largest shale deposit outside US. Major heavy haul.", directoryKW: ["directorio vehículo escolta Argentina", "carro piloto Buenos Aires"], loadBoardKW: ["cargas especiales Argentina", "transporte especial trabajos"], appKW: ["app carro piloto Argentina"], topLongTail: ["normativa transporte sobredimensionado Argentina", "requisitos escolta vial Argentina"] },
    { code: "CO", name: "Colombia", lang: "es", fastestWin: "Port of Cartagena + oil sector escort content.", uniqueEdge: "Growing infrastructure + oil sector.", directoryKW: ["directorio vehículo escolta Colombia", "carro piloto Bogotá"], loadBoardKW: ["cargas especiales Colombia"], appKW: ["app carro piloto Colombia"], topLongTail: ["normativa carga extradimensionada Colombia"] },
    { code: "PE", name: "Peru", lang: "es", fastestWin: "Mining corridor (Lima→Andes). Copper/gold mining escorts.", uniqueEdge: "Major mining nation. Mountain corridor challenges.", directoryKW: ["directorio vehículo escolta Perú", "carro piloto Lima"], loadBoardKW: ["cargas especiales Perú"], appKW: ["app carro piloto Perú"], topLongTail: ["normativa transporte sobredimensionado Perú", "escolta carga especial MTC"] },
];

// ══════════════════════════════════════════════════════════════
// TIER D — SLATE (3 countries) — Placeholder sovereignty
// ══════════════════════════════════════════════════════════════

export const SLATE_PLAYBOOKS: SilverPlaybook[] = [
    { code: "UY", name: "Uruguay", lang: "es", fastestWin: "Stub page + Montevideo port mention. Instant sovereignty.", uniqueEdge: "Small market. First page in Spanish = instant #1.", directoryKW: ["vehículo escolta Uruguay", "pilot car Uruguay"], loadBoardKW: ["cargas especiales Uruguay"], appKW: ["app escolta Uruguay"], topLongTail: ["requisitos escolta tráfico Uruguay"] },
    { code: "PA", name: "Panama", lang: "es", fastestWin: "Panama Canal Zone escort content. Unique global asset.", uniqueEdge: "Panama Canal = unique oversize logistics challenge.", directoryKW: ["vehículo escolta Panamá", "pilot car Panama"], loadBoardKW: ["cargas especiales Panamá"], appKW: ["app escolta Panamá"], topLongTail: ["transporte sobredimensionado Zona del Canal"] },
    { code: "CR", name: "Costa Rica", lang: "es", fastestWin: "Stub page. Minimal effort, sovereignty secured.", uniqueEdge: "Growing infrastructure investment.", directoryKW: ["vehículo escolta Costa Rica", "pilot car Costa Rica"], loadBoardKW: ["cargas especiales Costa Rica"], appKW: ["app escolta Costa Rica"], topLongTail: ["normativa carga sobredimensionada Costa Rica"] },
];

// ── Master Lookup ──

export function getPlaybook(code: string): CountryDominancePlaybook | SilverPlaybook | undefined {
    return GOLD_PLAYBOOKS.find(p => p.code === code)
        ?? BLUE_PLAYBOOKS.find(p => p.code === code)
        ?? SILVER_PLAYBOOKS.find(p => p.code === code)
        ?? SLATE_PLAYBOOKS.find(p => p.code === code);
}

export function getAllKeywordsForCountry(code: string): string[] {
    const pb = getPlaybook(code);
    if (!pb) return [];
    if ("keywords" in pb) {
        const k = pb.keywords;
        return [...k.directory, ...k.loadBoard, ...k.leaderboard, ...k.mobileApp, ...k.longTail, ...k.voiceQueries];
    }
    return [...pb.directoryKW, ...pb.loadBoardKW, ...pb.appKW, ...pb.topLongTail];
}

export function getTotalKeywordCount(): number {
    const all = [...GOLD_PLAYBOOKS, ...BLUE_PLAYBOOKS, ...SILVER_PLAYBOOKS, ...SLATE_PLAYBOOKS];
    return all.reduce((sum, pb) => sum + getAllKeywordsForCountry(pb.code).length, 0);
}
