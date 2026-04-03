import React from 'react';
import Link from 'next/link';
import { getWeightedLinks, type LinkTargetType } from '@/lib/seo/internalLinks';
import { HubLinks, TopCitiesInState, NearbyCities } from '@/lib/seo/internal-links';

interface LinkMeshProps {
    currentPath: string;
    pageType: string;
    countryCode?: string;
    regionCode?: string;
    city?: string;
    h3r6?: string;
    metroClusterId?: string;
}

export async function LinkMesh({
    currentPath,
    pageType,
    countryCode = 'us',
    regionCode,
    city,
    h3r6,
    metroClusterId
}: LinkMeshProps) {
    // Determine which dynamic links to fetch based on page context
    let targetType: LinkTargetType = 'city';
    if (pageType === 'corridor') targetType = 'corridor';
    if (pageType === 'regulations') targetType = 'region';
    
    // Fetch dynamic, signal-weighted links
    const dynamicLinks = await getWeightedLinks({
        fromPageType: pageType,
        toPageType: targetType,
        countryCode,
        regionCode,
        fromH3r6: h3r6,
        fromMetroClusterId: metroClusterId,
        limit: 8
    });

    return (
        <div style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: '#F9FAFB', marginBottom: 24 }}>Explore Heavy Haul Network</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                
                {/* 1. Universal Hub Links */}
                <div>
                    <h3 style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                        Core Platform
                    </h3>
                    <HubLinks compact={false} />
                </div>
                
                {/* 2. Static Contextual Links (if location data is present) */}
                {regionCode && city && (
                    <div>
                        <TopCitiesInState state={regionCode} country={countryCode as 'us' | 'ca'} />
                        <div style={{ marginTop: 16 }}>
                            <NearbyCities currentCity={city} state={regionCode} />
                        </div>
                    </div>
                )}
                
                {/* 3. Dynamic Signal-Weighted Links */}
                {dynamicLinks && dynamicLinks.length > 0 && (
                    <div>
                        <h3 style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
                            High-Demand {targetType === 'corridor' ? 'Corridors' : 'Locations'}
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {dynamicLinks.map(link => (
                                <Link 
                                    key={link.id} 
                                    href={link.path}
                                    style={{
                                        padding: '6px 14px',
                                        borderRadius: 8,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                        color: '#D1D5DB',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6
                                    }}
                                >
                                    {link.path.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    {link.demand_score > 80 && (
                                        <span style={{ fontSize: 12 }} title="High Demand">🔥</span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default LinkMesh;
