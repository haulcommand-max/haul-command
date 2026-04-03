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
                
                {/* Sponsor placeholder for the empty state */}
                <div style={{
                    background: 'rgba(198, 146, 58, 0.05)',
                    border: '1px solid rgba(198, 146, 58, 0.2)',
                    borderRadius: 12,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}>
                    <div style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: '#C6923A',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        marginBottom: 8
                    }}>
                        Exclusive Sponsorship Available
                    </div>
                    <div style={{ fontSize: 14, color: '#E5E7EB', marginBottom: 12 }}>
                        Own the entire {locationName} market. Your business will appear here permanently.
                    </div>
                    <Link href="/advertise/buy" style={{
                        fontSize: 12,
                        color: '#C6923A',
                        fontWeight: 700,
                        textDecoration: 'none'
                    }}>
                        View Sponsorship Pricing
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default EmptyMarketState;
