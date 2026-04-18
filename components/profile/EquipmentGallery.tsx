'use client';

export function EquipmentGallery({ operatorName, isClaimed }: { operatorName: string, isClaimed: boolean }) {
    // In a real app, this takes an `images` array from the `operator.equipment` table.
    // We are simulating the "Double Platinum" JB Hunt-level visual grid here.

    return (
        <div className="bg-[#141e28] border border-[#1e3048] rounded-xl overflow-hidden mb-6">
            <div className="p-4 border-b border-[#1e3048] flex justify-between items-center">
                <h3 className="text-white font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                    <svg className="w-4 h-4 text-[#e8a828]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    Verified Assets & Equipment
                </h3>
                {!isClaimed && (
                    <span className="text-[10px] bg-[#1e3048] text-[#8ab0d0] px-2 py-1 rounded uppercase tracking-widest font-bold">Stock Assets</span>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-1 p-1 bg-[#0a1118]">
                {/* Main Hero Shot */}
                <div className="col-span-2 row-span-2 relative aspect-video md:aspect-square bg-[#1e3048] overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
                    <img src="/maps-placeholder.jpg" alt={`${operatorName} Primary Rig`} className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                    <div className="absolute bottom-4 left-4 z-20">
                        <span className="bg-green-500 text-black text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm shadow-[0_0_8px_#22c55e]">Verified</span>
                        <p className="text-white font-bold text-sm mt-1">Lead Pilot Chase</p>
                    </div>
                </div>

                {/* Sub Shots */}
                <div className="relative aspect-square bg-[#1e3048] overflow-hidden group">
                    <img src="/maps-placeholder.jpg" alt={`${operatorName} Height Pole`} className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity filter grayscale" />
                    <div className="absolute bottom-2 left-2 z-20">
                        <p className="text-white font-bold text-xs">Height Pole</p>
                    </div>
                </div>
                
                <div className="relative aspect-square bg-[#1e3048] overflow-hidden group">
                    <img src="/maps-placeholder.jpg" alt={`${operatorName} Steerman`} className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity filter grayscale" />
                    <div className="absolute bottom-2 left-2 z-20">
                        <p className="text-white font-bold text-xs">Signage</p>
                    </div>
                </div>

                <div className="relative aspect-square bg-[#1e3048] overflow-hidden group">
                    <img src="/maps-placeholder.jpg" alt={`${operatorName} Gear`} className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity filter grayscale" />
                    <div className="absolute bottom-2 left-2 z-20">
                        <p className="text-white font-bold text-xs">VHF Radios</p>
                    </div>
                </div>

                <div className="relative aspect-square bg-[#1e3048] overflow-hidden group flex items-center justify-center cursor-pointer hover:bg-[#283e58] transition-colors">
                    <div className="text-center">
                        <span className="block text-2xl mb-1 text-[#8ab0d0]">+8</span>
                        <span className="text-[#8ab0d0] text-[10px] uppercase tracking-widest font-bold">View Gallery</span>
                    </div>
                </div>
            </div>
            
            {!isClaimed && (
                <div className="p-3 bg-[#e8a828]/10 text-[#e8a828] text-xs text-center border-t border-[#1e3048]">
                    Own this listing? Claim it to upload your actual fleet photos and increase booking confidence.
                </div>
            )}
        </div>
    );
}
