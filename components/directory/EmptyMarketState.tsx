import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

interface EmptyMarketStateProps {
    country: string;
    region?: string;
    city?: string;
}

export function EmptyMarketState({ country, region, city }: EmptyMarketStateProps) {
    const locationName = city ? `${city}, ${region || country}` : region ? `${region}, ${country}` : country;
    const locationQuery = encodeURIComponent(locationName);

    return (
        <div style={{
            background: '#111114',
            border: '1px dashed rgba(255,255,255,0.15)',
            borderRadius: 16,
            padding: 32,
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background pattern */}
            <div style={{
                position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none',
                backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")',
            }} />

            <div style={{ position: 'relative', zIndex: 1, maxWidth: 600, margin: '0 auto' }}>
                <div style={{
                    fontSize: 48,
                    marginBottom: 16,
                    opacity: 0.8
                }}>
                    📡
                </div>
                
                <h2 style={{
                    fontSize: 24,
                    fontWeight: 800,
                    color: '#F9FAFB',
                    marginBottom: 12
                }}>
                    Source-backed supply is thin in {locationName}
                </h2>
                
                <p style={{
                    fontSize: 15,
                    color: '#9CA3AF',
                    lineHeight: 1.6,
                    marginBottom: 24
                }}>
                    Haul Command does not have enough source-backed directory coverage for this market yet.
                    Submit the need, claim your profile, or sponsor the gap so this becomes a routing,
                    recruitment, and market-demand signal.
                </p>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
                    <Link href={`/loads/post?source=no-result&market=${locationQuery}`} style={{ textDecoration: 'none' }}>
                        <Button
                            style={{
                                background: '#C6923A',
                                color: '#0B0B0C',
                                fontWeight: 700,
                                padding: '12px 24px',
                                height: 'auto',
                                borderRadius: 8
                            }}
                        >
                            Request Route Support
                        </Button>
                    </Link>
                    <Link href={`/claim?source=no-result&market=${locationQuery}`} style={{ textDecoration: 'none' }}>
                        <Button
                            variant="outline"
                            style={{
                                borderColor: 'rgba(255,255,255,0.1)',
                                color: '#F0F0F2',
                                fontWeight: 600,
                                padding: '12px 24px',
                                height: 'auto',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 8
                            }}
                        >
                            Claim Your Profile
                        </Button>
                    </Link>
                    <Link href={`/sponsor?package=market-gap&market=${locationQuery}`} style={{ textDecoration: 'none' }}>
                        <Button
                            variant="outline"
                            style={{
                                borderColor: 'rgba(198,146,58,0.24)',
                                color: '#C6923A',
                                fontWeight: 600,
                                padding: '12px 24px',
                                height: 'auto',
                                background: 'rgba(198,146,58,0.06)',
                                borderRadius: 8
                            }}
                        >
                            Sponsor This Gap
                        </Button>
                    </Link>
                </div>

                <p style={{ color: '#6B7280', fontSize: 12, lineHeight: 1.5, margin: 0 }}>
                    No-result searches guide provider recruitment, AdGrid audiences,
                    country maturity, and future corridor expansion.
                </p>
                
                {/* Sponsor card is rendered externally by the parent page via AdGrid */}
            </div>
        </div>
    );
}

export default EmptyMarketState;
