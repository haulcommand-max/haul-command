'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

type Locale = 'en-US' | 'en-CA' | 'fr-CA' | 'es-US' | 'es-CA';

const SUPPORTED_LOCALES: Locale[] = ['en-US', 'en-CA', 'fr-CA', 'es-US', 'es-CA'];
const DEFAULT_LOCALE: Locale = 'en-US';
const COOKIE_NAME = 'hc_locale';

type Messages = Record<string, any>;

interface LocaleContextValue {
    locale: Locale;
    messages: Messages;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
    locale: DEFAULT_LOCALE,
    messages: {},
    setLocale: () => { },
    t: (key: string) => key,
});

export function useLocale() {
    return useContext(LocaleContext);
}

// Deep getter: t("nav.home") → messages.nav.home
function deepGet(obj: any, path: string): string {
    const keys = path.split('.');
    let current = obj;
    for (const key of keys) {
        if (current == null) return path;
        current = current[key];
    }
    return typeof current === 'string' ? current : path;
}

function getCookie(name: string): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
}

function setCookie(name: string, value: string, days: number = 365) {
    if (typeof document === 'undefined') return;
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};path=/;expires=${expires};SameSite=Lax`;
}

// Cache loaded messages
const messageCache: Record<string, Messages> = {};

async function loadMessages(locale: Locale): Promise<Messages> {
    if (messageCache[locale]) return messageCache[locale];
    try {
        const res = await fetch(`/messages/${locale}.json`);
        if (!res.ok) throw new Error(`Failed to load ${locale}`);
        const data = await res.json();
        messageCache[locale] = data;
        return data;
    } catch {
        // Fallback to en-US
        if (locale !== DEFAULT_LOCALE) return loadMessages(DEFAULT_LOCALE);
        return {};
    }
}

export function LocaleProvider({ children, initialLocale }: { children: ReactNode; initialLocale?: Locale }) {
    const [locale, setLocaleState] = useState<Locale>(() => {
        const cookie = getCookie(COOKIE_NAME);
        if (cookie && SUPPORTED_LOCALES.includes(cookie as Locale)) return cookie as Locale;
        return initialLocale || DEFAULT_LOCALE;
    });
    const [messages, setMessages] = useState<Messages>({});

    useEffect(() => {
        loadMessages(locale).then(setMessages);
    }, [locale]);

    const setLocale = useCallback(async (newLocale: Locale) => {
        if (!SUPPORTED_LOCALES.includes(newLocale)) return;
        setLocaleState(newLocale);
        setCookie(COOKIE_NAME, newLocale);

        // Persist to profile if logged in
        try {
            await fetch('/api/locale', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ locale: newLocale }),
            });
        } catch {
            // Ignore — cookie is already set
        }
    }, []);

    const t = useCallback((key: string) => deepGet(messages, key), [messages]);

    return (
        <LocaleContext.Provider value={{ locale, messages, setLocale, t }}>
            {children}
        </LocaleContext.Provider>
    );
}
