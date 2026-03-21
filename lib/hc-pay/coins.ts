/**
 * HC Pay — Coin Configuration
 *
 * Single source of truth for all crypto coin defaults, networks, and country routing.
 * BTC (Lightning) and ADA are defaults everywhere.
 * USDT (TRC20) and USDC (Base) are stable defaults.
 * XRP auto-enables in Middle East + APAC markets.
 */

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

// XRP default countries (Middle East + APAC)
const XRP_COUNTRIES = [
    'AE', 'SA', 'QA', 'KW', 'OM', 'BH', // Gulf
    'IN', 'ID', 'TH', 'SG', 'MY', 'JP', 'KR', // APAC
];

// SOL default countries (tech-forward APAC)
const SOL_COUNTRIES = ['SG', 'JP', 'KR', 'AU', 'NZ'];

/**
 * Returns the default coins for a given country.
 * Always: BTC, ADA, USDT, USDC.
 * + XRP in Middle East / APAC markets.
 * + SOL in tech-forward APAC markets.
 */
export function getCoinsForCountry(isoCode: string): CoinConfig[] {
    const defaults = COIN_CONFIGS.filter((c) => c.defaultOn);
    const additions: CoinConfig[] = [];
    const upper = isoCode.toUpperCase();

    if (XRP_COUNTRIES.includes(upper)) {
        const xrp = COIN_CONFIGS.find((c) => c.symbol === 'XRP');
        if (xrp) additions.push(xrp);
    }

    if (SOL_COUNTRIES.includes(upper)) {
        const sol = COIN_CONFIGS.find((c) => c.symbol === 'SOL');
        if (sol && !additions.find((c) => c.symbol === 'SOL')) additions.push(sol);
    }

    return [...defaults, ...additions];
}

/**
 * Find a coin config by symbol.
 */
export function getCoinBySymbol(symbol: string): CoinConfig | undefined {
    return COIN_CONFIGS.find((c) => c.symbol.toUpperCase() === symbol.toUpperCase());
}
