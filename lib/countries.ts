/**
 * Haul Command — 120 Country Tier System
 *
 * Tier A (Gold):   Full platform — load board + escrow + leaderboard + social + ads
 * Tier B (Blue):   Directory + load board + compliance DB + tools
 * Tier C (Silver): Directory + compliance DB + basic tools
 * Tier D (Slate):  Directory + coming soon features
 * Tier E (Copper): Compliance DB + waitlist + SEO landing pages
 */

export type CountryTier = 'A' | 'B' | 'C' | 'D' | 'E';

export interface CountryConfig {
    code: string;          // ISO 3166-1 alpha-2
    name: string;
    nameLocal: string;     // Native language name
    tier: CountryTier;
    flag: string;
    tierLabel: string;
    tierColor: string;
    currency: string;      // ISO 4217
    currencySymbol: string;
    units: 'imperial' | 'metric';
    direction: 'ltr' | 'rtl';
    escortTerm: string;    // What they call a pilot car
    localPayment?: string; // Most popular local payment provider
    stripe: boolean;       // Stripe available
    cryptoOk: boolean;     // BTC/ADA legal
    privacyLaw?: string;   // Primary privacy regulation
    rateFormat: 'hourly' | 'daily' | 'per_km' | 'project';
}

export const COUNTRY_TIERS: Record<CountryTier, { label: string; color: string; bgColor: string; count: number }> = {
    A: { label: 'Gold',   color: '#c6923a', bgColor: 'rgba(198,146,58,0.15)',  count: 10 },
    B: { label: 'Blue',   color: '#3b82f6', bgColor: 'rgba(59,130,246,0.15)',  count: 18 },
    C: { label: 'Silver', color: '#94a3b8', bgColor: 'rgba(148,163,184,0.15)', count: 26 },
    D: { label: 'Slate',  color: '#64748b', bgColor: 'rgba(100,116,139,0.15)', count: 25 },
    E: { label: 'Copper', color: '#78350f', bgColor: 'rgba(120,53,15,0.15)',   count: 41 },
};

// Helper to build config with defaults
function c(
    code: string, name: string, nameLocal: string, tier: CountryTier,
    flag: string, currency: string, currencySymbol: string,
    opts: Partial<Pick<CountryConfig, 'units'|'direction'|'escortTerm'|'localPayment'|'stripe'|'cryptoOk'|'privacyLaw'|'rateFormat'>> = {}
): CountryConfig {
    const tierMeta = COUNTRY_TIERS[tier];
    return {
        code, name, nameLocal, tier, flag,
        tierLabel: tierMeta.label, tierColor: tierMeta.color,
        currency, currencySymbol,
        units: opts.units ?? 'metric',
        direction: opts.direction ?? 'ltr',
        escortTerm: opts.escortTerm ?? 'Escort Vehicle',
        localPayment: opts.localPayment,
        stripe: opts.stripe ?? false,
        cryptoOk: opts.cryptoOk ?? true,
        privacyLaw: opts.privacyLaw,
        rateFormat: opts.rateFormat ?? 'daily',
    };
}

export const COUNTRIES: CountryConfig[] = [
    // ══ Tier A — Gold (10) ══════════════════════════════════════════
    c('US','United States','United States','A','🇺🇸','USD','$',{units:'imperial',escortTerm:'Pilot Car',localPayment:'Zelle',stripe:true,privacyLaw:'FTC/State',rateFormat:'hourly'}),
    c('CA','Canada','Canada','A','🇨🇦','CAD','$',{escortTerm:'Pilot Vehicle',localPayment:'Interac',stripe:true,privacyLaw:'PIPEDA',rateFormat:'hourly'}),
    c('AU','Australia','Australia','A','🇦🇺','AUD','$',{escortTerm:'Pilot Vehicle',localPayment:'BPAY',stripe:true,privacyLaw:'Privacy Act',rateFormat:'daily'}),
    c('GB','United Kingdom','United Kingdom','A','🇬🇧','GBP','£',{units:'imperial',escortTerm:'Abnormal Load Escort',localPayment:'Faster Payments',stripe:true,privacyLaw:'UK GDPR',rateFormat:'daily'}),
    c('NZ','New Zealand','Aotearoa','A','🇳🇿','NZD','$',{escortTerm:'Pilot Vehicle',stripe:true,privacyLaw:'Privacy Act',rateFormat:'daily'}),
    c('ZA','South Africa','Suid-Afrika','A','🇿🇦','ZAR','R',{escortTerm:'Pilot Vehicle',localPayment:'EFT',stripe:true,privacyLaw:'POPIA',rateFormat:'daily'}),
    c('DE','Germany','Deutschland','A','🇩🇪','EUR','€',{escortTerm:'Begleitfahrzeug (BF3)',localPayment:'SEPA/Giropay',stripe:true,privacyLaw:'GDPR/BDSG',rateFormat:'per_km'}),
    c('NL','Netherlands','Nederland','A','🇳🇱','EUR','€',{escortTerm:'Begeleidingsvoertuig',localPayment:'iDEAL',stripe:true,privacyLaw:'GDPR/AVG',rateFormat:'per_km'}),
    c('AE','UAE','الإمارات','A','🇦🇪','AED','د.إ',{direction:'rtl',escortTerm:'مركبة مرافقة',localPayment:'Apple Pay',stripe:true,privacyLaw:'PDPL',rateFormat:'project'}),
    c('BR','Brazil','Brasil','A','🇧🇷','BRL','R$',{escortTerm:'Veículo Batedor',localPayment:'PIX',stripe:true,privacyLaw:'LGPD',rateFormat:'daily'}),

    // ══ Tier B — Blue (18) ══════════════════════════════════════════
    c('IE','Ireland','Éire','B','🇮🇪','EUR','€',{escortTerm:'Escort Vehicle',stripe:true,privacyLaw:'GDPR'}),
    c('SE','Sweden','Sverige','B','🇸🇪','SEK','kr',{escortTerm:'Eskortfordon',localPayment:'Swish',stripe:true,privacyLaw:'GDPR'}),
    c('NO','Norway','Norge','B','🇳🇴','NOK','kr',{escortTerm:'Følgebil',localPayment:'Vipps',stripe:true,privacyLaw:'GDPR'}),
    c('DK','Denmark','Danmark','B','🇩🇰','DKK','kr',{escortTerm:'Ledsagebil',localPayment:'MobilePay',stripe:true,privacyLaw:'GDPR'}),
    c('FI','Finland','Suomi','B','🇫🇮','EUR','€',{escortTerm:'Saattueauto',stripe:true,privacyLaw:'GDPR'}),
    c('BE','Belgium','België','B','🇧🇪','EUR','€',{escortTerm:'Begeleidingsvoertuig',localPayment:'Bancontact',stripe:true,privacyLaw:'GDPR'}),
    c('AT','Austria','Österreich','B','🇦🇹','EUR','€',{escortTerm:'Begleitfahrzeug',localPayment:'EPS',stripe:true,privacyLaw:'GDPR/DSG'}),
    c('CH','Switzerland','Schweiz','B','🇨🇭','CHF','CHF',{escortTerm:'Begleitfahrzeug',stripe:true,privacyLaw:'nDSG'}),
    c('ES','Spain','España','B','🇪🇸','EUR','€',{escortTerm:'Vehículo de Acompañamiento',localPayment:'Bizum',stripe:true,privacyLaw:'GDPR'}),
    c('FR','France','France','B','🇫🇷','EUR','€',{escortTerm:'Véhicule d\'accompagnement',stripe:true,privacyLaw:'GDPR/CNIL'}),
    c('IT','Italy','Italia','B','🇮🇹','EUR','€',{escortTerm:'Veicolo di Scorta',stripe:true,privacyLaw:'GDPR'}),
    c('PT','Portugal','Portugal','B','🇵🇹','EUR','€',{escortTerm:'Veículo de Escolta',localPayment:'MB WAY',stripe:true,privacyLaw:'GDPR'}),
    c('SA','Saudi Arabia','السعودية','B','🇸🇦','SAR','﷼',{direction:'rtl',escortTerm:'مركبة مرافقة',localPayment:'mada',stripe:true,cryptoOk:false,privacyLaw:'PDPL',rateFormat:'project'}),
    c('QA','Qatar','قطر','B','🇶🇦','QAR','﷼',{direction:'rtl',escortTerm:'مركبة مرافقة',rateFormat:'project',privacyLaw:'PDPPL'}),
    c('MX','Mexico','México','B','🇲🇽','MXN','$',{escortTerm:'Vehículo de Escolta',localPayment:'SPEI/OXXO',stripe:true,privacyLaw:'LFPDPPP'}),
    c('IN','India','भारत','B','🇮🇳','INR','₹',{escortTerm:'Pilot Vehicle',localPayment:'UPI',stripe:true,privacyLaw:'DPDP Act',rateFormat:'daily'}),
    c('ID','Indonesia','Indonesia','B','🇮🇩','IDR','Rp',{escortTerm:'Kendaraan Pengawal',localPayment:'GoPay/OVO',privacyLaw:'PDP Law'}),
    c('TH','Thailand','ประเทศไทย','B','🇹🇭','THB','฿',{escortTerm:'รถนำขบวน',localPayment:'PromptPay',stripe:true,privacyLaw:'PDPA'}),

    // ══ Tier C — Silver (26) ════════════════════════════════════════
    c('PL','Poland','Polska','C','🇵🇱','PLN','zł',{escortTerm:'Pojazd Pilotujący',localPayment:'BLIK',stripe:true,privacyLaw:'GDPR'}),
    c('CZ','Czech Republic','Česko','C','🇨🇿','CZK','Kč',{escortTerm:'Doprovodné Vozidlo',stripe:true,privacyLaw:'GDPR'}),
    c('SK','Slovakia','Slovensko','C','🇸🇰','EUR','€',{escortTerm:'Sprievodné Vozidlo',stripe:true,privacyLaw:'GDPR'}),
    c('HU','Hungary','Magyarország','C','🇭🇺','HUF','Ft',{escortTerm:'Kísérő Jármű',stripe:true,privacyLaw:'GDPR'}),
    c('SI','Slovenia','Slovenija','C','🇸🇮','EUR','€',{escortTerm:'Spremno Vozilo',stripe:true,privacyLaw:'GDPR'}),
    c('EE','Estonia','Eesti','C','🇪🇪','EUR','€',{escortTerm:'Saatesõiduk',stripe:true,privacyLaw:'GDPR'}),
    c('LV','Latvia','Latvija','C','🇱🇻','EUR','€',{escortTerm:'Pavadošais Transports',stripe:true,privacyLaw:'GDPR'}),
    c('LT','Lithuania','Lietuva','C','🇱🇹','EUR','€',{escortTerm:'Lydintis Transportas',stripe:true,privacyLaw:'GDPR'}),
    c('HR','Croatia','Hrvatska','C','🇭🇷','EUR','€',{escortTerm:'Pratnja Prijevoza',stripe:true,privacyLaw:'GDPR'}),
    c('RO','Romania','România','C','🇷🇴','RON','lei',{escortTerm:'Vehicul de Escortă',stripe:true,privacyLaw:'GDPR'}),
    c('BG','Bulgaria','България','C','🇧🇬','BGN','лв',{escortTerm:'Ескортно Превозно Средство',stripe:true,privacyLaw:'GDPR'}),
    c('GR','Greece','Ελλάδα','C','🇬🇷','EUR','€',{escortTerm:'Συνοδευτικό Όχημα',stripe:true,privacyLaw:'GDPR'}),
    c('TR','Turkey','Türkiye','C','🇹🇷','TRY','₺',{escortTerm:'Refakat Aracı',localPayment:'Papara',stripe:true,cryptoOk:false,privacyLaw:'KVKK'}),
    c('KW','Kuwait','الكويت','C','🇰🇼','KWD','د.ك',{direction:'rtl',escortTerm:'مركبة مرافقة',localPayment:'KNET'}),
    c('OM','Oman','عُمان','C','🇴🇲','OMR','ر.ع.',{direction:'rtl',escortTerm:'مركبة مرافقة'}),
    c('BH','Bahrain','البحرين','C','🇧🇭','BHD','.د.ب',{direction:'rtl',escortTerm:'مركبة مرافقة',localPayment:'BenefitPay'}),
    c('SG','Singapore','Singapore','C','🇸🇬','SGD','$',{escortTerm:'Escort Vehicle',localPayment:'PayNow',stripe:true,privacyLaw:'PDPA'}),
    c('MY','Malaysia','Malaysia','C','🇲🇾','MYR','RM',{escortTerm:'Kenderaan Pengiring',localPayment:'DuitNow',stripe:true,privacyLaw:'PDPA'}),
    c('JP','Japan','日本','C','🇯🇵','JPY','¥',{escortTerm:'先導車',localPayment:'PayPay',stripe:true,privacyLaw:'APPI',rateFormat:'daily'}),
    c('KR','South Korea','대한민국','C','🇰🇷','KRW','₩',{escortTerm:'선도차량',localPayment:'KakaoPay',cryptoOk:false,privacyLaw:'PIPA'}),
    c('CL','Chile','Chile','C','🇨🇱','CLP','$',{escortTerm:'Vehículo de Escolta',stripe:true}),
    c('AR','Argentina','Argentina','C','🇦🇷','ARS','$',{escortTerm:'Vehículo de Escolta',localPayment:'Mercado Pago'}),
    c('CO','Colombia','Colombia','C','🇨🇴','COP','$',{escortTerm:'Vehículo de Escolta',localPayment:'PSE/Nequi'}),
    c('PE','Peru','Perú','C','🇵🇪','PEN','S/',{escortTerm:'Vehículo de Escolta',localPayment:'Yape'}),
    c('VN','Vietnam','Việt Nam','C','🇻🇳','VND','₫',{escortTerm:'Xe Dẫn Đường',localPayment:'MoMo',cryptoOk:false}),
    c('PH','Philippines','Pilipinas','C','🇵🇭','PHP','₱',{escortTerm:'Escort Vehicle',localPayment:'GCash'}),

    // ══ Tier D — Slate (25) ═════════════════════════════════════════
    c('UY','Uruguay','Uruguay','D','🇺🇾','UYU','$U',{escortTerm:'Vehículo de Escolta'}),
    c('PA','Panama','Panamá','D','🇵🇦','PAB','B/',{escortTerm:'Vehículo de Escolta'}),
    c('CR','Costa Rica','Costa Rica','D','🇨🇷','CRC','₡',{escortTerm:'Vehículo de Escolta'}),
    c('IL','Israel','ישראל','D','🇮🇱','ILS','₪',{escortTerm:'רכב ליווי',stripe:true}),
    c('NG','Nigeria','Nigeria','D','🇳🇬','NGN','₦',{escortTerm:'Escort Vehicle',localPayment:'Flutterwave',stripe:true}),
    c('EG','Egypt','مصر','D','🇪🇬','EGP','E£',{direction:'rtl',escortTerm:'مركبة مرافقة',localPayment:'Fawry',stripe:true}),
    c('KE','Kenya','Kenya','D','🇰🇪','KES','KSh',{escortTerm:'Escort Vehicle',localPayment:'M-Pesa',stripe:true}),
    c('MA','Morocco','المغرب','D','🇲🇦','MAD','د.م.',{direction:'rtl',escortTerm:'مركبة مرافقة',cryptoOk:false}),
    c('RS','Serbia','Србија','D','🇷🇸','RSD','din.',{escortTerm:'Vozilo za Pratnju'}),
    c('UA','Ukraine','Україна','D','🇺🇦','UAH','₴',{escortTerm:'Автомобіль Супроводу'}),
    c('KZ','Kazakhstan','Қазақстан','D','🇰🇿','KZT','₸',{escortTerm:'Escort Vehicle',localPayment:'Kaspi'}),
    c('TW','Taiwan','臺灣','D','🇹🇼','TWD','NT$',{escortTerm:'前導車',localPayment:'LINE Pay'}),
    c('PK','Pakistan','پاکستان','D','🇵🇰','PKR','Rs',{direction:'rtl',escortTerm:'ایسکارٹ گاڑی',localPayment:'JazzCash/Easypaisa'}),
    c('BD','Bangladesh','বাংলাদেশ','D','🇧🇩','BDT','৳',{escortTerm:'Escort Vehicle',localPayment:'bKash'}),
    c('MN','Mongolia','Монгол','D','🇲🇳','MNT','₮',{escortTerm:'Escort Vehicle'}),
    c('TT','Trinidad & Tobago','Trinidad & Tobago','D','🇹🇹','TTD','TT$',{escortTerm:'Escort Vehicle'}),
    c('JO','Jordan','الأردن','D','🇯🇴','JOD','د.ا',{direction:'rtl',escortTerm:'مركبة مرافقة'}),
    c('GH','Ghana','Ghana','D','🇬🇭','GHS','GH₵',{escortTerm:'Escort Vehicle',localPayment:'Mobile Money',stripe:true}),
    c('TZ','Tanzania','Tanzania','D','🇹🇿','TZS','TSh',{escortTerm:'Escort Vehicle',localPayment:'M-Pesa'}),
    c('GE','Georgia','საქართველო','D','🇬🇪','GEL','₾',{escortTerm:'Escort Vehicle',stripe:true}),
    c('AZ','Azerbaijan','Azərbaycan','D','🇦🇿','AZN','₼',{escortTerm:'Escort Vehicle'}),
    c('CY','Cyprus','Κύπρος','D','🇨🇾','EUR','€',{escortTerm:'Escort Vehicle',stripe:true,privacyLaw:'GDPR'}),
    c('IS','Iceland','Ísland','D','🇮🇸','ISK','kr',{escortTerm:'Fylgdarbíll',stripe:true,privacyLaw:'GDPR'}),
    c('LU','Luxembourg','Lëtzebuerg','D','🇱🇺','EUR','€',{escortTerm:'Véhicule d\'escorte',stripe:true,privacyLaw:'GDPR'}),
    c('EC','Ecuador','Ecuador','D','🇪🇨','USD','$',{escortTerm:'Vehículo de Escolta'}),

    // ══ Tier E — Copper (41) ════════════════════════════════════════
    c('BO','Bolivia','Bolivia','E','🇧🇴','BOB','Bs',{escortTerm:'Vehículo de Escolta'}),
    c('PY','Paraguay','Paraguay','E','🇵🇾','PYG','₲',{escortTerm:'Vehículo de Escolta'}),
    c('GT','Guatemala','Guatemala','E','🇬🇹','GTQ','Q',{escortTerm:'Vehículo de Escolta'}),
    c('DO','Dominican Republic','Rep. Dominicana','E','🇩🇴','DOP','RD$',{escortTerm:'Vehículo de Escolta'}),
    c('HN','Honduras','Honduras','E','🇭🇳','HNL','L',{escortTerm:'Vehículo de Escolta'}),
    c('SV','El Salvador','El Salvador','E','🇸🇻','USD','$',{escortTerm:'Vehículo de Escolta'}),
    c('NI','Nicaragua','Nicaragua','E','🇳🇮','NIO','C$',{escortTerm:'Vehículo de Escolta'}),
    c('JM','Jamaica','Jamaica','E','🇯🇲','JMD','J$',{escortTerm:'Escort Vehicle'}),
    c('GY','Guyana','Guyana','E','🇬🇾','GYD','G$',{escortTerm:'Escort Vehicle'}),
    c('SR','Suriname','Suriname','E','🇸🇷','SRD','$',{escortTerm:'Escort Vehicle'}),
    c('BA','Bosnia & Herzegovina','Bosna i Hercegovina','E','🇧🇦','BAM','KM',{escortTerm:'Vozilo za Pratnju'}),
    c('ME','Montenegro','Crna Gora','E','🇲🇪','EUR','€',{escortTerm:'Vozilo za Pratnju'}),
    c('MK','North Macedonia','Северна Македонија','E','🇲🇰','MKD','ден',{escortTerm:'Escort Vehicle'}),
    c('AL','Albania','Shqipëria','E','🇦🇱','ALL','L',{escortTerm:'Mjet Përcjellëse'}),
    c('MD','Moldova','Moldova','E','🇲🇩','MDL','L',{escortTerm:'Vehicul de Escortă'}),
    c('IQ','Iraq','العراق','E','🇮🇶','IQD','ع.د',{direction:'rtl',escortTerm:'مركبة مرافقة',cryptoOk:false}),
    c('NA','Namibia','Namibia','E','🇳🇦','NAD','N$',{escortTerm:'Escort Vehicle'}),
    c('AO','Angola','Angola','E','🇦🇴','AOA','Kz',{escortTerm:'Veículo de Escolta',cryptoOk:false}),
    c('MZ','Mozambique','Moçambique','E','🇲🇿','MZN','MT',{escortTerm:'Veículo de Escolta',localPayment:'M-Pesa'}),
    c('ET','Ethiopia','ኢትዮጵያ','E','🇪🇹','ETB','Br',{escortTerm:'Escort Vehicle',localPayment:'Telebirr',cryptoOk:false}),
    c('CI','Côte d\'Ivoire','Côte d\'Ivoire','E','🇨🇮','XOF','CFA',{escortTerm:'Véhicule d\'escorte',localPayment:'Orange Money'}),
    c('SN','Senegal','Sénégal','E','🇸🇳','XOF','CFA',{escortTerm:'Véhicule d\'escorte',localPayment:'Orange Money'}),
    c('BW','Botswana','Botswana','E','🇧🇼','BWP','P',{escortTerm:'Escort Vehicle'}),
    c('ZM','Zambia','Zambia','E','🇿🇲','ZMW','ZK',{escortTerm:'Escort Vehicle',localPayment:'Airtel Money'}),
    c('UG','Uganda','Uganda','E','🇺🇬','UGX','USh',{escortTerm:'Escort Vehicle',localPayment:'MTN Money'}),
    c('CM','Cameroon','Cameroun','E','🇨🇲','XAF','CFA',{escortTerm:'Véhicule d\'escorte',localPayment:'Orange Money'}),
    c('KH','Cambodia','កម្ពុជា','E','🇰🇭','KHR','៛',{escortTerm:'Escort Vehicle',localPayment:'ABA Pay'}),
    c('LK','Sri Lanka','ශ්‍රී ලංකාව','E','🇱🇰','LKR','Rs',{escortTerm:'Escort Vehicle'}),
    c('UZ','Uzbekistan','Oʻzbekiston','E','🇺🇿','UZS','сўм',{escortTerm:'Escort Vehicle',localPayment:'Payme'}),
    c('LA','Laos','ລາວ','E','🇱🇦','LAK','₭',{escortTerm:'Escort Vehicle'}),
    c('NP','Nepal','नेपाल','E','🇳🇵','NPR','Rs',{escortTerm:'Escort Vehicle',localPayment:'eSewa'}),
    c('DZ','Algeria','الجزائر','E','🇩🇿','DZD','د.ج',{direction:'rtl',escortTerm:'مركبة مرافقة',cryptoOk:false}),
    c('TN','Tunisia','تونس','E','🇹🇳','TND','د.ت',{direction:'rtl',escortTerm:'مركبة مرافقة'}),
    c('MT','Malta','Malta','E','🇲🇹','EUR','€',{escortTerm:'Escort Vehicle',stripe:true,privacyLaw:'GDPR'}),
    c('BN','Brunei','Brunei','E','🇧🇳','BND','B$',{escortTerm:'Escort Vehicle'}),
    c('RW','Rwanda','Rwanda','E','🇷🇼','RWF','FRw',{escortTerm:'Escort Vehicle',localPayment:'MTN MoMo'}),
    c('MG','Madagascar','Madagasikara','E','🇲🇬','MGA','Ar',{escortTerm:'Escort Vehicle'}),
    c('PG','Papua New Guinea','Papua Niugini','E','🇵🇬','PGK','K',{escortTerm:'Escort Vehicle'}),
    c('TM','Turkmenistan','Türkmenistan','E','🇹🇲','TMT','m',{escortTerm:'Escort Vehicle',cryptoOk:false}),
    c('KG','Kyrgyzstan','Кыргызстан','E','🇰🇬','KGS','сом',{escortTerm:'Escort Vehicle'}),
    c('MW','Malawi','Malaŵi','E','🇲🇼','MWK','MK',{escortTerm:'Escort Vehicle',localPayment:'Airtel Money'}),
];

// ── Utility functions ─────────────────────────────────────────────

/** Get country config by ISO code */
export function getCountry(code: string): CountryConfig | undefined {
    return COUNTRIES.find(c => c.code === code.toUpperCase());
}

/** Get all countries in a tier */
export function getCountriesByTier(tier: CountryTier): CountryConfig[] {
    return COUNTRIES.filter(c => c.tier === tier);
}

/** Get tier info for a country code */
export function getCountryTier(code: string): CountryTier | undefined {
    return getCountry(code)?.tier;
}

/** Check if a country code is in the 120-country system */
export function isSupported(code: string): boolean {
    return COUNTRIES.some(c => c.code === code.toUpperCase());
}

/** Get country codes as a flat array */
export function getAllCountryCodes(): string[] {
    return COUNTRIES.map(c => c.code);
}

/** Get tier metadata */
export function getTierConfig(tier: CountryTier) {
    return COUNTRY_TIERS[tier];
}

/** Get RTL countries */
export function getRtlCountries(): CountryConfig[] {
    return COUNTRIES.filter(c => c.direction === 'rtl');
}

/** Get countries where crypto is legal */
export function getCryptoCountries(): CountryConfig[] {
    return COUNTRIES.filter(c => c.cryptoOk);
}

/** Get countries with Stripe support */
export function getStripeCountries(): CountryConfig[] {
    return COUNTRIES.filter(c => c.stripe);
}

/** Get escort term for a country */
export function getEscortTerm(code: string): string {
    return getCountry(code)?.escortTerm ?? 'Escort Vehicle';
}

/** Get currency info for a country */
export function getCurrencyInfo(code: string): { currency: string; symbol: string } {
    const country = getCountry(code);
    return { currency: country?.currency ?? 'USD', symbol: country?.currencySymbol ?? '$' };
}
