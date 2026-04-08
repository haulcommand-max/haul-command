'use client';

import React from 'react';
import Link from 'next/link';

// ══════════════════════════════════════════════════════════════
// AUTO LINKER — High-performance SEO Internal Linking
// Automatically scans text for known heavy-haul industry terms
// and replaces them with active <Link> tags directed to our glossary.
// ══════════════════════════════════════════════════════════════

interface AutoLinkerProps {
  content: string;
  className?: string;
  // Terms to explicitly skip to prevent over-linking
  skipTerms?: string[];
  // Terms to map (term => slug)
  dictionary?: Record<string, string>;
}

// Default dictionary of heavy-haul SEO targets
const DEFAULT_DICTIONARY: Record<string, string> = {
  'pilot car': 'pilot-car',
  'escort vehicle': 'escort-vehicle',
  'high pole': 'high-pole',
  'steersman': 'steersman',
  'superload': 'superload',
  'heavy haul': 'heavy-haul',
  'oversize load': 'oversize-load',
  'route survey': 'route-survey',
  'tillerman': 'tillerman',
  'lead escort': 'lead-escort',
  'chase escort': 'chase-escort',
  'load board': 'load-board',
  'amber light pulse': 'amber-light-pulse',
  'dot dot number': 'dot-number',
  'fmcsa': 'fmcsa',
  'cdl': 'commercial-drivers-license'
};

export function AutoLinker({ 
  content, 
  className = '', 
  skipTerms = [],
  dictionary = DEFAULT_DICTIONARY 
}: AutoLinkerProps) {
  
  if (!content) return null;

  // We only want to link the FIRST occurrence of a term in a given block
  // to prevent keyword stuffing penalties from Google.
  const linkedTerms = new Set<string>();

  // Filter out skipped terms
  const activeKeys = Object.keys(dictionary).filter(k => !skipTerms.includes(k));

  // Sort by length descending, so "pilot car" matches before "car" (if car was a term)
  activeKeys.sort((a, b) => b.length - a.length);

  // Build a massive regex that matches any dictionary term
  // Boundaries (\b) ensure we don't match inside other words.
  const regexPattern = new RegExp(`\\b(${activeKeys.map(k => escapeRegExp(k)).join('|')})\\b`, 'gi');

  const parts = [];
  let lastIndex = 0;
  let match;

  // Execute regex to find all terms
  while ((match = regexPattern.exec(content)) !== null) {
    const matchedStr = match[0];
    const matchLower = matchedStr.toLowerCase();
    
    // Add text preceding the match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    if (!linkedTerms.has(matchLower)) {
      // First time seeing this term, generate an SEO-optimized link
      linkedTerms.add(matchLower);
      const slug = dictionary[matchLower];
      
      parts.push(
        <Link 
          key={`link-${match.index}`} 
          href={`/glossary/${slug}`}
          className="text-[#d4950e] hover:text-[#e8a828] underline decoration-[#d4950e]/30 underline-offset-2 transition-colors font-semibold"
          title={`Read definition for ${matchedStr}`}
        >
          {matchedStr}
        </Link>
      );
    } else {
      // Already linked this term, leave it as raw text
      parts.push(matchedStr);
    }

    lastIndex = regexPattern.lastIndex;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return (
    <div className={`auto-linked-content leading-relaxed ${className}`}>
      {parts.length > 0 ? parts : content}
    </div>
  );
}

// Utility to escape regex characters safely
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
