import { Metadata } from 'next';
import { getPageFamilyOgImage } from '@/components/ui/PageFamilyBackground';

export async function generateMetadata(): Promise<Metadata> {
    return {
        title: "Heavy Haul Training & Certification | Haul Command",
        description: "The only global training program and certification built specifically for pilot car and escort operators working in heavy haul, wind energy, and autonomous vehicle corridors.",
        openGraph: {
            title: "Heavy Haul Training & Certification | Haul Command",
            description: "Built on FMCSA + SC&RA standards. Get certified, get chosen first.",
            images: [getPageFamilyOgImage('training')],
        },
        twitter: {
            card: "summary_large_image",
            images: [getPageFamilyOgImage('training')],
        }
    };
}

export default function TrainingLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
