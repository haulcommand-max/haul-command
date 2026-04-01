/**
 * AudioPronunciation — Play audio pronunciation for glossary terms.
 *
 * P1: 10X differentiation — hear how industry terms are pronounced.
 * Uses Web Speech API (SpeechSynthesis) with fallback.
 * Styled as a compact pill button that sits next to term headings.
 */
'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

interface AudioPronunciationProps {
  /** The term to pronounce */
  term: string;
  /** Optional phonetic guide to display */
  phonetic?: string;
  /** Optional custom audio URL (mp3/ogg) for curated pronunciation */
  audioUrl?: string;
  /** Size variant */
  variant?: 'pill' | 'icon' | 'inline';
  /** Optional className */
  className?: string;
}

export default function AudioPronunciation({
  term,
  phonetic,
  audioUrl,
  variant = 'pill',
  className = '',
}: AudioPronunciationProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check if speech synthesis is supported
    if (typeof window !== 'undefined') {
      setIsSupported('speechSynthesis' in window || !!audioUrl);
    }
  }, [audioUrl]);

  const handlePlay = useCallback(() => {
    if (isPlaying) return;
    setIsPlaying(true);

    // 1. Try custom audio URL first
    if (audioUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrl);
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play()
        .then(() => {
          audioRef.current!.onended = () => setIsPlaying(false);
        })
        .catch(() => {
          // Fallback to speech synthesis
          playWithSpeechSynthesis();
        });
      return;
    }

    // 2. Use Web Speech API
    playWithSpeechSynthesis();
  }, [isPlaying, audioUrl, term]);

  const playWithSpeechSynthesis = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      setIsPlaying(false);
      setIsSupported(false);
      return;
    }

    // Cancel any existing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(term);
    utterance.lang = 'en-US';
    utterance.rate = 0.85; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Try to find a natural-sounding voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.lang.startsWith('en') && (
        v.name.includes('Natural') ||
        v.name.includes('Samantha') ||
        v.name.includes('Google') ||
        v.name.includes('Microsoft') ||
        v.name.includes('Alex')
      )
    ) || voices.find(v => v.lang.startsWith('en-US'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [term]);

  if (!isSupported) return null;

  // Speaker icon SVG
  const SpeakerIcon = () => (
    <svg
      width={variant === 'icon' ? 18 : 14}
      height={variant === 'icon' ? 18 : 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      {isPlaying ? (
        <>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </>
      ) : (
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      )}
    </svg>
  );

  if (variant === 'icon') {
    return (
      <button
        aria-label={`Pronounce ${term}`}
        onClick={handlePlay}
        disabled={isPlaying}
        className={`audio-pronunciation-icon ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: 'none',
          background: isPlaying ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.08)',
          color: isPlaying ? '#3B82F6' : 'rgba(255,255,255,0.5)',
          cursor: isPlaying ? 'default' : 'pointer',
          transition: 'all 0.2s ease',
        }}
      >
        <SpeakerIcon />
      </button>
    );
  }

  if (variant === 'inline') {
    return (
      <button
        aria-label={`Pronounce ${term}`}
        onClick={handlePlay}
        disabled={isPlaying}
        className={`audio-pronunciation-inline ${className}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'none',
          border: 'none',
          color: isPlaying ? '#3B82F6' : 'rgba(255,255,255,0.4)',
          cursor: isPlaying ? 'default' : 'pointer',
          padding: 0,
          fontSize: 'inherit',
          transition: 'color 0.2s ease',
        }}
      >
        <SpeakerIcon />
        {phonetic && (
          <span style={{ fontSize: 14, fontStyle: 'italic', opacity: 0.7 }}>
            /{phonetic}/
          </span>
        )}
      </button>
    );
  }

  // Default: pill variant
  return (
    <button
      aria-label={`Pronounce ${term}`}
      onClick={handlePlay}
      disabled={isPlaying}
      className={`audio-pronunciation-pill ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 14px',
        borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.1)',
        background: isPlaying
          ? 'rgba(59,130,246,0.15)'
          : 'rgba(255,255,255,0.05)',
        color: isPlaying ? '#3B82F6' : 'rgba(255,255,255,0.6)',
        cursor: isPlaying ? 'default' : 'pointer',
        fontSize: 12,
        fontWeight: 700,
        transition: 'all 0.2s ease',
        whiteSpace: 'nowrap',
      }}
    >
      <SpeakerIcon />
      <span>{isPlaying ? 'Playing...' : phonetic ? `/${phonetic}/` : 'Pronounce'}</span>
    </button>
  );
}
