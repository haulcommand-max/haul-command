// ══════════════════════════════════════════════════════════════
// FORMATTING UTILITIES — Currency, distance, weight, date, time
// Spec: HC_DOMINATION_PATCH_V1 Phase 4 — Globalization Plumbing
// Purpose: Every number on every page should feel local
// ══════════════════════════════════════════════════════════════

import { COUNTRY_LOCALES, type LocaleConfig } from "./country-locales";

// ── Currency Formatting ──

interface CurrencyFormatOptions {
    /** Show currency symbol or code */
    display?: "symbol" | "code" | "name";
    /** Number of decimal places (default: auto from currency) */
    decimals?: number;
    /** Show as compact (e.g., $1.2K) when > threshold */
    compact?: boolean;
    /** Compact threshold (default: 10,000) */
    compactThreshold?: number;
}

const ZERO_DECIMAL_CURRENCIES = new Set(["JPY", "KRW", "CLP", "HUF", "COP", "ISK", "VND"]);

export function formatCurrency(
    amount: number,
    iso2: string,
    options: CurrencyFormatOptions = {}
): string {
    const locale = COUNTRY_LOCALES[iso2];
    if (!locale) return `${amount}`;

    const {
        display = "symbol",
        decimals,
        compact = false,
        compactThreshold = 10_000,
    } = options;

    const resolvedDecimals = decimals ?? (ZERO_DECIMAL_CURRENCIES.has(locale.currency) ? 0 : 2);

    if (compact && Math.abs(amount) >= compactThreshold) {
        return new Intl.NumberFormat(locale.locale, {
            style: "currency",
            currency: locale.currency,
            currencyDisplay: display === "symbol" ? "narrowSymbol" : display,
            notation: "compact",
            maximumSignificantDigits: 3,
        }).format(amount);
    }

    return new Intl.NumberFormat(locale.locale, {
        style: "currency",
        currency: locale.currency,
        currencyDisplay: display === "symbol" ? "narrowSymbol" : display,
        minimumFractionDigits: resolvedDecimals,
        maximumFractionDigits: resolvedDecimals,
    }).format(amount);
}

/** Format amount with both local currency and USD reference */
export function formatDualCurrency(
    amountLocal: number,
    amountUsd: number,
    iso2: string
): string {
    const locale = COUNTRY_LOCALES[iso2];
    if (!locale || locale.currency === "USD") {
        return formatCurrency(amountLocal, iso2);
    }
    return `${formatCurrency(amountLocal, iso2)} (${formatCurrency(amountUsd, "US")})`;
}

/** Format a rate range (e.g., "$80–$120/mi") */
export function formatRateRange(
    low: number,
    high: number,
    iso2: string,
    unit?: string
): string {
    const locale = COUNTRY_LOCALES[iso2];
    if (!locale) return `${low}–${high}`;

    const fmtLow = formatCurrency(low, iso2);
    const fmtHigh = formatCurrency(high, iso2);
    const rateUnit = unit || `/${locale.distanceUnit}`;
    return `${fmtLow}–${fmtHigh}${rateUnit}`;
}

// ── Distance Formatting ──

export function formatDistance(
    valueKm: number,
    iso2: string,
    options: { precision?: number; showUnit?: boolean } = {}
): string {
    const locale = COUNTRY_LOCALES[iso2];
    if (!locale) return `${valueKm} km`;

    const { precision = 0, showUnit = true } = options;

    if (locale.distanceUnit === "mi") {
        const miles = valueKm * 0.621371;
        const formatted = new Intl.NumberFormat(locale.locale, {
            maximumFractionDigits: precision,
        }).format(miles);
        return showUnit ? `${formatted} mi` : formatted;
    }

    const formatted = new Intl.NumberFormat(locale.locale, {
        maximumFractionDigits: precision,
    }).format(valueKm);
    return showUnit ? `${formatted} km` : formatted;
}

// ── Weight Formatting ──

export function formatWeight(
    valueKg: number,
    iso2: string,
    options: { precision?: number; showUnit?: boolean } = {}
): string {
    const locale = COUNTRY_LOCALES[iso2];
    if (!locale) return `${valueKg} kg`;

    const { precision = 0, showUnit = true } = options;

    let value: number;
    let unit: string;

    switch (locale.weightUnit) {
        case "lb":
            value = valueKg * 2.20462;
            unit = "lbs";
            break;
        case "ton":
            value = valueKg / 907.185; // US short ton
            unit = "tons";
            break;
        case "t":
            value = valueKg / 1000; // metric ton
            unit = "t";
            break;
        default:
            value = valueKg;
            unit = "kg";
    }

    const formatted = new Intl.NumberFormat(locale.locale, {
        maximumFractionDigits: precision,
    }).format(value);
    return showUnit ? `${formatted} ${unit}` : formatted;
}

// ── Date & Time Formatting ──

export function formatDate(
    date: Date | string,
    iso2: string,
    style: "short" | "medium" | "long" = "medium"
): string {
    const locale = COUNTRY_LOCALES[iso2];
    if (!locale) return new Date(date).toLocaleDateString();

    const d = typeof date === "string" ? new Date(date) : date;

    const opts: Intl.DateTimeFormatOptions = style === "short"
        ? { month: "numeric", day: "numeric", year: "2-digit" }
        : style === "long"
            ? { weekday: "long", month: "long", day: "numeric", year: "numeric" }
            : { month: "short", day: "numeric", year: "numeric" };

    return new Intl.DateTimeFormat(locale.locale, {
        ...opts,
        timeZone: locale.primaryTimezone,
    }).format(d);
}

export function formatTime(
    date: Date | string,
    iso2: string,
    options: { showTimezone?: boolean; timezone?: string } = {}
): string {
    const locale = COUNTRY_LOCALES[iso2];
    if (!locale) return new Date(date).toLocaleTimeString();

    const d = typeof date === "string" ? new Date(date) : date;
    const tz = options.timezone || locale.primaryTimezone;

    return new Intl.DateTimeFormat(locale.locale, {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: tz,
        ...(options.showTimezone ? { timeZoneName: "short" } : {}),
    }).format(d);
}

export function formatRelativeTime(
    date: Date | string,
    iso2: string
): string {
    const locale = COUNTRY_LOCALES[iso2];
    const d = typeof date === "string" ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    const rtf = new Intl.RelativeTimeFormat(locale?.locale || "en", { numeric: "auto" });

    if (diffMins < 1) return rtf.format(0, "minute"); // "just now" / "ahora"
    if (diffMins < 60) return rtf.format(-diffMins, "minute");
    if (diffHours < 24) return rtf.format(-diffHours, "hour");
    if (diffDays < 30) return rtf.format(-diffDays, "day");
    if (diffDays < 365) return rtf.format(-Math.floor(diffDays / 30), "month");
    return rtf.format(-Math.floor(diffDays / 365), "year");
}

// ── Number Formatting ──

export function formatNumber(
    value: number,
    iso2: string,
    options: { precision?: number; compact?: boolean } = {}
): string {
    const locale = COUNTRY_LOCALES[iso2];
    if (!locale) return `${value}`;

    return new Intl.NumberFormat(locale.locale, {
        maximumFractionDigits: options.precision ?? 0,
        ...(options.compact ? { notation: "compact" as const } : {}),
    }).format(value);
}

export function formatPercentage(
    value: number,
    iso2: string,
    precision: number = 0
): string {
    const locale = COUNTRY_LOCALES[iso2];
    if (!locale) return `${value}%`;

    return new Intl.NumberFormat(locale.locale, {
        style: "percent",
        maximumFractionDigits: precision,
    }).format(value / 100);
}

// ── Timezone Utilities ──

/** Get user's timezone and match to the best country config */
export function detectUserTimezone(): string {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
        return "UTC";
    }
}

/** Convert a date to a specific country's primary timezone */
export function toCountryTime(date: Date | string, iso2: string): Date {
    const locale = COUNTRY_LOCALES[iso2];
    if (!locale) return new Date(date);

    const d = typeof date === "string" ? new Date(date) : date;
    // Return Date object adjusted to display in the target timezone
    const tzDate = new Date(d.toLocaleString("en-US", { timeZone: locale.primaryTimezone }));
    return tzDate;
}

/** Get timezone offset label for a country (e.g., "UTC+10") */
export function getTimezoneLabel(iso2: string): string {
    const locale = COUNTRY_LOCALES[iso2];
    if (!locale) return "UTC";

    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: locale.primaryTimezone,
        timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(now);
    const tzPart = parts.find(p => p.type === "timeZoneName");
    return tzPart?.value || "UTC";
}

// ── Measurement Label Helpers ──

export function getDistanceLabel(iso2: string): string {
    return COUNTRY_LOCALES[iso2]?.distanceUnit === "mi" ? "miles" : "kilometers";
}

export function getWeightLabel(iso2: string): string {
    const unit = COUNTRY_LOCALES[iso2]?.weightUnit;
    switch (unit) {
        case "lb": return "pounds";
        case "ton": return "tons";
        case "t": return "tonnes";
        default: return "kilograms";
    }
}

export function getMeasurementSystem(iso2: string): "metric" | "imperial" | "mixed" {
    return COUNTRY_LOCALES[iso2]?.measurementSystem || "metric";
}
