// ══════════════════════════════════════════════════════════════
// 10X KEYWORD DOMINATION ENGINE
// Three verticals × 52 countries × city/state/country levels
//
// VERTICAL 1: Pilot Car Directory
// VERTICAL 2: Load Board (oversize/heavy haul)
// VERTICAL 3: Mobile App (pilot car / escort)
//
// Each vertical gets localized terms for all 52 countries.
// ══════════════════════════════════════════════════════════════

import { COUNTRY_KEYWORD_SEEDS } from "./global-keyword-matrix";

// ═══════════════════════════════════════════════
// VERTICAL DEFINITIONS
// ═══════════════════════════════════════════════

export interface VerticalKeywordConfig {
    verticalId: "directory" | "load_board" | "mobile_app";
    /** English name for the vertical */
    verticalName: string;
    /** Country-specific term overrides */
    countryTerms: Record<string, {
        /** Primary keyword phrase in local language */
        primary: string;
        /** All search variants */
        variants: string[];
        /** Long-tail keyword patterns */
        longTails: string[];
    }>;
}

// ═══════════════════════════════════════════════
// VERTICAL 1: PILOT CAR DIRECTORY
// ═══════════════════════════════════════════════

export const DIRECTORY_VERTICAL: VerticalKeywordConfig = {
    verticalId: "directory",
    verticalName: "Pilot Car Directory",
    countryTerms: {
        // ── TIER A — GOLD ──
        US: {
            primary: "pilot car directory",
            variants: ["pilot car directory", "escort vehicle directory", "pilot car listings", "find pilot car", "pilot car companies near me", "PEVO directory", "pilot escort directory", "oversize load escort directory", "wide load pilot car", "certified pilot car operators"],
            longTails: ["pilot car directory {city}", "find pilot car drivers near {city}", "certified PEVO operators in {state}", "pilot car companies hiring near {city}", "oversize load escort services {state}", "licensed pilot car operators {city}", "best pilot car companies in {state}"],
        },
        CA: {
            primary: "pilot car directory Canada",
            variants: ["pilot car directory", "escort vehicle directory Canada", "pilot vehicle listings", "find pilot car Canada", "wide load escort Canada", "pilot car companies Canada", "oversize load escort Alberta"],
            longTails: ["pilot car directory {city}", "escort vehicle services {province}", "pilot car companies in Alberta", "oversize load escort British Columbia", "pilot vehicle operators near {city}"],
        },
        AU: {
            primary: "escort vehicle directory Australia",
            variants: ["escort vehicle directory", "pilot vehicle directory Australia", "over-dimensional escort directory", "escort vehicle operators", "find escort vehicle Australia", "escort car services", "OSOM escort directory", "heavy vehicle escort Australia"],
            longTails: ["escort vehicle directory {city}", "pilot vehicle operators near {city}", "over-dimensional escort services {state}", "NHVR escort vehicle operators {city}", "heavy haulage escort services {state}"],
        },
        GB: {
            primary: "escort vehicle directory UK",
            variants: ["escort vehicle directory", "abnormal load escort directory", "wide load escort UK", "heavy haulage escort", "STGO escort services", "escort vehicle operators UK", "abnormal load companies", "pilot vehicle UK"],
            longTails: ["escort vehicle directory {city}", "abnormal load escort services {region}", "heavy haulage escort near {city}", "wide load escort companies {region}", "STGO escort operators near me"],
        },
        NZ: {
            primary: "pilot vehicle directory New Zealand",
            variants: ["pilot vehicle directory", "escort vehicle directory NZ", "over-dimension escort NZ", "pilot vehicle operators", "overweight permit escort NZ"],
            longTails: ["pilot vehicle directory {city}", "escort vehicle operators near {city}", "over-dimension escort services {region}"],
        },
        ZA: {
            primary: "escort vehicle directory South Africa",
            variants: ["escort vehicle directory", "abnormal load escort South Africa", "pilot car directory SA", "traffic escort services", "oversize escort South Africa"],
            longTails: ["escort vehicle directory {city}", "abnormal load escort services {province}", "oversize escort companies near {city}"],
        },
        DE: {
            primary: "Begleitfahrzeug Verzeichnis",
            variants: ["Begleitfahrzeug Verzeichnis", "Schwertransport Begleitung Verzeichnis", "BF3 BF4 Verzeichnis", "Schwertransport Begleitfahrzeug finden", "escort vehicle directory Germany", "Großraum Schwertransport Begleitung"],
            longTails: ["Begleitfahrzeug Verzeichnis {city}", "Schwertransport Begleitung {bundesland}", "BF3 Begleitfahrzeug finden {city}"],
        },
        NL: {
            primary: "begeleidingsvoertuig directory",
            variants: ["begeleidingsvoertuig directory", "exceptioneel transport begeleiding", "zwaar transport begeleiding", "escort vehicle directory Netherlands", "begeleiding dienst vinden"],
            longTails: ["begeleidingsvoertuig {city}", "exceptioneel transport begeleiding {province}", "zwaar transport diensten {city}"],
        },
        AE: {
            primary: "escort vehicle directory UAE",
            variants: ["escort vehicle directory UAE", "pilot car directory Dubai", "oversize load escort Dubai", "heavy equipment escort Abu Dhabi", "escort vehicle companies UAE", "مركبة مرافقة دبي"],
            longTails: ["escort vehicle directory {city}", "oversize load escort services {emirate}", "heavy haul escort companies {city}"],
        },
        BR: {
            primary: "diretório de veículos batedores",
            variants: ["diretório de veículos batedores", "diretório escolta de carga", "encontrar veículo batedor", "escort vehicle directory Brazil", "escolta transporte especial", "veículo de escolta Brasil"],
            longTails: ["veículo batedor {city}", "escolta de carga {state}", "serviço de escolta transporte especial {city}"],
        },

        // ── TIER B — BLUE ──
        IE: {
            primary: "escort vehicle directory Ireland",
            variants: ["escort vehicle directory Ireland", "abnormal load escort Ireland", "wide load escort companies", "pilot car Ireland"],
            longTails: ["escort vehicle directory {city}", "abnormal load escort companies {county}"],
        },
        SE: {
            primary: "eskortfordon katalog Sverige",
            variants: ["eskortfordon katalog", "följefordon directory", "specialtransport följefordon", "escort vehicle directory Sweden"],
            longTails: ["eskortfordon {city}", "specialtransport följefordon {region}"],
        },
        NO: {
            primary: "følgebil katalog Norge",
            variants: ["følgebil katalog", "spesialtransport følgebil", "escort vehicle directory Norway", "følgebil tjenester"],
            longTails: ["følgebil {city}", "spesialtransport følgebil {region}"],
        },
        DK: {
            primary: "følgebil katalog Danmark",
            variants: ["følgebil katalog", "specialtransport følgebil", "escort vehicle directory Denmark"],
            longTails: ["følgebil {city}", "specialtransport følgebil {region}"],
        },
        FI: {
            primary: "saattoauto hakemisto Suomi",
            variants: ["saattoauto hakemisto", "erikoiskuljetus saattoauto", "escort vehicle directory Finland"],
            longTails: ["saattoauto {city}", "erikoiskuljetus saattoauto {region}"],
        },
        BE: {
            primary: "begeleidingsvoertuig directory België",
            variants: ["begeleidingsvoertuig directory", "véhicule d'accompagnement annuaire Belgique", "escort vehicle directory Belgium", "convoi exceptionnel escorte"],
            longTails: ["begeleidingsvoertuig {city}", "véhicule d'accompagnement {city}"],
        },
        AT: {
            primary: "Begleitfahrzeug Verzeichnis Österreich",
            variants: ["Begleitfahrzeug Verzeichnis", "Sondertransport Begleitung Österreich", "escort vehicle directory Austria"],
            longTails: ["Begleitfahrzeug {city}", "Sondertransport Begleitung {bundesland}"],
        },
        CH: {
            primary: "Begleitfahrzeug Verzeichnis Schweiz",
            variants: ["Begleitfahrzeug Verzeichnis", "véhicule d'accompagnement Suisse", "escort vehicle directory Switzerland"],
            longTails: ["Begleitfahrzeug {city}", "véhicule d'accompagnement {canton}"],
        },
        ES: {
            primary: "directorio vehículos de acompañamiento España",
            variants: ["directorio vehículos de acompañamiento", "escolta transporte especial España", "directorio escolta de cargas", "escort vehicle directory Spain"],
            longTails: ["vehículo de acompañamiento {city}", "escolta transporte especial {comunidad}"],
        },
        FR: {
            primary: "annuaire véhicule d'accompagnement France",
            variants: ["annuaire véhicule d'accompagnement", "voiture pilote annuaire", "convoi exceptionnel escorte France", "escort vehicle directory France"],
            longTails: ["véhicule d'accompagnement {city}", "convoi exceptionnel escorte {region}"],
        },
        IT: {
            primary: "directory veicoli di scorta Italia",
            variants: ["directory veicoli di scorta", "scorta tecnica directory", "trasporto eccezionale scorta Italia", "escort vehicle directory Italy"],
            longTails: ["veicolo di scorta {city}", "scorta trasporto eccezionale {region}"],
        },
        PT: {
            primary: "diretório veículos de escolta Portugal",
            variants: ["diretório veículos de escolta", "escolta transporte especial Portugal", "escort vehicle directory Portugal"],
            longTails: ["veículo de escolta {city}", "escolta transporte especial {district}"],
        },
        SA: {
            primary: "escort vehicle directory Saudi Arabia",
            variants: ["escort vehicle directory KSA", "oversize escort Saudi", "مركبة مرافقة السعودية", "heavy load escort Riyadh"],
            longTails: ["escort vehicle {city}", "oversize load escort {region}"],
        },
        QA: {
            primary: "escort vehicle directory Qatar",
            variants: ["escort vehicle directory Qatar", "oversize escort Doha", "heavy haul escort Qatar"],
            longTails: ["escort vehicle {city}", "oversize load escort {municipality}"],
        },
        MX: {
            primary: "directorio vehículos escolta México",
            variants: ["directorio vehículos escolta", "escolta carga sobredimensionada México", "directorio bandereros", "escort vehicle directory Mexico"],
            longTails: ["vehículo escolta {city}", "escolta carga especial {state}"],
        },

        // ── TIER C — SILVER ──
        PL: { primary: "katalog pojazdów pilotujących Polska", variants: ["katalog pojazdów pilotujących", "pilot drogowy katalog", "escort vehicle directory Poland"], longTails: ["pojazd pilotujący {city}", "pilot drogowy {voivodeship}"] },
        CZ: { primary: "katalog doprovodných vozidel Česko", variants: ["katalog doprovodných vozidel", "escort vehicle directory Czech Republic"], longTails: ["doprovodné vozidlo {city}"] },
        SK: { primary: "katalóg sprievodných vozidiel Slovensko", variants: ["katalóg sprievodných vozidiel", "escort vehicle directory Slovakia"], longTails: ["sprievodné vozidlo {city}"] },
        HU: { primary: "kísérő járművek katalógus Magyarország", variants: ["kísérő járművek katalógus", "escort vehicle directory Hungary"], longTails: ["kísérő jármű {city}"] },
        SI: { primary: "katalog spremnih vozil Slovenija", variants: ["katalog spremnih vozil", "escort vehicle directory Slovenia"], longTails: ["spremno vozilo {city}"] },
        EE: { primary: "saatesõidukite kataloog Eesti", variants: ["saatesõidukite kataloog", "escort vehicle directory Estonia"], longTails: ["saatesõiduk {city}"] },
        LV: { primary: "pavadošo transportlīdzekļu katalogs Latvija", variants: ["pavadošo transportlīdzekļu katalogs", "escort vehicle directory Latvia"], longTails: ["pavadoņa transportlīdzeklis {city}"] },
        LT: { primary: "lydinčių automobilių katalogas Lietuva", variants: ["lydinčių automobilių katalogas", "escort vehicle directory Lithuania"], longTails: ["lydintis automobilis {city}"] },
        HR: { primary: "katalog pratećih vozila Hrvatska", variants: ["katalog pratećih vozila", "escort vehicle directory Croatia"], longTails: ["pratnja vozilo {city}"] },
        RO: { primary: "catalog vehicule de însoțire România", variants: ["catalog vehicule de însoțire", "escort vehicle directory Romania"], longTails: ["vehicul de însoțire {city}"] },
        BG: { primary: "каталог на пилотни автомобили България", variants: ["каталог на пилотни автомобили", "escort vehicle directory Bulgaria"], longTails: ["пилотен автомобил {city}"] },
        GR: { primary: "κατάλογος οχημάτων συνοδείας Ελλάδα", variants: ["κατάλογος οχημάτων συνοδείας", "escort vehicle directory Greece"], longTails: ["όχημα συνοδείας {city}"] },
        TR: { primary: "refakat aracı rehberi Türkiye", variants: ["refakat aracı rehberi", "escort vehicle directory Turkey", "özel yük taşıma refakat"], longTails: ["refakat aracı {city}", "özel yük taşıma {il}"] },
        KW: { primary: "escort vehicle directory Kuwait", variants: ["escort vehicle directory Kuwait"], longTails: ["escort vehicle {city}"] },
        OM: { primary: "escort vehicle directory Oman", variants: ["escort vehicle directory Oman"], longTails: ["escort vehicle {city}"] },
        BH: { primary: "escort vehicle directory Bahrain", variants: ["escort vehicle directory Bahrain"], longTails: ["escort vehicle {city}"] },
        SG: { primary: "escort vehicle directory Singapore", variants: ["escort vehicle directory Singapore", "heavy vehicle escort SG"], longTails: ["escort vehicle {area}"] },
        MY: { primary: "direktori kenderaan pengiring Malaysia", variants: ["direktori kenderaan pengiring", "escort vehicle directory Malaysia"], longTails: ["kenderaan pengiring {city}"] },
        JP: { primary: "先導車ディレクトリ 日本", variants: ["先導車ディレクトリ", "誘導車 一覧", "特殊車両 先導車 検索", "escort vehicle directory Japan"], longTails: ["先導車 {city}", "誘導車 {prefecture}"] },
        KR: { primary: "유도차량 디렉토리 한국", variants: ["유도차량 디렉토리", "특수차량 호송 업체", "escort vehicle directory Korea"], longTails: ["유도차량 {city}", "특수차량 호송 {province}"] },
        CL: { primary: "directorio vehículos escolta Chile", variants: ["directorio vehículos escolta Chile", "escolta carga sobredimensionada Chile"], longTails: ["vehículo escolta {city}"] },
        AR: { primary: "directorio vehículos de escolta Argentina", variants: ["directorio vehículos de escolta Argentina", "escolta carga excepcional Argentina"], longTails: ["vehículo de escolta {city}"] },
        CO: { primary: "directorio vehículos escolta Colombia", variants: ["directorio vehículos escolta Colombia", "escolta carga extradimensionada Colombia"], longTails: ["vehículo escolta {city}"] },
        PE: { primary: "directorio vehículos escolta Perú", variants: ["directorio vehículos escolta Perú", "escolta carga especial Perú"], longTails: ["vehículo escolta {city}"] },

        // ── TIER D — SLATE ──
        UY: { primary: "directorio vehículos escolta Uruguay", variants: ["directorio vehículos escolta Uruguay"], longTails: ["vehículo escolta {city}"] },
        PA: { primary: "directorio vehículos escolta Panamá", variants: ["directorio vehículos escolta Panamá"], longTails: ["vehículo escolta {city}"] },
        CR: { primary: "directorio vehículos escolta Costa Rica", variants: ["directorio vehículos escolta Costa Rica"], longTails: ["vehículo escolta {city}"] },
    },
};

// ═══════════════════════════════════════════════
// VERTICAL 2: LOAD BOARD
// ═══════════════════════════════════════════════

export const LOAD_BOARD_VERTICAL: VerticalKeywordConfig = {
    verticalId: "load_board",
    verticalName: "Oversize Load Board",
    countryTerms: {
        // ── TIER A — GOLD ──
        US: {
            primary: "oversize load board",
            variants: ["oversize load board", "heavy haul load board", "wide load board", "pilot car load board", "oversize freight board", "escort vehicle load board", "overweight load board", "superload board", "flatbed load board oversize", "specialized load board", "hot shot load board oversize"],
            longTails: ["oversize load board {state}", "heavy haul loads available {city}", "pilot car jobs board {state}", "oversize freight near {city}", "wide load shipping board {state}", "available oversize loads {city}", "find oversize loads near me"],
        },
        CA: {
            primary: "oversize load board Canada",
            variants: ["oversize load board Canada", "heavy haul load board Canada", "wide load board Canada", "over-dimensional freight board", "pilot car jobs Canada", "escort vehicle jobs Canada", "heavy haul loads Alberta"],
            longTails: ["oversize load board {province}", "heavy haul loads available {city}", "oversize freight jobs {province}"],
        },
        AU: {
            primary: "over-dimensional load board Australia",
            variants: ["over-dimensional load board", "heavy haulage load board Australia", "OSOM load board", "escort vehicle jobs Australia", "oversize freight board Australia", "heavy vehicle load board", "wide load jobs Australia"],
            longTails: ["over-dimensional load board {state}", "heavy haulage loads available {city}", "OSOM freight {state}"],
        },
        GB: {
            primary: "abnormal load board UK",
            variants: ["abnormal load board UK", "heavy haulage load board", "wide load board UK", "STGO load board", "abnormal indivisible load board", "heavy transport jobs UK", "escort vehicle jobs UK"],
            longTails: ["abnormal load board {region}", "heavy haulage loads available {city}", "STGO freight near {city}"],
        },
        NZ: {
            primary: "over-dimension load board New Zealand",
            variants: ["over-dimension load board NZ", "heavy haulage load board NZ", "overweight load board", "pilot vehicle jobs NZ"],
            longTails: ["over-dimension load board {region}", "heavy haulage loads {city}"],
        },
        ZA: {
            primary: "abnormal load board South Africa",
            variants: ["abnormal load board South Africa", "heavy haulage load board SA", "oversize freight board", "escort vehicle jobs South Africa"],
            longTails: ["abnormal load board {province}", "heavy haulage loads {city}"],
        },
        DE: {
            primary: "Schwertransport Frachtbörse",
            variants: ["Schwertransport Frachtbörse", "Schwerlast Frachtbörse", "Großraum Schwertransport Aufträge", "oversize load board Germany", "Schwertransport Aufträge finden", "BF3 BF4 Aufträge"],
            longTails: ["Schwertransport Frachtbörse {bundesland}", "Schwerlast Aufträge {city}", "Großraumtransport finden {city}"],
        },
        NL: {
            primary: "exceptioneel transport vrachtbeurs",
            variants: ["exceptioneel transport vrachtbeurs", "zwaar transport vrachtbeurs", "oversize load board Netherlands", "speciaal transport opdrachten"],
            longTails: ["exceptioneel transport {province}", "zwaar transport opdrachten {city}"],
        },
        AE: {
            primary: "oversize load board UAE",
            variants: ["oversize load board UAE", "heavy haul load board Dubai", "oversize freight Dubai", "heavy equipment shipping board UAE", "project cargo board UAE"],
            longTails: ["oversize load board {emirate}", "heavy haul loads {city}"],
        },
        BR: {
            primary: "bolsa de cargas especiais Brasil",
            variants: ["bolsa de cargas especiais", "frete carga indivisível", "bolsa de fretes pesados", "oversize load board Brazil", "carga especial encontrar frete"],
            longTails: ["bolsa de cargas especiais {state}", "frete carga indivisível {city}"],
        },

        // ── TIER B — BLUE ──
        IE: { primary: "abnormal load board Ireland", variants: ["abnormal load board Ireland", "heavy haulage load board Ireland"], longTails: ["abnormal load board {county}"] },
        SE: { primary: "specialtransport fraktbörs Sverige", variants: ["specialtransport fraktbörs", "tung transport fraktbörs", "oversize load board Sweden"], longTails: ["specialtransport {region}"] },
        NO: { primary: "spesialtransport fraktbørs Norge", variants: ["spesialtransport fraktbørs", "tungtransport fraktbørs", "oversize load board Norway"], longTails: ["spesialtransport {region}"] },
        DK: { primary: "specialtransport fragtbørs Danmark", variants: ["specialtransport fragtbørs", "oversize load board Denmark"], longTails: ["specialtransport {region}"] },
        FI: { primary: "erikoiskuljetus rahtipörssi Suomi", variants: ["erikoiskuljetus rahtipörssi", "oversize load board Finland"], longTails: ["erikoiskuljetus {region}"] },
        BE: { primary: "exceptioneel transport vrachtbeurs België", variants: ["exceptioneel transport vrachtbeurs", "bourse de fret convoi exceptionnel Belgique", "oversize load board Belgium"], longTails: ["exceptioneel transport {city}"] },
        AT: { primary: "Sondertransport Frachtbörse Österreich", variants: ["Sondertransport Frachtbörse", "Schwertransport Aufträge Österreich", "oversize load board Austria"], longTails: ["Sondertransport {bundesland}"] },
        CH: { primary: "Schwertransport Frachtbörse Schweiz", variants: ["Schwertransport Frachtbörse Schweiz", "oversize load board Switzerland"], longTails: ["Schwertransport {kanton}"] },
        ES: { primary: "bolsa de cargas transporte especial España", variants: ["bolsa de cargas transporte especial", "flete sobredimensionado España", "oversize load board Spain"], longTails: ["transporte especial {comunidad}", "carga sobredimensionada {city}"] },
        FR: { primary: "bourse de fret convoi exceptionnel France", variants: ["bourse de fret convoi exceptionnel", "fret surdimensionné France", "oversize load board France"], longTails: ["convoi exceptionnel {region}", "fret surdimensionné {city}"] },
        IT: { primary: "borsa carichi trasporto eccezionale Italia", variants: ["borsa carichi trasporto eccezionale", "frete sovradimensionato Italia", "oversize load board Italy"], longTails: ["trasporto eccezionale {region}"] },
        PT: { primary: "bolsa de cargas transporte especial Portugal", variants: ["bolsa de cargas transporte especial Portugal", "oversize load board Portugal"], longTails: ["transporte especial {district}"] },
        SA: { primary: "oversize load board Saudi Arabia", variants: ["oversize load board KSA", "heavy haul freight Saudi", "project cargo board Saudi Arabia"], longTails: ["oversize load {city}"] },
        QA: { primary: "oversize load board Qatar", variants: ["oversize load board Qatar", "heavy haul freight Doha"], longTails: ["oversize load {city}"] },
        MX: { primary: "bolsa de cargas sobredimensionadas México", variants: ["bolsa de cargas sobredimensionadas", "flete carga especial México", "oversize load board Mexico"], longTails: ["carga sobredimensionada {state}", "flete especial {city}"] },

        // ── TIER C — SILVER ──
        PL: { primary: "giełda transportów nienormatywnych Polska", variants: ["giełda transportów nienormatywnych", "oversize load board Poland"], longTails: ["transport nienormatywny {city}"] },
        CZ: { primary: "burza nadměrných nákladů Česko", variants: ["burza nadměrných nákladů", "oversize load board Czech Republic"], longTails: ["nadměrný náklad {city}"] },
        SK: { primary: "burza nadrozmerných prepráv Slovensko", variants: ["burza nadrozmerných prepráv", "oversize load board Slovakia"], longTails: ["nadrozmerná preprava {city}"] },
        HU: { primary: "túlméretes fuvarböze Magyarország", variants: ["túlméretes fuvarböze", "oversize load board Hungary"], longTails: ["túlméretes szállítmány {city}"] },
        SI: { primary: "borza izrednih prevozov Slovenija", variants: ["borza izrednih prevozov", "oversize load board Slovenia"], longTails: ["izredni prevoz {city}"] },
        EE: { primary: "eriveo kaubaveod Eesti", variants: ["eriveo kaubaveod", "oversize load board Estonia"], longTails: ["erivedu {city}"] },
        LV: { primary: "lielgabarīta kravu birža Latvija", variants: ["lielgabarīta kravu birža", "oversize load board Latvia"], longTails: ["lielgabarīta krava {city}"] },
        LT: { primary: "negabaritinių krovinių birža Lietuva", variants: ["negabaritinių krovinių birža", "oversize load board Lithuania"], longTails: ["negabaritinis krovinys {city}"] },
        HR: { primary: "burza izvanrednih prijevoza Hrvatska", variants: ["burza izvanrednih prijevoza", "oversize load board Croatia"], longTails: ["izvanredni prijevoz {city}"] },
        RO: { primary: "bursa transporturi agabaritice România", variants: ["bursa transporturi agabaritice", "oversize load board Romania"], longTails: ["transport agabaritic {city}"] },
        BG: { primary: "борса за извънгабаритни товари България", variants: ["борса за извънгабаритни товари", "oversize load board Bulgaria"], longTails: ["извънгабаритен товар {city}"] },
        GR: { primary: "χρηματιστήριο υπερμεγέθων φορτίων Ελλάδα", variants: ["χρηματιστήριο υπερμεγέθων φορτίων", "oversize load board Greece"], longTails: ["υπερμεγέθης φορτίο {city}"] },
        TR: { primary: "gabari dışı yük borsası Türkiye", variants: ["gabari dışı yük borsası", "oversize load board Turkey", "özel yük taşıma borsası"], longTails: ["gabari dışı yük {city}", "özel yük {il}"] },
        KW: { primary: "oversize load board Kuwait", variants: ["oversize load board Kuwait"], longTails: ["oversize load {city}"] },
        OM: { primary: "oversize load board Oman", variants: ["oversize load board Oman"], longTails: ["oversize load {city}"] },
        BH: { primary: "oversize load board Bahrain", variants: ["oversize load board Bahrain"], longTails: ["oversize load {city}"] },
        SG: { primary: "oversize load board Singapore", variants: ["oversize load board Singapore", "heavy vehicle freight SG"], longTails: ["oversize load {area}"] },
        MY: { primary: "papan muatan berat Malaysia", variants: ["papan muatan berat", "oversize load board Malaysia"], longTails: ["muatan berat {city}"] },
        JP: { primary: "特殊車両 荷物ボード 日本", variants: ["特殊車両 荷物ボード", "大型貨物 マッチング", "oversize load board Japan", "特殊車両運送 案件"], longTails: ["特殊車両 荷物 {city}", "大型貨物 {prefecture}"] },
        KR: { primary: "특수차량 화물 게시판 한국", variants: ["특수차량 화물 게시판", "과적차량 운송 게시판", "oversize load board Korea"], longTails: ["특수차량 화물 {city}", "과적차량 {province}"] },
        CL: { primary: "bolsa de cargas sobredimensionadas Chile", variants: ["bolsa de cargas sobredimensionadas Chile"], longTails: ["carga sobredimensionada {city}"] },
        AR: { primary: "bolsa de cargas excepcionales Argentina", variants: ["bolsa de cargas excepcionales Argentina"], longTails: ["carga excepcional {city}"] },
        CO: { primary: "bolsa de cargas extradimensionadas Colombia", variants: ["bolsa de cargas extradimensionadas Colombia"], longTails: ["carga extradimensionada {city}"] },
        PE: { primary: "bolsa de cargas especiales Perú", variants: ["bolsa de cargas especiales Perú"], longTails: ["carga especial {city}"] },
        UY: { primary: "bolsa de cargas especiales Uruguay", variants: ["bolsa de cargas especiales Uruguay"], longTails: ["carga especial {city}"] },
        PA: { primary: "bolsa de cargas sobredimensionadas Panamá", variants: ["bolsa de cargas sobredimensionadas Panamá"], longTails: ["carga sobredimensionada {city}"] },
        CR: { primary: "bolsa de cargas especiales Costa Rica", variants: ["bolsa de cargas especiales Costa Rica"], longTails: ["carga especial {city}"] },
    },
};

// ═══════════════════════════════════════════════
// VERTICAL 3: MOBILE APP
// ═══════════════════════════════════════════════

export const MOBILE_APP_VERTICAL: VerticalKeywordConfig = {
    verticalId: "mobile_app",
    verticalName: "Pilot Car Mobile App",
    countryTerms: {
        // ── TIER A — GOLD ──
        US: {
            primary: "pilot car app",
            variants: ["pilot car app", "escort vehicle app", "pilot car mobile app", "PEVO app", "pilot car driver app", "oversize load escort app", "wide load escort app", "pilot car GPS app", "pilot car route planning app", "pilot car job finding app", "pilot car tracking app", "oversize load tracking app", "escort vehicle dispatch app"],
            longTails: ["best pilot car app {year}", "pilot car app for iPhone", "pilot car app Android", "free pilot car app", "pilot car route survey app", "oversize load permit app", "pilot car job app {state}", "escort vehicle dispatch app", "pilot car company management app"],
        },
        CA: {
            primary: "pilot car app Canada",
            variants: ["pilot car app Canada", "escort vehicle app Canada", "wide load escort app", "pilot car GPS Canada", "oversize escort tracking app"],
            longTails: ["best pilot car app Canada", "pilot car route app {province}", "escort vehicle management app Canada"],
        },
        AU: {
            primary: "escort vehicle app Australia",
            variants: ["escort vehicle app Australia", "pilot vehicle app", "OSOM escort app", "heavy haulage app Australia", "over-dimensional transport app", "escort vehicle tracking app", "NHVR app"],
            longTails: ["best escort vehicle app Australia", "escort vehicle route app {state}", "heavy haulage management app Australia"],
        },
        GB: {
            primary: "escort vehicle app UK",
            variants: ["escort vehicle app UK", "abnormal load app", "heavy haulage app UK", "STGO app", "wide load escort app UK", "abnormal load notification app"],
            longTails: ["best escort vehicle app UK", "abnormal load route app", "heavy haulage tracking app UK"],
        },
        NZ: {
            primary: "pilot vehicle app New Zealand",
            variants: ["pilot vehicle app NZ", "escort vehicle app NZ", "over-dimension transport app"],
            longTails: ["best pilot vehicle app NZ", "escort vehicle route app NZ"],
        },
        ZA: {
            primary: "escort vehicle app South Africa",
            variants: ["escort vehicle app South Africa", "abnormal load app SA", "traffic escort app"],
            longTails: ["best escort vehicle app South Africa", "abnormal load tracking app SA"],
        },
        DE: {
            primary: "Begleitfahrzeug App",
            variants: ["Begleitfahrzeug App", "Schwertransport App", "BF3 BF4 App", "Großraumtransport App", "escort vehicle app Germany", "Schwertransport Route App", "Schwerlast App"],
            longTails: ["beste Begleitfahrzeug App", "Schwertransport Routenplanung App", "BF3 App Android"],
        },
        NL: {
            primary: "begeleidingsvoertuig app",
            variants: ["begeleidingsvoertuig app", "exceptioneel transport app", "zwaar transport app", "escort vehicle app Netherlands"],
            longTails: ["beste begeleidingsvoertuig app", "exceptioneel transport route app"],
        },
        AE: {
            primary: "escort vehicle app UAE",
            variants: ["escort vehicle app UAE", "pilot car app Dubai", "oversize load app Dubai", "heavy equipment escort app"],
            longTails: ["best escort vehicle app UAE", "oversize load tracking app Dubai"],
        },
        BR: {
            primary: "aplicativo veículo batedor Brasil",
            variants: ["aplicativo veículo batedor", "app escolta de carga", "aplicativo transporte especial", "escort vehicle app Brazil"],
            longTails: ["melhor app veículo batedor", "app escolta de carga Brasil", "aplicativo rastreamento escolta"],
        },

        // ── TIER B — BLUE ──
        IE: { primary: "escort vehicle app Ireland", variants: ["escort vehicle app Ireland", "abnormal load app Ireland"], longTails: ["best escort vehicle app Ireland"] },
        SE: { primary: "eskortfordon app Sverige", variants: ["eskortfordon app", "specialtransport app Sverige", "escort vehicle app Sweden"], longTails: ["bästa eskortfordon app"] },
        NO: { primary: "følgebil app Norge", variants: ["følgebil app", "spesialtransport app Norge", "escort vehicle app Norway"], longTails: ["beste følgebil app"] },
        DK: { primary: "følgebil app Danmark", variants: ["følgebil app", "specialtransport app Danmark", "escort vehicle app Denmark"], longTails: ["bedste følgebil app"] },
        FI: { primary: "saattoauto sovellus Suomi", variants: ["saattoauto sovellus", "erikoiskuljetus sovellus", "escort vehicle app Finland"], longTails: ["paras saattoauto sovellus"] },
        BE: { primary: "begeleidingsvoertuig app België", variants: ["begeleidingsvoertuig app", "application véhicule d'accompagnement Belgique", "escort vehicle app Belgium"], longTails: ["beste begeleidingsvoertuig app"] },
        AT: { primary: "Begleitfahrzeug App Österreich", variants: ["Begleitfahrzeug App Österreich", "Sondertransport App", "escort vehicle app Austria"], longTails: ["beste Begleitfahrzeug App"] },
        CH: { primary: "Begleitfahrzeug App Schweiz", variants: ["Begleitfahrzeug App Schweiz", "escort vehicle app Switzerland"], longTails: ["beste Begleitfahrzeug App"] },
        ES: { primary: "aplicación vehículo de acompañamiento España", variants: ["aplicación vehículo de acompañamiento", "app escolta transporte especial España", "escort vehicle app Spain"], longTails: ["mejor app escolta transporte especial"] },
        FR: { primary: "application véhicule d'accompagnement France", variants: ["application véhicule d'accompagnement", "app voiture pilote France", "app convoi exceptionnel", "escort vehicle app France"], longTails: ["meilleure app véhicule d'accompagnement"] },
        IT: { primary: "app veicolo di scorta Italia", variants: ["app veicolo di scorta", "applicazione scorta tecnica", "app trasporto eccezionale", "escort vehicle app Italy"], longTails: ["migliore app veicolo di scorta"] },
        PT: { primary: "aplicação veículo de escolta Portugal", variants: ["aplicação veículo de escolta", "app transporte especial Portugal", "escort vehicle app Portugal"], longTails: ["melhor app veículo de escolta"] },
        SA: { primary: "escort vehicle app Saudi Arabia", variants: ["escort vehicle app KSA", "oversize load app Saudi", "تطبيق مركبة مرافقة"], longTails: ["best escort vehicle app Saudi"] },
        QA: { primary: "escort vehicle app Qatar", variants: ["escort vehicle app Qatar", "oversize load app Doha"], longTails: ["best escort vehicle app Qatar"] },
        MX: { primary: "aplicación vehículo escolta México", variants: ["aplicación vehículo escolta", "app escolta carga sobredimensionada", "app banderero México", "escort vehicle app Mexico"], longTails: ["mejor app escolta México"] },

        // ── TIER C — SILVER ──
        PL: { primary: "aplikacja pojazd pilotujący Polska", variants: ["aplikacja pojazd pilotujący", "escort vehicle app Poland"], longTails: ["najlepsza aplikacja pilot drogowy"] },
        CZ: { primary: "aplikace doprovodné vozidlo Česko", variants: ["aplikace doprovodné vozidlo", "escort vehicle app Czech Republic"], longTails: ["nejlepší aplikace doprovodné vozidlo"] },
        SK: { primary: "aplikácia sprievodné vozidlo Slovensko", variants: ["aplikácia sprievodné vozidlo", "escort vehicle app Slovakia"], longTails: ["najlepšia aplikácia sprievodné vozidlo"] },
        HU: { primary: "kísérő jármű alkalmazás Magyarország", variants: ["kísérő jármű alkalmazás", "escort vehicle app Hungary"], longTails: ["legjobb kísérő jármű alkalmazás"] },
        SI: { primary: "aplikacija spremno vozilo Slovenija", variants: ["aplikacija spremno vozilo", "escort vehicle app Slovenia"], longTails: ["najboljša aplikacija spremno vozilo"] },
        EE: { primary: "saatesõiduki rakendus Eesti", variants: ["saatesõiduki rakendus", "escort vehicle app Estonia"], longTails: ["parim saatesõiduki rakendus"] },
        LV: { primary: "pavadoņa transportlīdzekļa lietotne Latvija", variants: ["pavadoņa transportlīdzekļa lietotne", "escort vehicle app Latvia"], longTails: ["labākā pavadoņa lietotne"] },
        LT: { primary: "lydinčio automobilio programėlė Lietuva", variants: ["lydinčio automobilio programėlė", "escort vehicle app Lithuania"], longTails: ["geriausia lydinčio automobilio programėlė"] },
        HR: { primary: "aplikacija pratnja vozilo Hrvatska", variants: ["aplikacija pratnja vozilo", "escort vehicle app Croatia"], longTails: ["najbolja aplikacija pratnja vozilo"] },
        RO: { primary: "aplicație vehicul de însoțire România", variants: ["aplicație vehicul de însoțire", "escort vehicle app Romania"], longTails: ["cea mai bună aplicație vehicul de însoțire"] },
        BG: { primary: "приложение пилотен автомобил България", variants: ["приложение пилотен автомобил", "escort vehicle app Bulgaria"], longTails: ["най-добро приложение пилотен автомобил"] },
        GR: { primary: "εφαρμογή όχημα συνοδείας Ελλάδα", variants: ["εφαρμογή όχημα συνοδείας", "escort vehicle app Greece"], longTails: ["καλύτερη εφαρμογή όχημα συνοδείας"] },
        TR: { primary: "refakat aracı uygulaması Türkiye", variants: ["refakat aracı uygulaması", "escort vehicle app Turkey", "gabari dışı yük uygulaması"], longTails: ["en iyi refakat aracı uygulaması"] },
        KW: { primary: "escort vehicle app Kuwait", variants: ["escort vehicle app Kuwait"], longTails: ["best escort vehicle app Kuwait"] },
        OM: { primary: "escort vehicle app Oman", variants: ["escort vehicle app Oman"], longTails: ["best escort vehicle app Oman"] },
        BH: { primary: "escort vehicle app Bahrain", variants: ["escort vehicle app Bahrain"], longTails: ["best escort vehicle app Bahrain"] },
        SG: { primary: "escort vehicle app Singapore", variants: ["escort vehicle app Singapore", "heavy vehicle app SG"], longTails: ["best escort vehicle app Singapore"] },
        MY: { primary: "aplikasi kenderaan pengiring Malaysia", variants: ["aplikasi kenderaan pengiring", "escort vehicle app Malaysia"], longTails: ["aplikasi terbaik kenderaan pengiring"] },
        JP: { primary: "先導車アプリ 日本", variants: ["先導車アプリ", "誘導車アプリ", "特殊車両 先導 アプリ", "escort vehicle app Japan"], longTails: ["おすすめ 先導車アプリ", "特殊車両 アプリ おすすめ"] },
        KR: { primary: "유도차량 앱 한국", variants: ["유도차량 앱", "특수차량 호송 앱", "escort vehicle app Korea"], longTails: ["최고의 유도차량 앱", "특수차량 앱 추천"] },
        CL: { primary: "aplicación vehículo escolta Chile", variants: ["aplicación vehículo escolta Chile"], longTails: ["mejor app escolta Chile"] },
        AR: { primary: "aplicación vehículo de escolta Argentina", variants: ["aplicación vehículo de escolta Argentina"], longTails: ["mejor app escolta Argentina"] },
        CO: { primary: "aplicación vehículo escolta Colombia", variants: ["aplicación vehículo escolta Colombia"], longTails: ["mejor app escolta Colombia"] },
        PE: { primary: "aplicación vehículo escolta Perú", variants: ["aplicación vehículo escolta Perú"], longTails: ["mejor app escolta Perú"] },
        UY: { primary: "aplicación vehículo escolta Uruguay", variants: ["aplicación vehículo escolta Uruguay"], longTails: ["mejor app escolta Uruguay"] },
        PA: { primary: "aplicación vehículo escolta Panamá", variants: ["aplicación vehículo escolta Panamá"], longTails: ["mejor app escolta Panamá"] },
        CR: { primary: "aplicación vehículo escolta Costa Rica", variants: ["aplicación vehículo escolta Costa Rica"], longTails: ["mejor app escolta Costa Rica"] },
    },
};

// ═══════════════════════════════════════════════
// CROSS-VERTICAL KEYWORD GENERATION
// ═══════════════════════════════════════════════

export const ALL_VERTICALS = [DIRECTORY_VERTICAL, LOAD_BOARD_VERTICAL, MOBILE_APP_VERTICAL] as const;

export interface CrossVerticalKeyword {
    vertical: "directory" | "load_board" | "mobile_app";
    keyword: string;
    iso2: string;
    country: string;
    location?: string;
    locationLevel: "country" | "region" | "city";
    language: string;
    searchVolumeTier: "high" | "medium" | "low";
}

/** Generate ALL keywords across all verticals for a country */
export function generate10xKeywords(iso2: string): CrossVerticalKeyword[] {
    const countrySeed = COUNTRY_KEYWORD_SEEDS.find(s => s.iso2 === iso2);
    if (!countrySeed) return [];

    const keywords: CrossVerticalKeyword[] = [];

    for (const vertical of ALL_VERTICALS) {
        const terms = vertical.countryTerms[iso2];
        if (!terms) continue;

        // Country-level keywords (primary + all variants)
        keywords.push({
            vertical: vertical.verticalId,
            keyword: terms.primary,
            iso2,
            country: countrySeed.country,
            locationLevel: "country",
            language: terms.primary === terms.variants[0] ? "native" : "mixed",
            searchVolumeTier: "high",
        });

        for (const variant of terms.variants) {
            if (variant !== terms.primary) {
                keywords.push({
                    vertical: vertical.verticalId,
                    keyword: variant,
                    iso2,
                    country: countrySeed.country,
                    locationLevel: "country",
                    language: /[a-zA-Z]/.test(variant) ? "english" : "native",
                    searchVolumeTier: "medium",
                });
            }
        }

        // Region-level long-tails
        for (const region of countrySeed.regions) {
            for (const template of terms.longTails) {
                const keyword = template
                    .replace("{city}", region)
                    .replace("{state}", region)
                    .replace("{province}", region)
                    .replace("{region}", region)
                    .replace("{bundesland}", region)
                    .replace("{comunidad}", region)
                    .replace("{county}", region)
                    .replace("{canton}", region)
                    .replace("{voivodeship}", region)
                    .replace("{emirate}", region)
                    .replace("{prefecture}", region)
                    .replace("{district}", region)
                    .replace("{municipality}", region)
                    .replace("{area}", region)
                    .replace("{il}", region)
                    .replace("{year}", new Date().getFullYear().toString());

                keywords.push({
                    vertical: vertical.verticalId,
                    keyword,
                    iso2,
                    country: countrySeed.country,
                    location: region,
                    locationLevel: "region",
                    language: "mixed",
                    searchVolumeTier: "medium",
                });
            }
        }

        // City-level long-tails (top 5 cities only for volume)
        for (const city of countrySeed.topCities.slice(0, 8)) {
            for (const template of terms.longTails) {
                const keyword = template
                    .replace("{city}", city)
                    .replace("{state}", city)
                    .replace("{province}", city)
                    .replace("{region}", city)
                    .replace("{bundesland}", city)
                    .replace("{comunidad}", city)
                    .replace("{county}", city)
                    .replace("{canton}", city)
                    .replace("{voivodeship}", city)
                    .replace("{emirate}", city)
                    .replace("{prefecture}", city)
                    .replace("{district}", city)
                    .replace("{municipality}", city)
                    .replace("{area}", city)
                    .replace("{il}", city)
                    .replace("{year}", new Date().getFullYear().toString());

                keywords.push({
                    vertical: vertical.verticalId,
                    keyword,
                    iso2,
                    country: countrySeed.country,
                    location: city,
                    locationLevel: "city",
                    language: "mixed",
                    searchVolumeTier: countrySeed.topCities.indexOf(city) < 3 ? "medium" : "low",
                });
            }
        }
    }

    return keywords;
}

/** Get total 10x keyword count across all countries and verticals */
export function getTotal10xKeywordCount(): { total: number; byVertical: Record<string, number>; byTier: Record<string, number> } {
    const byVertical: Record<string, number> = {};
    const byTier: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };

    const tierMap: Record<string, string> = {};
    const tierACountries = ["US", "CA", "AU", "GB", "NZ", "ZA", "DE", "NL", "AE", "BR"];
    const tierBCountries = ["IE", "SE", "NO", "DK", "FI", "BE", "AT", "CH", "ES", "FR", "IT", "PT", "SA", "QA", "MX"];
    const tierCCountries = ["PL", "CZ", "SK", "HU", "SI", "EE", "LV", "LT", "HR", "RO", "BG", "GR", "TR", "KW", "OM", "BH", "SG", "MY", "JP", "KR", "CL", "AR", "CO", "PE"];
    const tierDCountries = ["UY", "PA", "CR"];

    for (const c of tierACountries) tierMap[c] = "A";
    for (const c of tierBCountries) tierMap[c] = "B";
    for (const c of tierCCountries) tierMap[c] = "C";
    for (const c of tierDCountries) tierMap[c] = "D";

    let total = 0;
    for (const seed of COUNTRY_KEYWORD_SEEDS) {
        const kws = generate10xKeywords(seed.iso2);
        total += kws.length;

        for (const kw of kws) {
            byVertical[kw.vertical] = (byVertical[kw.vertical] || 0) + 1;
        }

        byTier[tierMap[seed.iso2] || "D"] += kws.length;
    }

    return { total, byVertical, byTier };
}
