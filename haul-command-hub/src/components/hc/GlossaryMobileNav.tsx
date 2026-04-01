'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Props {
  letters: string[];
  letterCounts: Record<string, number>;
  totalTerms: number;
}

/**
 * GlossaryMobileNav — Sticky search + A–Z quick-jump bar
 * 
 * Mobile-first design:
 * - Search bar is FIRST and prominent
 * - Sticky horizontal A–Z scroll strip with gold highlight
 * - High-contrast letter chips with clear active/disabled states
 * - Smooth scroll to letter sections
 */
export default function GlossaryMobileNav({ letters, letterCounts, totalTerms }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  // Track which letter section is in view via IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id;
            if (id.startsWith('letter-')) {
              setActiveLetter(id.replace('letter-', ''));
            }
          }
        }
      },
      { rootMargin: '-100px 0px -70% 0px', threshold: 0 }
    );

    letters.forEach(l => {
      const el = document.getElementById(`letter-${l}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [letters]);

  // Auto-scroll the A–Z strip to keep active letter visible
  useEffect(() => {
    if (!activeLetter || !scrollRef.current) return;
    const btn = scrollRef.current.querySelector(`[data-letter="${activeLetter}"]`);
    if (btn) {
      btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeLetter]);

  const handleLetterClick = useCallback((letter: string) => {
    const el = document.getElementById(`letter-${letter}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveLetter(letter);
    }
  }, []);

  // Client-side search filter (hides non-matching cards)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const q = searchQuery.toLowerCase().trim();
    
    // Get all term card links within letter sections
    const allCards = document.querySelectorAll('[data-glossary-card]');
    
    if (!q) {
      // Show all
      allCards.forEach(card => {
        (card as HTMLElement).style.display = '';
      });
      // Show all letter sections
      document.querySelectorAll('[id^="letter-"]').forEach(sec => {
        (sec as HTMLElement).style.display = '';
      });
      return;
    }

    // Hide non-matching cards
    const visibleLetters = new Set<string>();
    allCards.forEach(card => {
      const el = card as HTMLElement;
      const text = el.textContent?.toLowerCase() ?? '';
      if (text.includes(q)) {
        el.style.display = '';
        const letter = el.closest('[id^="letter-"]')?.id.replace('letter-', '');
        if (letter) visibleLetters.add(letter);
      } else {
        el.style.display = 'none';
      }
    });

    // Hide empty letter sections
    document.querySelectorAll('[id^="letter-"]').forEach(sec => {
      const letter = sec.id.replace('letter-', '');
      (sec as HTMLElement).style.display = visibleLetters.has(letter) ? '' : 'none';
    });
  }, [searchQuery]);

  return (
    <div className="sticky top-0 z-30 -mx-4 px-4 pb-3 pt-2 mb-6 bg-[#0B0F14]/98 backdrop-blur-xl border-b border-white/[0.06]">
      {/* Search bar — PRIMARY interaction */}
      <div className="relative mb-3">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">🔍</div>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${totalTerms.toLocaleString()} terms…`}
          className="w-full bg-white/[0.06] border border-white/[0.12] rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-accent/50 focus:bg-white/[0.08] transition-all"
          autoComplete="off"
          autoCorrect="off"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs w-6 h-6 rounded-full bg-white/10 flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* A–Z Horizontal Scroll Strip — HIGH CONTRAST */}
      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto -mx-1 px-1 py-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {allLetters.map(letter => {
          const hasTerms = letters.includes(letter);
          const isActive = activeLetter === letter;
          const count = letterCounts[letter] ?? 0;
          
          return (
            <button
              key={letter}
              data-letter={letter}
              onClick={() => hasTerms && handleLetterClick(letter)}
              disabled={!hasTerms}
              style={
                isActive
                  ? { background: '#f59e0b', color: '#000', boxShadow: '0 0 16px rgba(245,158,11,0.4)' }
                  : hasTerms
                    ? { background: 'rgba(245,158,11,0.08)', borderColor: 'rgba(245,158,11,0.25)', color: '#fbbf24' }
                    : { background: 'transparent', borderColor: 'rgba(255,255,255,0.06)', color: '#374151' }
              }
              className={`
                flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center 
                text-xs font-black transition-all duration-150 border
                ${isActive
                  ? 'scale-110'
                  : hasTerms
                    ? 'hover:scale-105 active:scale-95'
                    : 'cursor-default'
                }
              `}
              title={hasTerms ? `${letter} — ${count} term${count !== 1 ? 's' : ''}` : `No terms for ${letter}`}
            >
              {letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}
