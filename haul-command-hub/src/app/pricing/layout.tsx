import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — Operator, Broker & Enterprise Plans',
  description: 'Compare Haul Command subscription plans for pilot car operators, freight brokers, and enterprise fleets. From free listings to Corridor Elite. Cancel anytime.',
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
