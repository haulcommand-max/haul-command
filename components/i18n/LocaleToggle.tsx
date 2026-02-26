'use client';

import { useState, useCallback } from 'react';
import type { SupportedLocale } from '@/lib/i18n/locale';

/**
 * LocaleToggle — compact EN/FR toggle for Canadian visitors.
 * US visitors never see this component (controlled by server).
 *
 * Sets the hc_locale cookie and refreshes the page.
 */

interface LocaleToggleProps {
    currentLocale: SupportedLocale;
    className?: string;
}

export function LocaleToggle({ currentLocale, className }: LocaleToggleProps) {
    const [locale, setLocale] = useState(currentLocale);

    const switchLocale = useCallback((newLocale: SupportedLocale) => {
        document.cookie = `hc_locale=${newLocale};path=/;max-age=${30 * 86400};SameSite=Lax`;
        setLocale(newLocale);
        // Soft reload to pick up new locale
        window.location.reload();
    }, []);

    const isEn = locale === 'en-CA';
    const isFr = locale === 'fr-CA';

    return (
        <div className={`locale-toggle ${className || ''}`} role="group" aria-label="Language">
            <button
                className={`locale-btn ${isEn ? 'locale-btn--active' : ''}`}
                onClick={() => switchLocale('en-CA')}
                aria-pressed={isEn}
                disabled={isEn}
            >
                EN
            </button>
            <span className="locale-divider">/</span>
            <button
                className={`locale-btn ${isFr ? 'locale-btn--active' : ''}`}
                onClick={() => switchLocale('fr-CA')}
                aria-pressed={isFr}
                disabled={isFr}
            >
                FR
            </button>
            <style>{`
                .locale-toggle {
                    display: inline-flex;
                    align-items: center;
                    gap: 2px;
                    font-size: 12px;
                    font-weight: 500;
                    background: rgba(255,255,255,0.05);
                    border-radius: 6px;
                    padding: 2px 6px;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .locale-btn {
                    background: none;
                    border: none;
                    padding: 2px 4px;
                    cursor: pointer;
                    color: rgba(255,255,255,0.5);
                    font-size: 12px;
                    font-weight: 500;
                    border-radius: 4px;
                    transition: all 0.15s;
                }
                .locale-btn:hover:not(:disabled) {
                    color: rgba(255,255,255,0.9);
                }
                .locale-btn--active {
                    color: #fff;
                    background: rgba(255,255,255,0.1);
                    cursor: default;
                }
                .locale-divider {
                    color: rgba(255,255,255,0.2);
                    font-size: 11px;
                }
            `}</style>
        </div>
    );
}
