import { notFound } from 'next/navigation';
import SEOLandingPage from '@/components/SEOLandingPage';
import seoData from '@/data/seo_data_manifest.json';

interface PageProps {
    params: Promise<{
        state: string;
        city: string;
    }>;
}

export async function generateStaticParams() {
    // Generate params for each state/city combination
    // We deduplicate to ensure unique routes
    const paths = Array.from(new Set(
        seoData
            .filter(item => item.state && item.city)
            .map(item => `${item.state}/${item.city!.replace(/\s+/g, '-')}`)
    ));

    return paths.map(path => {
        const [state, city] = path.split('/');
        return { state, city };
    });
}

export default async function ServiceLocationPage({ params }: PageProps) {
    const { state, city } = await params;

    // Unslugify city name (e.g., "El-Paso" -> "El Paso")
    const decodedCity = city.replace(/-/g, ' ');

    // Find matching data. In a nested structure, we might have multiple services.
    // For now, we prefer the "CITY_LANDING" type if it exists, or just the first match.
    const cityPages = seoData.filter(
        (item) => item.state && item.city &&
            item.state.toLowerCase() === state.toLowerCase() &&
            item.city.toLowerCase() === decodedCity.toLowerCase()
    );

    if (cityPages.length === 0) {
        notFound();
    }

    // Default to the first one, or preferred CITY_LANDING
    const pageData = cityPages.find(p => p.type === 'CITY_LANDING') || cityPages[0];

    return (
        <SEOLandingPage
            service={pageData.service || 'Specialized Service'}
            city={pageData.city || decodedCity}
            state={pageData.state || state}
            localIntelligence={pageData.local_intelligence || ''}
            availabilityCount={pageData.availability || 0}
            slug={pageData.slug || ''} // Keep slug for now as it's used in schema
        />
    );
}

export async function generateMetadata({ params }: PageProps) {
    const { state, city } = await params;
    const decodedCity = city.replace(/-/g, ' ');

    const pageData = seoData.find(
        (item) => item.state && item.city &&
            item.state.toLowerCase() === state.toLowerCase() &&
            item.city.toLowerCase() === decodedCity.toLowerCase()
    );

    if (!pageData) return { title: 'Service Not Found | Haul Command' };

    return {
        title: `${pageData.service} in ${pageData.city}, ${pageData.state} | Haul Command`,
        description: `Verified ${pageData.service} services in ${pageData.city}, ${pageData.state}. Ground-truth logistics intelligence for Superload and Oversize transport.`,
        openGraph: {
            title: `${pageData.service} - ${pageData.city}, ${pageData.state}`,
            description: `Book specialized escort services in ${pageData.city}.`,
        }
    };
}
