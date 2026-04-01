/**
 * SwipeableRunCard — Touch gesture to accept/reject load cards.
 *
 * P1: Mobile delight — swipe right to accept, swipe left to skip.
 * Uses pointer events for cross-browser touch support.
 * Includes haptic feedback when threshold is reached.
 */
'use client';

import React, { useRef, useState, useCallback } from 'react';
import { triggerHaptic } from '@/lib/mobile/haptics';

interface SwipeableRunCardProps {
  /** Unique ID for the card */
  id: string;
  /** Callback when swiped right (accept) */
  onAccept: (id: string) => void;
  /** Callback when swiped left (skip/reject) */
  onSkip: (id: string) => void;
  /** Content to render inside the card */
  children: React.ReactNode;
  /** Threshold in pixels before action triggers (default: 100) */
  threshold?: number;
  /** Accept label */
  acceptLabel?: string;
  /** Skip label */
  skipLabel?: string;
  /** Style overrides */
  className?: string;
}

const SPRING_TENSION = 0.15;
const MAX_ROTATION = 8;
const OPACITY_DECAY_START = 80;

export default function SwipeableRunCard({
  id,
  onAccept,
  onSkip,
  children,
  threshold = 100,
  acceptLabel = 'Accept',
  skipLabel = 'Skip',
  className = '',
}: SwipeableRunCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const isHorizontal = useRef<boolean | null>(null);
  const hasTriggeredHaptic = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (isExiting) return;
    startX.current = e.clientX;
    startY.current = e.clientY;
    isHorizontal.current = null;
    hasTriggeredHaptic.current = false;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [isExiting]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || isExiting) return;

    const dx = e.clientX - startX.current;
    const dy = e.clientY - startY.current;

    // Determine scroll direction on first significant move
    if (isHorizontal.current === null) {
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        isHorizontal.current = Math.abs(dx) > Math.abs(dy);
      }
      return;
    }

    // If vertical scroll, don't interfere
    if (!isHorizontal.current) return;

    e.preventDefault();
    setOffset(dx);

    // Haptic feedback when crossing threshold
    if (Math.abs(dx) >= threshold && !hasTriggeredHaptic.current) {
      hasTriggeredHaptic.current = true;
      triggerHaptic('medium');
    }
    if (Math.abs(dx) < threshold && hasTriggeredHaptic.current) {
      hasTriggeredHaptic.current = false;
    }
  }, [isDragging, isExiting, threshold]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging || isExiting) return;
    setIsDragging(false);

    if (Math.abs(offset) >= threshold) {
      const direction = offset > 0 ? 'right' : 'left';
      setExitDirection(direction);
      setIsExiting(true);
      triggerHaptic('heavy');

      // Animate out then trigger callback
      setTimeout(() => {
        if (direction === 'right') {
          onAccept(id);
        } else {
          onSkip(id);
        }
        // Reset after callback
        setTimeout(() => {
          setIsExiting(false);
          setExitDirection(null);
          setOffset(0);
        }, 50);
      }, 300);
    } else {
      // Spring back
      setOffset(0);
    }
  }, [isDragging, isExiting, offset, threshold, id, onAccept, onSkip]);

  // Visual calculations
  const rotation = isDragging ? (offset / threshold) * MAX_ROTATION : 0;
  const clampedRotation = Math.max(-MAX_ROTATION, Math.min(MAX_ROTATION, rotation));
  const progress = Math.min(1, Math.abs(offset) / threshold);
  const acceptOpacity = offset > 0 ? progress : 0;
  const skipOpacity = offset < 0 ? progress : 0;

  const exitTranslate = isExiting
    ? exitDirection === 'right' ? 'translateX(120%)' : 'translateX(-120%)'
    : `translateX(${offset}px) rotate(${clampedRotation}deg)`;

  return (
    <div
      className={`swipeable-run-card-container ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        touchAction: isDragging && isHorizontal.current ? 'none' : 'pan-y',
      }}
    >
      {/* Accept indicator (right) */}
      <div
        className="swipe-indicator swipe-accept"
        style={{
          position: 'absolute',
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: acceptOpacity,
          transition: isDragging ? 'none' : 'opacity 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 0,
        }}
      >
        <div style={{
          width: 44, height: 44,
          borderRadius: 22,
          background: 'rgba(34,197,94,0.2)',
          border: `2px solid rgba(34,197,94,${0.3 + progress * 0.7})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: `scale(${0.8 + progress * 0.4})`,
          transition: isDragging ? 'none' : 'transform 0.2s ease',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <span style={{
          fontSize: 13,
          fontWeight: 800,
          color: '#22C55E',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {acceptLabel}
        </span>
      </div>

      {/* Skip indicator (left) */}
      <div
        className="swipe-indicator swipe-skip"
        style={{
          position: 'absolute',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: skipOpacity,
          transition: isDragging ? 'none' : 'opacity 0.2s ease',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          zIndex: 0,
          flexDirection: 'row-reverse',
        }}
      >
        <div style={{
          width: 44, height: 44,
          borderRadius: 22,
          background: 'rgba(239,68,68,0.2)',
          border: `2px solid rgba(239,68,68,${0.3 + progress * 0.7})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: `scale(${0.8 + progress * 0.4})`,
          transition: isDragging ? 'none' : 'transform 0.2s ease',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
        <span style={{
          fontSize: 13,
          fontWeight: 800,
          color: '#EF4444',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {skipLabel}
        </span>
      </div>

      {/* Main card content */}
      <div
        ref={cardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: 'relative',
          zIndex: 1,
          transform: exitTranslate,
          transition: isDragging ? 'none' : isExiting ? 'transform 0.3s cubic-bezier(0.4,0,0.2,1)' : 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        {/* Colored border overlay based on swipe direction */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          border: acceptOpacity > 0
            ? `2px solid rgba(34,197,94,${acceptOpacity * 0.6})`
            : skipOpacity > 0
            ? `2px solid rgba(239,68,68,${skipOpacity * 0.6})`
            : '2px solid transparent',
          pointerEvents: 'none',
          transition: isDragging ? 'none' : 'border-color 0.2s ease',
          zIndex: 2,
        }} />
        {children}
      </div>
    </div>
  );
}
