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
                    Be the first in {locationName}
                </h2>
                
                <p style={{
                    fontSize: 15,
                    color: '#9CA3AF',
                    lineHeight: 1.6,
                    marginBottom: 24
                }}>
                    We don't have any verified pilot car operators listed in this area yet. 
                    Claim this territory to receive all incoming load volume and heavy haul requests for {locationName}.
                </p>

                <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
                    <Link href="/advertise/buy" style={{ textDecoration: 'none' }}>
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
                            Claim this Territory →
                        </Button>
                    </Link>
                    <Link href="/join" style={{ textDecoration: 'none' }}>
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
                            List your business free
                        </Button>
                    </Link>
                </div>
                
                {/* Sponsor card is rendered externally by the parent page via AdGrid */}
            </div>
        </div>
    );
}

export default EmptyMarketState;
