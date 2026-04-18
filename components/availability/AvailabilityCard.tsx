'use client';

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export function AvailabilityCard({ operator }: { operator: any }) {
    // Determine status color
    let statusColor = "bg-green-500";
    let statusText = "Available Now";
    
    if (operator.status === 'available_today') {
        statusColor = "bg-yellow-500";
        statusText = "Available Later Today";
    } else if (operator.status === 'available_this_week') {
        statusColor = "bg-blue-500";
        statusText = "Available This Week";
    }

    return (
        <div className="bg-[#141e28] border border-[#1e3048] rounded-xl p-5 hover:border-[#385374] transition-colors relative group overflow-hidden shadow-lg">
            
            {/* Trust Shield Background Watermark */}
            <div className="absolute -right-10 -bottom-10 opacity-[0.03] transform rotate-12 pointer-events-none group-hover:opacity-10 transition-opacity">
                <svg width="200" height="200" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/>
                </svg>
            </div>

            <div className="flex flex-col md:flex-row gap-5 relative z-10">
                {/* Left: Location & Status Badge */}
                <div className="flex-shrink-0 flex flex-col items-start gap-2 min-w-[140px]">
                    <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${statusColor}`}></span>
                        <span className="text-xs font-bold uppercase tracking-widest text-[#f0f2f5]">{statusText}</span>
                    </div>
                    <div className="text-sm font-mono text-[#8ab0d0]">
                        Posted {formatDistanceToNow(new Date(operator.created_at))} ago
                    </div>
                    <div className="mt-2 bg-[#0a1118] border border-[#1e3048] px-3 py-1.5 rounded-lg flex flex-col w-full">
                        <span className="text-[10px] text-[#8ab0d0] uppercase tracking-wider">Location</span>
                        <span className="font-bold text-white text-sm">{operator.city}, {operator.state_code}</span>
                    </div>
                </div>

                {/* Center: Operator Profile & Capacity */}
                <div className="flex-grow">
                    <div className="flex justify-between items-start">
                        <div>
                            <Link href={`/directory/profile/${operator.operator_slug || operator.operator_id}`} className="hover:underline">
                                <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                                    {operator.operator_name || "Verified Operator"}
                                    {operator.claim_status === 'claimed' && (
                                        <svg className="w-4 h-4 text-[#e8a828]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                    )}
                                </h3>
                            </Link>

                            {/* Services Tags */}
                            <div className="flex flex-wrap gap-2 mt-3">
                                {operator.service_types && operator.service_types.map((svc: string) => (
                                    <span key={svc} className="px-2 py-0.5 bg-[#1e3048] text-[#8ab0d0] text-xs font-semibold rounded uppercase tracking-wide">
                                        {svc.replace('_', ' ')}
                                    </span>
                                ))}
                            </div>

                            {operator.willing_to_deadhead_miles > 0 && (
                                <p className="text-xs text-[#8ab0d0] mt-3 flex items-center gap-1">
                                    <svg className="w-3 h-3 text-[#e8a828]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
                                    Willing to deadhead {operator.willing_to_deadhead_miles} miles
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Actions / Call */}
                <div className="flex-shrink-0 flex flex-col justify-center items-end border-t md:border-t-0 md:border-l border-[#1e3048] pt-4 md:pt-0 md:pl-5 mt-2 md:mt-0">
                    <button className="bg-[#e8a828] text-black font-black uppercase tracking-wider text-sm py-3 px-6 rounded-lg hover:bg-[#ffe399] transition-all shadow-[0_0_15px_rgba(232,168,40,0.3)] w-full md:w-auto text-center flex items-center justify-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                        Call to Book
                    </button>
                    
                    <div className="mt-3 text-[10px] text-center w-full uppercase tracking-widest text-[#8ab0d0] flex items-center justify-center gap-1">
                        Trust Score: <span className="text-white font-bold">{operator.trust_score || 85}</span> / 100
                    </div>
                </div>
            </div>
        </div>
    );
}
