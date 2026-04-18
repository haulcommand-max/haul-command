'use client';

import { formatDistanceToNow } from "date-fns";

export function RecentActivity({ operatorName }: { operatorName: string }) {
    // Simulated native activity feed for social stickiness
    return (
        <div className="bg-[#141e28] border border-[#1e3048] rounded-xl overflow-hidden mb-6">
            <div className="p-5 border-b border-[#1e3048] flex justify-between items-center text-[#8ab0d0]">
                <h3 className="text-white font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    Recent Command Activity
                </h3>
                <span className="text-xs">Last 30 Days</span>
            </div>
            
            <div className="p-0">
                <div className="flex border-b border-[#1e3048]">
                    {/* Activity Feed */}
                    <div className="w-full md:w-3/5 p-5 space-y-6">
                        
                        <div className="relative pl-6 border-l-2 border-[#1e3048]">
                            <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-[7px] top-1 shadow-[0_0_8px_#22c55e]"></div>
                            <p className="text-xs text-[#8ab0d0] font-mono mb-1 uppercase tracking-widest">{formatDistanceToNow(new Date(Date.now() - 86400000))} ago</p>
                            <p className="text-sm text-white">Completed Escort: <span className="font-bold text-[#e8a828]">Houston, TX → Phoenix, AZ</span></p>
                            <p className="text-xs text-[#8ab0d0] mt-1">104' Wind Turbine Blade • Lead & Chase required.</p>
                        </div>

                        <div className="relative pl-6 border-l-2 border-[#1e3048]">
                            <div className="absolute w-3 h-3 bg-[#e8a828] rounded-full -left-[7px] top-1"></div>
                            <p className="text-xs text-[#8ab0d0] font-mono mb-1 uppercase tracking-widest">3 days ago</p>
                            <p className="text-sm text-white">Updated Compliance Documents</p>
                            <p className="text-xs text-[#8ab0d0] mt-1">Verified new Certificate of Insurance (COI) through Haul Command Trust Engine.</p>
                        </div>

                        <div className="relative pl-6 border-l-2 border-[#1e3048]">
                            <div className="absolute w-3 h-3 bg-[#385374] rounded-full -left-[7px] top-1"></div>
                            <p className="text-xs text-[#8ab0d0] font-mono mb-1 uppercase tracking-widest">1 week ago</p>
                            <p className="text-sm text-white">Repositioning Broadcast</p>
                            <p className="text-xs text-[#8ab0d0] mt-1">Broadcasted availability outbound from Salt Lake City, UT.</p>
                        </div>

                    </div>
                    
                    {/* Map Visual (Double Platinum UX feature) */}
                    <div className="hidden md:block w-2/5 border-l border-[#1e3048] relative overflow-hidden bg-[#0a1118]">
                        <img src="/maps-placeholder.jpg" className="w-full h-full object-cover opacity-20 filter grayscale" alt="Route Map" />
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                            <svg className="w-10 h-10 text-[#e8a828] mb-2 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
                            <span className="text-[#8ab0d0] text-xs font-bold uppercase tracking-widest mb-1">RouteRadar</span>
                            <span className="text-white text-sm font-black">2,410 Miles Tracked</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="p-3 bg-[#1e3048]/30 flex justify-center hover:bg-[#1e3048]/50 transition-colors cursor-pointer">
                <span className="text-xs text-[#8ab0d0] uppercase tracking-widest font-bold">Load Full History</span>
            </div>
        </div>
    );
}
