import { Metadata } from 'next';
import RateIndexPageClient from './RateIndexPageClient';

export const metadata: Metadata = {
    title: 'Escort Rate Index - Oversize Escort Pricing by Corridor | Haul Command',
    description: 'Free escort pricing benchmarks for oversize and heavy haul corridors where source data is available. See average pilot car rates per mile, corridor trends, and demand signals.',
    keywords: ['escort rate index', 'pilot car rates', 'oversize escort pricing', 'heavy haul rates', 'corridor pricing', 'load board rates'],
    openGraph: {
        title: 'Escort Rate Index - Corridor Pricing Benchmarks | Haul Command',
        description: 'The industry\'s first public escort rate index. See live pricing for oversize and heavy haul escort services by corridor.',
        type: 'website',
        url: 'https://haulcommand.com/rate-index',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Escort Rate Index | Haul Command',
        description: 'Oversize escort pricing benchmarks by corridor. Free data, pro insights.',
    },
};

export default function RateIndexPage() {
    return <RateIndexPageClient />;
}