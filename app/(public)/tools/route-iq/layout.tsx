import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Route IQ | Load Impact & Compliance Checker | Haul Command',
    description: 'Instantly compute escort requirements, state restrictions, and heavy haul compliance constraints for any oversize route. Free for all carriers.',
};

export default function RouteIqLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}