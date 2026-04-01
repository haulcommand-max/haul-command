'use client';

import React from 'react';
import Link from 'next/link';

const GLOSSARY_TERMS: Record<string, string> = {
  'superload': '/glossary/superload',
  'super load': '/glossary/superload',
  'twic': '/glossary/twic-card',
  'twic card': '/glossary/twic-card',
  'bol': '/glossary/bill-of-lading',
  'bill of lading': '/glossary/bill-of-lading',
  'pod': '/glossary/proof-of-delivery',
  'proof of delivery': '/glossary/proof-of-delivery',
  'escort vehicle': '/glossary/pilot-car',
  'pilot car': '/glossary/pilot-car',
  'steerable trailer': '/glossary/steerable-trailer',
  'jeep': '/glossary/jeep',
  'stinger': '/glossary/stinger',
  'overdimensional': '/glossary/overdimensional',
  'heavy haul': '/glossary/heavy-haul',
  'route survey': '/glossary/route-survey',
  'curfew': '/glossary/curfew',
};

interface AutoLinkerProps {
  text: string;
  className?: string;
  autoSaveLocal?: boolean;
}

/**
 * Programmatic AutoLinker Engine
 * Scans static text blocks and identifies key logistics terminology,
 * automatically wrapping them in dofollow internal links to boost SEO
 * and contextually educate operators.
 */
export default function AutoLinker({ text, className = '' }: AutoLinkerProps) {
  if (!text) return null;

  // Build a regex pattern from the keys, sorted by length descending so longer terms match first
  const terms = Object.keys(GLOSSARY_TERMS).sort((a, b) => b.length - a.length);
  // Boundary \b doesn't work well if terms contains spaces or special characters sometimes but here terms are alphanumeric + space
  const pattern = new RegExp(`\\b(${terms.join('|')})\\b`, 'gi');

  const parts = text.split(pattern);

  return (
    <span className={className}>
      {parts.map((part, i) => {
        const lowerPart = part.toLowerCase();
        if (GLOSSARY_TERMS[lowerPart]) {
          return (
            <Link 
              key={`link-${i}`} 
              href={GLOSSARY_TERMS[lowerPart]} 
              className="text-yellow-500 hover:text-yellow-400 font-medium underline decoration-yellow-500/30 transition-colors"
            >
              {part}
            </Link>
          );
        }
        return <React.Fragment key={`text-${i}`}>{part}</React.Fragment>;
      })}
    </span>
  );
}
