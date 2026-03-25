import type { Metadata } from 'next';
import { OnboardingSwiper } from '@/components/hc/OnboardingSwiper';

export const metadata: Metadata = {
  title: 'Get Started — Join the World\'s Largest Escort Network',
  description: 'Claim your free pilot car operator profile on Haul Command. Join 7,800+ operators across 57 countries. No credit card required.',
};

export default function OnboardingStartPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] overflow-hidden">
      <OnboardingSwiper />
    </main>
  );
}
