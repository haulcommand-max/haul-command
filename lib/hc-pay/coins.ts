/**
 * HC Pay — Coin Configuration
 *
 * Single source of truth for all crypto coin defaults, networks, and country routing.
 * BTC (Lightning) and ADA are defaults everywhere crypto is legal.
 * USDT (TRC20) and USDC (Base) are stable defaults.
 * XRP auto-enables in Middle East + APAC markets.
 * SOL auto-enables in tech-forward markets.
 *
 * Updated: 120-country expansion — routing covers all 5 tiers.
 */

import { getCountry } from '@/lib/countries';

export interface CoinConfig {
    symbol: string;
    name: string;
    network: string;
    networkLabel: string;
    nowpaymentsCode: string;
    avgFeeUsd: number;
    avgConfirmSeconds: number;
    defaultOn: boolean;
    logoUrl?: string;
}

export const COIN_CONFIGS: CoinConfig[] = [
    {
        symbol: 'BTC',
        name: 'Bitcoin',
        network: 'lightning',
        networkLabel: 'Lightning Network',
        nowpaymentsCode: 'btcln',
        avgFeeUsd: 0.001,
        avgConfirmSeconds: 3,
        defaultOn: true,
        logoUrl: '/icons/coins/btc.svg',
    },
    {
        symbol: 'ADA',
        name: 'Cardano',
        network: 'cardano',
        networkLabel: 'Cardano',
        nowpaymentsCode: 'ada',
        avgFeeUsd: 0.17,
        avgConfirmSeconds: 20,
        defaultOn: true,
        logoUrl: '/icons/coins/ada.svg',
    },
    {
        symbol: 'USDT',
        name: 'Tether',
        network: 'trc20',
        networkLabel: 'TRON (TRC20)',
        nowpaymentsCode: 'usdttrc20',
        avgFeeUsd: 1.0,
        avgConfirmSeconds: 180,
        defaultOn: true,
        logoUrl: '/icons/coins/usdt.svg',
    },
    {
        symbol: 'USDC',
        name: 'USD Coin',
        network: 'base',
        networkLabel: 'Base (L2)',
        nowpaymentsCode: 'usdcbase',
        avgFeeUsd: 0.01,
        avgConfirmSeconds: 120,
        defaultOn: true,
        logoUrl: '/icons/coins/usdc.svg',
    },
    {
        symbol: 'XRP',
        name: 'XRP',
        network: 'xrp',
        networkLabel: 'XRP Ledger',
        nowpaymentsCode: 'xrp',
        avgFeeUsd: 0.001,
        avgConfirmSeconds: 5,
        defaultOn: false,
        logoUrl: '/icons/coins/xrp.svg',
    },
    {
        symbol: 'SOL',
        name: 'Solana',
        network: 'solana',
        networkLabel: 'Solana',
        nowpaymentsCode: 'sol',
        avgFeeUsd: 0.001,
        avgConfirmSeconds: 60,
        defaultOn: false,
        logoUrl: '/icons/coins/sol.svg',
    },
    {
        symbol: 'ETH',
        name: 'Ethereum',
        network: 'eth',
        networkLabel: 'Ethereum (mainnet)',
        nowpaymentsCode: 'eth',
        avgFeeUsd: 15.0,
        avgConfirmSeconds: 900,
        defaultOn: false, // NEVER default — fees too high
        logoUrl: '/icons/coins/eth.svg',
    },
    {
        symbol: 'DOGE',
        name: 'Dogecoin',
        network: 'doge',
        networkLabel: 'Dogecoin',
        nowpaymentsCode: 'doge',
        avgFeeUsd: 0.15,
        avgConfirmSeconds: 60,
        defaultOn: false,
        logoUrl: '/icons/coins/doge.svg',
    },
    {
        symbol: 'LTC',
        name: 'Litecoin',
        network: 'litecoin',
        networkLabel: 'Litecoin',
        nowpaymentsCode: 'ltc',
        avgFeeUsd: 0.02,
        avgConfirmSeconds: 150,
        defaultOn: false,
        logoUrl: '/icons/coins/ltc.svg',
    },
    {
        symbol: 'MATIC',
        name: 'Polygon',
        network: 'polygon',
        networkLabel: 'Polygon',
        nowpaymentsCode: 'maticpolygon',
        avgFeeUsd: 0.01,
        avgConfirmSeconds: 30,
        defaultOn: false,
        logoUrl: '/icons/coins/matic.svg',
    },
];

export const DEFAULT_COINS = COIN_CONFIGS.filter((c) => c.defaultOn);
export const ALL_STATIC_COINS = COIN_CONFIGS;

// ═══════════════════════════════════════════════════════════════
// COUNTRY-BASED COIN ROUTING — 120 Countries
// ═══════════════════════════════════════════════════════════════

// XRP: Middle East + Gulf + APAC + East Africa (remittance corridors)
const XRP_COUNTRIES = [
    // Gulf / Middle East
    'AE', 'SA', 'QA', 'KW', 'OM', 'BH', 'JO', 'IQ', 'EG',
    // APAC
    'IN', 'ID', 'TH', 'SG', 'MY', 'JP', 'KR', 'PH', 'VN', 'KH', 'LK', 'BD', 'PK', 'NP',
    // East Africa (mobile money + remittance heavy)
    'KE', 'TZ', 'UG', 'RW',
];

// SOL: Tech-forward markets + crypto-native economies
const SOL_COUNTRIES = [
    'SG', 'JP', 'KR', 'AU', 'NZ', 'TW', 'IL', 'EE', 'GE',
    'SV', // El Salvador — Bitcoin legal tender, crypto-forward
];

// DOGE: Markets where meme culture drives adoption
const DOGE_COUNTRIES = [
    'US', 'CA', 'AU', 'GB', 'NZ', 'BR', 'MX', 'TR', 'NG', 'GH',
];

// LTC: Latin America + West Africa (lower fees, faster than BTC mainnet)
const LTC_COUNTRIES = [
    'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'EC', 'BO', 'PY', 'UY',
    'CR', 'PA', 'GT', 'HN', 'SV', 'NI', 'DO', 'JM', 'GY', 'SR', 'TT',
    'NG', 'GH', 'KE', 'TZ', 'ZA',
];

// MATIC: EU markets where gas-optimized L2 is preferred
const MATIC_COUNTRIES = [
    'DE', 'NL', 'FR', 'ES', 'IT', 'PT', 'BE', 'AT', 'CH', 'IE',
    'SE', 'NO', 'DK', 'FI', 'PL', 'CZ', 'SK', 'HU', 'SI', 'EE',
    'LV', 'LT', 'HR', 'RO', 'BG', 'GR', 'CY', 'LU', 'MT', 'IS',
    'RS', 'BA', 'ME', 'MK', 'AL', 'MD', 'UA',
];

// Countries where crypto is RESTRICTED — only offer stablecoins or nothing
const CRYPTO_RESTRICTED = [
    'SA', 'KR', 'VN', 'TR', 'MA', 'IQ', 'AO', 'ET', 'DZ', 'TM',
];

/**
 * Returns the coins available for a given country.
 *
 * Logic:
 * 1. Check if crypto is legal via countries.ts config
 * 2. If restricted: offer ONLY USDT + USDC (stablecoins) — no volatile coins
 * 3. If legal: always BTC + ADA + USDT + USDC
 * 4. Add regional favorites (XRP, SOL, DOGE, LTC, MATIC) based on country
 */
export function getCoinsForCountry(isoCode: string): CoinConfig[] {
    const upper = isoCode.toUpperCase();
    const countryConfig = getCountry(upper);

    // If country is not in our 120-country system, return defaults
    if (!countryConfig) {
        return COIN_CONFIGS.filter((c) => c.defaultOn);
    }

    // If crypto is not OK in this country, offer stablecoins only
    if (!countryConfig.cryptoOk) {
        // Stablecoins are generally treated differently from crypto in most jurisdictions
        // But for fully banned markets, return empty
        if (CRYPTO_RESTRICTED.includes(upper)) {
            return COIN_CONFIGS.filter(
                (c) => c.symbol === 'USDT' || c.symbol === 'USDC'
            );
        }
        return [];
    }

    // Start with defaults: BTC, ADA, USDT, USDC
    const result = COIN_CONFIGS.filter((c) => c.defaultOn);
    const symbols = new Set(result.map((c) => c.symbol));

    // Add regional coins
    const addCoin = (symbol: string) => {
        if (!symbols.has(symbol)) {
            const coin = COIN_CONFIGS.find((c) => c.symbol === symbol);
            if (coin) { result.push(coin); symbols.add(symbol); }
        }
    };

    if (XRP_COUNTRIES.includes(upper)) addCoin('XRP');
    if (SOL_COUNTRIES.includes(upper)) addCoin('SOL');
    if (DOGE_COUNTRIES.includes(upper)) addCoin('DOGE');
    if (LTC_COUNTRIES.includes(upper)) addCoin('LTC');
    if (MATIC_COUNTRIES.includes(upper)) addCoin('MATIC');

    return result;
}

/**
 * Find a coin config by symbol.
 */
export function getCoinBySymbol(symbol: string): CoinConfig | undefined {
    return COIN_CONFIGS.find((c) => c.symbol.toUpperCase() === symbol.toUpperCase());
}

/**
 * Check if a specific coin is available in a country.
 */
export function isCoinAvailable(isoCode: string, symbol: string): boolean {
    return getCoinsForCountry(isoCode).some(
        (c) => c.symbol.toUpperCase() === symbol.toUpperCase()
    );
}

/**
 * Get the recommended "fastest + cheapest" coin for a country.
 * Used for default selection in payment UI.
 */
export function getRecommendedCoin(isoCode: string): CoinConfig {
    const available = getCoinsForCountry(isoCode);
    // Prefer BTC Lightning (fastest, cheapest), fallback to ADA, then USDT
    return (
        available.find((c) => c.symbol === 'BTC') ??
        available.find((c) => c.symbol === 'ADA') ??
        available.find((c) => c.symbol === 'USDT') ??
        available[0] ??
        COIN_CONFIGS[0]
    );
}
