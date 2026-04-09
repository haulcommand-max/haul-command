'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

/**
 * CSS-based scroll reveal animation. No external deps needed.
 * Uses IntersectionObserver to trigger staggered fade-in/slide-up.
 */
export function ScrollReveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/**
 * Static counter for stats to prevent 0+ trust leaks.
 */
export function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  // We explicitly disable animation to prevent JavaScript/hydation lag from rendering "0+" 
  // on a critical search-authority surface. Truth first.
  return <span>{target.toLocaleString()}{suffix}</span>;
}

/**
 * Enhanced A-Z sticky navigation with active letter tracking.
 */
export function StickyAlphabetNav() {
  const [activeLetter, setActiveLetter] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const letters = document.querySelectorAll('[data-letter]');
      let current = '';
      letters.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 160) {
          current = el.getAttribute('data-letter') || '';
        }
      });
      setActiveLetter(current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const letters = ['#', ...Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ')];

  return (
    <div className="sticky top-0 z-50 bg-[#0B0B0C]/90 backdrop-blur-2xl border-y border-white/5 py-3 mb-10 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {letters.map((letter) => {
          const isActive = activeLetter === letter;
          return (
            <a
              key={letter}
              href={`#letter-${letter}`}
              aria-label={`Jump to ${letter}`}
              className={`
                flex-shrink-0 w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center 
                rounded-xl font-bold text-sm sm:text-base
                transition-all duration-200 active:scale-90
                ${isActive
                  ? 'bg-gradient-to-br from-[#D4A844] to-[#b8892c] text-[#0B0B0C] shadow-[0_0_20px_rgba(212,168,68,0.4)] scale-105 border border-[#D4A844]'
                  : 'bg-white/[0.04] border border-amber-500/40 text-amber-400 hover:bg-[#D4A844]/10 hover:border-[#D4A844]/60 hover:text-[#D4A844] hover:shadow-[0_0_12px_rgba(212,168,68,0.12)]'
                }
              `}
            >
              {letter}
            </a>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Real-time fuzzy search for glossary terms (client-side).
 */
export function GlossarySearch({ terms }: { terms: { slug: string; term: string; short_definition: string; category?: string }[] }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<typeof terms>([]);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return; }
    const q = query.toLowerCase();
    const matched = terms
      .filter(t => t.term.toLowerCase().includes(q) || t.short_definition?.toLowerCase().includes(q))
      .slice(0, 8);
    setResults(matched);
  }, [query, terms]);

  return (
    <div className="max-w-xl mx-auto relative group">
      <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none z-10">
        <svg className={`w-5 h-5 transition-colors duration-200 ${isFocused ? 'text-[#D4A844]' : 'text-white/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="search"
        placeholder="Search 3,000+ terms, acronyms, or regulations..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        className="w-full bg-[#121214] border-2 border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white placeholder-white/40 focus:outline-none focus:border-[#D4A844]/50 focus:ring-4 focus:ring-[#D4A844]/10 transition-all text-base shadow-2xl"
      />

      {/* Live results dropdown */}
      {results.length > 0 && isFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#15151A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2">
          {results.map((t, i) => (
            <a
              key={t.slug}
              href={`/glossary/${t.slug}`}
              className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <span className="text-[#D4A844] text-lg mt-0.5">◆</span>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm">{t.term}</div>
                <div className="text-white/40 text-xs mt-0.5 line-clamp-1">{t.short_definition}</div>
              </div>
              {t.category && (
                <span className="flex-shrink-0 text-[9px] uppercase tracking-widest font-bold text-white/25 bg-white/5 px-2 py-1 rounded-lg self-center">{t.category}</span>
              )}
            </a>
          ))}
          <div className="px-5 py-2.5 bg-white/[0.02] text-center">
            <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">
              {results.length} results · Press Enter for full search
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
