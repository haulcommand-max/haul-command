'use client';

import React from 'react';
import { useLocale } from '@/lib/i18n/LocaleProvider';

const LOCALES = [
    { code: 'en-US', label: 'English (US)', flag: '🇺🇸' },
    { code: 'en-CA', label: 'English (Canada)', flag: '🇨🇦' },
    { code: 'fr-CA', label: 'Français (Canada)', flag: '🇨🇦' },
    { code: 'es-US', label: 'Español (US)', flag: '🇺🇸' },
    { code: 'es-CA', label: 'Español (Canada)', flag: '🇨🇦' },
] as const;

export function LanguageSelector() {
    const { locale, setLocale } = useLocale();

    return (
        <div className="relative group">
            <button
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                aria-label="Select language"
            >
                <span>{LOCALES.find(l => l.code === locale)?.flag || '🌐'}</span>
                <span className="hidden sm:inline">{locale.split('-')[0].toUpperCase()}</span>
            </button>
            <div className="absolute right-0 top-full mt-1 w-48 bg-[#111] border border-white/10 rounded-xl shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all z-50">
                {LOCALES.map(l => (
                    <button
                        key={l.code}
                        onClick={() => setLocale(l.code as any)}
                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-white/5 transition-colors first:rounded-t-xl last:rounded-b-xl ${locale === l.code ? 'text-amber-500 font-bold' : 'text-slate-300'
                            }`}
                    >
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}
