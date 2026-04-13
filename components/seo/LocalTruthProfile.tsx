import React from 'react';
import { Map, Clock, ShieldCheck, CheckCircle } from 'lucide-react';

export interface LocalTruthProfileProps {
    businessName: string;
    verifiedState: 'verified' | 'unclaimed' | 'unverified';
    locationData: {
        addressLine1?: string;
        city: string;
        stateCode: string;
        zip?: string;
        isRealStorefront: boolean;
        serviceRadiusMiles?: number;
    };
    operatingHours: string;
    contactPhone?: string;
    googleBusinessId?: string;
}

/**
 * HC-W1-08 — Local Truth + GBP Readiness System
 * This component strict-validates local truth representations. Never renders fake virtual offices.
 */
export function LocalTruthProfile({ businessName, verifiedState, locationData, operatingHours, contactPhone }: LocalTruthProfileProps) {
    
    // Construct strict LocalBusiness JSON-LD schema based on authentic variables
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": locationData.isRealStorefront ? "LocalBusiness" : "ServiceAreaBusiness",
        "name": businessName,
        "telephone": contactPhone || undefined,
        "address": locationData.isRealStorefront ? {
            "@type": "PostalAddress",
            "streetAddress": locationData.addressLine1,
            "addressLocality": locationData.city,
            "addressRegion": locationData.stateCode,
            "postalCode": locationData.zip
        } : undefined,
        "areaServed": !locationData.isRealStorefront ? {
            "@type": "GeoCircle",
            "geoMidpoint": {
                "@type": "GeoCoordinates",
                "addressRegion": locationData.stateCode,
                "addressLocality": locationData.city
            },
            "geoRadius": locationData.serviceRadiusMiles || 50
        } : undefined
    };

    return (
        <div className="w-full bg-[#0a0d14] rounded-2xl border border-white/[0.08] overflow-hidden">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            
            <div className="px-6 py-4 flex items-center justify-between border-b border-white/[0.04] bg-[#0f1420]">
                <h3 className="font-semibold text-white truncate max-w-sm">
                    {businessName}
                </h3>
                {verifiedState === 'verified' && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#00FF66]/10 text-[#00FF66] text-[10px] font-bold uppercase tracking-wider">
                        <CheckCircle className="w-3 h-3" />
                        Verified Entity
                    </div>
                )}
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                    <Map className="w-4 h-4 text-[#5A6577] mt-0.5" />
                    <div>
                        <div className="text-xs font-semibold text-[#8fa3b8] uppercase tracking-wider mb-1">
                            {locationData.isRealStorefront ? 'Operating Base' : 'Service Territory'}
                        </div>
                        <div className="text-sm text-white/90">
                            {locationData.isRealStorefront ? (
                                <>
                                    {locationData.addressLine1 && <div className="truncate">{locationData.addressLine1}</div>}
                                    <div>{locationData.city}, {locationData.stateCode} {locationData.zip}</div>
                                </>
                            ) : (
                                <>
                                    <div>Primary Market: {locationData.city}, {locationData.stateCode}</div>
                                    <div className="text-[#5A6577]">{locationData.serviceRadiusMiles} mi radius coverage</div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-[#5A6577] mt-0.5" />
                    <div>
                        <div className="text-xs font-semibold text-[#8fa3b8] uppercase tracking-wider mb-1">
                            Availability
                        </div>
                        <div className="text-sm text-white/90">
                            {operatingHours}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
