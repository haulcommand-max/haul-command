import { Metadata } from 'next';
import RateIndexPageClient from './RateIndexPageClient';

export const metadata: Metadata = {
    title: 'Escort Rate Index — Live Oversize Escort Pricing by Corridor | Haul Command',
    description: 'Free, live escort pricing intelligence for oversize and heavy haul corridors across 57 countries. See average pilot car rates per mile, corridor trends, and demand signals. Updated daily.',
    keywords: ['escort rate index', 'pilot car rates', 'oversize escort pricing', 'heavy haul rates', 'corridor pricing', 'load board rates'],
    openGraph: {
        title: 'Escort Rate Index — Live Corridor Pricing | Haul Command',
        description: 'The industry\'s first public escort rate index. See live pricing for oversize and heavy haul escort services by corridor.',
        type: 'website',
        url: 'https://haulcommand.com/rate-index',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Escort Rate Index | Haul Command',
        description: 'Live oversize escort pricing by corridor. Free data, pro insights.',
    },
};

export default function RateIndexPage() {
    return <RateIndexPageClient />;
}
