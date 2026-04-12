import type { Metadata } from 'next';
import EstimateForm from './EstimateForm';

export const metadata: Metadata = {
    title: 'Instant Pilot Car Cost Estimate | Heavy Haul Quote in 30 Seconds',
    description: 'Get an instant escort cost estimate for your oversize load. Enter dimensions and route â€” see pilot car pricing, escort requirements, permit costs, and operator availability in 30 seconds. Free. No login.',
    alternates: {
        canonical: 'https://www.haulcommand.com/estimate',
    },
};

const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Haul Command Instant Quote',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any',
    description: 'Free instant pilot car and escort cost estimator for oversize and overweight loads.',
    url: 'https://www.haulcommand.com/estimate',
    offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
    },
};

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'How much does a pilot car cost?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Pilot car costs typically range from $400 to $800 per day in the US ($1.50-$3.00 per mile), $450-$900 per day in Canada, and $350-$900 per day in Europe. The total depends on load dimensions, route length, number of escorts required, permit needs, and seasonal demand. Use the Haul Command instant estimator for a route-specific quote.',
            },
        },
        {
            '@type': 'Question',
            name: 'How many escort vehicles do I need?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Escort requirements depend on load dimensions: loads wider than 14 feet (4.27m) typically need 2 escorts, loads wider than 12 feet (3.66m) or taller than 14.5 feet (4.42m) need at least 1 escort. Loads wider than 16 feet (4.88m) may also require police escorts. Requirements vary by state and country â€” this estimator calculates the exact needs for your route.',
            },
        },
        {
            '@type': 'Question',
            name: 'Is this quote estimate accurate?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'This tool provides a benchmark estimate based on current regional rate data and standard escort regulations. Actual costs may vary based on operator availability, exact route conditions, special equipment needs, and negotiated rates. For a binding quote, request matching with verified escorts through the platform.',
            },
        },
    ],
};

export default function EstimatePage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

            <div style={{ minHeight: '100vh', background: '#0B0B0C', color: '#F0F0F2' }}>
                {/* â”€â”€ Hero â”€â”€ */}
                <section style={{
                    position: 'relative', overflow: 'hidden',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                    <div style={{
                        position: 'absolute', inset: 0, opacity: 0.12, pointerEvents: 'none',
                        background: 'radial-gradient(ellipse at 50% 0%, rgba(198,146,58,0.5) 0%, transparent 60%)',
                    }} />
                    <div style={{
                        maxWidth: 800, margin: '0 auto', padding: '72px 24px 48px',
                        position: 'relative', zIndex: 1, textAlign: 'center',
                    }}>
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            background: 'rgba(198,146,58,0.08)', border: '1px solid rgba(198,146,58,0.20)',
                            borderRadius: 999, padding: '5px 14px',
                            fontSize: 10, fontWeight: 800, textTransform: 'uppercase' as const,
                            letterSpacing: '0.1em', color: '#C6923A', marginBottom: 20,
                        }}>
                            âš¡ #1 commercial-intent tool in heavy haul
                        </div>
                        <h1 style={{
                            fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900,
                            lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 14,
                        }}>
                            How Much Does a{' '}
                            <span style={{
                                background: 'linear-gradient(135deg, #C6923A, #E4B872)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            }}>
                                Pilot Car Cost?
                            </span>
                        </h1>
                        <p style={{ fontSize: 16, color: '#9CA3AF', lineHeight: 1.6, maxWidth: 560, margin: '0 auto' }}>
                            Enter your load dimensions and route. Get escort requirements,
                            cost range, permits, and operator availability in 30 seconds.
                        </p>
                    </div>
                </section>

                {/* â”€â”€ Quote Form â”€â”€ */}
                <EstimateForm />
            </div>
        </>
    );
}