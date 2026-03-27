import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Intelligence Hub — Heavy Haul Industry Analysis & Reports',
  description: 'Expert analysis on escort regulations, pilot car reciprocity, superload corridors, police scheduling, and heavy haul market trends. Updated weekly.',
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
