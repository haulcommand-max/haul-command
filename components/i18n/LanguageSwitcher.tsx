'use client';

import { useState, useRef, useEffect } from 'react';

// ══════════════════════════════════════════════════════════════
// LANGUAGE SWITCHER — Client component for locale selection
// Reads available locales and current selection from cookies
// Sets hc_locale cookie and reloads page on change
// ══════════════════════════════════════════════════════════════

interface LanguageSwitcherProps {
  currentLocale: string;
  availableLocales: { code: string; label: string }[];
  className?: string;
  compact?: boolean;  // Show only flag/icon (for mobile nav)
}

const FLAG_EMOJIS: Record<string, string> = {
  US: '🇺🇸', CA: '🇨🇦', AU: '🇦🇺', GB: '🇬🇧', NZ: '🇳🇿', ZA: '🇿🇦',
  DE: '🇩🇪', NL: '🇳🇱', AE: '🇦🇪', BR: '🇧🇷', IE: '🇮🇪', SE: '🇸🇪',
  NO: '🇳🇴', DK: '🇩🇰', FI: '🇫🇮', BE: '🇧🇪', AT: '🇦🇹', CH: '🇨🇭',
  ES: '🇪🇸', FR: '🇫🇷', IT: '🇮🇹', PT: '🇵🇹', SA: '🇸🇦', QA: '🇶🇦',
  MX: '🇲🇽', IN: '🇮🇳', ID: '🇮🇩', TH: '🇹🇭', PL: '🇵🇱', CZ: '🇨🇿',
  SK: '🇸🇰', HU: '🇭🇺', SI: '🇸🇮', EE: '🇪🇪', LV: '🇱🇻', LT: '🇱🇹',
  HR: '🇭🇷', RO: '🇷🇴', BG: '🇧🇬', GR: '🇬🇷', TR: '🇹🇷', KW: '🇰🇼',
  OM: '🇴🇲', BH: '🇧🇭', SG: '🇸🇬', MY: '🇲🇾', JP: '🇯🇵', KR: '🇰🇷',
  CL: '🇨🇱', AR: '🇦🇷', CO: '🇨🇴', PE: '🇵🇪', VN: '🇻🇳', PH: '🇵🇭',
  UY: '🇺🇾', PA: '🇵🇦', CR: '🇨🇷',
};

function getFlag(localeCode: string): string {
  const country = localeCode.split('-')[1]?.toUpperCase() || '';
  return FLAG_EMOJIS[country] || '🌐';
}

export default function LanguageSwitcher({
  currentLocale,
  availableLocales,
  className = '',
  compact = false,
}: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleLocaleChange = (newLocale: string) => {
    // Set cookie with 1 year expiry
    document.cookie = `hc_locale=${newLocale};path=/;max-age=31536000;SameSite=Lax`;
    setIsOpen(false);
    // Reload to apply new locale via middleware
    window.location.reload();
  };

  if (availableLocales.length <= 1) return null;

  const currentLabel = availableLocales.find(l => l.code === currentLocale)?.label || currentLocale;
  const currentFlag = getFlag(currentLocale);

  return (
    <div ref={dropdownRef} className={`language-switcher ${className}`} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        id="language-switcher-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: compact ? '6px 8px' : '8px 14px',
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '8px',
          color: 'inherit',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
          transition: 'all 0.2s ease',
          backdropFilter: 'blur(8px)',
        }}
      >
        <span style={{ fontSize: '18px' }}>{currentFlag}</span>
        {!compact && <span>{currentLabel}</span>}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.2s ease',
        }}>
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {isOpen && (
        <div
          role="listbox"
          aria-label="Available languages"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            right: 0,
            minWidth: '200px',
            background: 'rgba(20, 20, 30, 0.95)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '12px',
            padding: '4px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(16px)',
            zIndex: 9999,
            animation: 'fadeSlideDown 0.15s ease-out',
          }}
        >
          {availableLocales.map(locale => (
            <button
              key={locale.code}
              role="option"
              aria-selected={locale.code === currentLocale}
              onClick={() => handleLocaleChange(locale.code)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '10px 14px',
                background: locale.code === currentLocale
                  ? 'rgba(59, 130, 246, 0.15)'
                  : 'transparent',
                border: 'none',
                borderRadius: '8px',
                color: locale.code === currentLocale ? '#60a5fa' : '#e2e8f0',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: locale.code === currentLocale ? 600 : 400,
                textAlign: 'left',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={e => {
                if (locale.code !== currentLocale) {
                  (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                }
              }}
              onMouseLeave={e => {
                if (locale.code !== currentLocale) {
                  (e.target as HTMLElement).style.background = 'transparent';
                }
              }}
            >
              <span style={{ fontSize: '18px' }}>{getFlag(locale.code)}</span>
              <span>{locale.label}</span>
              {locale.code === currentLocale && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginLeft: 'auto' }}>
                  <path d="M3 7L6 10L11 4" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeSlideDown {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .language-switcher button:hover {
          border-color: rgba(255,255,255,0.2) !important;
        }
      `}</style>
    </div>
  );
}
