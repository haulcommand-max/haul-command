'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/* ═══════════════════════════════════════════════════════════
   SCROLL REVEAL — IntersectionObserver-based entrance animation
   
   Wraps any section to add a smooth fade-up on scroll-into-view.
   Uses the ag-reveal CSS class from globals.css.
   ═══════════════════════════════════════════════════════════ */

interface ScrollRevealProps {
  children: ReactNode;
  threshold?: number;
  className?: string;
}

export default function ScrollReveal({ children, threshold = 0.15, className = '' }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={`ag-reveal ${visible ? 'visible' : ''} ${className}`}
    >
      {children}
    </div>
  );
}
