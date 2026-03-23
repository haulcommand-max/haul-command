// ══════════════════════════════════════════════════════════════
// CRYPTO PAYMENTS BY COUNTRY — Which tokens are allowed where
// Spec: Crypto & Legal Compliance Block 1
// Integrates: NOWPayments, Circle (USDC yield)
// ══════════════════════════════════════════════════════════════

export interface CryptoConfig {
  allowed: boolean;
  tokens: CryptoToken[];
  regulations: string;
  taxReportingRequired: boolean;
  kycThreshold?: number;       // Amount in USD above which KYC is mandatory
  stablecoinOnly?: boolean;    // Some countries only allow stablecoins
  localToken?: string;         // Country-specific digital currency (e.g., DREX for Brazil)
  notes?: string;
}

export interface CryptoToken {
  symbol: string;
  name: string;
  network: string;
  enabled: boolean;
}

// ── Standard token definitions ──
const USDC: CryptoToken = { symbol: 'USDC', name: 'USD Coin', network: 'Ethereum/Polygon', enabled: true };
const USDT: CryptoToken = { symbol: 'USDT', name: 'Tether', network: 'Ethereum/Tron', enabled: true };
const ETH: CryptoToken = { symbol: 'ETH', name: 'Ethereum', network: 'Ethereum', enabled: true };
const BTC: CryptoToken = { symbol: 'BTC', name: 'Bitcoin', network: 'Bitcoin', enabled: true };
const DREX: CryptoToken = { symbol: 'DREX', name: 'Digital Real', network: 'Hyperledger Besu', enabled: false }; // Brazil CBDC — not yet live
const ADA: CryptoToken = { symbol: 'ADA', name: 'Cardano', network: 'Cardano', enabled: true };

export const CRYPTO_BY_COUNTRY: Record<string, CryptoConfig> = {
  // ── Tier A Gold — Full crypto support ──
  US: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC],
    regulations: 'SEC/FinCEN regulated. MSB license may be required.',
    taxReportingRequired: true,
    kycThreshold: 3000,
    notes: 'State-by-state variation. NY requires BitLicense.',
  },
  CA: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC],
    regulations: 'FINTRAC regulated. Crypto exchanges must register as MSBs.',
    taxReportingRequired: true,
    kycThreshold: 1000,
  },
  AU: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC],
    regulations: 'AUSTRAC regulated. DCE registration required.',
    taxReportingRequired: true,
    kycThreshold: 5000,
  },
  GB: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC],
    regulations: 'FCA regulated. Crypto firms must be registered.',
    taxReportingRequired: true,
    kycThreshold: 1000,
  },
  DE: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC],
    regulations: 'BaFin regulated under MiCA. Crypto custody license required.',
    taxReportingRequired: true,
    kycThreshold: 1000,
    notes: 'Tax-free after 1 year hold. MiCA compliant since 2024.',
  },
  NL: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC],
    regulations: 'DNB registered. MiCA compliant.',
    taxReportingRequired: true,
    kycThreshold: 1000,
  },
  AE: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC, ADA],
    regulations: 'VARA (Dubai) / FSRA (ADGM) regulated. Progressive framework.',
    taxReportingRequired: false,
    notes: 'Zero income tax. Dubai is a crypto hub. VARA licensed exchanges preferred.',
  },
  BR: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC, DREX],
    regulations: 'Central Bank regulated. Marco Legal das Criptomoedas (2023).',
    taxReportingRequired: true,
    kycThreshold: 5000,
    localToken: 'DREX',
    notes: 'DREX (digital real) CBDC launching 2025. Banco Central oversight.',
  },
  ZA: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC],
    regulations: 'FSCA regulated as financial products since 2023.',
    taxReportingRequired: true,
    kycThreshold: 5000,
  },
  NZ: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC],
    regulations: 'FMA oversight. AML/CFT Act applies.',
    taxReportingRequired: true,
    kycThreshold: 1000,
  },

  // ── Tier B Blue — Selective support ──
  SA: {
    allowed: false,
    tokens: [],
    regulations: 'SAMA has not authorized crypto. Trading is discouraged but not illegal.',
    taxReportingRequired: false,
    stablecoinOnly: true,
    notes: 'No formal ban but banks may freeze accounts. Proceed with caution.',
  },
  QA: {
    allowed: false,
    tokens: [],
    regulations: 'QCB has banned crypto trading and services.',
    taxReportingRequired: false,
    notes: 'Full ban on crypto activities.',
  },
  IN: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC],
    regulations: 'RBI/SEBI regulated. 30% flat tax on crypto gains. 1% TDS.',
    taxReportingRequired: true,
    kycThreshold: 500,
    notes: '30% tax + 1% TDS on transactions makes high-frequency trading costly.',
  },
  JP: {
    allowed: true,
    tokens: [USDC, ETH, BTC],
    regulations: 'FSA regulated. Registered crypto exchanges only.',
    taxReportingRequired: true,
    kycThreshold: 1000,
    notes: 'USDT not widely available. Strict exchange requirements.',
  },
  KR: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC],
    regulations: 'FSC regulated. VASP registration required.',
    taxReportingRequired: true,
    kycThreshold: 1000,
    notes: 'Crypto gains tax deferred to 2025.',
  },
  MX: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC],
    regulations: 'CNBV/Banxico regulated under FinTech Law.',
    taxReportingRequired: true,
    kycThreshold: 3000,
  },
  SE: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC],
    regulations: 'Finansinspektionen registered. MiCA compliant.',
    taxReportingRequired: true,
    kycThreshold: 1000,
  },
  NO: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC],
    regulations: 'Finanstilsynet oversight. AML requirements.',
    taxReportingRequired: true,
    kycThreshold: 1000,
  },
  CH: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC, ADA],
    regulations: 'FINMA regulated. Crypto Valley (Zug) friendly framework.',
    taxReportingRequired: true,
    kycThreshold: 1000,
    notes: 'One of the most crypto-friendly countries globally.',
  },
  SG: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC],
    regulations: 'MAS regulated under Payment Services Act.',
    taxReportingRequired: false,
    kycThreshold: 5000,
    notes: 'No capital gains tax. Strong regulatory framework.',
  },
  FR: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC],
    regulations: 'AMF regulated. PSAN registration required. MiCA compliant.',
    taxReportingRequired: true,
    kycThreshold: 1000,
  },
  ES: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC],
    regulations: 'CNMV/Banco de España. MiCA compliant.',
    taxReportingRequired: true,
    kycThreshold: 1000,
  },
  IT: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC],
    regulations: 'OAM registered. 26% capital gains tax on crypto.',
    taxReportingRequired: true,
    kycThreshold: 1000,
  },

  // ── Tier C Silver — Limited or stablecoin only ──
  TR: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC],
    regulations: 'CMB oversight. Payment ban for crypto but trading is legal.',
    taxReportingRequired: true,
    stablecoinOnly: false,
    notes: 'Cannot use crypto for payments but can trade. Proposed legislation pending.',
  },
  PL: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC],
    regulations: 'KNF oversight. MiCA compliant.',
    taxReportingRequired: true,
    kycThreshold: 1000,
  },
  TH: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC],
    regulations: 'SEC Thailand regulated. 15% withholding tax on crypto gains.',
    taxReportingRequired: true,
    kycThreshold: 1000,
  },
  ID: {
    allowed: true,
    tokens: [USDC, USDT, ETH, BTC],
    regulations: 'Bappebti/OJK regulated. Crypto classified as commodity.',
    taxReportingRequired: true,
    kycThreshold: 1000,
    notes: 'Crypto exchanges must be registered with Bappebti.',
  },
};

// ── Helper functions ──

export function getCryptoConfig(countryCode: string): CryptoConfig {
  return CRYPTO_BY_COUNTRY[countryCode.toUpperCase()] || {
    allowed: false,
    tokens: [],
    regulations: 'Crypto regulations not yet mapped for this country.',
    taxReportingRequired: false,
    notes: 'Contact legal team before enabling crypto payments.',
  };
}

export function isCryptoAllowed(countryCode: string): boolean {
  return getCryptoConfig(countryCode).allowed;
}

export function getAllowedTokens(countryCode: string): CryptoToken[] {
  const config = getCryptoConfig(countryCode);
  return config.tokens.filter(t => t.enabled);
}

export function requiresKYC(countryCode: string, amountUSD: number): boolean {
  const config = getCryptoConfig(countryCode);
  if (!config.kycThreshold) return false;
  return amountUSD >= config.kycThreshold;
}

export function getCryptoFriendlyCountries(): string[] {
  return Object.entries(CRYPTO_BY_COUNTRY)
    .filter(([_, config]) => config.allowed && !config.stablecoinOnly)
    .map(([code]) => code);
}

export function getStablecoinOnlyCountries(): string[] {
  return Object.entries(CRYPTO_BY_COUNTRY)
    .filter(([_, config]) => config.allowed && config.stablecoinOnly)
    .map(([code]) => code);
}

export function getCryptoBannedCountries(): string[] {
  return Object.entries(CRYPTO_BY_COUNTRY)
    .filter(([_, config]) => !config.allowed)
    .map(([code]) => code);
}
