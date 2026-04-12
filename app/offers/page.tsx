import type { Metadata } from 'next';
import OffersClient from './OffersClient';

export const metadata: Metadata = {
  title: 'Your Offers â€” Haul Command Dispatch',
  description: 'View and respond to escort job offers. Accept or decline incoming dispatch requests.',
};

export default function OffersPage() {
  return <OffersClient />;
}