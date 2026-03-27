import type { Metadata } from 'next';
import LiveMapClient from './LiveMapClient';

export const metadata: Metadata = {
  title: 'Live Dispatch Map — Heavy Haul Operations | Haul Command',
  description: 'Real-time dispatch map showing all active oversize loads, escort positions, permit routes, and clearance intelligence across 120 countries.',
};

export default function LiveMapPage() {
  return <LiveMapClient />;
}
