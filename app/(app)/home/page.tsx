import MobileCommandCenter from '@/components/mobile/screens/MobileCommandCenter';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Command Center | Haul Command',
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * /home — Mobile-first Command Center
 * Frame 3 spec: Stats, routes, market pulse, leaderboard peek
 * This lives under (app) layout which has the bottom nav
 */
export default function MobileHomePage() {
  return <MobileCommandCenter />;
}