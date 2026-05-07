import { Metadata } from 'next';
import { getPageFamilyOgImage } from '@/components/ui/PageFamilyBackground';
import { HCGlobalHeader } from '@/components/landing-system/navigation/HCGlobalHeader';
import { HCFooterShell } from '@/components/landing-system/footer/HCFooterShell';

export const dynamic = 'force-dynamic';

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
    return (
        <div className="flex flex-col ">
            <HCGlobalHeader />
            <div style={{ background: '#111118', borderBottom: '1px solid #1a1a22', position: 'sticky', top: 0, zIndex: 40, padding: '12px 24px', display: 'flex', gap: '24px', overflowX: 'auto', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 600 }}>
               <a href="/training" style={{ color: '#e8e8e8', textDecoration: 'none' }}>Training Home</a>
               <a href="/training/safety-library" style={{ color: '#9a9ab0', textDecoration: 'none', transition: 'color 0.2s' }}>Safety Library</a>
               <a href="/training/verify" style={{ color: '#9a9ab0', textDecoration: 'none', transition: 'color 0.2s' }}>Verify Certification</a>
               <a href="/training/pre-class-support" style={{ color: '#9a9ab0', textDecoration: 'none', transition: 'color 0.2s' }}>Pre-Class Tech Support</a>
               <a href="/training/replacement-card" style={{ color: '#9a9ab0', textDecoration: 'none', transition: 'color 0.2s' }}>Replacement Cards</a>
               <a href="/training/corporate" style={{ color: '#9a9ab0', textDecoration: 'none', transition: 'color 0.2s' }}>Corporate Booking</a>
               <a href="/training/report-card" style={{ color: '#F5A623', textDecoration: 'none', marginLeft: 'auto' }}>Your Report Card →</a>
            </div>
            <main className="flex-1">
                {children}
            </main>
            <HCFooterShell />
        </div>
    );
}