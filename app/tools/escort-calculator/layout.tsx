import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Escort Cost Calculator & Rate Estimator | Haul Command',
    description: 'Calculate detailed heavy haul escort vehicle costs by region, service type, and wait time using live 2026 market benchmarks across 120 countries.',
    alternates: {
        canonical: 'https://www.haulcommand.com/tools/escort-calculator',
    },
};

export default function EscortCalculatorLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
